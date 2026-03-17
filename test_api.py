import requests
import json

url = "http://localhost:8000/analyze"
payload = {
    "raw_narrative": "I bought a defective phone from a store in Mumbai, and they refuse to refund me.",
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
        print("Success! Response:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Failed! Error: {response.text}")
except Exception as e:
    print(f"An error occurred: {e}")
