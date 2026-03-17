from agents.retrieval import search_law

query = "seller took money but did not deliver product consumer complaint fraud"

results = search_law(query)

for r in results:
    print(r)