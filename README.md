# ⚖️ Single-View Case Analyzer

An AI-powered legal research tool that compares two opposing case documents and generates a structured **Judicial Brief** — complete with party summaries, points of contention, relevant precedents, and neutral analytical observations.

Built for the Indian judicial context using **RAG (Retrieval-Augmented Generation)** over a local knowledge base of Orissa High Court judgments.

> **Disclaimer:** This tool is an analytical aid only. It does NOT provide legal advice or predict outcomes.

---

## How It Works

```
User uploads 2 PDFs (e.g., Prosecution vs. Defense)
        │
        ▼
┌─── FastAPI Backend ───┐
│  1. Extract text       │
│  2. Retrieve top-5     │──── ChromaDB (926 precedent chunks)
│     precedents (RAG)   │          ▲
│  3. Send to LLM        │     BAAI/bge-small-en-v1.5
│     (Groq API)         │     (CPU embeddings)
│  4. Return structured  │
│     Judicial Brief     │
└────────────────────────┘
        │
        ▼
  React Frontend renders the analysis
```

**Key Output — The Judicial Brief:**
- **Case Overview** — Titles and analysis timestamp
- **Party A & B Summaries** — Key claims, cited statutes, core arguments
- **Comparative Analysis** — Points of agreement and contention
- **Relevant Precedents** — Retrieved from Orissa HC judgment database
- **Analytical Observations** — Neutral, citation-backed insights

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Axios, CSS |
| **Backend** | FastAPI, Uvicorn, Pydantic |
| **LLM** | Groq API (`llama-3.1-8b-instant`) |
| **RAG** | LlamaIndex + ChromaDB |
| **Embeddings** | `BAAI/bge-small-en-v1.5` (CPU) |
| **PDF Parsing** | PyMuPDF (fitz) |

---

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app (routes, CORS, lifespan)
│   ├── config.py                # Centralized settings & env loading
│   ├── models.py                # Pydantic schemas
│   ├── ingest.py                # Offline: PDF → chunks → ChromaDB
│   ├── services/
│   │   ├── pdf_parser.py        # PyMuPDF text extraction
│   │   ├── retriever.py         # LlamaIndex vector retrieval
│   │   └── analyzer.py          # Groq LLM orchestration
│   └── prompts/
│       └── judicial_brief.py    # System & user prompt templates
│
├── frontend/
│   ├── src/
│   │   ├── App.js               # Main layout (split-screen)
│   │   ├── components/
│   │   │   ├── UploadPanel.jsx   # Dual PDF upload
│   │   │   ├── BriefDisplay.jsx  # Judicial Brief renderer
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBanner.jsx
│   │   └── services/
│   │       └── api.js           # Axios API calls
│   └── public/
│
├── downloaded_pdfs/             # Orissa HC judgment PDFs (data source)
├── plan.md                      # System design document
├── implementation.md            # Implementation roadmap
└── DownloderScript.py           # Selenium PDF scraper
```

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API key](https://console.groq.com/keys) (free tier works)

### 1. Backend

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (CPU-only PyTorch)
pip install torch==2.2.2+cpu --index-url https://download.pytorch.org/whl/cpu
pip install -r backend/requirements.txt

# Configure API key
echo "GROQ_API_KEY=your_key_here" > .env

# Ingest PDFs into vector store (one-time)
cd backend
python ingest.py

# Start the API server
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check + vector store status |
| `POST` | `/api/v1/analyze_case` | Upload 2 PDFs → returns Judicial Brief JSON |

Interactive docs available at: `http://localhost:8000/docs`

---

## Team

| Member | Role |
|--------|------|
| **Shubham Jain** | Team Lead |

---

## License

This project is for educational and research purposes only.
