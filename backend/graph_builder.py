"""
ARID Platform - Knowledge Graph Builder
Manages Neo4j graph (if available) and in-memory fallback graph.
"""
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# In-memory graph store (always available)
# ─────────────────────────────────────────────
_graph_nodes: Dict[str, Dict] = {}   # node_id -> {id, label, properties}
_graph_edges: List[Dict] = []         # [{source, target, relation}]


class GraphBuilder:
    """
    Builds and queries the research knowledge graph.
    Uses Neo4j when available, falls back to in-memory store.
    """

    def __init__(self):
        self._driver = None
        self._neo4j_available = False
        self._try_connect_neo4j()

    # ── Neo4j ──────────────────────────────────
    def _try_connect_neo4j(self):
        try:
            from config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_AVAILABLE
            if not NEO4J_AVAILABLE:
                logger.info("Neo4j disabled via config (NEO4J_AVAILABLE=false)")
                return
            from neo4j import GraphDatabase
            self._driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            self._driver.verify_connectivity()
            self._neo4j_available = True
            logger.info("Neo4j connected")
            self._create_constraints()
        except Exception as e:
            logger.warning(f"Neo4j not available: {e} – using in-memory graph")

    def _create_constraints(self):
        """Create uniqueness constraints."""
        queries = [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Author) REQUIRE a.name IS UNIQUE",
        ]
        with self._driver.session() as session:
            for q in queries:
                try:
                    session.run(q)
                except Exception as e:
                    logger.warning(f"Constraint creation: {e}")

    # ── Public API ─────────────────────────────
    def add_paper(self, paper_id: str, title: str, abstract: str,
                  year: Optional[int] = None, filename: str = ""):
        """Add a Paper node."""
        props = {
            "id": paper_id, "title": title, "abstract": abstract,
            "year": year, "filename": filename,
        }
        self._upsert_node(paper_id, "Paper", props)

        if self._neo4j_available:
            with self._driver.session() as session:
                session.run(
                    "MERGE (p:Paper {id: $id}) "
                    "SET p.title=$title, p.abstract=$abstract, p.year=$year, p.filename=$filename",
                    **props
                )

    def add_author(self, author_name: str, paper_id: str):
        """Add Author node and AUTHOR_WRITES_PAPER edge."""
        node_id = f"author:{author_name}"
        self._upsert_node(node_id, "Author", {"id": node_id, "name": author_name})
        self._upsert_edge(node_id, paper_id, "AUTHOR_WRITES_PAPER")

        if self._neo4j_available:
            with self._driver.session() as session:
                session.run(
                    "MERGE (a:Author {name: $name}) "
                    "WITH a MATCH (p:Paper {id: $paper_id}) "
                    "MERGE (a)-[:AUTHOR_WRITES_PAPER]->(p)",
                    name=author_name, paper_id=paper_id
                )

    def add_concept(self, concept: str, paper_id: str):
        """Add Concept node and PAPER_HAS_CONCEPT edge."""
        node_id = f"concept:{concept}"
        self._upsert_node(node_id, "Concept", {"id": node_id, "name": concept})
        self._upsert_edge(paper_id, node_id, "PAPER_HAS_CONCEPT")

        if self._neo4j_available:
            with self._driver.session() as session:
                session.run(
                    "MERGE (c:Concept {name: $name}) "
                    "WITH c MATCH (p:Paper {id: $paper_id}) "
                    "MERGE (p)-[:PAPER_HAS_CONCEPT]->(c)",
                    name=concept, paper_id=paper_id
                )

    def add_citation(self, citing_id: str, cited_title: str):
        """Add PAPER_CITES_PAPER edge (cited paper may be external)."""
        cited_id = f"external:{citing_id}:{cited_title[:30]}"
        self._upsert_node(cited_id, "Paper", {"id": cited_id, "title": cited_title, "external": True})
        self._upsert_edge(citing_id, cited_id, "PAPER_CITES_PAPER")

        if self._neo4j_available:
            with self._driver.session() as session:
                session.run(
                    "MERGE (cited:Paper {id: $cited_id}) "
                    "SET cited.title=$title "
                    "WITH cited MATCH (citing:Paper {id: $citing_id}) "
                    "MERGE (citing)-[:PAPER_CITES_PAPER]->(cited)",
                    cited_id=cited_id, title=cited_title, citing_id=citing_id
                )

    def get_full_graph(self) -> Dict[str, Any]:
        """Return full graph as {nodes, edges} for frontend visualization."""
        if self._neo4j_available:
            return self._neo4j_full_graph()
        return self._memory_full_graph()

    def get_paper_subgraph(self, paper_id: str) -> Dict[str, Any]:
        """Return subgraph centred on a paper."""
        if self._neo4j_available:
            return self._neo4j_paper_subgraph(paper_id)
        return self._memory_paper_subgraph(paper_id)

    # ── In-memory store helpers ─────────────────
    def _upsert_node(self, node_id: str, label: str, props: Dict):
        _graph_nodes[node_id] = {"id": node_id, "label": label, **props}

    def _upsert_edge(self, source: str, target: str, relation: str):
        for e in _graph_edges:
            if e["source"] == source and e["target"] == target and e["relation"] == relation:
                return
        _graph_edges.append({"source": source, "target": target, "relation": relation})

    def _memory_full_graph(self) -> Dict[str, Any]:
        return {
            "nodes": list(_graph_nodes.values()),
            "edges": list(_graph_edges),
        }

    def _memory_paper_subgraph(self, paper_id: str) -> Dict[str, Any]:
        connected_ids = {paper_id}
        relevant_edges = []
        for edge in _graph_edges:
            if edge["source"] == paper_id or edge["target"] == paper_id:
                connected_ids.add(edge["source"])
                connected_ids.add(edge["target"])
                relevant_edges.append(edge)
        nodes = [n for nid, n in _graph_nodes.items() if nid in connected_ids]
        return {"nodes": nodes, "edges": relevant_edges}

    # ── Neo4j query helpers ─────────────────────
    def _neo4j_full_graph(self) -> Dict[str, Any]:
        nodes, edges = [], []
        with self._driver.session() as session:
            result = session.run("MATCH (n) RETURN n LIMIT 500")
            for record in result:
                n = record["n"]
                nodes.append({"id": n.element_id, "label": list(n.labels)[0], **dict(n)})
            result = session.run(
                "MATCH (a)-[r]->(b) RETURN a, type(r) AS rel, b LIMIT 1000"
            )
            for record in result:
                edges.append({
                    "source": record["a"].element_id,
                    "target": record["b"].element_id,
                    "relation": record["rel"],
                })
        return {"nodes": nodes, "edges": edges}

    def _neo4j_paper_subgraph(self, paper_id: str) -> Dict[str, Any]:
        nodes, edges = [], []
        with self._driver.session() as session:
            result = session.run(
                "MATCH (p:Paper {id:$id})-[r]-(n) RETURN p, type(r) AS rel, n",
                id=paper_id
            )
            seen_nodes = set()
            for record in result:
                for node in [record["p"], record["n"]]:
                    if node.element_id not in seen_nodes:
                        nodes.append({"id": node.element_id, "label": list(node.labels)[0], **dict(node)})
                        seen_nodes.add(node.element_id)
                edges.append({
                    "source": record["p"].element_id,
                    "target": record["n"].element_id,
                    "relation": record["rel"],
                })
        return {"nodes": nodes, "edges": edges}


# Singleton
_builder: Optional[GraphBuilder] = None


def get_builder() -> GraphBuilder:
    global _builder
    if _builder is None:
        _builder = GraphBuilder()
    return _builder
