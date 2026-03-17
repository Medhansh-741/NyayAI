import requests
import json

url = "http://localhost:8000/analyze"
# The user provided "user_input" but the API expects "raw_narrative" based on my previous implementation.
# However, I should check if the user wants me to support "user_input" or just use the current schema.
# I will use "raw_narrative" as per the IntakeRequest model I defined.
payload = {
    "raw_narrative": "My landlord gave me a 7 day eviction notice without reason. I have been a tenant for 3 years.",
    "language_preference": "english",
    "state_jurisdiction": "Maharashtra",
    "mode": "citizen"
}
headers = {
    "Content-Type": "application/json"
}

print(f"Sending request to {url}...")
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("\n--- Pipeline Execution Result ---")
        
        # Check intake status
        intake_status = result.get("intake_status")
        print(f"Intake Status: {intake_status}")
        
        case_state = result.get("case_state", {})
        
        # Verify agents execution via presence of data
        print("\n--- Agent Data Presence Check ---")
        print(f"Agent 1 (Intake - Structured Facts): {'YES' if case_state.get('structured_facts') else 'NO'}")
        print(f"Agent 2 (Research - Legal Mapping): {'YES' if case_state.get('legal_mapping') else 'NO'}")
        print(f"Agent 3 (Strategy - Action Plan): {'YES' if case_state.get('action_plan') else 'NO'}")
        print(f"Agent 4 (Drafting - Documents): {'YES' if case_state.get('generated_documents') else 'NO'}")
        print(f"Agent 5 (Explainability - Reasoning Trace): {'YES' if case_state.get('reasoning_trace') else 'NO'}")
        
        if intake_status == "complete":
             print("\nFull Pipeline Executed Successfully!")
        else:
             print("\nPipeline stopped after Intake (Awaiting more info/confirmation).")
             print(f"Questions: {case_state.get('follow_up_questions')}")

        # print(json.dumps(result, indent=2))
    else:
        print(f"Failed! Error: {response.text}")
except Exception as e:
    print(f"An error occurred: {e}")
