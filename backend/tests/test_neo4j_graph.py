from scripts.ingestion.ingest_neo4j_graph import _extract_chapters_and_sections


def test_extract_chapters_and_sections_basic_hierarchy():
    text = """
    CHAPTER I - Offences Against the Body
    101. Murder
    102. Culpable homicide

    CHAPTER II - Property Offences
    201. Theft
    202. Robbery
    """

    groups = _extract_chapters_and_sections(text)

    assert len(groups) == 2
    assert groups[0]["chapter_number"] == "I"
    assert groups[0]["chapter_name"] == "Offences Against the Body"
    assert groups[0]["sections"][0]["section_number"] == "101"
    assert groups[1]["chapter_number"] == "II"
    assert groups[1]["sections"][1]["title"] == "Robbery"


def test_extract_chapters_and_sections_without_chapter_headers():
    text = """
    1. Preliminary
    2. Definitions
    """

    groups = _extract_chapters_and_sections(text)

    assert len(groups) == 1
    assert groups[0]["chapter_number"] == "GENERAL"
    assert len(groups[0]["sections"]) == 2
