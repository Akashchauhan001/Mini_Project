"""
ARID Platform - Main Flask Application
REST API for the Autonomous Research Literature Intelligence & Discovery Platform.
"""
import os
import sys
import uuid
import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Ensure backend dir is on path
sys.path.insert(0, str(Path(__file__).parent))

from config import (
    SQLITE_DB_PATH, UPLOAD_FOLDER, ALLOWED_EXTENSIONS,
    MAX_CONTENT_LENGTH, SECRET_KEY
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# ── Flask App ─────────────────────────────────
app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── SQLite Initialization ─────────────────────
def init_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS papers (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            authors     TEXT,
            abstract    TEXT,
            year        INTEGER,
            filename    TEXT,
            char_count  INTEGER DEFAULT 0,
            word_count  INTEGER DEFAULT 0,
            file_path   TEXT,
            concepts    TEXT,
            methods     TEXT,
            findings    TEXT,
            keywords    TEXT,
            citations   TEXT,
            status      TEXT DEFAULT 'processed',
            created_at  TEXT
        )
    """)
    conn.commit()
    conn.close()
    logger.info("SQLite DB initialized")


def get_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Helpers ───────────────────────────────────
def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def paper_row_to_dict(row) -> dict:
    d = dict(row)
    for json_field in ("authors", "concepts", "methods", "findings", "keywords", "citations"):
        if d.get(json_field):
            try:
                d[json_field] = json.loads(d[json_field])
            except (json.JSONDecodeError, TypeError):
                d[json_field] = []
        else:
            d[json_field] = []
    return d


def api_response(data=None, message="OK", status=200, error=None):
    body = {"message": message, "status": status}
    if data is not None:
        body["data"] = data
    if error:
        body["error"] = error
    return jsonify(body), status


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

# ── Health ────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return api_response(data={"service": "ARID Platform API", "version": "1.0.0"})


# ── Papers ───────────────────────────────────
@app.route("/api/papers", methods=["GET"])
def list_papers():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM papers ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    papers = [paper_row_to_dict(r) for r in rows]
    return api_response(data={"papers": papers, "total": len(papers)})


@app.route("/api/papers/<paper_id>", methods=["GET"])
def get_paper(paper_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM papers WHERE id=?", (paper_id,)).fetchone()
    conn.close()
    if not row:
        return api_response(message="Paper not found", status=404)
    return api_response(data={"paper": paper_row_to_dict(row)})


@app.route("/api/papers/upload", methods=["POST"])
def upload_paper():
    """Upload a PDF → parse → NLP → index."""
    if "file" not in request.files:
        return api_response(message="No file provided", status=400, error="MISSING_FILE")

    file = request.files["file"]
    if file.filename == "":
        return api_response(message="No file selected", status=400)

    if not allowed_file(file.filename):
        return api_response(message="Only PDF files are allowed", status=400, error="INVALID_FORMAT")

    paper_id = str(uuid.uuid4())
    original_name = secure_filename(file.filename)
    save_path = str(UPLOAD_FOLDER / f"{paper_id}_{original_name}")
    file.save(save_path)
    logger.info(f"Saved upload: {save_path}")

    # Parse
    try:
        from paper_parser import extract_paper
        parsed = extract_paper(save_path)
    except Exception as e:
        logger.error(f"Parser error: {e}")
        parsed = {
            "title": original_name.replace(".pdf", "").replace("_", " "),
            "authors": [], "abstract": "", "year": None, "citations": [],
            "full_text": "", "char_count": 0, "word_count": 0,
        }

    # NLP
    try:
        from nlp_pipeline import extract_concepts
        nlp_result = extract_concepts(parsed.get("full_text", ""), parsed.get("abstract", ""))
    except Exception as e:
        logger.error(f"NLP error: {e}")
        nlp_result = {"key_concepts": [], "entities": {}, "methods": [], "findings": [], "keywords": []}

    # Persist to SQLite
    title = parsed.get("title") or original_name
    authors = parsed.get("authors", [])
    abstract = parsed.get("abstract", "")
    year = parsed.get("year")

    conn = get_db()
    conn.execute(
        """INSERT INTO papers
           (id, title, authors, abstract, year, filename, char_count, word_count,
            file_path, concepts, methods, findings, keywords, citations, status, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            paper_id, title,
            json.dumps(authors),
            abstract, year,
            original_name,
            parsed.get("char_count", 0),
            parsed.get("word_count", 0),
            save_path,
            json.dumps(nlp_result.get("key_concepts", [])),
            json.dumps(nlp_result.get("methods", [])),
            json.dumps(nlp_result.get("findings", [])),
            json.dumps(nlp_result.get("keywords", [])),
            json.dumps(parsed.get("citations", [])),
            "processed",
            datetime.utcnow().isoformat(),
        )
    )
    conn.commit()
    conn.close()

    # Knowledge graph
    try:
        from graph_builder import get_builder
        gb = get_builder()
        gb.add_paper(paper_id, title, abstract, year, original_name)
        for author in authors:
            gb.add_author(author, paper_id)
        for concept in nlp_result.get("key_concepts", [])[:15]:
            gb.add_concept(concept, paper_id)
        for citation in parsed.get("citations", [])[:5]:
            gb.add_citation(paper_id, citation)
    except Exception as e:
        logger.error(f"Graph builder error: {e}")

    # FAISS index
    try:
        from semantic_search import add_paper as faiss_add
        faiss_add(paper_id, title, abstract, authors)
    except Exception as e:
        logger.error(f"FAISS error: {e}")

    return api_response(
        data={
            "paper_id": paper_id,
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "year": year,
            "concepts": nlp_result.get("key_concepts", []),
            "keywords": nlp_result.get("keywords", []),
            "char_count": parsed.get("char_count", 0),
        },
        message="Paper uploaded and processed successfully",
        status=201,
    )


