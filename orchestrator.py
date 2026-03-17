import os
import sys
import logging
from typing import TypedDict
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END

# Setup paths locally so we don't have to deal with complex structure right now
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "agents")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "schemas")))

from case_state import CaseState
from agent1_intake import run as intake_agent
from agent2_legal_research import agent2 as research_agent
from agent3_strategy import run_strategy_agent as strategy_agent
from agent4_drafting import drafting_agent
from agent5_explainability import explainability_agent

load_dotenv(override=True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LangGraph state needs to be TypedDict for strict typing, 
# but we can use our CaseState dict dynamically.
class GraphState(TypedDict):
    case_state: dict
    mode: str          # "citizen" or "lawyer" (for Legal Explorer)
    intake_status: str # "complete" or "awaiting_user_response"
    force_complete: bool # True to skip follow-up loop and proceed

# --- Node Handlers ---

def run_agent1(state: GraphState):
    logger.info("--- NODE: AGENT 1 (INTAKE) ---")
    case_dict = state.get("case_state", {})
    force_complete = state.get("force_complete", False)
    
    # Agent 1 expects a Pydantic object
    pydantic_state = CaseState(**case_dict)
    updated_case = intake_agent(pydantic_state)
    
    # If force_complete is set, override Agent 1's decision and proceed
    if force_complete:
        logger.info("--- FORCE COMPLETE: Overriding intake status to 'complete' ---")
        updated_case.intake_status = "complete"
        updated_case.follow_up_questions = []  # Clear any leftover questions
    
    # Store everything as a flat dict moving between nodes
    status = "complete" if updated_case.intake_status == "complete" else "awaiting_user_response"
    return {"case_state": updated_case.model_dump(), "intake_status": status, "mode": state.get("mode"), "force_complete": force_complete}


def run_agent2(state: GraphState):
    logger.info("--- NODE: AGENT 2 (RESEARCH) ---")
    case_dict = state.get("case_state", {})
    # Agent 2 expects the CaseState dictionary (we mapped it to support dicts earlier)
    updated_case = research_agent(case_dict)
    return {"case_state": updated_case}


def run_agent3(state: GraphState):
    logger.info("--- NODE: AGENT 3 (STRATEGY) ---")
    case_dict = state.get("case_state", {})
    pydantic_state = CaseState(**case_dict)
    updated_case = strategy_agent(pydantic_state)
    return {"case_state": updated_case.model_dump()}


def run_agent4(state: GraphState):
    logger.info("--- NODE: AGENT 4 (DRAFTING) ---")
    case_dict = state.get("case_state", {})
    updated_case = drafting_agent(case_dict)
    return {"case_state": updated_case}


def run_agent5(state: GraphState):
    logger.info("--- NODE: AGENT 5 (EXPLAINABILITY) ---")
    case_dict = state.get("case_state", {})
    mode = state.get("mode", "citizen")
    updated_case = explainability_agent(case_dict, mode=mode)
    return {"case_state": updated_case}


# --- Conditional Edges ---

def route_after_intake(state: GraphState):
    status = state.get("intake_status")
    if status == "awaiting_user_response":
        logger.info("--- ROUTING: HALTING FOR USER INPUT (END) ---")
        return "end"
    else:
        logger.info("--- ROUTING: PROCEEDING TO RESEARCH AGENT ---")
        return "proceed_to_research"


# --- Graph Construction ---

def build_nyaya_graph():
    workflow = StateGraph(GraphState)

    # Nodes
    workflow.add_node("agent_1_intake", run_agent1)
    workflow.add_node("agent_2_research", run_agent2)
    workflow.add_node("agent_3_strategy", run_agent3)
    workflow.add_node("agent_4_drafting", run_agent4)
    workflow.add_node("agent_5_explainability", run_agent5)

    # Edges
    workflow.set_entry_point("agent_1_intake")
    
    workflow.add_conditional_edges(
        "agent_1_intake",
        route_after_intake,
        {
            "proceed_to_research": "agent_2_research",
            "end": END
        }
    )

    workflow.add_edge("agent_2_research", "agent_3_strategy")
    workflow.add_edge("agent_3_strategy", "agent_4_drafting")
    workflow.add_edge("agent_4_drafting", "agent_5_explainability")
    workflow.add_edge("agent_5_explainability", END)

    # Compile the graph
    app = workflow.compile()
    return app

if __name__ == "__main__":
    import json
    # Simple explicit test runner 
    app = build_nyaya_graph()
    
    # Starting state payload config
    initial_state = {
        "case_state": {
            "case_id": "PIPELINE_E2E_001",
            "raw_narrative": "My name is Ramesh Kumar, living in Malad West, Mumbai. On January 15th, 2024, I purchased a Sony Bravia TV (Model X75L) for ₹65,000 from the Reliance Digital store at Infinity Mall, Malad West, Mumbai (Phone: 022-1234567). The invoice number is RD/2024/987. After just 3 days, on Jan 18th, the screen started showing vertical lines and then went completely black. I visited the store on Jan 19th and spoke with the manager, Mr. Sharma, who refused to help me, saying the TV was sold on 'as-is' basis despite the 1-year Sony manufacturer warranty clearly mentioned on the invoice. The store's return policy printed on the bill says 'No returns after sale', but the item is clearly defective. I have the original bill and a video proving the screen defect. I want a full refund or a replacement under the Consumer Protection Act.",
            "language_preference": "english",
            "state_jurisdiction": "Maharashtra",
            "uploaded_files": []
        },
        "mode": "citizen",
        "intake_status": "pending"
    }

    print("\n--- Starting Execution Pipeline ---")
    final_output = app.invoke(initial_state)

    print("\n--- Pipeline Execution Completed! ---")
    
    state_out = final_output.get("case_state", {})
    intake_status = final_output.get("intake_status")
    
    print(f"Pipeline Status: {intake_status}")
    
    if intake_status == "complete":
        print(f"Intake Output (Facts): {json.dumps(state_out.get('structured_facts', {}).get('key_facts', []), indent=2)}")
        
        lm = state_out.get('legal_mapping', {})
        if lm:
            print(f"Research Output (Standing): {lm.get('legal_standing_score')}")
        
        ap = state_out.get('action_plan', {})
        if ap:
            print(f"Strategy Output (Forum): {ap.get('forum_selection')}")
        
        docs = state_out.get('generated_documents', {})
        if isinstance(docs, dict):
            print(f"Drafting Output (Docs): {list(docs.keys())}")
        
        rt = state_out.get('reasoning_trace', {})
        if rt:
            print(f"Explainability Output (Citations): {rt.get('citations') is not None}")
    else:
        print(f"Intake Output (Questions): {state_out.get('follow_up_questions', [])}")
