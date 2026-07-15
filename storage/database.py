import sqlite3
from datetime import datetime


DATABASE_NAME = "databuddy.db"


def get_connection() -> sqlite3.Connection:
    return sqlite3.connect(DATABASE_NAME)


def initialize_database() -> None:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            answer_mode TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT NOT NULL,
            question TEXT NOT NULL,
            selected_answer TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    connection.commit()
    connection.close()


def save_chat(
    question: str,
    answer: str,
    answer_mode: str,
) -> None:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO chats (
            question,
            answer,
            answer_mode,
            created_at
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            question,
            answer,
            answer_mode,
            datetime.now().strftime("%d %B %Y, %I:%M %p"),
        ),
    )

    connection.commit()
    connection.close()


def save_quiz_result(
    topic: str,
    question: str,
    selected_answer: str,
    correct_answer: str,
    is_correct: bool,
) -> None:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO quiz_results (
            topic,
            question,
            selected_answer,
            correct_answer,
            is_correct,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            topic,
            question,
            selected_answer,
            correct_answer,
            int(is_correct),
            datetime.now().strftime("%d %B %Y, %I:%M %p"),
        ),
    )

    connection.commit()
    connection.close()


def get_recent_chats(limit: int = 10) -> list[tuple]:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT question, answer, answer_mode, created_at
        FROM chats
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )

    chats = cursor.fetchall()
    connection.close()

    return chats


def get_recent_quiz_results(limit: int = 10) -> list[tuple]:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            topic,
            question,
            selected_answer,
            correct_answer,
            is_correct,
            created_at
        FROM quiz_results
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )

    results = cursor.fetchall()
    connection.close()

    return results


def get_quiz_summary() -> tuple[int, int]:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            COUNT(*),
            COALESCE(SUM(is_correct), 0)
        FROM quiz_results
        """
    )

    total_quizzes, correct_answers = cursor.fetchone()
    connection.close()

    return total_quizzes, correct_answers


def get_total_chats() -> int:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM chats
        """
    )

    total_chats = cursor.fetchone()[0]
    connection.close()

    return total_chats


def get_topic_performance() -> list[tuple]:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            LOWER(TRIM(topic)) AS clean_topic,
            COUNT(*) AS total_attempts,
            COALESCE(SUM(is_correct), 0) AS correct_answers
        FROM quiz_results
        GROUP BY LOWER(TRIM(topic))
        ORDER BY total_attempts DESC
        """
    )

    topic_results = cursor.fetchall()
    connection.close()

    return topic_results