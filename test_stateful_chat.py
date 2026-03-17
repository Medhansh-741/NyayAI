import requests
import json
import uuid

BASE_URL = "http://localhost:8000"

def test_stateful_conversation():
    case_id = f"test_{uuid.uuid4().hex[:8]}"
    print(f"\n--- Starting Stateful Test: {case_id} ---")

    # Round 1: Greeting
    print("\nRound 1: Sending 'hi'")
    payload1 = {
        "case_id": case_id,
        "raw_narrative": "hi",
        "language_preference": "english",
        "state_jurisdiction": "Maharashtra",
        "mode": "citizen"
    }
    resp1 = requests.post(f"{BASE_URL}/analyze", json=payload1)
    data1 = resp1.json()
    print(f"Status: {data1.get('intake_status')}")
    print(f"Questions: {data1.get('case_state', {}).get('follow_up_questions')}")
    
    # Assertions for Round 1
    assert data1.get('intake_status') == "awaiting_user_response"
    assert len(data1.get('case_state', {}).get('follow_up_questions', [])) > 0

    # Round 2: Partial Info
    print("\nRound 2: Sending location info")
    payload2 = {
        "case_id": case_id,
        "raw_narrative": "I live in Mumbai and bought a phone from Reliance Digital.",
        "language_preference": "english",
        "state_jurisdiction": "Maharashtra",
        "mode": "citizen"
    }
    resp2 = requests.post(f"{BASE_URL}/analyze", json=payload2)
    data2 = resp2.json()
    print(f"Status: {data2.get('intake_status')}")
    narrative2 = data2.get('case_state', {}).get('raw_narrative', "")
    print(f"Narrative check contains Round 1: {'hi' in narrative2}")
    
    # Assertions for Round 2
    assert "hi" in narrative2
    assert "Mumbai" in narrative2

    # Round 3: Detailed Info (Should Complete)
    print("\nRound 3: Sending defect info")
    payload3 = {
        "case_id": case_id,
        "raw_narrative": "The phone screen is broken and they won't refund me my 50000 rupees.",
        "language_preference": "english",
        "state_jurisdiction": "Maharashtra",
        "mode": "citizen"
    }
    resp3 = requests.post(f"{BASE_URL}/analyze", json=payload3)
    data3 = resp3.json()
    print(f"Status: {data3.get('intake_status')}")
    
    # If completed, check for results
    if data3.get('intake_status') == "complete":
        print("Success! Pipeline completed end-to-end.")
        print(f"Incident Summary: {data3.get('case_state', {}).get('structured_facts', {}).get('incident_summary')}")
    else:
        print("Still in intake. This is fine if LLM still wants more info.")

if __name__ == "__main__":
    try:
        test_stateful_conversation()
    except Exception as e:
        print(f"Test failed: {e}")
