"""
ARID Platform - Semantic Search Engine
SentenceTransformers + FAISS for similarity search over paper embeddings.
"""
import json
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

_model = None
_faiss_index = None
_metadata: List[Dict] = []


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            from config import SENTENCE_TRANSFORMER_MODEL
            _model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
            logger.info(f"SentenceTransformer loaded: {SENTENCE_TRANSFORMER_MODEL}")
        except Exception as e:
            logger.error(f"Could not load SentenceTransformer: {e}")
            _model = None
    return _model


def _load_index():
    """Load FAISS index and metadata from disk if they exist."""
    global _faiss_index, _metadata
    from config import FAISS_INDEX_PATH, FAISS_METADATA_PATH
    try:
        import faiss
        if Path(FAISS_INDEX_PATH).exists():
            _faiss_index = faiss.read_index(FAISS_INDEX_PATH)
            logger.info(f"FAISS index loaded with {_faiss_index.ntotal} vectors")
        if Path(FAISS_METADATA_PATH).exists():
            with open(FAISS_METADATA_PATH, "r", encoding="utf-8") as f:
                _metadata = json.load(f)
    except Exception as e:
        logger.warning(f"Could not load FAISS index: {e}")


def _save_index():
    """Persist FAISS index and metadata to disk."""
    global _faiss_index, _metadata
    from config import FAISS_INDEX_PATH, FAISS_METADATA_PATH
    try:
        import faiss
        if _faiss_index is not None:
            faiss.write_index(_faiss_index, FAISS_INDEX_PATH)
        with open(FAISS_METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(_metadata, f)
    except Exception as e:
        logger.error(f"Could not save FAISS index: {e}")


def _encode(text: str) -> Optional[np.ndarray]:
    """Encode a text string into a float32 embedding vector."""
    model = _get_model()
    if model is None:
        return None
    vec = model.encode([text], convert_to_numpy=True, normalize_embeddings=True)
    return vec.astype(np.float32)


def add_paper(paper_id: str, title: str, abstract: str, authors: List[str] = None):
    """
    Encode abstract and add to FAISS index.
    Call after a new paper is ingested.
    """
    global _faiss_index, _metadata
    import faiss

    text = f"{title} {abstract}"
    vec = _encode(text)
    if vec is None:
        logger.warning(f"Skipping FAISS index for paper {paper_id}: model unavailable")
        return

    dim = vec.shape[1]

    if _faiss_index is None:
        _faiss_index = faiss.IndexFlatIP(dim)  # Inner-product (cosine with normalized vecs)
        logger.info(f"Created new FAISS index (dim={dim})")

    _faiss_index.add(vec)
    _metadata.append({
        "paper_id": paper_id,
        "title": title,
        "abstract": abstract,
        "authors": authors or [],
        "index_pos": len(_metadata),
    })
    _save_index()
    logger.info(f"Added paper '{title}' to FAISS index (total: {_faiss_index.ntotal})")


def search(query: str, top_k: int = 10) -> List[Dict[str, Any]]:
    """
    Semantic search: encode query and find top_k similar papers.
    Returns list of {paper_id, title, abstract, authors, score}.
    """
    global _faiss_index, _metadata

    if _faiss_index is None:
        _load_index()

    if _faiss_index is None or _faiss_index.ntotal == 0:
        logger.warning("FAISS index empty – returning empty results")
        return []

    vec = _encode(query)
    if vec is None:
        return []

    k = min(top_k, _faiss_index.ntotal)
    scores, indices = _faiss_index.search(vec, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(_metadata):
            continue
        entry = _metadata[idx].copy()
        entry["score"] = float(score)
        results.append(entry)

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def rebuild_index(papers: List[Dict[str, Any]]):
    """
    Rebuild the FAISS index from scratch given a list of paper dicts.
    Each dict should have: id, title, abstract, authors.
    """
    global _faiss_index, _metadata
    import faiss

    _faiss_index = None
    _metadata = []
    for paper in papers:
        add_paper(
            paper_id=paper.get("id", paper.get("paper_id", "")),
            title=paper.get("title", ""),
            abstract=paper.get("abstract", ""),
            authors=paper.get("authors", []),
        )
    logger.info(f"Rebuilt FAISS index with {len(papers)} papers")


# Initialize on import
try:
    _load_index()
except Exception:
    pass
