"""
FastAPI Application — Single-View Case Analyzer Backend
========================================================

Endpoints:
  GET  /api/v1/health         → Health check + vector store status
  POST /api/v1/analyze_case   → Upload 2 PDFs → Receive Judicial Brief
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import AnalysisResponse, HealthResponse
from services.pdf_parser import extract_text_from_bytes
from services.retriever import precedent_retriever
from services.analyzer import generate_judicial_brief


# ──────────────────────────────────────────────
# Lifespan: Initialize retriever on startup
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the embedding model and ChromaDB index on startup."""
    print("\n🚀 Starting Case Analyzer Backend...")
    try:
        precedent_retriever.initialize()
        print("✅ Retriever initialized successfully.\n")
    except FileNotFoundError as e:
        print(f"⚠  Warning: {e}")
        print("   The /analyze_case endpoint will work but without precedent retrieval.")
        print("   Run `python ingest.py` to populate the vector store.\n")
    yield
    print("\n👋 Shutting down Case Analyzer Backend.")


# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(
    title="Single-View Case Analyzer",
    description="AI-powered comparative legal document analysis with precedent retrieval",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*", # Allow all domains so Vercel deployment works seamlessly
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Check if the server and vector store are operational."""
    return HealthResponse(
        status="ok",
        vector_store_ready=precedent_retriever.is_ready,
        documents_count=precedent_retriever.document_count,
    )


@app.post("/api/v1/analyze_case", response_model=AnalysisResponse)
async def analyze_case(
    doc_a: UploadFile = File(..., description="PDF file for Party A (Prosecution/Petitioner)"),
    doc_b: UploadFile = File(..., description="PDF file for Party B (Defense/Respondent)"),
):
    """
    Upload two opposing case documents and receive a structured Judicial Brief.

    The system:
    1. Extracts text from both PDFs
    2. Retrieves relevant precedents from the Orissa HC vector store
    3. Sends everything to the Groq LLM for structured analysis
    4. Returns a citation-backed Judicial Brief
    """

    # ── Validate file types ───────────────────────────
    for label, upload in [("doc_a", doc_a), ("doc_b", doc_b)]:
        if not upload.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=422,
                detail=f"{label} must be a PDF file. Got: {upload.filename}"
            )

    # ── Extract text ──────────────────────────────────
    try:
        bytes_a = await doc_a.read()
        text_a = extract_text_from_bytes(bytes_a)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from {doc_a.filename}: {str(e)}"
        )

    try:
        bytes_b = await doc_b.read()
        text_b = extract_text_from_bytes(bytes_b)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from {doc_b.filename}: {str(e)}"
        )

    if not text_a.strip():
        raise HTTPException(
            status_code=422,
            detail=f"No readable text found in {doc_a.filename}. It may be a scanned image PDF."
        )

    if not text_b.strip():
        raise HTTPException(
            status_code=422,
            detail=f"No readable text found in {doc_b.filename}. It may be a scanned image PDF."
        )

    # ── Retrieve precedents ───────────────────────────
    precedents = []
    if precedent_retriever.is_ready:
        # Build a query from the key points of both documents
        query = (
            f"Legal arguments and claims: "
            f"{text_a[:1500]} ... vs ... {text_b[:1500]}"
        )
        try:
            precedents = precedent_retriever.retrieve(query)
            print(f"[API] Retrieved {len(precedents)} precedents.")
        except Exception as e:
            print(f"[API] Retrieval warning: {e}")
    else:
        print("[API] Vector store not ready — proceeding without precedents.")

    # ── Generate Judicial Brief ───────────────────────
    try:
        brief = generate_judicial_brief(text_a, text_b, precedents)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

    return AnalysisResponse(
        status="success",
        judicial_brief=brief,
    )
