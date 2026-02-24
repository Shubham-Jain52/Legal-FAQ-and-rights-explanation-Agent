# Lex-2026 AI Legal Analyst

This project implements an AI-powered document analysis tool for legal proceedings.

## Current AI Architecture

### 1. Document Summarization
- **Model:** `facebook/bart-large-cnn`
- **Flow:** Triggered automatically during the `/api/upload` process.
- **Processing:** Summarizes the first 2000 characters of the document.
- **Future:** The `/api/summarize` route is currently reserved for future custom-model integration.

### 2. Semantic Search & Memory
- **Model:** `all-MiniLM-L6-v2` (Sentence-Transformers).
- **Storage:** Data is currently **non-persistent**.
  - `chunkedCases[]`: Stores raw text chunks in memory.
  - `embeddings[]`: Stores the numeric vector representations.
- **Similarity Score:** Calculated using Cosine Similarity between the **PDF filename** and the **text chunks**. 
  - *Note:* This is a placeholder logic; future updates will introduce proper legal metrics and query-based searching.

## Data Flow
1. **Party Dashboard:** User uploads PDF $\rightarrow$ Backend returns Summary + Extracted Text.
2. **Local Storage:** Frontend saves this data to `localStorage` for cross-tab availability.
3. **Judge Dashboard:** Displays the summary and calculates similarity via the `/api/search` endpoint.
