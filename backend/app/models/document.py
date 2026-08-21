import uuid
from sqlalchemy import Column, String, Text, Integer
from app.models.base import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(100), nullable=False, index=True)
    document_title = Column(String(255), nullable=False)
    organization = Column(String(100), nullable=False)
    section = Column(String(255), nullable=True)
    page = Column(Integer, nullable=True)
    text_content = Column(Text, nullable=False)
    # Store embedding as text for SQLite (comma-separated floats)
    embedding = Column(Text, nullable=True)

    def __repr__(self):
        return f"<DocumentChunk(id={self.id}, source_id='{self.source_id}', section='{self.section}')>"
