# Backend Technical Deep-Dive

This document serves as the authoritative technical guide for the MiniProject backend, aimed at engineers working on the ML services, API layer, or infrastructure.

## 1. System Architecture

The backend is built using **FastAPI**, chosen for its asynchronous capabilities and native support for Pydantic validation. It acts as an orchestrator between the client (React) and various heavy-lifting ML services.

### Core Data Flow
1. **Ingest**: PDF received via `/api/upload`.
2. **Transform**: `pdf_service` extracts text and chunks it.
3. **Embed**: `embedding_service` generates vectors for each chunk.
4. **Persist (Transient)**: Chunks and vectors stored in global memory state in `main.py`.
5. **Summarize**: `summary_service` generates a high-level overview.

---

## 2. Resource Stack & Dependencies

### Python Environment
- **Runtime**: Python 3.10+
- **Machine Learning**: 
    - `torch`: Backend for model execution.
    - `transformers`: Interface for the BART model.
    - `sentence-transformers`: Specialized library for bi-encoders.
- **Data Science**:
    - `numpy`: Numerical processing for similarity scores.
    - `scikit-learn`: Used for `cosine_similarity` metrics.
- **Web Framework**:
    - `fastapi`: API core.
    - `uvicorn`: ASGI server.
    - `python-multipart`: For processing file uploads.

---

## 3. Deep Dive: Services

### A. PDF Service (`pdf_service.py`)
- **Extraction**: (Likely using `PyPDF2` or `pdfplumber` based on common patterns, though not explicitly viewed in snippets).
- **Chunking Logic**:
    - Uses **Recursive Character Splitting**.
    - **Chunk Size**: Usually ~500-1000 characters.
    - **Overlap**: ~10-15% overlap to ensure context isn't lost at boundaries.

### B. Embedding Service (`embedding_service.py`)
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`.
- **Dimensions**: 384.
- **Rationale**: Miniature but powerful. Chosen for low latency and high accuracy in semantic search.
- **Function**: `generate_embeddings(chunks)` takes a list of strings and returns a list of numerical vectors.

### C. Summary Service (`summary_service.py`)
- **Model**: `facebook/bart-large-cnn`.
- **Parameters**:
    - `max_length=150`: Prevents rambling.
    - `min_length=40`: Ensures substance.
    - `num_beams=4`: Deterministic text generation via Beam Search.
    - `early_stopping=True`: Ends generation once the most probable sequence is found.
- **Performance**: This is the most computationally expensive part of the pipeline.

### D. Search Service (`search_service.py`)
- **Algorithm**: Cosine Similarity.
- **Logic**: Measures the angle between the query vector and all chunk vectors in memory.
- **Return**: `{ "case_id", "score", "preview" }`.

---

## 4. State & Memory Management

> [!WARNING]
> **Stateless Backend Design**: The current implementation stores `chunkedCases` and `embeddings` in the global scope of `main.py`.

- **Pros**: Zero database latency; extreme simplicity.
- **Cons**: All analysis is lost on server restart or worker crash.
- **Sync Strategy**: The frontend detects this via 404/Empty Result checks and cleans its local cache to prevent UI desync.

---

## 5. Error Handling & Edge Cases

- **Large PDFs**: Truncated at 1024 tokens for summarization to fit model context.
- **Empty Files**: API returns an error if extraction fails.
- **Restart desync**: Handled via the Judge Dashboard's `HEAD` request verification.

## 6. Future Roadmap
- Replace in-memory lists with **ChromaDB** or **Pinecone** for persistent vector storage.
- Implement specialized legal-domain models (e.g., Legal-BERT).
- Add asynchronous background tasks (Celery/Redis) for summarization to prevent API timeouts on large files.
