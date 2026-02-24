from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def search_similar(query, model, embeddings, chunked_data, top_k=5):
    query_embedding = model.encode([query])
    similarities = cosine_similarity(query_embedding, embeddings)[0]

    top_indices = np.argsort(similarities)[-top_k:][::-1]

    results = []

    for idx in top_indices:
        results.append({
            "case_id": chunked_data[idx]["case_id"],
            "score": float(similarities[idx]),
            "preview": chunked_data[idx]["text"]
        })

    return results
