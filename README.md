# 🧠 ARID Platform
## Autonomous Research Literature Intelligence & Discovery

A full-stack AI-powered research intelligence platform that helps researchers discover insights from scientific papers through semantic search, knowledge graphs, and conversational AI.

---

## ✨ Features

| Feature | Technology |
|---------|-----------|
| PDF Upload & Parsing | PyPDF2, pdfminer.six |
| NLP Concept Extraction | spaCy (en_core_web_sm) |
| Semantic Search | SentenceTransformers + FAISS |
| Knowledge Graph | Neo4j (or in-memory fallback) |
| AI Research Assistant | OpenAI GPT / rule-based fallback |
| Interactive Graph Viz | D3.js force-directed graph |
| React Frontend | Vite + Tailwind CSS + React Router |

---

## 📁 Project Structure

```
Mini project/
├── backend/
│   ├── app.py              # Flask REST API (all endpoints)
│   ├── config.py           # Configuration & env variables
│   ├── paper_parser.py     # PDF text + metadata extraction
│   ├── nlp_pipeline.py     # spaCy NLP concept extraction
│   ├── semantic_search.py  # FAISS + SentenceTransformers
│   ├── graph_builder.py    # Neo4j / in-memory graph
│   ├── seed_demo.py        # Load sample data without PDFs
│   └── requirements.txt
│
├── database/
│   ├── neo4j_setup.py      # Neo4j schema initialization
│   └── arid.db             # SQLite (auto-created on first run)
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # LandingPage, Dashboard, Upload, Search, Graph, Assistant
│   │   ├── components/     # Layout, Sidebar, Topbar
│   │   ├── services/api.js # Axios API client
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── sample_papers/
│   ├── sample_metadata.json  # 3 demo paper records
│   └── README.md
│
├── uploads/                  # Uploaded PDFs (auto-created)
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Neo4j** (optional) — [neo4j.com/download](https://neo4j.com/download)

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate virtual environment (recommended)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

#### Configure Environment
```bash
# Copy the example env file
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux

# Edit .env — set OPENAI_API_KEY if you have one
# Neo4j is disabled by default (NEO4J_AVAILABLE=false)
```

#### Run the Backend
```bash
cd backend
python app.py
```
API will be live at: `http://localhost:5000`

#### (Optional) Seed Demo Data
```bash
cd backend
python seed_demo.py
```
This populates the database with 3 landmark AI papers without needing real PDFs.

---

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend will be live at: `http://localhost:5173`

---

### 3. (Optional) Neo4j Setup

1. Download and install [Neo4j Desktop](https://neo4j.com/download)
2. Create a new database with password `password`
3. Start the database
4. Set `NEO4J_AVAILABLE=true` in your `.env` file
5. Run the setup script:
   ```bash
   cd database
   python neo4j_setup.py
   ```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/papers` | List all papers |
| GET | `/api/papers/<id>` | Get single paper |
| POST | `/api/papers/upload` | Upload PDF paper |
| DELETE | `/api/papers/<id>` | Delete paper |
| POST | `/api/search` | Semantic search |
| GET | `/api/graph` | Full knowledge graph |
| GET | `/api/graph/paper/<id>` | Paper subgraph |
| POST | `/api/assistant/query` | AI assistant Q&A |
| GET | `/api/stats` | Dashboard statistics |

### Example: Upload a Paper
```bash
curl -X POST http://localhost:5000/api/papers/upload \
  -F "file=@/path/to/paper.pdf"
```

### Example: Semantic Search
```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "transformer attention mechanisms", "top_k": 5}'
```

### Example: AI Assistant
```bash
curl -X POST http://localhost:5000/api/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Summarize this paper", "paper_id": "YOUR_PAPER_ID"}'
```

---

## 🖥 Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Platform overview and features |
| `/app/dashboard` | Dashboard | Stats + recent papers |
| `/app/upload` | Upload Paper | Drag-and-drop PDF uploader |
| `/app/search` | Semantic Search | AI-powered paper search |
| `/app/graph` | Knowledge Graph | D3.js interactive graph |
| `/app/assistant` | AI Assistant | Chat with your research |

---

## ⚙️ Tech Stack

**Backend**
- Flask 3.0 + Flask-CORS
- SQLite (metadata store)
- Neo4j (knowledge graph, optional)
- spaCy (NLP)
- sentence-transformers + FAISS (semantic search)
- PyPDF2 / pdfminer.six (PDF parsing)
- OpenAI GPT (AI assistant, optional)

**Frontend**
- React 18 + Vite
- Tailwind CSS 3
- React Router 6
- D3.js 7 (knowledge graph)
- Axios (HTTP client)
- react-dropzone (file upload)
- Lucide React (icons)

---

## 🤔 Troubleshooting

**CORS errors:** Make sure the Flask backend is running on port 5000.

**spaCy model missing:**
```bash
python -m spacy download en_core_web_sm
```

**FAISS errors on Windows:**
```bash
pip install faiss-cpu
```

**SentenceTransformers slow first load:** The `all-MiniLM-L6-v2` model (~80MB) is downloaded automatically on first use from HuggingFace.

**Neo4j connection refused:** Leave `NEO4J_AVAILABLE=false` to use in-memory graph.

---

## 📄 License

MIT License — built for academic research use.
