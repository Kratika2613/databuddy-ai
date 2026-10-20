"""
DataBuddy AI - Enterprise Python FastAPI Backend Server
Integrates SQLAlchemy, SQLite, Scikit-learn RAG, Google Gemini (google-genai),
and controlled Agentic Workflows. Exposes self-documenting OpenAPI endpoints.
"""

import os
import sys
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Ensure local imports resolve
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services.agent_service import LearningWorkflowAgent
from services.ai_service import (
    generate_learning_explanation,
    generate_quiz_question,
    synthesize_rag_answer,
)
from services.rag_service import (
    extract_text_from_file,
    search_similar_chunks,
    split_text_into_chunks,
)
from storage.database import (
    get_all_chunks_for_rag,
    get_db,
    get_learning_preferences,
    get_performance_dashboard,
    get_quiz_reviews,
    get_recent_messages,
    init_db,
    list_knowledge_documents,
    save_chat_turn,
    save_quiz_question,
    store_document,
    submit_quiz_answer,
    update_learning_preferences,
    get_agent_logs,
)

load_dotenv()

# Initialize relational database tables
init_db()

app = FastAPI(
    title="DataBuddy AI - Intelligent Data Engineering Learning Platform",
    description="Enterprise API backed by Python, FastAPI, SQLite, SQLAlchemy, Scikit-learn RAG, and Google Gemini.",
    version="3.2.0",
)

# Enable CORS for Vite frontend dev server (port 5173) and local clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Request & Response Schemas
# ============================================================================

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Student's query")
    mode: str = Field(default="Beginner Mode", description="Pedagogic mode: Beginner Mode, Interview Mode, or Technical Mode")
    session_id: str = Field(default="default")

class QuizGenerateRequest(BaseModel):
    topic: str = Field(default="ETL Pipelines", description="Data engineering domain")
    difficulty: str = Field(default="Medium", description="Easy, Medium, or Hard")

class QuizSubmitRequest(BaseModel):
    question_id: int
    selected_answer: str

class RagQueryRequest(BaseModel):
    question: str = Field(..., min_length=2)
    top_k: int = Field(default=3, ge=1, le=8)

class PreferenceUpdateRequest(BaseModel):
    target_role: str = Field(default="Data Engineer")
    preferred_mode: str = Field(default="Beginner Mode")
    preferred_difficulty: str = Field(default="Medium")
    notes: Optional[str] = None


# ============================================================================
# 1. Telemetry & Health Endpoint
# ============================================================================

@app.get("/api/health", tags=["Telemetry"])
def health_status(db: Session = Depends(get_db)):
    """System health status, database connection, and configuration telemetry."""
    docs = list_knowledge_documents(db)
    dash = get_performance_dashboard(db)
    gemini_key = os.getenv("GEMINI_API_KEY")

    return {
        "status": "online",
        "service": "DataBuddy AI Enterprise Core",
        "engine": "Python 3.10+ / FastAPI / SQLAlchemy",
        "database": "SQLite (databuddy.db)",
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "gemini_configured": bool(gemini_key and len(gemini_key) > 8),
        "total_documents_indexed": len(docs),
        "total_conversations_logged": dash["total_chats"],
        "total_quizzes_completed": dash["total_quizzes"],
        "overall_accuracy": dash["overall_accuracy"],
    }


# ============================================================================
# 2. AI Learning Assistant Endpoints
# ============================================================================

@app.post("/api/chat", tags=["AI Learning Assistant"])
def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """Generate multi-mode explanation with follow-up questions and save to SQLite."""
    # Retrieve past conversation context for memory continuity
    history = get_recent_messages(db, session_id=req.session_id, limit=6)
    
    explanation, follow_ups = generate_learning_explanation(
        question=req.question,
        mode=req.mode,
        conversation_context=history,
    )

    # Save to SQLite database
    user_msg, bot_msg = save_chat_turn(
        db=db,
        user_text=req.question,
        bot_text=explanation,
        mode=req.mode,
        follow_ups=follow_ups,
        session_id=req.session_id,
    )

    return {
        "id": bot_msg.id,
        "question": req.question,
        "answer": explanation,
        "mode": req.mode,
        "follow_ups": follow_ups,
        "created_at": bot_msg.created_at.strftime("%b %d, %I:%M %p") if bot_msg.created_at else "",
    }


