import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../Agent 2/schemas")))

import json
import logging
from agent4_drafting import drafting_agent

logging.basicConfig(level=logging.INFO)

mock_state = {
    "case_id": "test_case_4",
    "language_preference": "english",
    "state_jurisdiction": "Maharashtra",
    "structured_facts": {
        "dispute_type": "consumer",
        "key_facts": [
            "User paid builder INR 10,00,000 for flat in 2020.",
            "Builder promised possession in Dec 2022.",
            "Possession not handed over. Builder not refunding money."
        ],
        "parties": [
            {"name": "Ravi Kumar", "role": "complainant"},
            {"name": "Skyline Builders", "role": "respondent"}
        ]
    },
    "legal_mapping": {
        "applicable_sections": [
            {"section_ref": "Sec 35", "act_name": "Consumer Protection Act 2019", "confidence": "high"},
            {"section_ref": "Sec 18", "act_name": "RERA 2016", "confidence": "high"}
        ]
    },
    "action_plan": {
        "forum_selection": "District Consumer Commission",
        "demand_amount": "Refund of 10,00,000 + 12% interest",
        "relief_sought": "Refund, compensation for mental agony",
        "document_types_required": ["legal_notice", "consumer_complaint"],
        "lawyer_recommended": True  # This should trigger 'lawyer_brief' too
    }
}

print("Running drafting agent with mock state...")
out_state = drafting_agent(mock_state)

print("\n--- Generated Documents ---")
for doc_type, doc_data in out_state.get("generated_documents", {}).items():
    if doc_data is None:
        continue
    print(f"\nDocument Type: {doc_type}")
    print(f"  Title: {doc_data.get('document_title')}")
    print(f"  Word Docx: {doc_data.get('docx_url')}")
    print(f"  PDF: {doc_data.get('pdf_url')}")
    print(f"  Preview:\n{doc_data.get('content_md')[:200]}...")

print("\nTesting complete.")
