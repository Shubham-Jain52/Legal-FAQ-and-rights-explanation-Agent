"""
Centralized configuration for the Case Analyzer backend.
All paths, model names, and API keys are managed here.
"""

import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PDF_DIR = os.path.join(PROJECT_ROOT, "downloaded_pdfs")
CHROMA_PERSIST_DIR = os.path.join(PROJECT_ROOT, "chroma_db")

# ──────────────────────────────────────────────
# ChromaDB
# ──────────────────────────────────────────────
CHROMA_COLLECTION = "orissa_hc_judgments"

# ──────────────────────────────────────────────
# Embedding Model (CPU-only)
# ──────────────────────────────────────────────
EMBED_MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBED_DEVICE = "cpu"

# ──────────────────────────────────────────────
# LLM (Groq API)
# ──────────────────────────────────────────────
LLM_MODEL = "llama-3.1-8b-instant"
LLM_TEMPERATURE = 0.1
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ──────────────────────────────────────────────
# Retrieval
# ──────────────────────────────────────────────
RETRIEVAL_TOP_K = 5

# ──────────────────────────────────────────────
# Chunking
# ──────────────────────────────────────────────
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50
