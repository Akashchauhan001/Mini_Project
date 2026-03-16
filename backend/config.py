"""
ARID Platform - Configuration
"""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
DATABASE_FOLDER = BASE_DIR / "database"

# Ensure dirs exist
UPLOAD_FOLDER.mkdir(exist_ok=True)
DATABASE_FOLDER.mkdir(exist_ok=True)

# SQLite
SQLITE_DB_PATH = str(DATABASE_FOLDER / "arid.db")

# Neo4j
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

# OpenAI (optional)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# HuggingFace
HF_MODEL_SUMMARIZATION = os.getenv("HF_MODEL_SUMMARIZATION", "facebook/bart-large-cnn")
SENTENCE_TRANSFORMER_MODEL = os.getenv("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2")

# FAISS index path
FAISS_INDEX_PATH = str(DATABASE_FOLDER / "faiss.index")
FAISS_METADATA_PATH = str(DATABASE_FOLDER / "faiss_metadata.json")

# Flask
SECRET_KEY = os.getenv("SECRET_KEY", "arid-secret-key-2024")
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {"pdf"}

# spaCy model
SPACY_MODEL = "en_core_web_sm"

# Neo4j available flag
NEO4J_AVAILABLE = os.getenv("NEO4J_AVAILABLE", "false").lower() == "true"