@app.route("/api/papers/<paper_id>", methods=["DELETE"])
def delete_paper(paper_id):
    conn = get_db()
    row = conn.execute("SELECT file_path FROM papers WHERE id=?", (paper_id,)).fetchone()
    if not row:
        conn.close()
        return api_response(message="Paper not found", status=404)
    path = row["file_path"]
    conn.execute("DELETE FROM papers WHERE id=?", (paper_id,))
    conn.commit()
    conn.close()
    try:
        if path and Path(path).exists():
            os.remove(path)
    except Exception:
        pass
    return api_response(message="Paper deleted")


# ── Semantic Search ───────────────────────────
@app.route("/api/search", methods=["POST"])
def semantic_search():
    body = request.get_json() or {}
    query = body.get("query", "").strip()
    top_k = int(body.get("top_k", 10))

    if not query:
        return api_response(message="Query is required", status=400)

    # Semantic results
    try:
        from semantic_search import search
        sem_results = search(query, top_k=top_k)
    except Exception as e:
        logger.error(f"Search error: {e}")
        sem_results = []

    # Augment with DB data
    if sem_results:
        conn = get_db()
        enriched = []
        for r in sem_results:
            row = conn.execute("SELECT * FROM papers WHERE id=?", (r["paper_id"],)).fetchone()
            if row:
                p = paper_row_to_dict(row)
                p["score"] = r.get("score", 0.0)
                enriched.append(p)
            else:
                enriched.append(r)
        conn.close()
        sem_results = enriched

    # Fallback: keyword search in SQLite
    if not sem_results:
        conn = get_db()
        like = f"%{query}%"
        rows = conn.execute(
            "SELECT * FROM papers WHERE title LIKE ? OR abstract LIKE ? OR keywords LIKE ? LIMIT ?",
            (like, like, like, top_k)
        ).fetchall()
        conn.close()
        sem_results = [paper_row_to_dict(r) for r in rows]

    return api_response(data={"results": sem_results, "query": query, "total": len(sem_results)})


# ── Knowledge Graph ───────────────────────────
@app.route("/api/graph", methods=["GET"])
def get_graph():
    try:
        from graph_builder import get_builder
        graph = get_builder().get_full_graph()
    except Exception as e:
        logger.error(f"Graph error: {e}")
        graph = {"nodes": [], "edges": []}
    return api_response(data=graph)


@app.route("/api/graph/paper/<paper_id>", methods=["GET"])
def get_paper_graph(paper_id):
    try:
        from graph_builder import get_builder
        graph = get_builder().get_paper_subgraph(paper_id)
    except Exception as e:
        logger.error(f"Graph error: {e}")
        graph = {"nodes": [], "edges": []}
    return api_response(data=graph)


# ── AI Research Assistant ─────────────────────
@app.route("/api/assistant/query", methods=["POST"])
def assistant_query():
    body = request.get_json() or {}
    query = body.get("query", "").strip()
    paper_id = body.get("paper_id")

    if not query:
        return api_response(message="Query is required", status=400)

    context_text = ""
    paper_info = None

    if paper_id:
        conn = get_db()
        row = conn.execute("SELECT * FROM papers WHERE id=?", (paper_id,)).fetchone()
        conn.close()
        if row:
            paper_info = paper_row_to_dict(row)
            context_text = (
                f"Paper: {paper_info['title']}\n"
                f"Abstract: {paper_info['abstract']}\n"
                f"Key Concepts: {', '.join(paper_info.get('concepts', []))}\n"
                f"Methods: {', '.join(paper_info.get('methods', []))}\n"
                f"Findings: {' '.join(paper_info.get('findings', []))}\n"
            )

    response_text = _generate_ai_response(query, context_text, paper_info)

    return api_response(data={
        "query": query,
        "response": response_text,
        "paper_id": paper_id,
    })


