"""
Google Gemini AI Service using the official google-genai Python SDK.
Handles learning explanations, follow-up recommendations, dynamic quiz generation,
RAG context synthesis, and intelligent fallback handling.
"""

import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from google import genai
from google.genai import errors

load_dotenv()

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")


def get_genai_client() -> Optional[genai.Client]:
    """Retrieve initialized Gemini client using server environment key."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Google Gemini Client: {e}")
        return None


def get_mode_prompt_instructions(mode: str) -> str:
    """Return tailored pedagogic instructions for each learning lens."""
    if mode == "Beginner Mode":
        return """
- Explain in simple, intuitive English for someone new to Data Engineering.
- Use one concrete real-world analogy (e.g., comparing data flow to water treatment, a restaurant kitchen, or airport logistics).
- Avoid unexplained jargon; define any essential terms immediately.
- Use clean formatting with short, readable paragraphs.
"""
    if mode == "Interview Mode":
        return """
- Provide an executive, high-impact answer structured for technical Data Engineering interviews.
- Keep the main definition between 4 and 7 lines.
- Include:
  1. Formal architectural definition.
  2. Core trade-off or advantage (e.g., latency vs. throughput, consistency vs. availability).
  3. One common interview pitfall or production edge-case.
"""
    # Technical Mode
    return """
- Provide an exhaustive technical explanation appropriate for a Senior or Staff Data Engineer.
- Include:
  1. Internal distributed mechanics and execution semantics.
  2. DAG execution flow or data serialization/partitioning strategies.
  3. Illustrative SQL, PySpark, or configuration pattern when relevant.
  4. Bottlenecks, memory pressure, and production optimizations.
"""


def clean_json_response(raw_text: str) -> str:
    """Extract and sanitize JSON from Markdown code fences or raw LLM output."""
    cleaned = raw_text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()
    return cleaned


# ============================================================================
# Core AI Functions
# ============================================================================

def generate_learning_explanation(
    question: str,
    mode: str = "Beginner Mode",
    conversation_context: Optional[List[Dict[str, str]]] = None,
) -> Tuple[str, List[str]]:
    """
    Generate tailored explanation and 2-3 proactive follow-up learning questions.
    Returns: (explanation_text, list_of_follow_ups)
    """
    client = get_genai_client()
    instructions = get_mode_prompt_instructions(mode)

    context_str = ""
    if conversation_context:
        history_lines = []
        for msg in conversation_context[-4:]:
            role_label = "Student" if msg.get("role") == "user" else "Assistant"
            history_lines.append(f"{role_label}: {msg.get('content', '')[:250]}")
        context_str = "Recent Conversation Context:\n" + "\n".join(history_lines) + "\n\n"

    prompt = f"""You are DataBuddy AI, an intelligent, authoritative Data Engineering Learning Assistant.

Selected Learning Lens:
{mode}

Pedagogic Guidelines:
{instructions}

{context_str}Student Question:
{question}

