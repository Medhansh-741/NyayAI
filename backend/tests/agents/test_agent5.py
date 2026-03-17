import pprint
from agent5_explainability import explainability_agent

mock_state = {
    "structured_facts": {
        "dispute_type": "criminal",
        "parties": [
            {"name": "Anil Sharma", "role": "complainant"},
            {"name": "Mithun Verma", "role": "respondent"}
        ],
        "urgency_level": "immediate",
        "key_facts": ["Assault with a weapon", "Victim sustained severe injuries"]
    },
    "legal_mapping": {
        "legal_standing_score": "strong",
        "applicable_sections": [
            {"section_ref": "Sec 118", "act_name": "BNS 2023", "confidence": "high", "description": "Voluntarily causing hurt by dangerous weapons"}
        ],
        "ipc_crpc_crossref": [
            {"old_ref": "Sec 324", "act_old": "IPC 1860", "new_ref": "Sec 118", "act_new": "BNS 2023"}
        ],
        "landmark_cases": [
            {"citation": "State of MP v. Ram Krishna (2015)", "summary": "Outlines weapon threshold criteria", "relevance": "high"}
        ]
    },
    "action_plan": {
        "forum_selection": "District Sessions Court",
        "document_types_required": ["fir_draft", "lawyer_brief"],
        "lawyer_recommended": True,
        "lawyer_recommended_reason": "Cognizable criminal offense involving serious injury"
    },
    "agent_trace": [
        {"agent": "strategy", "reasoning": {"forum_selection_basis": "Criminal offenses bypass civil courts"}}
    ]
}

print("=== CITIZEN MODE ===")
citizen_trace = explainability_agent(dict(mock_state), mode="citizen")
pprint.pprint(citizen_trace.get("reasoning_trace"))

print("\n\n=== LAWYER MODE ===")
lawyer_trace = explainability_agent(dict(mock_state), mode="lawyer")
pprint.pprint(lawyer_trace.get("reasoning_trace"))
