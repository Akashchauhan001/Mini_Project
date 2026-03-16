"""
ARID Platform - Neo4j Setup Script
Run this once to initialize Neo4j schema constraints and indexes.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


def setup_neo4j():
    try:
        from neo4j import GraphDatabase
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")

        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        print(f"✅ Connected to Neo4j at {uri}")

        with driver.session() as session:
            # Uniqueness constraints
            constraints = [
                "CREATE CONSTRAINT paper_id IF NOT EXISTS FOR (p:Paper) REQUIRE p.id IS UNIQUE",
                "CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE",
                "CREATE CONSTRAINT author_name IF NOT EXISTS FOR (a:Author) REQUIRE a.name IS UNIQUE",
            ]
            for q in constraints:
                try:
                    session.run(q)
                    print(f"✅ Created constraint")
                except Exception as e:
                    print(f"⚠️  Constraint (may already exist): {e}")

            # Indexes
            indexes = [
                "CREATE INDEX paper_title IF NOT EXISTS FOR (p:Paper) ON (p.title)",
                "CREATE INDEX paper_year IF NOT EXISTS FOR (p:Paper) ON (p.year)",
                "CREATE INDEX concept_name_idx IF NOT EXISTS FOR (c:Concept) ON (c.name)",
            ]
            for q in indexes:
                try:
                    session.run(q)
                    print(f"✅ Created index")
                except Exception as e:
                    print(f"⚠️  Index: {e}")

        driver.close()
        print("\n✅ Neo4j setup complete!")

    except Exception as e:
        print(f"❌ Neo4j setup failed: {e}")
        print("   Make sure Neo4j is running and credentials are correct.")
        print("   Set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD environment variables.")
        sys.exit(1)


if __name__ == "__main__":
    setup_neo4j()
