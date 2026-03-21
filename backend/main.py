from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Depends
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
from app.services.legal_graph_service import legal_graph_service
from app.services.legal_updates_service import legal_updates_service
from retrieval import get_domain_topic_sections
import json
import sqlite3
from datetime import datetime
from app.core.auth import get_current_citizen
from app.core.supabase import supabase_admin

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


class DomainTopicsRequest(BaseModel):
    domain: str = Field(min_length=1, max_length=100)
    per_topic_limit: int = Field(default=5, ge=1, le=12)


class DomainTopicItem(BaseModel):
    title: str
    explanation: str
    source_section: str
    score: Optional[float] = None
    is_fallback: bool = False


class DomainTopicsResponse(BaseModel):
    domain: str
    topics: list[DomainTopicItem]


class LegalUpdateItem(BaseModel):
    title: str
    short_summary: str
    source: str
    link: str
    published_at: str


class LegalUpdatesResponse(BaseModel):
    updates: list[LegalUpdateItem]
    mode: str
    fetched_at: str


class AcceptOfferRequest(BaseModel):
    pipeline_id: str
    case_id: str

@app.get("/health")
async def health():
    return {"status": "ok", "version": "4.0.0"}


@app.get("/legal-graph/health")
async def legal_graph_health():
    return legal_graph_service.health()


@app.get("/legal-graph/acts/{act_name}/chapters")
async def legal_graph_chapters(act_name: str):
    neo4j_health = legal_graph_service.health()
    return {
        "act_name": act_name,
        "chapters": legal_graph_service.get_chapters_under_act(act_name),
        "neo4j": neo4j_health,
    }


@app.get("/legal-graph/acts/{act_name}/chapters/{chapter_number}/sections")
async def legal_graph_sections(act_name: str, chapter_number: str):
    neo4j_health = legal_graph_service.health()
    return {
        "act_name": act_name,
        "chapter_number": chapter_number,
        "sections": legal_graph_service.get_sections_under_chapter(act_name, chapter_number),
        "neo4j": neo4j_health,
    }


@app.get("/legal-graph/acts/{act_name}/sections/{section_number}")
async def legal_graph_section_detail(act_name: str, section_number: str):
    neo4j_health = legal_graph_service.health()
    if not neo4j_health.get("available", False):
        return {
            "act_name": act_name,
            "section_number": section_number,
            "section": None,
            "neo4j": neo4j_health,
        }

    section = legal_graph_service.get_section_by_number(act_name, section_number)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

@app.get("/download/{filename}")
async def download_file(filename: str):
    filepath = os.path.join("output_docs", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, filename=filename)


@app.post("/legal/domain-topics", response_model=DomainTopicsResponse)
async def legal_domain_topics(request: DomainTopicsRequest):
    try:
        topics = get_domain_topic_sections(request.domain, per_topic_limit=request.per_topic_limit)
        return DomainTopicsResponse(domain=request.domain, topics=topics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve domain topics: {str(e)}")


@app.get("/explorer/legal-updates", response_model=LegalUpdatesResponse)
async def explorer_legal_updates(limit: int = Query(default=8, ge=5, le=10)):
    try:
        payload = await legal_updates_service.get_updates_payload(limit=limit)
        return LegalUpdatesResponse(**payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve legal updates: {str(e)}")

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

def get_case_by_id(case_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return None
    
    case_dict = dict(row)
    # Parse the metadata_json to return full analysis
    if case_dict.get('metadata_json'):
        try:
            case_dict['analysis'] = json.loads(case_dict['metadata_json'])
        except json.JSONDecodeError:
            case_dict['analysis'] = None
    
    return case_dict

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

@app.get("/cases/{case_id}")
async def get_case_analysis(case_id: str):
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@app.post("/pipeline/accept-offer")
async def accept_offer_secure(
    request: AcceptOfferRequest,
    user=Depends(get_current_citizen),
):
    citizen_id = user.get("sub")
    if not citizen_id:
        raise HTTPException(status_code=401, detail="Invalid auth token")

    try:
        pipeline_res = (
            supabase_admin
            .table("case_pipeline")
            .select("id, case_id, lawyer_id, stage, offer_amount")
            .eq("id", request.pipeline_id)
            .maybe_single()
            .execute()
        )
        pipeline_row = pipeline_res.data

        if not pipeline_row:
            raise HTTPException(status_code=404, detail="Offer not found")

        if pipeline_row.get("case_id") != request.case_id:
            raise HTTPException(status_code=409, detail="Offer does not belong to this case")

        if pipeline_row.get("stage") != "offered":
            raise HTTPException(status_code=409, detail="Offer is no longer pending")

        case_res = (
            supabase_admin
            .table("cases")
            .select("id, title, citizen_id, status")
            .eq("id", request.case_id)
            .maybe_single()
            .execute()
        )
        case_row = case_res.data

        if not case_row:
            raise HTTPException(status_code=404, detail="Case not found")

        if case_row.get("citizen_id") != citizen_id:
            raise HTTPException(status_code=403, detail="You are not allowed to accept offers for this case")

        if case_row.get("status") in ["lawyer_matched", "active", "completed"]:
            raise HTTPException(status_code=409, detail="Case is already matched")

        now_iso = datetime.utcnow().isoformat()

        accepted_res = (
            supabase_admin
            .table("case_pipeline")
            .update({"stage": "accepted", "accepted_at": now_iso})
            .eq("id", request.pipeline_id)
            .execute()
        )

        (
            supabase_admin
            .table("case_pipeline")
            .update({"stage": "withdrawn"})
            .eq("case_id", request.case_id)
            .eq("stage", "offered")
            .neq("id", request.pipeline_id)
            .execute()
        )

        (
            supabase_admin
            .table("cases")
            .update({
                "status": "lawyer_matched",
                "lawyer_matched_at": now_iso,
                "is_seeking_lawyer": False,
            })
            .eq("id", request.case_id)
            .execute()
        )

        lawyer_id = pipeline_row.get("lawyer_id")
        if lawyer_id:
            amount = pipeline_row.get("offer_amount")
            amount_suffix = f" (Offer: INR {int(amount):,})" if isinstance(amount, (int, float)) else ""
            (
                supabase_admin
                .table("notifications")
                .insert({
                    "user_id": lawyer_id,
                    "type": "offer_accepted",
                    "title": "Your offer was accepted",
                    "body": f"{case_row.get('title') or 'A case'} has accepted your offer{amount_suffix}.",
                    "data": {
                        "case_id": request.case_id,
                        "pipeline_id": request.pipeline_id,
                        "lawyer_id": lawyer_id,
                    },
                })
                .execute()
            )

        return {
            "success": True,
            "pipeline": accepted_res.data,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Secure offer accept failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to accept offer")


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