Output Format Requirements:
1. Provide the complete pedagogical explanation answering the student's question directly.
2. At the very end of your response, output a section exactly labeled "---FOLLOW_UPS---" followed by 2 or 3 brief, logical follow-up questions (each on a new line starting with a bullet `- `) that will help the student explore deeper or test their understanding.
"""

    if client:
        try:
            response = client.models.generate_content(
                model=DEFAULT_MODEL,
                contents=prompt,
            )
            raw_output = response.text or ""
            if "---FOLLOW_UPS---" in raw_output:
                parts = raw_output.split("---FOLLOW_UPS---")
                explanation = parts[0].strip()
                follow_up_lines = [
                    line.replace("-", "").strip()
                    for line in parts[1].strip().split("\n")
                    if line.strip()
                ]
                return explanation, follow_up_lines[:3]
            return raw_output.strip(), [
                f"How would you optimize this in a high-volume pipeline?",
                f"What are the failure modes or data quality checks for this?",
            ]
        except Exception as e:
            print(f"Gemini generation error: {e}")

    # Domain Fallback if Gemini API key missing or network fails
    fallback_answers = {
        "spark": (
            "Apache Spark is a distributed computing engine that processes large-scale data in memory across clusters. "
            "It breaks computations into Directed Acyclic Graphs (DAGs) and executes transformations lazily until an action is triggered.",
            ["What is the difference between narrow and wide transformations?", "How does Spark's Catalyst Optimizer work?"],
        ),
        "etl": (
            "An ETL (Extract, Transform, Load) pipeline extracts raw data from operational systems, cleans, validates, and models it, "
            "and loads the curated results into analytical storage like Snowflake, BigQuery, or Databricks.",
            ["How do you ensure data pipeline idempotency?", "When should you choose ELT over ETL?"],
        ),
        "delta": (
            "Delta Lake adds an ACID-compliant transaction log (_delta_log) on top of Parquet files in object storage, enabling atomic commits, schema enforcement, and time travel.",
            ["How does Delta Lake handle concurrent writes?", "What is the difference between optimize and vacuum in Delta Lake?"],
        ),
    }

    lowered = question.lower()
    for key, (ans, follow_ups) in fallback_answers.items():
        if key in lowered:
            return f"**[Demo Response]** {ans}", follow_ups

    return (
        f"**[DataBuddy Analysis]** For '{question}': In distributed data architectures, robust data pipelines require idempotent ingestion, "
        f"schema enforcement, and structured partition strategies to ensure reliability and scalable analytical querying.",
        ["Can you show an example implementation?", "What are the common production bottlenecks?"],
    )


def generate_quiz_question(
    topic: str,
    difficulty: str = "Medium",
) -> Dict[str, Any]:
    """
    Generate an intelligent 4-option MCQ with explanation and correct answer.
    """
    client = get_genai_client()

    prompt = f"""Create one technical multiple-choice question for Data Engineering assessment.

Topic: {topic}
Target Difficulty Level: {difficulty}

Return ONLY valid JSON with this exact structure:
{{
  "question": "Clear, technically precise problem statement or question",
  "options": [
    "Option A text",
    "Option B text",
    "Option C text",
    "Option D text"
  ],
  "correct_answer": "Exact text of the single correct option matching one of the options",
  "explanation": "Clear architectural explanation detailing why the correct answer is right and why the primary distractor is wrong.",
  "difficulty": "{difficulty}"
}}

