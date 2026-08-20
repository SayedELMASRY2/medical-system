from typing import Any
from langchain_core.messages import HumanMessage, SystemMessage
from config.model_factory import create_llm
from rag.retriever import get_retriever
from prompts.medical_prompt import MEDICAL_SYSTEM_PROMPT


def create_medical_agent(llm=None):
    if llm is None:
        llm = create_llm()

    def medical_node(state: dict[str, Any]) -> dict[str, Any]:
        messages = list(state.get("messages", []))
        patient = state.get("patient", {})
        lab_results = state.get("lab_results")

        last_message = ""
        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                last_message = msg.content
                break

        search_query = state.get("search_query") or last_message
        if not search_query:
            return {
                "messages": messages,
                "current_agent": "medical_agent",
                "retrieved_citations": [],
            }

        citations = []
        evidence_text = "No clinical evidence retrieved."

        try:
            retriever = get_retriever()
            result = retriever.retrieve(
                query=search_query,
                clinical_context=_build_clinical_context(patient, lab_results),
            )
            citations = [c.to_dict() for c in result.citations]

            if citations:
                evidence_parts = []
                for i, c in enumerate(citations, 1):
                    evidence_parts.append(
                        f"[{i}] Source: {c['source_title']} ({c['organization']})\n"
                        f"    {c['text_snippet'][:300]}"
                    )
                evidence_text = "\n\n".join(evidence_parts)
        except Exception as e:
            evidence_text = f"RAG retrieval error: {str(e)}"

        context_parts = [f"Patient: {patient.get('name', 'Unknown')}"]
        if patient.get("gestational_age_weeks"):
            context_parts.append(f"GA: {patient['gestational_age_weeks']}w")
        if lab_results:
            context_parts.append(f"Lab results available: {list(lab_results.get('results', lab_results).keys())[:5]}")

        query_msg = HumanMessage(content=(
            f"Medical Query: {search_query}\n\n"
            f"Patient Context: {' | '.join(context_parts)}\n\n"
            f"Retrieved Clinical Evidence:\n{evidence_text}"
        ))

        response = llm.invoke([
            SystemMessage(content=MEDICAL_SYSTEM_PROMPT),
            query_msg,
        ])

        messages.append(query_msg)
        messages.append(response)

        return {
            "messages": messages,
            "chat_response": response.content,
            "retrieved_citations": citations,
            "current_agent": "medical_agent",
        }

    return medical_node


def _build_clinical_context(patient: dict, lab_results: dict | None) -> str:
    parts = []
    if patient.get("gestational_age_weeks"):
        parts.append(f"pregnancy week {patient['gestational_age_weeks']}")
    if patient.get("medical_history"):
        parts.append(f"history: {', '.join(patient['medical_history'][:3])}")
    if lab_results:
        results = lab_results.get("results", lab_results)
        if isinstance(results, dict):
            parts.append(f"labs: {', '.join(list(results.keys())[:5])}")
    return " | ".join(parts) if parts else ""
