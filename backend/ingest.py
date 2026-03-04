"""
Offline Ingestion Pipeline
==========================
Run this script ONCE (or whenever new PDFs are added) to:
  1. Parse all PDFs in downloaded_pdfs/
  2. Extract text + filename-based metadata
  3. Chunk text with LlamaIndex SentenceSplitter
  4. Embed with BAAI/bge-small-en-v1.5 (CPU)
  5. Store in ChromaDB (persistent)

Usage:
    cd backend
    python ingest.py
"""

import os
import sys
import time

import chromadb
from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore

from config import (
    PDF_DIR,
    CHROMA_PERSIST_DIR,
    CHROMA_COLLECTION,
    EMBED_MODEL_NAME,
    EMBED_DEVICE,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
)
from services.pdf_parser import extract_text_from_path, parse_filename_metadata


def main():
    print("=" * 60)
    print("  Single-View Case Analyzer — Ingestion Pipeline")
    print("=" * 60)

    # ── 1. Discover PDFs ──────────────────────────────────────
    pdf_files = sorted([
        f for f in os.listdir(PDF_DIR)
        if f.lower().endswith(".pdf")
    ])

    if not pdf_files:
        print(f"[!] No PDF files found in {PDF_DIR}")
        sys.exit(1)

    print(f"\n[*] Found {len(pdf_files)} PDFs in {PDF_DIR}\n")

    # ── 2. Configure Embedding Model (CPU) ────────────────────
    print(f"[*] Loading embedding model: {EMBED_MODEL_NAME} (device={EMBED_DEVICE})")
    embed_model = HuggingFaceEmbedding(
        model_name=EMBED_MODEL_NAME,
        device=EMBED_DEVICE,
    )
    Settings.embed_model = embed_model
    print("[✓] Embedding model loaded.\n")

    # ── 3. Build LlamaIndex Documents ─────────────────────────
    documents = []
    skipped = 0

    for i, filename in enumerate(pdf_files, 1):
        filepath = os.path.join(PDF_DIR, filename)
        metadata = parse_filename_metadata(filename)

        print(f"[{i}/{len(pdf_files)}] {filename}")
        print(f"         → case_type={metadata['case_type']}, "
              f"case_number={metadata['case_number']}, "
              f"year={metadata['year']}")

        try:
            text = extract_text_from_path(filepath)
            if not text.strip():
                print(f"         ⚠ Empty text — skipping.")
                skipped += 1
                continue

            doc = Document(
                text=text,
                metadata=metadata,
            )
            documents.append(doc)
        except Exception as e:
            print(f"         ✗ Error: {e}")
            skipped += 1

    print(f"\n[*] Successfully parsed {len(documents)} documents ({skipped} skipped).\n")

    if not documents:
        print("[!] No documents to ingest. Exiting.")
        sys.exit(1)

    # ── 4. Configure Chunking ─────────────────────────────────
    print(f"[*] Chunking: size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}")
    Settings.text_splitter = SentenceSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    # ── 5. Setup ChromaDB ─────────────────────────────────────
    print(f"[*] Initializing ChromaDB at: {CHROMA_PERSIST_DIR}")
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

    chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)

    # Delete existing collection if re-running
    try:
        chroma_client.delete_collection(CHROMA_COLLECTION)
        print(f"[*] Cleared existing collection '{CHROMA_COLLECTION}'.")
    except Exception:
        pass

    chroma_collection = chroma_client.get_or_create_collection(CHROMA_COLLECTION)
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # ── 6. Build Index (Embed + Store) ────────────────────────
    print(f"\n[*] Building vector index... (this will take a few minutes on CPU)")
    start = time.time()

    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True,
    )

    elapsed = time.time() - start

    # ── 7. Summary ────────────────────────────────────────────
    count = chroma_collection.count()
    print(f"\n{'=' * 60}")
    print(f"  ✅ Ingestion Complete!")
    print(f"  Documents ingested : {len(documents)}")
    print(f"  Chunks in ChromaDB : {count}")
    print(f"  Time elapsed       : {elapsed:.1f}s")
    print(f"  Persist directory  : {CHROMA_PERSIST_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
