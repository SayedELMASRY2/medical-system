import asyncio
import os
import uuid
from typing import List

from langchain_cohere import CohereEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.document import DocumentChunk

# Set Cohere API Key from config if not implicitly picked up
os.environ["COHERE_API_KEY"] = settings.COHERE_API_KEY

async def process_and_ingest_documents(file_path: str):
    """
    Reads a mock clinical guideline, chunks it, generates Cohere embeddings,
    and inserts it into the pgvector database.
    """
    print(f"Loading document from {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Extract basic mock metadata from top lines
    lines = text.split("\n")
    doc_title = lines[0].replace("#", "").strip() if lines else "Unknown Document"
    org = lines[1].replace("## Organization:", "").strip() if len(lines) > 1 else "Unknown"
    
    # Initialize Text Splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        separators=["\n### ", "\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_text(text)
    print(f"Generated {len(chunks)} chunks.")

    # Initialize Cohere Embeddings
    print("Generating embeddings using Cohere...")
    embeddings_model = CohereEmbeddings(model="embed-english-v3.0")
    
    # Generate embeddings for all chunks in a batch
    embeddings = embeddings_model.embed_documents(chunks)
    
    print(f"Generated {len(embeddings)} embeddings of dimension {len(embeddings[0])}.")
    
    # Database Insertion
    print("Inserting chunks into pgvector...")
    async with AsyncSessionLocal() as session:
        for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
            # Extremely basic section extraction for demonstration
            section = "Unknown"
            if "###" in chunk_text:
                section_lines = [l for l in chunk_text.split("\n") if l.startswith("###")]
                if section_lines:
                    section = section_lines[0].replace("###", "").strip()
            
            doc_chunk = DocumentChunk(
                id=uuid.uuid4(),
                source_id=f"{org.lower().replace(' ', '_')}_{doc_title.lower().replace(' ', '_')}",
                document_title=doc_title,
                organization=org,
                section=section,
                page=1, # Mock page number
                text_content=chunk_text,
                embedding=embedding
            )
            session.add(doc_chunk)
        
        await session.commit()
        print("Ingestion complete.")

if __name__ == "__main__":
    mock_file_path = os.path.join(
        os.path.dirname(__file__), 
        "../../../data/guidelines/acog_hypertension_mock.txt"
    )
    # Ensure full path is used
    mock_file_path = os.path.abspath(mock_file_path)
    
    if not os.path.exists(mock_file_path):
        print(f"Mock file not found at {mock_file_path}")
    else:
        asyncio.run(process_and_ingest_documents(mock_file_path))
