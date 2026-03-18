from app.core.neo4j_client import neo4j_client


class LegalGraphService:
    def health(self) -> dict:
        return neo4j_client.verify_connection()

    def get_chapters_under_act(self, act_name: str) -> list[dict]:
        query = """
        MATCH (a:Act {name: $act_name})-[:ACT_CONTAINS_CHAPTER]->(c:Chapter)
        RETURN c.chapter_number AS chapter_number, c.name AS name
        ORDER BY c.chapter_number
        """
        return neo4j_client.run_read_query(query, {"act_name": act_name})

    def get_sections_under_chapter(self, act_name: str, chapter_number: str) -> list[dict]:
        query = """
        MATCH (a:Act {name: $act_name})-[:ACT_CONTAINS_CHAPTER]->(c:Chapter {chapter_number: $chapter_number})
              -[:CHAPTER_CONTAINS_SECTION]->(s:Section)
        RETURN s.section_number AS section_number, s.title AS title, s.act_name AS act_name
        ORDER BY toInteger(s.section_number)
        """
        return neo4j_client.run_read_query(
            query,
            {"act_name": act_name, "chapter_number": chapter_number},
        )

    def get_section_by_number(self, act_name: str, section_number: str) -> dict | None:
        query = """
        MATCH (s:Section {act_name: $act_name, section_number: $section_number})
        RETURN s.section_number AS section_number, s.title AS title, s.act_name AS act_name
        LIMIT 1
        """
        rows = neo4j_client.run_read_query(
            query,
            {"act_name": act_name, "section_number": section_number},
        )
        return rows[0] if rows else None


legal_graph_service = LegalGraphService()
