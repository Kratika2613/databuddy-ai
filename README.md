# DataBuddy AI

# Live Demo -

[Open DataBuddy AI](https://databuddy-ai-y7cbvwj6tp2kdywqxe5ssy.streamlit.app)


DataBuddy AI is a Python-based learning assistant created for Data Engineering beginners.

It helps users understand technical topics, prepare for interviews, practice quizzes, ask questions from uploaded notes, and track learning progress.

## Project Overview

DataBuddy AI works like a simple chatbot focused on Data Engineering learning.

The user can choose different modes:

- **Beginner Mode** for simple explanations
- **Interview Mode** for short interview-ready answers
- **Technical Mode** for detailed explanations
- **Quiz Mode** for multiple-choice practice
- **Notes Mode** for asking questions from TXT, Markdown, or PDF files
- **History Mode** for viewing saved chats and quiz attempts
- **Dashboard Mode** for tracking scores and weak topics

The project also uses a basic RAG approach. Uploaded documents are divided into smaller chunks, and the most relevant chunks are selected before the question is sent to Gemini.

## Main Features

- AI-powered learning assistant
- Beginner, interview, and technical answer modes
- AI-generated quizzes
- Quiz result tracking
- Chat and quiz history
- Weak-topic identification
- TXT, Markdown, and PDF upload
- Question answering from uploaded notes
- Basic RAG using TF-IDF and cosine similarity
- SQLite database for local storage

## Technologies Used

- Python
- Streamlit
- Google Gemini API
- SQLite
- PyPDF
- Scikit-learn
- TF-IDF
- Cosine Similarity

## Project Structure

```text
databruddy-ai/
├── app.py
├── requirements.txt
├── README.md
├── services/
│   ├── __init__.py
│   ├── ai_service.py
│   └── rag_service.py
└── storage/
    ├── __init__.py
    └── database.py

## How It Works

- The user selects a learning mode.
- The user enters a question or uploads notes.
- DataBuddy sends the question to the Gemini API.
- In Notes Mode, the uploaded document is split into chunks.
- TF-IDF and cosine similarity are used to find relevant chunks.
- Gemini generates an answer using those chunks.
- Chats and quiz results are stored in SQLite.