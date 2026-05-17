import os
import uuid
import logging
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from openai import OpenAI

from app.core.database import get_db
from app.db.models import KnowledgeDocument, KnowledgeChunk
from app.core.config import OPENAI_API_KEY

from langchain_text_splitters import MarkdownTextSplitter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])

client = OpenAI(api_key=OPENAI_API_KEY)

class DocumentResponse(BaseModel):
    id: str
    title: str
    created_at: str

@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    docs = db.query(KnowledgeDocument).all()
    return [
        DocumentResponse(
            id=doc.id,
            title=doc.title,
            created_at=doc.createdAt.isoformat()
        )
        for doc in docs
    ]

@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a markdown document, parse it, chunk it, embed it, and save to vector db.
    """
    # Max 3 docs restriction check
    count = db.query(KnowledgeDocument).count()
    if count >= 3:
        raise HTTPException(status_code=400, detail="Maximum of 3 documents allowed. Please delete one first.")

    content_bytes = await file.read()
    content = content_bytes.decode("utf-8")
    title = file.filename or "Untitled Document"

    # Save Document
    doc_id = str(uuid.uuid4())
    doc = KnowledgeDocument(
        id=doc_id,
        title=title,
        content=content
    )
    db.add(doc)
    db.commit()

    # Chunking
    splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_text(content)

    if not chunks:
        return {"status": "ok", "id": doc.id, "chunks": 0}

    # Generate Embeddings
    try:
        response = client.embeddings.create(
            input=chunks,
            model="text-embedding-3-small"
        )
        
        for i, (chunk_text, embedding_data) in enumerate(zip(chunks, response.data)):
            chunk_record = KnowledgeChunk(
                documentId=doc_id,
                chunkIndex=i,
                content=chunk_text,
                embedding=embedding_data.embedding
            )
            db.add(chunk_record)
            
        db.commit()
        logger.info(f"Successfully processed and embedded document '{title}' into {len(chunks)} chunks.")
    except Exception as e:
        logger.error(f"Error processing document embeddings: {e}")
        db.delete(doc)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to generate embeddings")

    return {"status": "ok", "id": doc.id, "chunks": len(chunks)}

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(doc)
    db.commit()
    return {"status": "ok"}

class SearchRequest(BaseModel):
    query: str
    limit: int = 3

@router.post("/search")
def search_knowledge(req: SearchRequest, db: Session = Depends(get_db)):
    """
    Embeds the user's topic/query and performs cosine similarity search on pgvector.
    """
    if not req.query:
        return {"chunks": []}

    try:
        response = client.embeddings.create(
            input=req.query,
            model="text-embedding-3-small"
        )
        query_embedding = response.data[0].embedding

        # Cosine similarity using pgvector (<=> operator)
        chunks = db.query(KnowledgeChunk).order_by(
            KnowledgeChunk.embedding.cosine_distance(query_embedding)
        ).limit(req.limit).all()

        return {
            "chunks": [c.content for c in chunks]
        }
    except Exception as e:
        logger.error(f"Error during semantic search: {e}")
        return {"chunks": []}
