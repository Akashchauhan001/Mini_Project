"""
ARID Platform - Demo Seed Script
Populates SQLite and knowledge graph with sample paper data (no PDF required).
"""
import sys
import os
import json
import uuid
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("NEO4J_AVAILABLE", "false")

from app import init_db, get_db

SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "..", "sample_papers", "sample_metadata.json")


def seed():
    init_db()
    conn = get_db()

    with open(SAMPLE_PATH, "r", encoding="utf-8") as f:
        papers = json.load(f)

    print(f"Seeding {len(papers)} demo papers…\n")

    for paper in papers:
        paper_id = paper.get("id", str(uuid.uuid4()))

        # Check if already exists
        exists = conn.execute("SELECT id FROM papers WHERE id=?", (paper_id,)).fetchone()
        if exists:
            print(f"  ⏭  Already exists: {paper['title'][:50]}")
            continue

        conn.execute(
            """INSERT INTO papers
               (id, title, authors, abstract, year, filename, concepts, methods, keywords, citations, status, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                paper_id,
                paper["title"],
                json.dumps(paper.get("authors", [])),
                paper.get("abstract", ""),
                paper.get("year"),
                "demo_paper.pdf",
                json.dumps(paper.get("key_concepts", [])),
                json.dumps(paper.get("methods", [])),
                json.dumps(paper.get("key_concepts", [])[:10]),
                json.dumps(paper.get("citations", [])),
                "processed",
                datetime.utcnow().isoformat(),
            )
        )

        # Build graph
        try:
            from graph_builder import get_builder
            gb = get_builder()
            gb.add_paper(paper_id, paper["title"], paper.get("abstract",""), paper.get("year"))
            for author in paper.get("authors", []):
                gb.add_author(author, paper_id)
            for concept in paper.get("key_concepts", [])[:10]:
                gb.add_concept(concept, paper_id)
        except Exception as e:
            print(f"  ⚠  Graph error: {e}")

        # FAISS index
        try:
            from semantic_search import add_paper as faiss_add
            faiss_add(paper_id, paper["title"], paper.get("abstract",""), paper.get("authors",[]))
        except Exception as e:
            print(f"  ⚠  FAISS error: {e}")

        print(f"  ✅ {paper['title'][:60]}")

    conn.commit()
    conn.close()
    print("\n✅ Demo data seeded! Start the backend and open http://localhost:5173")


if __name__ == "__main__":
    seed()