def _generate_ai_response(query: str, context: str, paper_info: dict = None) -> str:
    """Generate AI response. Tries OpenAI → HuggingFace → rule-based."""
    query_lower = query.lower()

    # ── Try OpenAI ─────────────────────────────
    try:
        import openai
        from config import OPENAI_API_KEY
        if OPENAI_API_KEY:
            openai.api_key = OPENAI_API_KEY
            system_prompt = (
                "You are ARID, an expert AI research assistant. "
                "Help researchers understand scientific papers. "
                "Be concise, accurate, and insightful."
            )
            user_msg = f"{context}\n\nQuestion: {query}" if context else query
            resp = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=500,
                temperature=0.7,
            )
            return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"OpenAI failed: {e}")

    # ── Rule-based fallback ─────────────────────
    if paper_info:
        title = paper_info.get("title", "this paper")
        abstract = paper_info.get("abstract", "")
        concepts = paper_info.get("concepts", [])[:8]
        methods = paper_info.get("methods", [])[:5]
        findings = paper_info.get("findings", [])[:3]

        if any(w in query_lower for w in ["summarize", "summary", "overview", "about"]):
            return (
                f"**{title}**\n\n"
                f"{abstract[:600] if abstract else 'No abstract available.'}\n\n"
                f"**Key Concepts:** {', '.join(concepts) if concepts else 'None extracted'}\n"
                f"**Methods:** {'; '.join(methods[:3]) if methods else 'Not identified'}"
            )

        elif any(w in query_lower for w in ["key idea", "main idea", "key concept", "important"]):
            bullet_concepts = "\n".join(f"• {c}" for c in concepts[:10]) if concepts else "• No concepts extracted"
            return (
                f"**Key Ideas in \"{title}\":**\n\n"
                f"{bullet_concepts}\n\n"
                f"{'**Notable Findings:**\n' + chr(10).join(f'• {f[:150]}' for f in findings) if findings else ''}"
            )

        elif any(w in query_lower for w in ["method", "approach", "technique", "algorithm"]):
            if methods:
                return (
                    f"**Methods Used in \"{title}\":**\n\n"
                    + "\n".join(f"• {m[:200]}" for m in methods[:5])
                )
            return f"No specific methods were extracted from **{title}**. The abstract mentions: {abstract[:300]}"

        elif any(w in query_lower for w in ["related", "similar", "recommend"]):
            return (
                f"To find papers related to **{title}**, use the **Semantic Search** page "
                f"and search for: *{', '.join(concepts[:4]) if concepts else title}*.\n\n"
                f"This will surface papers with overlapping concepts and themes."
            )

        else:
            return (
                f"Regarding **{title}**: {abstract[:400] if abstract else 'No abstract available.'}\n\n"
                f"**Concepts:** {', '.join(concepts[:8]) if concepts else 'None'}"
            )

    # No paper context
    if any(w in query_lower for w in ["search", "find", "discover"]):
        return (
            "Use the **Semantic Search** page to discover papers by topic. "
            "Type any research topic and ARID will find relevant papers using AI-powered similarity matching."
        )
    elif any(w in query_lower for w in ["upload", "add", "import"]):
        return (
            "Go to the **Upload Paper** page to add new research papers. "
            "ARID supports PDF format and will automatically extract text, concepts, and build the knowledge graph."
        )
    elif any(w in query_lower for w in ["graph", "network", "knowledge"]):
        return (
            "The **Knowledge Graph** visualizes connections between papers, authors, and concepts. "
            "Each node represents an entity, and edges show relationships like citations and shared concepts."
        )
    else:
        return (
            "I'm ARID, your AI research assistant! I can help you:\n\n"
            "• **Summarize** uploaded papers\n"
            "• Identify **key concepts and methods**\n"
            "• Find **related research**\n"
            "• Explain the **knowledge graph**\n\n"
            "Try selecting a paper from your library and asking me to summarize it!"
        )


# ── Stats ─────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    total_papers = conn.execute("SELECT COUNT(*) FROM papers").fetchone()[0]
    recent = conn.execute(
        "SELECT id, title, authors, created_at FROM papers ORDER BY created_at DESC LIMIT 5"
    ).fetchall()
    conn.close()

    try:
        from graph_builder import get_builder
        graph = get_builder().get_full_graph()
        total_nodes = len(graph.get("nodes", []))
        total_edges = len(graph.get("edges", []))
        concept_nodes = sum(1 for n in graph.get("nodes", []) if n.get("label") == "Concept")
        author_nodes = sum(1 for n in graph.get("nodes", []) if n.get("label") == "Author")
    except Exception:
        total_nodes = total_edges = concept_nodes = author_nodes = 0

    recent_papers = []
    for r in recent:
        d = dict(r)
        try:
            d["authors"] = json.loads(d["authors"]) if d["authors"] else []
        except Exception:
            d["authors"] = []
        recent_papers.append(d)

    return api_response(data={
        "total_papers": total_papers,
        "total_nodes": total_nodes,
        "total_edges": total_edges,
        "concept_nodes": concept_nodes,
        "author_nodes": author_nodes,
        "recent_papers": recent_papers,
    })


# ── Serve uploaded files ───────────────────────
@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(str(UPLOAD_FOLDER), filename)


# ── Main ──────────────────────────────────────
if __name__ == "__main__":
    init_db()
    logger.info("ARID Platform API starting on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
