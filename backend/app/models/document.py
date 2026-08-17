import uuid
from typing import Optional
from sqlalchemy import Column, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.models.base import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(String(100), nullable=False, index=True)
    document_title = Column(String(255), nullable=False)
    organization = Column(String(100), nullable=False)
    section = Column(String(255), nullable=True)
    page = Column(Integer, nullable=True)
    
    text_content = Column(Text, nullable=False)
    
    # Cohere English v3.0 model uses 1024 dimensions
    embedding = Column(Vector(1024), nullable=False)

    def __repr__(self):
        return f"<DocumentChunk(id={self.id}, source_id='{self.source_id}', section='{self.section}')>"
