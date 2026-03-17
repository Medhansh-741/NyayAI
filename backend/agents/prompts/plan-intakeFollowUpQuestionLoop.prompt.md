## Plan: Intake Follow-up Question Loop

Add a minimal follow-up loop to Intake Agent by extending state, generating up to 3 user-friendly questions from missing_information, pausing when answers are needed, and reusing user answers on the next run. This keeps OCR, Groq extraction, evidence logic, and StructuredFacts unchanged.

**Progress update**
1. Completed codebase discovery and mapped exact insertion points in agent.py and case_state.py.
2. Confirmed your response schema choice: user_responses will use strict keys question and answer.
3. Saved the persistent plan to /memories/session/plan.md.

**Steps**
1. Extend CaseState in case_state.py by adding:
   follow_up_questions: list[str] = []
   user_responses: list[dict] = []
   intake_status: str = "collecting_info"
2. Add helper in agent.py:
   _generate_followup_questions(missing_information: list[str], limit: int = 3) -> list[str]
   Behavior: normalize text, convert each missing item to a user-friendly question, cap at 3.
3. In run(), before Groq input assembly in agent.py, append formatted user_responses content to the narrative when present, under:
   Additional information from user:
   Question: ...
   Answer: ...
4. In run(), immediately after structured facts assignment in agent.py, read missing = state.structured_facts.missing_information and branch:
   if missing exists:
   set follow_up_questions from helper
   set intake_status to awaiting_user_response
   log [IntakeAgent] Waiting for user follow-up answers
   return state early
5. If missing is empty:
   set follow_up_questions to []
   set intake_status to complete
   continue existing flow.
6. Keep architecture intact:
   no changes to OCR pipeline, Groq call contract, evidence extraction flow, or StructuredFacts schema.

**Relevant files**
1. case_state.py - add the three new CaseState fields only.
2. agent.py - add question generator helper and run loop branching/early return + narrative augmentation.
3. test_intake_agent.py - extend tests for helper behavior and branching outcomes.

**Verification**
1. Unit test helper:
   empty input gives []
   more than 3 items returns exactly 3 questions
   phrase conversion produces user-friendly prompts.
2. Run flow test:
   missing info present sets awaiting_user_response, populates follow_up_questions, and returns early.
3. Run flow test:
   no missing info sets complete and clears follow_up_questions.
4. Run flow test:
   user_responses are appended into the Groq narrative payload with Question/Answer formatting.
5. Regression check:
   existing OCR and extraction tests still pass.

If you approve this plan, I can hand off for implementation exactly as specified.
