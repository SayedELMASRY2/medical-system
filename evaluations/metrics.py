"""
Materna AI Evaluation & Metrics Suite
--------------------------------------
Comprehensive evaluation framework for RAG Retrieval, Constrained Clinical Generation,
Multi-Agent Latency/Cost, and Preeclampsia Clinical Risk Classification.
"""

import math
import time
from typing import List, Dict, Any, Set, Tuple


class RAGEvaluator:
    """Evaluates RAG retrieval performance (Hit Rate, MRR, NDCG, Precision, Recall)."""

    @staticmethod
    def hit_rate_at_k(retrieved_doc_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        """Returns 1.0 if at least one relevant document is retrieved in top K, else 0.0."""
        top_k = retrieved_doc_ids[:k]
        for doc_id in top_k:
            if doc_id in ground_truth_ids:
                return 1.0
        return 0.0

    @staticmethod
    def mrr_at_k(retrieved_doc_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        """Mean Reciprocal Rank @ K: 1/rank of the first relevant document."""
        top_k = retrieved_doc_ids[:k]
        for rank, doc_id in enumerate(top_k, start=1):
            if doc_id in ground_truth_ids:
                return 1.0 / rank
        return 0.0

    @staticmethod
    def precision_at_k(retrieved_doc_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        """Precision @ K = (Relevant retrieved in K) / K."""
        top_k = retrieved_doc_ids[:k]
        if not top_k:
            return 0.0
        relevant = sum(1 for doc_id in top_k if doc_id in ground_truth_ids)
        return relevant / float(k)

    @staticmethod
    def recall_at_k(retrieved_doc_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        """Recall @ K = (Relevant retrieved in K) / (Total ground truth relevant)."""
        if not ground_truth_ids:
            return 1.0
        top_k = retrieved_doc_ids[:k]
        relevant = sum(1 for doc_id in top_k if doc_id in ground_truth_ids)
        return relevant / float(len(ground_truth_ids))

    @staticmethod
    def ndcg_at_k(retrieved_doc_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        """Normalized Discounted Cumulative Gain @ K."""
        top_k = retrieved_doc_ids[:k]
        dcg = 0.0
        for i, doc_id in enumerate(top_k, start=1):
            rel = 1.0 if doc_id in ground_truth_ids else 0.0
            dcg += rel / math.log2(i + 1)

        ideal_relevant_count = min(len(ground_truth_ids), k)
        if ideal_relevant_count == 0:
            return 1.0

        idcg = sum(1.0 / math.log2(i + 1) for i in range(1, ideal_relevant_count + 1))
        return dcg / idcg if idcg > 0 else 0.0


class ClinicalGenerationEvaluator:
    """Evaluates constrained LLM generation, hallucination rates, schema compliance, and refusals."""

    @staticmethod
    def evaluate_groundedness(claims: List[str], retrieved_contexts: List[str]) -> Tuple[float, List[bool]]:
        """
        Calculates citation groundedness score:
        Fraction of generated claims supported by retrieved context snippets.
        """
        if not claims:
            return 1.0, []

        context_blob = " ".join(retrieved_contexts).lower()
        supported_flags = []

        for claim in claims:
            # Check keywords/tokens overlap in retrieved context
            words = [w.strip().lower() for w in claim.split() if len(w) > 3]
            if not words:
                supported_flags.append(True)
                continue
            matches = sum(1 for w in words if w in context_blob)
            overlap_ratio = matches / float(len(words))
            supported_flags.append(overlap_ratio >= 0.4)

        score = sum(1 for f in supported_flags if f) / float(len(supported_flags))
        return round(score, 4), supported_flags

    @staticmethod
    def evaluate_hallucination_rate(groundedness_score: float) -> float:
        """Hallucination Rate = 1.0 - Groundedness Score."""
        return round(1.0 - groundedness_score, 4)

    @staticmethod
    def evaluate_schema_adherence(json_outputs: List[Dict[str, Any]], required_keys: List[str]) -> float:
        """Percentage of outputs containing all mandatory schema keys."""
        if not json_outputs:
            return 1.0
        valid_count = 0
        for item in json_outputs:
            if isinstance(item, dict) and all(key in item for key in required_keys):
                valid_count += 1
        return round(valid_count / float(len(json_outputs)), 4)

    @staticmethod
    def evaluate_refusal_accuracy(test_queries: List[Dict[str, Any]]) -> float:
        """
        Evaluates whether out-of-scope queries (e.g. car repair, stock advice)
        were correctly refused by the clinical agent.
        """
        if not test_queries:
            return 1.0
        correct_refusals = 0
        for item in test_queries:
            is_out_of_scope = item.get("is_out_of_scope", False)
            was_refused = item.get("was_refused", False)
            if is_out_of_scope == was_refused:
                correct_refusals += 1
        return round(correct_refusals / float(len(test_queries)), 4)


class ClinicalDiagnosticEvaluator:
    """Evaluates medical safety, sensitivity, specificity, and confusion matrix for Preeclampsia Risk Engine."""

    @staticmethod
    def compute_confusion_matrix(predictions: List[str], ground_truth: List[str]) -> Dict[str, Any]:
        """
        Computes Sensitivity, Specificity, Precision, F1-Score, and Accuracy
        for High-Risk (Preeclampsia Emergency) vs Normal.
        """
        tp = fp = tn = fn = 0
        for pred, gt in zip(predictions, ground_truth):
            p_high = (pred in ["RED", "HIGH", "CRITICAL"])
            g_high = (gt in ["RED", "HIGH", "CRITICAL"])

            if p_high and g_high:
                tp += 1
            elif p_high and not g_high:
                fp += 1
            elif not p_high and not g_high:
                tn += 1
            elif not p_high and g_high:
                fn += 1

        total = tp + fp + tn + fn
        accuracy = (tp + tn) / float(total) if total > 0 else 0.0
        sensitivity = tp / float(tp + fn) if (tp + fn) > 0 else 1.0  # Recall for High Risk
        specificity = tn / float(tn + fp) if (tn + fp) > 0 else 1.0
        precision = tp / float(tp + fp) if (tp + fp) > 0 else 1.0
        f1_score = (2 * precision * sensitivity) / (precision + sensitivity) if (precision + sensitivity) > 0 else 0.0

        return {
            "TP": tp,
            "FP": fp,
            "TN": tn,
            "FN": fn,
            "accuracy": round(accuracy, 4),
            "sensitivity": round(sensitivity, 4),  # Medical Safety Critical Metric
            "specificity": round(specificity, 4),
            "precision": round(precision, 4),
            "f1_score": round(f1_score, 4),
        }