Rules:
- Provide exactly 4 plausible options.
- The correct_answer string must match one option word-for-word.
- Return only raw JSON, no surrounding markdown.
"""

    if client:
        try:
            response = client.models.generate_content(
                model=DEFAULT_MODEL,
                contents=prompt,
            )
            json_text = clean_json_response(response.text or "")
            data = json.loads(json_text)
            if "options" in data and len(data["options"]) == 4 and "correct_answer" in data:
                data["topic"] = topic
                data["difficulty"] = difficulty
                return data
        except Exception as e:
            print(f"Gemini Quiz Generation Error: {e}")

    # Reliable Curated Fallback
    curated_quizzes = {
        "ETL Pipelines": {
            "question": "What is the primary characteristic of an 'idempotent' data pipeline?",
            "options": [
                "Running the pipeline multiple times with the same input produces the exact same outcome without duplicate records",
                "The pipeline only processes data using streaming sockets rather than micro-batches",
                "The pipeline compresses output files exclusively using Snappy compression",
                "The pipeline requires manual approval before writing to the target warehouse"
            ],
            "correct_answer": "Running the pipeline multiple times with the same input produces the exact same outcome without duplicate records",
            "explanation": "Idempotency ensures that pipeline replays, retries, or backfills do not duplicate facts or corrupt state in downstream analytical storage.",
            "difficulty": difficulty,
            "topic": topic,
        },
        "Apache Spark": {
            "question": "Which of the following operations in Apache Spark causes a cluster-wide data shuffle?",
            "options": [
                "groupByKey() or join()",
                "filter()",
                "map()",
                "select()"
            ],
            "correct_answer": "groupByKey() or join()",
            "explanation": "Wide transformations like groupByKey, reduceByKey, and join require redistributing data across cluster partitions, incurring network I/O and shuffle overhead.",
            "difficulty": difficulty,
            "topic": topic,
        },
        "Delta Lake & ACID": {
            "question": "How does Delta Lake implement time travel to query past versions of a table?",
            "options": [
                "By reading the JSON transaction log (_delta_log) to reconstruct snapshot manifests at specific commit versions",
                "By keeping full duplicates of the entire raw database every minute",
                "By storing file snapshots in browser cache IndexedDB",
                "By locking all writes until read requests finish"
            ],
            "correct_answer": "By reading the JSON transaction log (_delta_log) to reconstruct snapshot manifests at specific commit versions",
            "explanation": "Delta Lake logs every commit as an atomic JSON file in the _delta_log directory, allowing the engine to read the exact parquet files valid at any prior commit timestamp.",
            "difficulty": difficulty,
            "topic": topic,
        },
    }

    fallback = curated_quizzes.get(topic, curated_quizzes["ETL Pipelines"])
    fallback["topic"] = topic
    fallback["difficulty"] = difficulty
    return fallback


def synthesize_rag_answer(
    question: str,
    relevant_chunks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Synthesize grounded answer using only retrieved documentation passages.
    Returns: {"answer": str, "citations": list}
    """
    if not relevant_chunks:
        return {
            "answer": "No relevant passages were found in the uploaded documents to answer this question.",
            "citations": [],
        }

    client = get_genai_client()

    context_blocks = []
    citations = []
    for idx, c in enumerate(relevant_chunks, 1):
        context_blocks.append(f"[Source {idx} - {c.get('filename', 'Doc')}]:\n{c['content']}")
        citations.append({
            "source_id": idx,
            "filename": c.get("filename", "Doc"),
            "similarity_score": c.get("similarity_score", 0.0),
            "snippet": c["content"][:180] + "...",
        })

    context_text = "\n\n---\n\n".join(context_blocks)

    prompt = f"""You are DataBuddy AI's Knowledge Retrieval Engine.

Answer the student's question STRICTLY and ONLY using the retrieved source passages below.

Retrieved Passages:
-------------------
{context_text}
-------------------

Rules:
1. Ground your entire answer in the provided passages.
2. If the answer cannot be found in the passages, state clearly: "I could not find information on this in the provided documents."
3. Cite the sources in your explanation using bracket references like [Source 1] or [Source 2].
4. Maintain a clear, professional technical tone.

Question:
{question}
"""

    if client:
        try:
            res = client.models.generate_content(
                model=DEFAULT_MODEL,
                contents=prompt,
            )
            return {
                "answer": res.text or "Answer synthesis generated empty response.",
                "citations": citations,
            }
        except Exception as e:
            print(f"RAG Synthesis Gemini Error: {e}")

    # Fallback response
    top_snippet = relevant_chunks[0]["content"]
    return {
        "answer": f"**Grounded Synthesis from {relevant_chunks[0].get('filename', 'Uploaded Notes')}**:\n\n{top_snippet}\n\n*(Reference: [Source 1] - similarity score {relevant_chunks[0].get('similarity_score', 0.85)})*",
        "citations": citations,
    }


def generate_personalized_recommendation(
    weak_topics: List[str],
    target_role: str = "Data Engineer",
) -> Dict[str, Any]:
    """
    Generate an intelligent revision plan for weak topics detected in SQLite.
    """
    client = get_genai_client()

    if not weak_topics:
        return {
            "status": "proficient",
            "message": "All assessed areas meet or exceed competency thresholds (> 65% accuracy).",
            "action_items": [
                "Proceed to advanced distributed topics: Spark memory tuning and Kafka exactly-once semantics.",
                "Take a Hard difficulty assessment in Quiz Studio.",
            ],
        }

    topics_joined = ", ".join(weak_topics)
    prompt = f"""The student is preparing for a role as a {target_role}.
Their diagnostic database results showed weak performance in the following topics:
{topics_joined}

Create a structured 3-step action plan to help them master these weak topics.
Return ONLY valid JSON:
{{
  "diagnostic_summary": "Short 2-sentence diagnostic assessment",
  "action_items": [
    "Step 1: Specific concept to review and why",
    "Step 2: Specific hands-on exercise or query pattern to practice",
    "Step 3: Self-test recommendation"
  ]
}}
"""

    if client:
        try:
            res = client.models.generate_content(
                model=DEFAULT_MODEL,
                contents=prompt,
            )
            cleaned = clean_json_response(res.text or "")
            data = json.loads(cleaned)
            return data
        except Exception as e:
            print(f"Recommendation Generation Error: {e}")

    return {
        "diagnostic_summary": f"Targeted remediation recommended for {topics_joined} to meet {target_role} expectations.",
        "action_items": [
            f"Review foundational principles and transaction logs for {weak_topics[0]}.",
            f"Practice troubleshooting partition skew and idempotency in {weak_topics[0]}.",
            f"Re-test in Quiz Studio once conceptual review is complete.",
        ],
    }