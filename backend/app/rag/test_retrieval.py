import asyncio
from app.rag.retriever import HybridRetriever

async def test_retrieval():
    print("Initializing HybridRetriever...")
    retriever = HybridRetriever()
    
    query = "What is the blood pressure threshold for severe preeclampsia?"
    print(f"\nQuerying: '{query}'\n")
    
    citations = await retriever.retrieve(query)
    
    print("\n--- RESULTS ---")
    for i, citation in enumerate(citations):
        print(f"\n[{i+1}] Source: {citation.source_title} ({citation.organization})")
        print(f"Snippet: {citation.text_snippet[:150]}...")

if __name__ == "__main__":
    asyncio.run(test_retrieval())
