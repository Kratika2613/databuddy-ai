"""
Database Management & Repository Layer using SQLAlchemy and SQLite.
Provides connection pooling, session lifecycle management, and optimized queries.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from sqlalchemy import Integer, create_engine, desc, func
from sqlalchemy.orm import Session, sessionmaker

from storage.models import (
    AgentWorkflowLog,
    Base,
    ConversationMessage,
    KnowledgeChunk,
    KnowledgeDocument,
    LearningPreference,
    QuizQuestionRecord,
    QuizSession,
)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./databuddy.db")

# SQLite connection arguments for concurrency
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all relational tables defined in models.py."""
    Base.metadata.create_all(bind=engine)
    # Seed default user learning preference if none exists
    with SessionLocal() as db:
        pref = db.query(LearningPreference).filter_by(user_id="default_user").first()
        if not pref:
            default_pref = LearningPreference(
                user_id="default_user",
                target_role="Data Engineer",
                preferred_mode="Beginner Mode",
                preferred_difficulty="Medium",
                notes="Preparing for foundational and enterprise distributed data systems.",
            )
            db.add(default_pref)
            db.commit()


def get_db():
    """FastAPI Dependency for database session lifecycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# Chat & Memory Repository
# ============================================================================

def save_chat_turn(
    db: Session,
    user_text: str,
    bot_text: str,
    mode: str,
    follow_ups: Optional[List[str]] = None,
    session_id: str = "default",
) -> Tuple[ConversationMessage, ConversationMessage]:
    """Store both user prompt and assistant explanation in persistent memory."""
    user_msg = ConversationMessage(
        session_id=session_id,
        role="user",
        content=user_text,
        mode=mode,
    )
    db.add(user_msg)
    db.flush()

    bot_msg = ConversationMessage(
        session_id=session_id,
        role="assistant",
        content=bot_text,
        mode=mode,
        follow_ups=json.dumps(follow_ups or []),
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)
    return user_msg, bot_msg


def get_recent_messages(db: Session, session_id: str = "default", limit: int = 30) -> List[Dict[str, Any]]:
    """Retrieve recent conversation history."""
    records = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.session_id == session_id)
        .order_by(desc(ConversationMessage.id))
        .limit(limit)
        .all()
    )
    records.reverse()

    results = []
    for r in records:
        follow_ups = []
        if r.follow_ups:
            try:
                follow_ups = json.loads(r.follow_ups)
            except Exception:
                follow_ups = []

        results.append({
            "id": r.id,
            "role": r.role,
            "content": r.content,
            "mode": r.mode,
            "follow_ups": follow_ups,
            "created_at": r.created_at.strftime("%b %d, %I:%M %p") if r.created_at else "",
        })
    return results


# ============================================================================
# Quiz Studio Repository
# ============================================================================

def save_quiz_question(
    db: Session,
    topic: str,
    difficulty: str,
    question: str,
    options: List[str],
    correct_answer: str,
    explanation: str,
) -> QuizQuestionRecord:
    """Save generated quiz question to database."""
    record = QuizQuestionRecord(
        topic=topic,
        difficulty=difficulty,
        question=question,
        options_json=json.dumps(options),
        correct_answer=correct_answer,
        explanation=explanation,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def submit_quiz_answer(
    db: Session,
    question_id: int,
    user_answer: str,
) -> Dict[str, Any]:
    """Grade and record student submission."""
    record = db.query(QuizQuestionRecord).filter(QuizQuestionRecord.id == question_id).first()
    if not record:
        raise ValueError(f"Question ID {question_id} not found.")

    is_correct = user_answer.strip().lower() == record.correct_answer.strip().lower()
    record.user_answer = user_answer
    record.is_correct = is_correct
    db.commit()

    return {
        "question_id": record.id,
        "is_correct": is_correct,
        "correct_answer": record.correct_answer,
        "explanation": record.explanation,
        "user_answer": user_answer,
    }


def get_quiz_reviews(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """Fetch completed quiz history for answer review."""
    records = (
        db.query(QuizQuestionRecord)
        .filter(QuizQuestionRecord.user_answer.isnot(None))
        .order_by(desc(QuizQuestionRecord.id))
        .limit(limit)
        .all()
    )

    results = []
    for q in records:
        try:
            options = json.loads(q.options_json)
        except Exception:
            options = []

        results.append({
            "id": q.id,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "question": q.question,
            "options": options,
            "correct_answer": q.correct_answer,
            "user_answer": q.user_answer,
            "is_correct": bool(q.is_correct),
            "explanation": q.explanation,
            "created_at": q.created_at.strftime("%b %d, %I:%M %p") if q.created_at else "",
        })
    return results


# ============================================================================
# Knowledge Center & Document Storage
# ============================================================================

def store_document(
    db: Session,
    filename: str,
    file_type: str,
    file_size: int,
    chunks: List[str],
) -> KnowledgeDocument:
    """Ingest document metadata and chunk partitions into database."""
    doc = KnowledgeDocument(
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        total_chunks=len(chunks),
    )
    db.add(doc)
    db.flush()

    for idx, chunk_text in enumerate(chunks):
        chunk_rec = KnowledgeChunk(
            document_id=doc.id,
            chunk_index=idx,
            content=chunk_text,
            character_length=len(chunk_text),
        )
        db.add(chunk_rec)

    db.commit()
    db.refresh(doc)
    return doc


def list_knowledge_documents(db: Session) -> List[Dict[str, Any]]:
    """List all documents currently in the Knowledge Center."""
    docs = db.query(KnowledgeDocument).order_by(desc(KnowledgeDocument.id)).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "total_chunks": d.total_chunks,
            "created_at": d.created_at.strftime("%b %d, %Y") if d.created_at else "",
        }
        for d in docs
    ]


def get_all_chunks_for_rag(db: Session) -> List[Dict[str, Any]]:
    """Retrieve all chunks across documents for global vector search."""
    chunks = (
        db.query(KnowledgeChunk.id, KnowledgeChunk.content, KnowledgeDocument.filename)
        .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
        .all()
    )
    return [
        {"id": c[0], "content": c[1], "filename": c[2]}
        for c in chunks
    ]


# ============================================================================
# Analytics & Weak-Topic Detection
# ============================================================================

def get_performance_dashboard(db: Session) -> Dict[str, Any]:
    """Compile database metrics, accuracy trends, and topic breakdown."""
    total_chats = db.query(func.count(ConversationMessage.id)).filter(ConversationMessage.role == "user").scalar() or 0
    total_attempts = db.query(func.count(QuizQuestionRecord.id)).filter(QuizQuestionRecord.user_answer.isnot(None)).scalar() or 0
    correct_attempts = (
        db.query(func.count(QuizQuestionRecord.id))
        .filter(QuizQuestionRecord.is_correct == True)
        .scalar() or 0
    )

    overall_accuracy = round((correct_attempts / total_attempts) * 100, 1) if total_attempts > 0 else 0.0

    # Topic-wise performance
    topic_rows = (
        db.query(
            QuizQuestionRecord.topic,
            func.count(QuizQuestionRecord.id).label("total"),
            func.sum(func.cast(QuizQuestionRecord.is_correct, Integer)).label("correct"),
        )
        .filter(QuizQuestionRecord.user_answer.isnot(None))
        .group_by(QuizQuestionRecord.topic)
        .all()
    )

    topics_summary = []
    weak_topics = []
    for r in topic_rows:
        topic_name = r[0]
        total = r[1] or 0
        correct = r[2] or 0
        acc = round((correct / total) * 100, 1) if total > 0 else 0.0

        topics_summary.append({
            "topic": topic_name,
            "total": total,
            "correct": correct,
            "accuracy": acc,
        })

        if total >= 1 and acc < 65.0:
            weak_topics.append({
                "topic": topic_name,
                "accuracy": acc,
                "total_attempts": total,
                "recommendation": f"Focus revision on {topic_name} fundamentals and review edge-case architectural trade-offs.",
            })

    # Recent Trend (last 7 days or last 10 quiz attempts for Recharts)
    recent_attempts = (
        db.query(QuizQuestionRecord)
        .filter(QuizQuestionRecord.user_answer.isnot(None))
        .order_by(QuizQuestionRecord.id)
        .limit(20)
        .all()
    )

    trend_data = []
    running_correct = 0
    for idx, item in enumerate(recent_attempts, 1):
        if item.is_correct:
            running_correct += 1
        acc = round((running_correct / idx) * 100, 1)
        trend_data.append({
            "attempt": f"#{idx}",
            "topic": item.topic,
            "score": 100 if item.is_correct else 0,
            "cumulativeAccuracy": acc,
        })

    return {
        "total_chats": total_chats,
        "total_quizzes": total_attempts,
        "correct_answers": correct_attempts,
        "overall_accuracy": overall_accuracy,
        "topics": topics_summary,
        "weak_topics": weak_topics,
        "trend_data": trend_data,
    }


def get_weak_topics_list(db: Session, threshold: float = 65.0) -> List[str]:
    """Return plain list of topic names requiring revision."""
    dash = get_performance_dashboard(db)
    return [item["topic"] for item in dash["weak_topics"]]


# ============================================================================
# Learning Preferences
# ============================================================================

def get_learning_preferences(db: Session, user_id: str = "default_user") -> Dict[str, Any]:
    pref = db.query(LearningPreference).filter_by(user_id=user_id).first()
    if not pref:
        return {
            "target_role": "Data Engineer",
            "preferred_mode": "Beginner Mode",
            "preferred_difficulty": "Medium",
            "notes": "",
        }
    return {
        "target_role": pref.target_role,
        "preferred_mode": pref.preferred_mode,
        "preferred_difficulty": pref.preferred_difficulty,
        "notes": pref.notes or "",
    }


def update_learning_preferences(
    db: Session,
    target_role: str,
    preferred_mode: str,
    preferred_difficulty: str,
    notes: Optional[str] = None,
    user_id: str = "default_user",
) -> Dict[str, Any]:
    pref = db.query(LearningPreference).filter_by(user_id=user_id).first()
    if not pref:
        pref = LearningPreference(user_id=user_id)
        db.add(pref)

    pref.target_role = target_role
    pref.preferred_mode = preferred_mode
    pref.preferred_difficulty = preferred_difficulty
    if notes is not None:
        pref.notes = notes
    db.commit()

    return {
        "target_role": pref.target_role,
        "preferred_mode": pref.preferred_mode,
        "preferred_difficulty": pref.preferred_difficulty,
        "notes": pref.notes,
    }


# ============================================================================
# Agent Workflow Logs
# ============================================================================

def log_agent_workflow(
    db: Session,
    workflow_name: str,
    trigger_type: str,
    steps: List[Dict[str, Any]],
    summary: str,
    status: str = "completed",
) -> AgentWorkflowLog:
    log = AgentWorkflowLog(
        workflow_name=workflow_name,
        trigger_type=trigger_type,
        steps_json=json.dumps(steps),
        summary=summary,
        status=status,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_agent_logs(db: Session, limit: int = 15) -> List[Dict[str, Any]]:
    logs = db.query(AgentWorkflowLog).order_by(desc(AgentWorkflowLog.id)).limit(limit).all()
    results = []
    for l in logs:
        try:
            steps = json.loads(l.steps_json)
        except Exception:
            steps = []
        results.append({
            "id": l.id,
            "workflow_name": l.workflow_name,
            "trigger_type": l.trigger_type,
            "steps": steps,
            "summary": l.summary,
            "status": l.status,
            "created_at": l.created_at.strftime("%b %d, %I:%M %p") if l.created_at else "",
        })
    return results