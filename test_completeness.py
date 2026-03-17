import requests
import json

BASE_URL = "http://localhost:8000"

def test_completeness():
    # Test 1: Complete query (should skip follow-ups)
    print("\n=== TEST 1: Complete Query (Samsung Fridge) ===")
    payload = {
        "case_id": "completeness_test_001",
        "raw_narrative": "I bought a Samsung refrigerator from Reliance Digital in Delhi for ₹45,000 two weeks ago. After 3 days it stopped cooling completely. The store is refusing to replace or refund it and is telling me to contact the company instead. I have the invoice and warranty card. What legal action can I take?",
        "language_preference": "english",
        "state_jurisdiction": "Delhi",
        "mode": "citizen"
    }
    resp = requests.post(f"{BASE_URL}/analyze", json=payload, timeout=120)
    data = resp.json()
    status = data.get("intake_status")
    conv = data.get("case_state", {}).get("conversational_response", "")
    print(f"Status: {status}")
    print(f"Response: {conv[:200]}")
    if status == "complete":
        print("✅ PASS: Complete query skipped follow-ups!")
    else:
        print("❌ FAIL: Complete query should have skipped follow-ups.")

    # Test 2: Vague query (should ask 1 question)
    print("\n=== TEST 2: Vague Query ===")
    payload2 = {
        "case_id": "completeness_test_002",
        "raw_narrative": "someone cheated me",
        "language_preference": "english",
        "state_jurisdiction": "Maharashtra",
        "mode": "citizen"
    }
    resp2 = requests.post(f"{BASE_URL}/analyze", json=payload2, timeout=60)
    data2 = resp2.json()
    status2 = data2.get("intake_status")
    questions = data2.get("case_state", {}).get("follow_up_questions", [])
    print(f"Status: {status2}")
    print(f"Questions: {questions}")
    if status2 == "awaiting_user_response" and len(questions) <= 1:
        print("✅ PASS: Vague query asked at most 1 question!")
    else:
        print(f"❌ FAIL: Expected 1 question max, got {len(questions)}.")

if __name__ == "__main__":
    test_completeness()
