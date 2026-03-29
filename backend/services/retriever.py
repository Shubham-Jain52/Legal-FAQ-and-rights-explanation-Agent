"""
LlamaIndex retrieval service.

Connects to the persistent ChromaDB vector store and retrieves
the most relevant precedent chunks for a given query.
"""

import os
import chromadb
from llama_index.core import VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore

from config import (
    CHROMA_PERSIST_DIR,
    CHROMA_COLLECTION,
    EMBED_MODEL_NAME,
    EMBED_DEVICE,
    RETRIEVAL_TOP_K,
)


class PrecedentRetriever:
    """Singleton-style retriever that loads ChromaDB and embedding model once."""

    def __init__(self):
        self._index = None
        self._retriever = None
        self._collection = None
        self._initialized = False

    def initialize(self):
        """Load the embedding model and connect to ChromaDB."""
        if self._initialized:
            return

        print("[Retriever] Loading embedding model...")
        embed_model = HuggingFaceEmbedding(
            model_name=EMBED_MODEL_NAME,
            device=EMBED_DEVICE,
        )
        Settings.embed_model = embed_model

        print(f"[Retriever] Connecting to ChromaDB at {CHROMA_PERSIST_DIR}...")
        if not os.path.exists(CHROMA_PERSIST_DIR):
            raise FileNotFoundError(
                f"ChromaDB directory not found: {CHROMA_PERSIST_DIR}. "
                "Run `python ingest.py` first."
            )

        chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        self._collection = chroma_client.get_collection(CHROMA_COLLECTION)

        vector_store = ChromaVectorStore(chroma_collection=self._collection)
        self._index = VectorStoreIndex.from_vector_store(vector_store)
        self._retriever = self._index.as_retriever(similarity_top_k=RETRIEVAL_TOP_K)

        self._initialized = True
        print(f"[Retriever] Ready. Collection has {self._collection.count()} chunks.")

    @property
    def is_ready(self) -> bool:
        return self._initialized

    @property
    def document_count(self) -> int:
        if self._collection:
            return self._collection.count()
        return 0

    def retrieve(self, query: str) -> list:
        """
        Retrieve top-K precedent chunks for the given query.

        Returns a list of dicts:
        [
            {
                "text": "...",
                "case_type": "...",
                "case_number": "...",
                "year": "...",
                "source_filename": "...",
                "score": 0.85
            },
            ...
        ]
        """
        if not self._initialized:
            raise RuntimeError("Retriever not initialized. Call initialize() first.")

        nodes = self._retriever.retrieve(query)

        results = []
        for node in nodes:
            metadata = node.metadata or {}
            results.append({
                "text": node.text,
                "case_type": metadata.get("case_type", "Unknown"),
                "case_number": metadata.get("case_number", "Unknown"),
                "year": metadata.get("year", "Unknown"),
                "source_filename": metadata.get("source_filename", "Unknown"),
                "score": round(node.score, 4) if node.score else None,
            })

        return results


# Module-level singleton
precedent_retriever = PrecedentRetriever()
