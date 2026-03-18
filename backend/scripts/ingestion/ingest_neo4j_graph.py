import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from neo4j import GraphDatabase


def _to_act_label(stem_name: str) -> tuple[str, str]:
    cleaned = stem_name.replace("_", " ").strip()
    abbreviation = "".join(part[0].upper() for part in cleaned.split() if part)
    name = " ".join(token.capitalize() for token in cleaned.split())
    return name, abbreviation


def _extract_chapters_and_sections(text: str) -> list[dict]:
    chapter_pattern = re.compile(
        r"(?:^|\n)\s*CHAPTER\s+([IVXLC\d]+)\s*[-:.]?\s*([^\n]*)",
        flags=re.IGNORECASE,
    )
    section_pattern = re.compile(r"(?:^|\n)\s*(\d+)\.\s+([^\n]+)")

    chapter_matches = [
        {
            "start": m.start(),
            "chapter_number": m.group(1).strip(),
            "chapter_name": (m.group(2) or "Untitled Chapter").strip() or "Untitled Chapter",
        }
        for m in chapter_pattern.finditer(text)
    ]

    if not chapter_matches:
        chapter_matches = [
            {
                "start": 0,
                "chapter_number": "GENERAL",
                "chapter_name": "General",
            }
        ]

    sections_by_chapter: dict[str, dict] = {}

    for section_match in section_pattern.finditer(text):
        section_start = section_match.start()
        section_number = section_match.group(1).strip()
        section_title = section_match.group(2).strip()

        active_chapter = chapter_matches[0]
        for chapter in chapter_matches:
            if chapter["start"] <= section_start:
                active_chapter = chapter
            else:
                break

        chapter_key = f"{active_chapter['chapter_number']}::{active_chapter['chapter_name']}"

        if chapter_key not in sections_by_chapter:
            sections_by_chapter[chapter_key] = {
                "chapter_number": active_chapter["chapter_number"],
                "chapter_name": active_chapter["chapter_name"],
                "sections": [],
            }

        sections_by_chapter[chapter_key]["sections"].append(
            {"section_number": section_number, "title": section_title}
        )

    return list(sections_by_chapter.values())


def _resolve_corpus_path(explicit_path: str | None) -> Path:
    if explicit_path:
        return Path(explicit_path)

    requested_default = Path("app") / "data" / "corpus"
    if requested_default.exists():
        return requested_default

    # Local compatibility fallback without changing requested default contract.
    return Path("data") / "corpus"


def _read_pdf_text(pdf_path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() for page in reader.pages if page.extract_text())


def verify_connection(driver, database: str) -> None:
    with driver.session(database=database) as session:
        result = session.run("MATCH (n) RETURN n LIMIT 1")
        _ = result.single()


def ensure_constraints(driver, database: str) -> None:
    queries = [
        "CREATE CONSTRAINT act_name_unique IF NOT EXISTS FOR (a:Act) REQUIRE a.name IS UNIQUE",
        "CREATE CONSTRAINT section_key_unique IF NOT EXISTS FOR (s:Section) REQUIRE (s.act_name, s.section_number) IS UNIQUE",
    ]

    with driver.session(database=database) as session:
        for query in queries:
            session.run(query)


def upsert_graph_for_pdf(driver, database: str, pdf_path: Path) -> None:
    act_name, abbreviation = _to_act_label(pdf_path.stem)
    text = _read_pdf_text(pdf_path)
    chapter_groups = _extract_chapters_and_sections(text)

    with driver.session(database=database) as session:
        session.run(
            """
            MERGE (a:Act {name: $name})
            SET a.abbreviation = $abbreviation
            """,
            {"name": act_name, "abbreviation": abbreviation},
        )

        for chapter in chapter_groups:
            chapter_params = {
                "act_name": act_name,
                "chapter_number": chapter["chapter_number"],
                "chapter_name": chapter["chapter_name"],
            }

            session.run(
                """
                MATCH (a:Act {name: $act_name})
                MERGE (c:Chapter {chapter_number: $chapter_number, name: $chapter_name})
                MERGE (a)-[:ACT_CONTAINS_CHAPTER]->(c)
                """,
                chapter_params,
            )

            for section in chapter["sections"]:
                section_params = {
                    "act_name": act_name,
                    "chapter_number": chapter["chapter_number"],
                    "chapter_name": chapter["chapter_name"],
                    "section_number": section["section_number"],
                    "title": section["title"],
                }

                session.run(
                    """
                    MATCH (a:Act {name: $act_name})-[:ACT_CONTAINS_CHAPTER]->
                          (c:Chapter {chapter_number: $chapter_number, name: $chapter_name})
                    MERGE (s:Section {act_name: $act_name, section_number: $section_number})
                    SET s.title = $title
                    MERGE (c)-[:CHAPTER_CONTAINS_SECTION]->(s)
                    """,
                    section_params,
                )


def main() -> int:
    load_dotenv(override=True)

    neo4j_uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user = os.environ.get("NEO4J_USER", "neo4j")
    neo4j_password = os.environ.get("NEO4J_PASSWORD", "")
    neo4j_database = os.environ.get("NEO4J_DATABASE", "neo4j")
    corpus_path = _resolve_corpus_path(os.environ.get("NEO4J_CORPUS_PATH"))

    if not neo4j_password:
        print("NEO4J_PASSWORD is missing. Aborting ingestion.")
        return 1

    if not corpus_path.exists():
        print(f"Corpus path not found: {corpus_path}")
        return 1

    pdf_files = sorted(corpus_path.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {corpus_path}")
        return 1

    driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))

    try:
        verify_connection(driver, neo4j_database)
        ensure_constraints(driver, neo4j_database)

        for pdf_file in pdf_files:
            print(f"Ingesting {pdf_file.name}")
            upsert_graph_for_pdf(driver, neo4j_database, pdf_file)

        print("Neo4j graph ingestion completed successfully.")
        return 0
    except Exception as exc:
        print(f"Neo4j ingestion failed: {exc}")
        return 1
    finally:
        driver.close()


if __name__ == "__main__":
    sys.exit(main())
