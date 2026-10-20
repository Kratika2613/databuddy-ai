"""
SQLAlchemy ORM Database Models for DataBuddy AI
Defines relational schemas for chat memory, quiz sessions, knowledge documents,
learning preferences, and agent workflow logs.
"""

from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), default="default", index=True)
    role = Column(String(32), nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    mode = Column(String(32), default="Beginner Mode")  # Beginner, Interview, Technical
    follow_ups = Column(Text, nullable=True)  # JSON-encoded array of follow-up strings
    created_at = Column(DateTime, default=datetime.utcnow)


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(String(128), nullable=False, index=True)
    difficulty = Column(String(32), default="Medium")  # Easy, Medium, Hard
    total_questions = Column(Integer, default=1)
    correct_answers = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("QuizQuestionRecord", back_populates="session", cascade="all, delete-orphan")


class QuizQuestionRecord(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_session_id = Column(Integer, ForeignKey("quiz_sessions.id", ondelete="CASCADE"), nullable=True)
    topic = Column(String(128), nullable=False, index=True)
    difficulty = Column(String(32), default="Medium")
    question = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False)  # JSON array of 4 strings
    correct_answer = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("QuizSession", back_populates="questions")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(256), nullable=False)
    file_type = Column(String(32), nullable=False)  # "pdf" | "md" | "txt"
    file_size = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    character_length = Column(Integer, default=0)

    document = relationship("KnowledgeDocument", back_populates="chunks")


class LearningPreference(Base):
    __tablename__ = "learning_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), default="default_user", unique=True, index=True)
    target_role = Column(String(128), default="Data Engineer")  # e.g., "Data Engineer", "Analytics Engineer"
    preferred_mode = Column(String(32), default="Beginner Mode")
    preferred_difficulty = Column(String(32), default="Medium")
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AgentWorkflowLog(Base):
    __tablename__ = "agent_workflow_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workflow_name = Column(String(128), nullable=False)
    trigger_type = Column(String(64), default="manual")
    steps_json = Column(Text, nullable=False)  # JSON representation of executed agent tool steps
    summary = Column(Text, nullable=False)
    status = Column(String(32), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)
