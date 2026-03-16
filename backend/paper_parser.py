"""
ARID Platform - Paper Parser
Extracts text and metadata from PDF research papers.
"""
import re
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def extract_paper(pdf_path: str) -> Dict[str, Any]:
    """
    Main entry point: extract text + metadata from a PDF.
    Returns structured dict with title, authors, abstract, full_text, year.
    """
    text = _extract_text(pdf_path)
    metadata = _extract_metadata(text, pdf_path)
    metadata["full_text"] = text
    metadata["char_count"] = len(text)
    metadata["word_count"] = len(text.split())
    return metadata


def _extract_text(pdf_path: str) -> str:
    """Try PyPDF2 first, fall back to pdfminer."""
    text = ""

    # Attempt 1: PyPDF2
    try:
        import PyPDF2
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            pages = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    pages.append(t)
            text = "\n".join(pages)
        if text.strip():
            logger.info(f"PyPDF2 extracted {len(text)} chars from {pdf_path}")
            return text
    except Exception as e:
        logger.warning(f"PyPDF2 failed: {e}")

    # Attempt 2: pdfminer
    try:
        from pdfminer.high_level import extract_text as pdfminer_extract
        text = pdfminer_extract(pdf_path)
        if text.strip():
            logger.info(f"pdfminer extracted {len(text)} chars from {pdf_path}")
            return text
    except Exception as e:
        logger.warning(f"pdfminer failed: {e}")

    logger.error(f"Could not extract text from {pdf_path}")
    return ""


def _extract_metadata(text: str, pdf_path: str) -> Dict[str, Any]:
    """Heuristically extract title, authors, abstract, year from text."""
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

    title = _extract_title(lines, pdf_path)
    authors = _extract_authors(lines)
    abstract = _extract_abstract(text)
    year = _extract_year(text)
    citations = _extract_citations(text)

    return {
        "title": title,
        "authors": authors,
        "abstract": abstract,
        "year": year,
        "citations": citations,
        "filename": Path(pdf_path).name,
    }


def _extract_title(lines: list, pdf_path: str) -> str:
    """First non-trivial line is usually the title."""
    for line in lines[:10]:
        if len(line) > 10 and not re.match(r"^\d", line):
            cleaned = re.sub(r"\s+", " ", line).strip()
            if len(cleaned) < 200:
                return cleaned
    return Path(pdf_path).stem


def _extract_authors(lines: list) -> list:
    """Look for author patterns in the first 20 lines."""
    authors = []
    author_pattern = re.compile(
        r"^([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+)?)*)"
    )
    for line in lines[1:20]:
        m = author_pattern.match(line)
        if m and len(line) < 150 and "abstract" not in line.lower():
            raw = m.group(1)
            for name in re.split(r",\s*(?:and\s+)?", raw):
                name = name.strip()
                if name and len(name.split()) >= 2:
                    authors.append(name)
    return authors[:10]  # max 10 authors


def _extract_abstract(text: str) -> str:
    """Find and return the abstract section."""
    # Pattern: "Abstract" header followed by text
    patterns = [
        r"(?i)abstract[\s\n]+(.{200,2000}?)(?:\n\n|\d\.|introduction)",
        r"(?i)abstract[:\-]?\s*(.{100,2000}?)(?:\n\n)",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            abstract = re.sub(r"\s+", " ", m.group(1)).strip()
            return abstract[:2000]

    # Fallback: take first 500 chars
    sentences = re.split(r"(?<=[.!?])\s+", text[:3000])
    if sentences:
        return " ".join(sentences[:5])[:500]
    return text[:500]


def _extract_year(text: str) -> Optional[int]:
    """Find a 4-digit year in the range 1900-2030."""
    matches = re.findall(r"\b(19[5-9]\d|20[0-2]\d)\b", text[:3000])
    if matches:
        return int(matches[0])
    return None


def _extract_citations(text: str) -> list:
    """Extract citation-like patterns from the text."""
    citations = []

    # [1] Author et al. style
    pattern1 = re.findall(
        r"\[(\d+)\]\s+([A-Z][^.]{10,100})\.", text
    )
    for _, cite_text in pattern1[:20]:
        citations.append(cite_text.strip())

    # Author (Year) style
    pattern2 = re.findall(
        r"([A-Z][a-z]+(?:\s+et\s+al\.)?)\s+\(((?:19|20)\d{2})\)",
        text
    )
    for author, year in pattern2[:20]:
        citations.append(f"{author.strip()} ({year})")

    # Deduplicate
    return list(dict.fromkeys(citations))[:15]