@app.get("/api/chat/history", tags=["AI Learning Assistant"])
def get_chat_history(session_id: str = "default", db: Session = Depends(get_db)):
    """Retrieve persistent conversation history from SQLite."""
    return get_recent_messages(db, session_id=session_id, limit=40)


# ============================================================================
# 3. Intelligent Quiz Studio Endpoints
# ============================================================================

@app.post("/api/quiz/generate", tags=["Quiz Studio"])
def quiz_generate_endpoint(req: QuizGenerateRequest, db: Session = Depends(get_db)):
    """Dynamically generate 4-option MCQ with difficulty, explanation, and persist to SQLite."""
    quiz_data = generate_quiz_question(topic=req.topic, difficulty=req.difficulty)

    record = save_quiz_question(
        db=db,
        topic=req.topic,
        difficulty=req.difficulty,
        question=quiz_data["question"],
        options=quiz_data["options"],
        correct_answer=quiz_data["correct_answer"],
        explanation=quiz_data["explanation"],
    )

    return {
        "question_id": record.id,
        "topic": record.topic,
        "difficulty": record.difficulty,
        "question": record.question,
        "options": quiz_data["options"],
        "explanation": record.explanation,
    }


@app.post("/api/quiz/submit", tags=["Quiz Studio"])
def quiz_submit_endpoint(req: QuizSubmitRequest, db: Session = Depends(get_db)):
    """Submit student answer, evaluate correctness, and update database score."""
    try:
        result = submit_quiz_answer(
            db=db,
            question_id=req.question_id,
            user_answer=req.selected_answer,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/quiz/reviews", tags=["Quiz Studio"])
def quiz_reviews_endpoint(db: Session = Depends(get_db)):
    """Retrieve student's completed quiz answers and explanations for review."""
    return get_quiz_reviews(db, limit=50)


# ============================================================================
# 4. Knowledge Center & RAG Endpoints
# ============================================================================

@app.post("/api/knowledge/upload", tags=["Knowledge Center"])
async def upload_document_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and vectorize PDF, Markdown, or plain text technical notes."""
    filename = file.filename or "technical_notes.txt"
    contents = await file.read()

    try:
        extracted_text = extract_text_from_file(contents, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Document contains no readable text content.")

    chunks = split_text_into_chunks(extracted_text, chunk_size=450, overlap=60)
    if not chunks:
        raise HTTPException(status_code=400, detail="Failed to generate chunk partitions.")

    ext = filename.split(".")[-1].lower() if "." in filename else "txt"
    doc_record = store_document(
        db=db,
        filename=filename,
        file_type=ext,
        file_size=len(contents),
        chunks=chunks,
    )

    return {
        "success": True,
        "document_id": doc_record.id,
        "filename": doc_record.filename,
        "total_chunks": doc_record.total_chunks,
        "file_size_kb": round(len(contents) / 1024, 1),
        "preview": extracted_text[:300] + ("..." if len(extracted_text) > 300 else ""),
    }


@app.get("/api/knowledge/documents", tags=["Knowledge Center"])
def list_documents_endpoint(db: Session = Depends(get_db)):
    """List all ingested technical documents in the Knowledge Center."""
    return list_knowledge_documents(db)


@app.post("/api/knowledge/query", tags=["Knowledge Center"])
def query_rag_endpoint(req: RagQueryRequest, db: Session = Depends(get_db)):
    """Perform TF-IDF vector similarity search and grounded LLM answer synthesis."""
    all_chunks = get_all_chunks_for_rag(db)
    if not all_chunks:
        # Default fallback sample knowledge if no files uploaded yet
        all_chunks = [
            {
                "id": 1,
                "filename": "ETL Best Practices Guide.md",
                "content": "ETL (Extract, Transform, Load) pipelines ingest raw transactional logs, perform deduplication, data quality validations, and schema transformations, and load curated dimensional tables into a central Data Warehouse. Idempotent pipeline design ensures replays do not produce duplicate fact records.",
            },
            {
                "id": 2,
                "filename": "Apache Spark Cluster Mechanics.md",
                "content": "Apache Spark uses Directed Acyclic Graphs (DAGs) and in-memory resilient distributed datasets. Narrow transformations execute within worker partitions without cross-network movement, whereas wide transformations like groupByKey and join require expensive cluster-wide data shuffles.",
            },
            {
                "id": 3,
                "filename": "Delta Lake Storage Specs.md",
                "content": "Delta Lake provides ACID guarantees over Apache Parquet storage using an atomic JSON transaction log (_delta_log). It enables versioned snapshot isolation, schema enforcement, and time travel rollback.",
            },
        ]

    similar_chunks = search_similar_chunks(req.question, all_chunks, top_k=req.top_k)
    synthesis = synthesize_rag_answer(req.question, similar_chunks)

    return {
        "question": req.question,
        "answer": synthesis["answer"],
        "citations": synthesis["citations"],
        "retrieved_chunks_count": len(similar_chunks),
        "passages": similar_chunks,
    }


# ============================================================================
# 5. Performance Dashboard & Learning Intelligence
# ============================================================================

@app.get("/api/analytics/dashboard", tags=["Performance Dashboard"])
def performance_dashboard_endpoint(db: Session = Depends(get_db)):
    """Compiled learning telemetry, accuracy trends, and weak topic alerts."""
    return get_performance_dashboard(db)


@app.get("/api/analytics/preferences", tags=["Learning Preferences"])
def get_preferences_endpoint(db: Session = Depends(get_db)):
    """Retrieve learner career target and preferences."""
    return get_learning_preferences(db)


@app.post("/api/analytics/preferences", tags=["Learning Preferences"])
def update_preferences_endpoint(req: PreferenceUpdateRequest, db: Session = Depends(get_db)):
    """Update learner career target, difficulty preference, and learning notes."""
    return update_learning_preferences(
        db=db,
        target_role=req.target_role,
        preferred_mode=req.preferred_mode,
        preferred_difficulty=req.preferred_difficulty,
        notes=req.notes,
    )


# ============================================================================
# 6. Learning Workflow Agent
# ============================================================================

@app.post("/api/agent/run", tags=["Learning Workflow Agent"])
def run_agent_workflow(db: Session = Depends(get_db)):
    """Execute the controlled autonomous diagnostic and remediation agent workflow."""
    agent = LearningWorkflowAgent(db)
    result = agent.run_diagnostic_and_remediation_workflow()
    return result


@app.get("/api/agent/logs", tags=["Learning Workflow Agent"])
def get_agent_execution_logs(db: Session = Depends(get_db)):
    """Retrieve past execution traces of agent tool calls."""
    return get_agent_logs(db, limit=20)


# ============================================================================
# Frontend Static Files Mount & SPA Routing
# ============================================================================
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


def start():
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    print("\n" + "=" * 65)
    print("🚀 DataBuddy AI — Enterprise Python FastAPI Platform Active")
    print(f"📍 Web Platform:          http://localhost:{port}")
    print(f"📍 OpenAPI Swagger Docs:  http://localhost:{port}/docs")
    print(f"📦 Relational Database:   SQLite with SQLAlchemy (databuddy.db)")
    print(f"🧠 RAG Vector Engine:     Scikit-learn TF-IDF + Cosine Similarity")
    print(f"🤖 Agentic Workflows:     Enabled (LearningWorkflowAgent)")
    print("=" * 65 + "\n")
    uvicorn.run("server:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    start()
