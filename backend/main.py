from fastapi import FastAPI, UploadFile, File
import os
import shutil
import time

from services.pdf_service import extract_text_from_pdf, chunk_text
from services.embedding_service import generate_embeddings, model
from services.search_service import search_similar
from services.summary_service import summarize_text

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADFOLDER = "uploads"

if not os.path.exists(UPLOADFOLDER):
    os.makedirs(UPLOADFOLDER)

# Serve uploaded PDFs statically
app.mount("/uploads", StaticFiles(directory=UPLOADFOLDER), name="uploads")

chunkedCases = []
embeddings = []

@app.post("/api/upload")
async def read_items(file: UploadFile = File(...)):
    start = time.time()
    file_path = os.path.join(UPLOADFOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)

    new_embeddings = generate_embeddings(chunks)

    for i, chunk in enumerate(chunks):
        chunkedCases.append({
            "case_id": file.filename,
            "text": chunk
        })
        embeddings.append(new_embeddings[i])

    summary = summarize_text(text[:2000])
    print("Upload processed in:", time.time() - start)
    return {
        "message": "File Upload Successfully",
        "case_id": file.filename,
        "summary": summary,
        "extracted_text": text   # full text; chunks are kept in memory for ML/search
    }

@app.get("/api/search")
def search(query: str):
    result = search_similar(query, model, embeddings, chunkedCases)
    return result

@app.get("/api/summarize")
def summarize(text: str):
    summary = summarize_text(text)
    return summary
