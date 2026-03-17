from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
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

@app.get("/download/{filename}")
async def download_file(filename: str):
    filepath = os.path.join("output_docs", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, filename=filename)

# Initialize the LangGraph
nyaya_graph = build_nyaya_graph()

import traceback
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory store: tracks full CaseState and follow-up count per case_id
# This allows for a stateful conversation where context is accumulated.
_case_store: dict[str, dict] = {}
_case_rounds: dict[str, int] = {}
MAX_FOLLOWUP_ROUNDS = 2

@app.post("/analyze")
async def analyze_case(request: IntakeRequest):
    try:
        # Ensure case_id is present
        case_id = request.case_id or str(uuid.uuid4())
        
        # 1. Retrieve or Initialize state
        existing_state = _case_store.get(case_id)
        round_count = _case_rounds.get(case_id, 0) + 1
        _case_rounds[case_id] = round_count
        
        # 2. Accumulate narrative if state exists
        if existing_state:
            # Append new input to previous narrative
            old_narrative = existing_state.get("raw_narrative", "")
            new_narrative = f"{old_narrative}\n\nUser: {request.raw_narrative}"
            existing_state["raw_narrative"] = new_narrative
            
            # Reset intake status and questions to allow Agent 1 to re-process with new context
            existing_state["intake_status"] = "collecting_info"
            existing_state["follow_up_questions"] = []
            
            current_case_state = existing_state
        else:
            # New case
            current_case_state = {
                "case_id": case_id,
                "raw_narrative": request.raw_narrative,
                "language_preference": request.language_preference,
                "state_jurisdiction": request.state_jurisdiction,
                "uploaded_files": []
            }

        # 3. Determine if we should force completion
        force_complete = round_count > MAX_FOLLOWUP_ROUNDS
        
        if force_complete:
            logger.info(f"Case {case_id}: Round {round_count} — forcing intake complete")
        else:
            logger.info(f"Case {case_id}: Round {round_count} of {MAX_FOLLOWUP_ROUNDS}")
        
        # 4. Prepare graph input
        initial_graph_state = {
            "case_state": current_case_state,
            "mode": request.mode,
            "intake_status": "pending",
            "force_complete": force_complete
        }
        
        # 5. Invoke the graph
        final_output = nyaya_graph.invoke(initial_graph_state)
        
        # 6. Persist the updated state back to our store
        _case_store[case_id] = final_output.get("case_state")
        
        return final_output
    except Exception as e:
        logger.error(f"Error in analyze_case: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
