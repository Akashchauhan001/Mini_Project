"""
ARID Platform - NLP Pipeline
Extracts concepts, entities, methods, findings from paper text using spaCy.
"""
import re
import logging
from typing import Dict, List, Any
from collections import Counter

logger = logging.getLogger(__name__)

# spaCy loaded lazily
_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded: en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            _nlp = None
    return _nlp


# Scientific method / technique keywords
METHOD_KEYWORDS = [
    "algorithm", "method", "approach", "framework", "model", "technique",
    "architecture", "system", "pipeline", "network", "classifier", "regression",
    "transformer", "attention", "encoder", "decoder", "convolution", "embedding",
    "clustering", "classification", "detection", "segmentation", "generation",
    "optimization", "training", "fine-tuning", "pre-training", "transfer learning",
    "reinforcement learning", "supervised", "unsupervised", "semi-supervised",
    "deep learning", "machine learning", "neural network", "bert", "gpt",
]

# Finding / result keywords
FINDING_KEYWORDS = [
    "result", "finding", "conclusion", "show", "demonstrate", "achieve",
    "outperform", "improve", "increase", "decrease", "accuracy", "performance",
    "state-of-the-art", "sota", "benchmark", "evaluation", "experiment",
    "significant", "novel", "propose", "contribution", "achieve",
]


def extract_concepts(text: str, abstract: str = "") -> Dict[str, Any]:
    """
    Main NLP pipeline entry. Returns dict with:
      - key_concepts: list of important noun phrases
      - entities: named entities (ORG, PERSON, GPE, PRODUCT)
      - methods: extracted ML/research methods
      - findings: key sentences about results
      - keywords: top N keywords by frequency
    """
    # Prefer abstract for concept extraction; supplement with first 5000 chars of body
    analysis_text = (abstract + " " + text[:5000]).strip()

    nlp = _get_nlp()
    if nlp is None:
        return _fallback_extraction(analysis_text)

    doc = nlp(analysis_text[:nlp.max_length])

    key_concepts = _extract_key_concepts(doc)
    entities = _extract_entities(doc)
    methods = _extract_methods(doc, analysis_text)
    findings = _extract_findings(doc, analysis_text)
    keywords = _extract_keywords(doc)

    return {
        "key_concepts": key_concepts[:20],
        "entities": entities,
        "methods": methods[:15],
        "findings": findings[:5],
        "keywords": keywords[:25],
    }


def _extract_key_concepts(doc) -> List[str]:
    """Extract meaningful noun chunks as key concepts."""
    concepts = []
    seen = set()
    for chunk in doc.noun_chunks:
        # Filter short/stopword-heavy chunks
        root = chunk.root
        if (root.pos_ in ("NOUN", "PROPN") and
                not root.is_stop and
                len(chunk.text.split()) >= 1 and
                len(chunk.text) > 3):
            clean = chunk.text.lower().strip()
            clean = re.sub(r"[^a-z0-9 \-]", "", clean).strip()
            if clean and clean not in seen and len(clean) > 3:
                concepts.append(clean)
                seen.add(clean)
    return concepts


def _extract_entities(doc) -> Dict[str, List[str]]:
    """Extract named entities grouped by type."""
    entity_map: Dict[str, set] = {
        "organizations": set(),
        "persons": set(),
        "technologies": set(),
        "locations": set(),
    }
    label_map = {
        "ORG": "organizations",
        "PERSON": "persons",
        "PRODUCT": "technologies",
        "GPE": "locations",
        "NORP": "organizations",
        "FAC": "organizations",
    }
    for ent in doc.ents:
        key = label_map.get(ent.label_)
        if key:
            name = ent.text.strip()
            if len(name) > 2:
                entity_map[key].add(name)
    return {k: list(v)[:10] for k, v in entity_map.items()}


def _extract_methods(doc, text: str) -> List[str]:
    """Find sentences / noun chunks related to methods/techniques."""
    methods = []
    text_lower = text.lower()
    for kw in METHOD_KEYWORDS:
        if kw in text_lower:
            # Find the sentence containing the keyword
            for sent in doc.sents:
                if kw in sent.text.lower():
                    clean = sent.text.strip()
                    if 20 < len(clean) < 300:
                        methods.append(clean)
                    break
    # Also grab noun chunks containing method keywords
    for chunk in doc.noun_chunks:
        for kw in METHOD_KEYWORDS[:10]:
            if kw in chunk.text.lower():
                t = chunk.text.strip()
                if t not in methods:
                    methods.append(t)
    return list(dict.fromkeys(methods))


def _extract_findings(doc, text: str) -> List[str]:
    """Extract sentences that describe results or findings."""
    findings = []
    for sent in doc.sents:
        sent_lower = sent.text.lower()
        score = sum(1 for kw in FINDING_KEYWORDS if kw in sent_lower)
        if score >= 2 and 40 < len(sent.text) < 400:
            findings.append(sent.text.strip())
    return findings


def _extract_keywords(doc) -> List[str]:
    """Return top keywords by lemma frequency (excluding stopwords)."""
    tokens = [
        token.lemma_.lower()
        for token in doc
        if not token.is_stop and not token.is_punct
        and token.pos_ in ("NOUN", "PROPN", "ADJ")
        and len(token.text) > 3
    ]
    freq = Counter(tokens)
    return [word for word, _ in freq.most_common(25)]


def _fallback_extraction(text: str) -> Dict[str, Any]:
    """Simple regex-based fallback when spaCy is unavailable."""
    words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
    stopwords = {
        "that", "this", "with", "from", "have", "been", "were", "they",
        "their", "which", "when", "also", "into", "about", "more", "some",
        "than", "such", "then", "over", "after", "these", "other", "paper",
    }
    freq = Counter(w for w in words if w not in stopwords)
    keywords = [w for w, _ in freq.most_common(25)]

    # Simple sentence-based extraction
    sentences = re.split(r"(?<=[.!?])\s+", text)
    findings = [s.strip() for s in sentences if any(
        kw in s.lower() for kw in ["result", "show", "achieve", "demonstrate"]
    ) and 40 < len(s) < 400][:5]

    return {
        "key_concepts": keywords[:20],
        "entities": {"organizations": [], "persons": [], "technologies": [], "locations": []},
        "methods": [],
        "findings": findings,
        "keywords": keywords[:25],
    }
