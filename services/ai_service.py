import json
import os
import time

import streamlit as st
from dotenv import load_dotenv
from google import genai


load_dotenv()

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        try:
            api_key = st.secrets["GEMINI_API_KEY"]
        except (KeyError, FileNotFoundError):
            return None

    return genai.Client(api_key=api_key)


def get_mode_instructions(selected_mode: str) -> str:
    if selected_mode == "Beginner Mode":
        return """
Explain in very simple English.
Assume the student is a complete beginner.
Use short paragraphs.
Give one easy real-life example.
Avoid difficult technical words.
"""

    if selected_mode == "Interview Mode":
        return """
Give a short and professional interview-ready answer.
Keep the answer between 4 and 7 lines.
Include the definition and one important use.
Use simple but professional language.
"""

    return """
Give a detailed technical explanation.
Include important concepts, working steps, and an example.
Use headings or bullet points when useful.
Explain technical terms clearly.
"""


def handle_ai_error(error: Exception) -> str:
    error_message = str(error)

    if "503" in error_message:
        return (
            "Gemini is temporarily busy. "
            "Please try again after a few seconds."
        )

    if "nodename nor servname provided" in error_message:
        return (
            "Your Mac could not connect to Gemini. "
            "Please check your internet, Wi-Fi or VPN."
        )

    return f"Something went wrong: {error_message}"

def get_ai_answer(question: str, selected_mode: str) -> str:
    client = get_client()

    if client is None:
        return "API key is missing. Please check the .env file."

    mode_instructions = get_mode_instructions(selected_mode)

    prompt = f"""
You are DataBuddy AI, a Data Engineering learning assistant.

Selected answer mode:
{selected_mode}

Follow these instructions:
{mode_instructions}

Important rules:
- Answer only the user's technical or learning question.
- Do not mention the user's name.
- Do not make personal comments about intelligence or ability.
- Do not add motivational comments unless requested.
- Keep the answer focused on the topic.

Student's question:
{question}
"""

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt,
            )

            return response.text or "I could not generate an answer."

        except Exception as error:
            error_message = str(error)

            if "503" in error_message:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue

                return (
                    "Gemini is temporarily busy. "
                    "Please try the question again after a few seconds."
                )
            
            if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
                return (
                    "The daily AI request limit has been reached. "
                    "Please try again later."
                )

            if "nodename nor servname provided" in error_message:
                return (
                    "The app could not connect to Gemini. "
                    "Please check your internet connection or VPN."
                )

            return f"Something went wrong: {error_message}"

    return "I could not generate an answer."


def generate_quiz(topic: str) -> tuple[dict | None, str | None]:
    client = get_client()

    if client is None:
        return None, "API key is missing from the .env file."

    try:
        prompt = f"""
Create one beginner-friendly multiple-choice question about:

{topic}

Return only valid JSON in exactly this structure:

{{
  "question": "Question here",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correct_answer": "The exact correct option",
  "explanation": "A simple explanation"
}}

Rules:

- Give exactly four options.
- Only one option must be correct.
- correct_answer must exactly match one option.
- Do not include markdown.
- Return only the JSON object.
"""

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )

        response_text = response.text.strip()

        if response_text.startswith("```"):
            response_text = response_text.replace("```json", "")
            response_text = response_text.replace("```", "")
            response_text = response_text.strip()

        quiz = json.loads(response_text)

        return quiz, None

    except json.JSONDecodeError:
        return None, "The quiz format was incorrect. Please generate it again."

    except Exception as error:
        return None, handle_ai_error(error)


def answer_from_notes(
    question: str,
    notes_content: str,
    filename: str,
) -> str:
    client = get_client()

    if client is None:
        return "API key is missing. Please check the .env file."

    try:
        prompt = f"""
You are DataBuddy AI.

Answer the student's question using only the uploaded notes below.

Important rules:

- Do not use outside knowledge.
- If the answer is not present in the notes, say:
  "I could not find this answer in the uploaded notes."
- Explain the answer in simple English.
- Keep the answer clear and to the point.
- Do not invent information.

Uploaded filename:
{filename}

Uploaded notes:
----------------
{notes_content}
----------------

Student's question:
{question}
"""

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )

        return response.text or "I could not generate an answer."

    except Exception as error:
        return handle_ai_error(error)