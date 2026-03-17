import sys
import logging
from app.schema import CaseState, StructuredFacts, LegalMapping, LegalSection
from app.agent import run_strategy_agent
import time

logging.basicConfig(level=logging.INFO)

# Mock state simulating Agent 1 and Agent 2 output
state = CaseState()
state.structured_facts = StructuredFacts(
    dispute_type="consumer",
    urgency_level="immediate",
    key_facts=["The builder abandoned project after taking 90% payment in 2021", "Refused refund in 2024"]
)

state.legal_mapping = LegalMapping(
    applicable_sections=[
        LegalSection(
            section_ref="Consumer Protection Act 2019 Section 35",
            act_name="Consumer Protection Act 2019",
            description="Filing of complaint regarding deficiency in service",
            confidence="high"
        )
    ],
    legal_standing_score="strong",
    state_specific_variations=["Maharashtra Real Estate Regulatory Authority (MahaRERA)"]
)

state.state_jurisdiction = "Maharashtra"

print("--- Running Strategy Agent (Agent 3) ---")
start = time.time()
updated_state = run_strategy_agent(state)
end = time.time()

print(f"\n--- Output (Took {end-start:.2f}s) ---")
plan = updated_state.action_plan

print(f"Forum: {plan.forum_selection}")
print(f"Lawyer Recommended: {plan.lawyer_recommended}")
print(f"Lawyer Reason: {plan.lawyer_recommended_reason}")
print(f"Document Types: {plan.document_types_required}")
print(f"\nImmediate Steps:")
for step in plan.immediate:
    print(f"- {step.step}: {step.description} (Deadline: {step.deadline})")
print(f"\nTimeline Estimate: {plan.timeline_estimate}")

print("\n--- Success ---")
