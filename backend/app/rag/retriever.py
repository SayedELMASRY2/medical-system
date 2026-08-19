import os
import asyncio
from typing import List, Dict, Any
from sqlalchemy import select
from rank_bm25 import BM25Okapi
import cohere
from langchain_cohere import CohereEmbeddings

from app.core.database import get_db
from app.models.document import DocumentChunk
from app.ai.state import Citation

class HybridRetriever:
    """
    Hybrid retriever combining pgvector (dense cosine similarity) and BM25 (lexical search),
    fused with Cohere cross-encoder reranking.
    """
    def __init__(self, vector_top_k: int = 15, bm25_top_k: int = 15, final_top_k: int = 5):
        self.vector_top_k = vector_top_k
        self.bm25_top_k = bm25_top_k
        self.final_top_k = final_top_k
        
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        if not self.cohere_api_key:
            raise ValueError("COHERE_API_KEY environment variable is missing.")
            
        # Initialize Cohere Langchain Embeddings for Vector Search
        self.embeddings = CohereEmbeddings(
            cohere_api_key=self.cohere_api_key,
            model="embed-english-v3.0"
        )
        
        # Initialize standard Cohere Client for Reranking (V2 API)
        self.co_client = cohere.Client(api_key=self.cohere_api_key)
        
        # BM25 In-memory index
        self.bm25 = None
        self.corpus_chunks = []
        
    async def load_bm25_corpus(self):
        """Loads all documents from the DB into memory to build the BM25 index."""
        async for session in get_db():
            result = await session.execute(select(DocumentChunk))
            self.corpus_chunks = result.scalars().all()
            
            if not self.corpus_chunks:
                print("Warning: Database is empty. BM25 will have no corpus.")
                return
                
            # Tokenize documents for BM25
            tokenized_corpus = [
                chunk.text_content.lower().split() 
                for chunk in self.corpus_chunks
            ]
            self.bm25 = BM25Okapi(tokenized_corpus)
            print(f"Loaded {len(self.corpus_chunks)} chunks into BM25 index.")
            return # Only need one session

    async def vector_search(self, query: str) -> List[DocumentChunk]:
        """Performs a semantic vector search using pgvector cosine distance."""
        # Embed the query
        query_vector = await self.embeddings.aembed_query(query)
        
        # Query Postgres
        chunks = []
        async for session in get_db():
            stmt = select(DocumentChunk).order_by(
                DocumentChunk.embedding.cosine_distance(query_vector)
            ).limit(self.vector_top_k)
            result = await session.execute(stmt)
            chunks = result.scalars().all()
            return chunks
        return chunks

    def bm25_search(self, query: str) -> List[DocumentChunk]:
        """Performs a lexical keyword search using BM25."""
        if not self.bm25 or not self.corpus_chunks:
            return []
            
        tokenized_query = query.lower().split()
        top_chunks = self.bm25.get_top_n(tokenized_query, self.corpus_chunks, n=self.bm25_top_k)
        return top_chunks

    def rerank(self, query: str, candidate_chunks: List[DocumentChunk]) -> List[Citation]:
        """Uses Cohere Rerank API to re-order and filter candidate chunks."""
        if not candidate_chunks:
            return []
            
        # Extract text for the reranker
        docs = [chunk.text_content for chunk in candidate_chunks]
        
        # Call Cohere Rerank v3
        response = self.co_client.rerank(
            model="rerank-english-v3.0",
            query=query,
            documents=docs,
            top_n=self.final_top_k
        )
        
        # Map back to our chunk objects and return Citations
        citations = []
        for result in response.results:
            chunk = candidate_chunks[result.index]
            citations.append(Citation(
                chunk_id=str(chunk.id),
                text_snippet=chunk.text_content,
                source_title=chunk.document_title,
                organization=chunk.organization
            ))
            
        return citations

    async def retrieve(self, query: str, clinical_context: str = None) -> List[Citation]:
        """Main orchestrator: Hybrid Search -> Deduplicate -> Rerank"""
        
        # Ensure BM25 is loaded
        if not self.bm25:
            await self.load_bm25_corpus()
            
        # Enhance query with context if provided
        search_query = query
        if clinical_context:
            search_query = f"{clinical_context} - {query}"
            
        print(f"Retrieving evidence for: '{search_query}'")
        
        # 1. Run Vector & BM25 in parallel
        vector_candidates_task = self.vector_search(search_query)
        
        # Run BM25 synchronously since it's in-memory CPU bound
        bm25_candidates = self.bm25_search(search_query)
        vector_candidates = await vector_candidates_task
        
        # 2. Deduplicate candidates using UUID
        seen_ids = set()
        unique_candidates = []
        
        for chunk in vector_candidates + bm25_candidates:
            if chunk.id not in seen_ids:
                seen_ids.add(chunk.id)
                unique_candidates.append(chunk)
                
        print(f"Found {len(unique_candidates)} unique candidates from Hybrid Search.")
        
        # 3. Rerank down to top K
        final_citations = self.rerank(search_query, unique_candidates)
        print(f"Reranked down to {len(final_citations)} most relevant citations.")
        
        return final_citations
