"""
RAG (Retrieval-Augmented Generation) Service
Handles document parsing (PDF, MD, TXT), text chunking, Scikit-learn TF-IDF vector embeddings,
and cosine similarity semantic matching with source attribution.
"""

import io
import re
from typing import Any, Dict, List, Tuple
from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def extract_text_from_file(contents: bytes, filename: str) -> str:
    """Extract clean text from PDF, Markdown, or plain text binary buffers."""
    lower_name = filename.lower()
    
    if lower_name.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(contents))
            pages_text = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            return "\n\n".join(pages_text)
        except Exception as e:
            raise ValueError(f"Unable to extract text from PDF '{filename}': {str(e)}")
            
    # Markdown or plain text
    try:
        return contents.decode("utf-8", errors="replace")
    except Exception as e:
        raise ValueError(f"Unable to decode text document '{filename}': {str(e)}")


def split_text_into_chunks(
    text: str,
    chunk_size: int = 450,
    overlap: int = 60,
) -> List[str]:
    """Split text using sentence/paragraph-aware sliding window chunking."""
    # Normalize whitespaces
    clean_text = re.sub(r'\s+', ' ', text).strip()
    if not clean_text:
        return []

    chunks = []
    start = 0
    total_len = len(clean_text)

    while start < total_len:
        end = start + chunk_size
        
        # If not at the end of the text, look for sentence boundary (.!?) near the end
        if end < total_len:
            boundary = -1
            # Search backwards up to 50 characters for a punctuation mark
            for punct in [". ", "? ", "! ", "\n"]:
                pos = clean_text.rfind(punct, start + chunk_size // 2, end)
                if pos > boundary:
                    boundary = pos + len(punct)
            
            if boundary > 0:
                end = boundary

        chunk = clean_text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= total_len:
            break

        start = max(start + 1, end - overlap)

    return chunks


def search_similar_chunks(
    query: str,
    chunks_with_metadata: List[Dict[str, Any]],
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Given a query and a list of chunk dictionaries:
      [{'id': int, 'content': str, 'filename': str}, ...]
    Vectorizes using TF-IDF and ranks by cosine similarity score.
    Returns the top_k matching chunks with similarity scores.
    """
    if not query.strip() or not chunks_with_metadata:
        return []

    corpus = [item["content"] for item in chunks_with_metadata]
    documents = corpus + [query]

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
    )

    try:
        tfidf_matrix = vectorizer.fit_transform(documents)
    except ValueError:
        # Fallback if corpus vocabulary is empty or only stop words
        return chunks_with_metadata[:top_k]

    chunk_vectors = tfidf_matrix[:-1]
    query_vector = tfidf_matrix[-1]

    similarities = cosine_similarity(query_vector, chunk_vectors).flatten()

    # Pair each chunk with its score
    scored_items = []
    for idx, score in enumerate(similarities):
        chunk_data = chunks_with_metadata[idx]
        scored_items.append({
            "chunk_id": chunk_data.get("id"),
            "content": chunk_data["content"],
            "filename": chunk_data.get("filename", "Uploaded Notes"),
            "similarity_score": round(float(score), 4),
        })

    # Sort descending by similarity score
    scored_items.sort(key=lambda x: x["similarity_score"], reverse=True)

    # Return top_k
    return scored_items[:top_k]