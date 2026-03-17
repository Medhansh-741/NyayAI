from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Literal
import uuid
import os
import sys

# Setup paths to ensure we can import from agents and schemas
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "agents")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "schemas")))

from orchestrator import build_nyaya_graph

app = FastAPI(title="NyayaAI API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Model for Intake
class IntakeRequest(BaseModel):
    case_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    raw_narrative: str
    language_preference: Literal["hindi", "english", "hinglish"] = "english"
    state_jurisdiction: Optional[str] = "Maharashtra"
    mode: Literal["citizen", "lawyer"] = "citizen"

@app.get("/health")
async def health():
    return {"status": "ok", "version": "4.0.0"}

# Initialize the LangGraph
nyaya_graph = build_nyaya_graph()

import traceback
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory session tracker: tracks follow-up count per case_id
# After MAX_FOLLOWUP_ROUNDS rounds, we force the intake to complete
MAX_FOLLOWUP_ROUNDS = 2
_case_sessions: dict[str, int] = {}

@app.post("/analyze")
async def analyze_case(request: IntakeRequest):
    try:
        # Ensure case_id is present and a valid string
        case_id = request.case_id or str(uuid.uuid4())
        
        # Track how many times this case has gone through intake
        round_count = _case_sessions.get(case_id, 0) + 1
        _case_sessions[case_id] = round_count
        force_complete = round_count > MAX_FOLLOWUP_ROUNDS
        
        if force_complete:
            logger.info(f"Case {case_id}: Round {round_count} — forcing intake complete (max {MAX_FOLLOWUP_ROUNDS} follow-ups reached)")
        else:
            logger.info(f"Case {case_id}: Round {round_count} of {MAX_FOLLOWUP_ROUNDS} follow-up rounds")
        
        # Initial state for the graph
        initial_state = {
            "case_state": {
                "case_id": case_id,
                "raw_narrative": request.raw_narrative,
                "language_preference": request.language_preference,
                "state_jurisdiction": request.state_jurisdiction,
                "uploaded_files": []
            },
            "mode": request.mode,
            "intake_status": "pending",
            "force_complete": force_complete
        }
        
        # Invoke the graph
        final_output = nyaya_graph.invoke(initial_state)
        return final_output
    except Exception as e:
        logger.error(f"Error in analyze_case: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
