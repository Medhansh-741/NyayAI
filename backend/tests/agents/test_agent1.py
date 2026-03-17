import os
import json
from unittest.mock import MagicMock
from agent import run
from case_state import CaseState, StructuredFacts

# Mock Groq client
mock_groq = MagicMock()
mock_completion = MagicMock()
mock_message = MagicMock()

# Simulated LLM output based on the new schema
simulated_json = {
  "language_preference": "english",
  "state_jurisdiction": "Delhi",
  "structured_facts": {
    "incident_type": "tenant",
    "incident_summary": "Landlord locking out tenant without notice.",
    "incident_date": "2023-10-01",
    "parties": [
      {
        "role": "victim",
        "name": "John Doe",
        "contact": "1234567890",
        "description": "Tenant"
      }
    ],
    "timeline": ["2023-10-01: Locked out"],
    "urgency_level": "high",
    "monetary_value_inr": None,
    "key_facts": ["No notice given", "Locked out"],
    "missing_information": [],
    "dispute_context": "Residential lease"
  },
  "evidence_inventory": []
}

mock_message.content = json.dumps(simulated_json)
mock_completion.message = mock_message
mock_groq.chat.completions.create.return_value.choices = [mock_completion]

# Mock Sarvam client since we aren't testing OCR here
mock_sarvam = MagicMock()

state = CaseState()
state.raw_narrative = "My landlord locked me out of my apartment in Delhi without any notice yesterday."

try:
    result = run(state, groq_client=mock_groq, sarvam_client=mock_sarvam)
    print("SUCCESS: Pipeline ran.")
    print(f"Language: {result.language_preference}")
    print(f"Jurisdiction: {result.state_jurisdiction}")
    print(f"Incident Type: {result.structured_facts.incident_type}")
    print(f"Intake Status: {result.intake_status}")
except Exception as e:
    print(e)

