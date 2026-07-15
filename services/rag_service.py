from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def split_text_into_chunks(
    text: str,
    chunk_size: int = 900,
    overlap: int = 150,
) -> list[str]:
    clean_text = " ".join(text.split())

    if not clean_text:
        return []

    chunks = []
    start = 0

    while start < len(clean_text):
        end = start + chunk_size
        chunk = clean_text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(clean_text):
            break

        start = end - overlap

    return chunks


def find_relevant_chunks(
    question: str,
    chunks: list[str],
    top_k: int = 3,
) -> list[str]:
    if not question.strip() or not chunks:
        return []

    documents = chunks + [question]

    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
    )

    try:
        vectors = vectorizer.fit_transform(documents)

    except ValueError:
        return chunks[:top_k]

    chunk_vectors = vectors[:-1]
    question_vector = vectors[-1]

    similarity_scores = cosine_similarity(
        question_vector,
        chunk_vectors,
    ).flatten()

    ranked_indexes = similarity_scores.argsort()[::-1]

    relevant_chunks = []

    for index in ranked_indexes[:top_k]:
        relevant_chunks.append(chunks[index])

    return relevant_chunks