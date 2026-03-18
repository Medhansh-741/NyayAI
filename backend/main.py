from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Literal
import io
import uuid
import os
import sys

# Setup paths to ensure we can import from agents and schemas
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "agents")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "schemas")))

from orchestrator import build_nyaya_graph
import json
import sqlite3
from datetime import datetime

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

# --- Database Setup ---
DB_PATH = "nyayai_cases.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS cases
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  case_id TEXT UNIQUE,
                  title TEXT,
                  description TEXT,
                  domain TEXT,
                  date TEXT,
                  status TEXT,
                  metadata_json TEXT)''')
    conn.commit()
    conn.close()

init_db()

def save_case_to_db(case_data: dict):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Extract fields from CaseState
    case_id = case_data.get("case_id")
    title = case_data.get("structured_facts", {}).get("incident_type", "Untitled Case").replace("_", " ").title()
    description = case_data.get("structured_facts", {}).get("incident_summary", "No summary available.")
    domain = case_data.get("structured_facts", {}).get("incident_type", "General").replace("_", " ").title()
    date = datetime.now().strftime("%b %d, %Y")
    status = "Analysis Complete" # Default status when saved
    metadata_json = json.dumps(case_data)
    
    try:
        c.execute('''INSERT OR REPLACE INTO cases (case_id, title, description, domain, date, status, metadata_json)
                     VALUES (?, ?, ?, ?, ?, ?, ?)''',
                  (case_id, title, description, domain, date, status, metadata_json))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Database error: {e}")
        return False
    finally:
        conn.close()

def get_all_cases():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM cases ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/analyze")
async def analyze_case(request: IntakeRequest):
    try:
        # Use provided case_id or generate a new one if it's a fresh start
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

@app.post("/save_case/{case_id}")
async def save_case(case_id: str):
    case_data = _case_store.get(case_id)
    if not case_data:
        raise HTTPException(status_code=404, detail="Case not found in current session")
    
    success = save_case_to_db(case_data)
    if success:
        return {"status": "success", "message": "Case saved to dashboard"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save case to database")

@app.get("/cases")
async def list_cases():
    cases = get_all_cases()
    return {"cases": cases}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Accept an audio file and return its Sarvam STT transcription."""
    try:
        sarvam_key = os.environ.get("SARVAM_API_KEY")
        if not sarvam_key:
            raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured")

        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty audio file")

        from sarvamai import SarvamAI
        client = SarvamAI(api_subscription_key=sarvam_key)

        audio_file = io.BytesIO(contents)
        audio_file.name = file.filename or "recording.webm"

        response = client.speech_to_text.transcribe(
            file=audio_file,
            model="saaras:v3",
            mode="transcribe",
        )

        transcript = getattr(response, "transcript", None)
        if transcript is None and isinstance(response, dict):
            transcript = response.get("transcript", "")
        if transcript is None:
            transcript = str(response)

        return {"text": transcript}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
