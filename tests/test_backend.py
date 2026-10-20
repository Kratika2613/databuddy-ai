"""
Automated Integration and Unit Tests for DataBuddy AI
Tests FastAPI endpoints, SQLAlchemy ORM persistence, Scikit-learn RAG, and Agentic Workflows.
"""

import io
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient

from server import app
from storage.database import SessionLocal, init_db

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database schema is initialized before running tests."""
    init_db()


def test_health_check_endpoint():
    """Verify system telemetry and configuration status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "FastAPI" in data["engine"]
    assert "SQLite" in data["database"]
    assert "overall_accuracy" in data


def test_ai_learning_assistant_chat():
    """Verify chat endpoint generates explanation, follow-ups, and logs to SQLite."""
    payload = {
        "question": "What is an idempotent pipeline?",
        "mode": "Beginner Mode",
        "session_id": "test_session",
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 10
    assert "follow_ups" in data
    assert isinstance(data["follow_ups"], list)

    # Verify message is persisted in chat history
    hist_response = client.get("/api/chat/history?session_id=test_session")
    assert hist_response.status_code == 200
    history = hist_response.json()
    assert any(m["content"] == payload["question"] for m in history)


def test_quiz_studio_workflow():
    """Verify quiz generation, 4 options format, and submission grading."""
    # 1. Generate quiz question
    gen_payload = {
        "topic": "Apache Spark",
        "difficulty": "Medium",
    }
    gen_res = client.post("/api/quiz/generate", json=gen_payload)
    assert gen_res.status_code == 200
    q_data = gen_res.json()
    assert "question_id" in q_data
    assert len(q_data["options"]) == 4
    assert q_data["topic"] == "Apache Spark"

    question_id = q_data["question_id"]
    chosen_answer = q_data["options"][0]

    # 2. Submit answer
    sub_payload = {
        "question_id": question_id,
        "selected_answer": chosen_answer,
    }
    sub_res = client.post("/api/quiz/submit", json=sub_payload)
    assert sub_res.status_code == 200
    grade_data = sub_res.json()
    assert "is_correct" in grade_data
    assert "explanation" in grade_data

    # 3. Verify reviews endpoint
    rev_res = client.get("/api/quiz/reviews")
    assert rev_res.status_code == 200
    reviews = rev_res.json()
    assert any(r["id"] == question_id for r in reviews)


def test_rag_knowledge_upload_and_query():
    """Verify document upload, chunking, and grounded query retrieval."""
    test_document_content = (
        "Apache Kafka is a distributed event store and stream-processing platform. "
        "Kafka clusters store streams of records in categories called topics. "
        "Each record consists of a key, a value, and a timestamp. "
        "Consumer groups allow a pool of processes to divide the work of consuming and processing records."
    )
    file_bytes = test_document_content.encode("utf-8")
    
    # 1. Upload document
    upload_res = client.post(
        "/api/knowledge/upload",
        files={"file": ("kafka_architecture.md", io.BytesIO(file_bytes), "text/markdown")},
    )
    assert upload_res.status_code == 200
    up_data = upload_res.json()
    assert up_data["success"] is True
    assert up_data["total_chunks"] >= 1

    # 2. Query knowledge base
    query_payload = {
        "question": "What is a consumer group in Kafka?",
        "top_k": 2,
    }
    query_res = client.post("/api/knowledge/query", json=query_payload)
    assert query_res.status_code == 200
    q_out = query_res.json()
    assert "answer" in q_out
    assert "citations" in q_out
    assert q_out["retrieved_chunks_count"] >= 1


def test_performance_dashboard_and_preferences():
    """Verify database analytics, weak topics aggregation, and preferences update."""
    dash_res = client.get("/api/analytics/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "total_chats" in dash_data
    assert "overall_accuracy" in dash_data
    assert "topics" in dash_data
    assert "trend_data" in dash_data

    # Update preferences
    pref_payload = {
        "target_role": "Analytics Engineer",
        "preferred_mode": "Interview Mode",
        "preferred_difficulty": "Hard",
        "notes": "Testing preferences update.",
    }
    update_res = client.post("/api/analytics/preferences", json=pref_payload)
    assert update_res.status_code == 200
    assert update_res.json()["target_role"] == "Analytics Engineer"

    # Get preferences
    get_res = client.get("/api/analytics/preferences")
    assert get_res.status_code == 200
    assert get_res.json()["target_role"] == "Analytics Engineer"


def test_learning_workflow_agent():
    """Verify the controlled agent executes all 4 workflow steps."""
    agent_res = client.post("/api/agent/run")
    assert agent_res.status_code == 200
    agent_data = agent_res.json()
    assert "workflow_id" in agent_data
    assert "summary" in agent_data
    assert "execution_trace" in agent_data
    assert len(agent_data["execution_trace"]) == 4

    # Verify tools executed
    tools = [step["tool"] for step in agent_data["execution_trace"]]
    assert "diagnose_state" in tools
    assert "search_knowledge" in tools
    assert "generate_targeted_quiz" in tools
    assert "generate_study_roadmap" in tools

    # Verify logs endpoint
    logs_res = client.get("/api/agent/logs")
    assert logs_res.status_code == 200
    assert len(logs_res.json()) >= 1
