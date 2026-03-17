import re
from pypdf import PdfReader
from pathlib import Path

def load_pdf(path: str) -> str:
    reader = PdfReader(path)
    text = "\n".join(page.extract_text() for page in reader.pages if page.extract_text())
    return text


def split_into_sections(text: str):
    """
    Splits legal acts into sections like:
    '35. Power of District Commission...'
    """
    pattern = r"\n\s*(\d+)\.\s"
    parts = re.split(pattern, text)

    sections = []

    for i in range(1, len(parts), 2):
        section_num = parts[i]
        section_text = parts[i + 1]
        sections.append((section_num, section_text.strip()))

    return sections


def chunk_text(text: str, chunk_size=800, overlap=100):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap

    return chunks


def load_all_pdfs(corpus_dir=None):
    if corpus_dir is None:
        # Resolve path relative to this script: backend/scripts/ingestion/ingest.py -> backend/data/corpus
        base_path = Path(__file__).parent.parent.parent
        corpus_dir = base_path / "data" / "corpus"
        
    records = []
    print(f"Loading PDFs from: {corpus_dir}")

    for pdf_file in Path(corpus_dir).glob("*.pdf"):

        act_name = pdf_file.stem

        print(f"\nProcessing {act_name}")

        text = load_pdf(str(pdf_file))

        sections = split_into_sections(text)

        print(f"Found {len(sections)} sections")

        for section_num, section_text in sections:

            section_chunks = chunk_text(section_text)

            for chunk in section_chunks:

                records.append({
                    "act": act_name,
                    "section": section_num,
                    "text": chunk,
                    "source": pdf_file.name
                })

    print(f"\nTotal chunks prepared: {len(records)}")

    return records


if __name__ == "__main__":

    data = load_all_pdfs()

    print(f"\nSample record:\n{data[0]}")