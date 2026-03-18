import os
import sys

from dotenv import load_dotenv
from neo4j import GraphDatabase


def main() -> int:
    load_dotenv(override=True)

    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "")
    database = os.environ.get("NEO4J_DATABASE", "neo4j")

    if not password:
        print("NEO4J_PASSWORD is missing.")
        return 1

    driver = GraphDatabase.driver(uri, auth=(user, password))

    try:
        with driver.session(database=database) as session:
            result = session.run("MATCH (n) RETURN n LIMIT 1")
            record = result.single()
            print("Neo4j connection successful.")
            print(f"Sample node exists: {record is not None}")
        return 0
    except Exception as exc:
        print(f"Neo4j connection failed: {exc}")
        return 1
    finally:
        driver.close()


if __name__ == "__main__":
    sys.exit(main())
