import requests
import json

BASE_URL = "http://localhost:8000"

payload = {
    "case_id": "vague_test_001",
    "raw_narrative": "someone cheated me",
    "language_preference": "english",
    "state_jurisdiction": "Maharashtra",
    "mode": "citizen"
}
resp = requests.post(f"{BASE_URL}/analyze", json=payload, timeout=60)
data = resp.json()
status = data.get("intake_status")
questions = data.get("case_state", {}).get("follow_up_questions", [])
print(f"Status: {status}")
print(f"Num questions: {len(questions)}")
for q in questions:
    print(f"  Q: {q}")
if status == "awaiting_user_response" and len(questions) <= 1:
    print("PASS")
else:
    print("FAIL")
