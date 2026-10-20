"""
Learning Workflow Agent for DataBuddy AI
Implements a controlled, tool-based agentic workflow that orchestrates:
1. Learning state diagnosis (SQLite metrics & weak topic analysis)
2. Knowledge retrieval (RAG semantic search)
3. Targeted assessment generation (Quiz studio)
4. Personalized study roadmap synthesis
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from services.ai_service import (
    generate_personalized_recommendation,
    generate_quiz_question,
    synthesize_rag_answer,
)
from services.rag_service import search_similar_chunks
from storage.database import (
    get_all_chunks_for_rag,
    get_learning_preferences,
    get_performance_dashboard,
    get_weak_topics_list,
    log_agent_workflow,
    save_quiz_question,
)


class LearningWorkflowAgent:
    """Agent that coordinates diagnostic analysis, RAG retrieval, and quiz remediation."""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # Agent Tools
    # ========================================================================

    def tool_diagnose_state(self) -> Dict[str, Any]:
        """Tool 1: Inspect SQLite database telemetry to diagnose learner progress."""
        dashboard = get_performance_dashboard(self.db)
        prefs = get_learning_preferences(self.db)
        weak_topics = [t["topic"] for t in dashboard.get("weak_topics", [])]

        return {
            "tool": "diagnose_state",
            "status": "success",
            "output": {
                "total_chats": dashboard["total_chats"],
                "total_quizzes": dashboard["total_quizzes"],
                "overall_accuracy": dashboard["overall_accuracy"],
                "weak_topics": weak_topics,
                "target_role": prefs.get("target_role", "Data Engineer"),
                "preferred_difficulty": prefs.get("preferred_difficulty", "Medium"),
            },
        }

    def tool_search_knowledge(self, topic: str) -> Dict[str, Any]:
        """Tool 2: Search RAG knowledge base for notes relevant to the topic."""
        chunks = get_all_chunks_for_rag(self.db)
        if not chunks:
            # Fallback in-memory default ETL notes if database has no custom uploaded docs
            chunks = [
                {
                    "id": 1,
                    "filename": "Core Data Engineering Guide.md",
                    "content": "ETL pipelines extract raw data from operational systems, apply deduplication, transformations, and schema validation, then load into an analytical warehouse. Idempotency guarantees that re-running pipelines produces identical results without duplicates.",
                },
                {
                    "id": 2,
                    "filename": "Distributed Compute Architecture.md",
                    "content": "Apache Spark partitions data in memory across workers. Wide transformations require network shuffles, whereas narrow transformations execute within partition boundaries without cross-network movement.",
                },
            ]

        results = search_similar_chunks(topic, chunks, top_k=2)
        return {
            "tool": "search_knowledge",
            "status": "success",
            "output": {
                "query": topic,
                "retrieved_passages_count": len(results),
                "top_snippet": results[0]["content"] if results else "No specific notes found.",
                "passages": results,
            },
        }

    def tool_generate_targeted_quiz(self, topic: str, difficulty: str) -> Dict[str, Any]:
        """Tool 3: Generate a targeted multiple-choice question on the learner's gap."""
        quiz_data = generate_quiz_question(topic=topic, difficulty=difficulty)
        
        # Save question to SQLite so learner can immediately take and review it
        record = save_quiz_question(
            db=self.db,
            topic=topic,
            difficulty=difficulty,
            question=quiz_data["question"],
            options=quiz_data["options"],
            correct_answer=quiz_data["correct_answer"],
            explanation=quiz_data["explanation"],
        )

        return {
            "tool": "generate_targeted_quiz",
            "status": "success",
            "output": {
                "question_id": record.id,
                "topic": topic,
                "difficulty": difficulty,
                "question": record.question,
                "options": quiz_data["options"],
            },
        }

    def tool_generate_study_roadmap(self, weak_topics: List[str], target_role: str) -> Dict[str, Any]:
        """Tool 4: Synthesize prioritized revision action items."""
        recommendations = generate_personalized_recommendation(weak_topics, target_role)
        return {
            "tool": "generate_study_roadmap",
            "status": "success",
            "output": recommendations,
        }

    # ========================================================================
    # Controlled Workflow Orchestration
    # ========================================================================

    def run_diagnostic_and_remediation_workflow(self) -> Dict[str, Any]:
        """
        Executes an autonomous 4-stage workflow:
        1. Diagnose telemetry from SQLite
        2. Retrieve domain knowledge from RAG for the weakest area
        3. Dynamically generate a remediation MCQ
        4. Synthesize a 3-step action roadmap
        """
        execution_trace = []

        # Step 1: Diagnose
        diag_step = self.tool_diagnose_state()
        execution_trace.append(diag_step)
        diag_out = diag_step["output"]

        weak_topics = diag_out["weak_topics"]
        primary_focus = weak_topics[0] if weak_topics else "ETL Pipelines"
        target_role = diag_out["target_role"]
        difficulty = diag_out["preferred_difficulty"]

        # Step 2: Retrieve Knowledge
        knowledge_step = self.tool_search_knowledge(primary_focus)
        execution_trace.append(knowledge_step)

        # Step 3: Targeted Quiz Generation
        quiz_step = self.tool_generate_targeted_quiz(primary_focus, difficulty)
        execution_trace.append(quiz_step)

        # Step 4: Study Roadmap
        roadmap_step = self.tool_generate_study_roadmap(weak_topics, target_role)
        execution_trace.append(roadmap_step)

        summary_text = (
            f"Agent completed diagnostic assessment for '{target_role}'. Identified focus area: '{primary_focus}'. "
            f"Retrieved {knowledge_step['output']['retrieved_passages_count']} knowledge passages, "
            f"generated Quiz #{quiz_step['output']['question_id']}, and constructed a personalized revision roadmap."
        )

        # Log into SQLite
        log_rec = log_agent_workflow(
            db=self.db,
            workflow_name="Autonomous Diagnostic & Remediation",
            trigger_type="manual",
            steps=execution_trace,
            summary=summary_text,
            status="completed",
        )

        return {
            "workflow_id": log_rec.id,
            "workflow_name": "Autonomous Diagnostic & Remediation",
            "target_role": target_role,
            "focus_topic": primary_focus,
            "summary": summary_text,
            "generated_question": quiz_step["output"],
            "roadmap": roadmap_step["output"],
            "execution_trace": execution_trace,
        }
