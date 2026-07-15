import streamlit as st
from pypdf import PdfReader

from services.ai_service import (
    answer_from_notes,
    generate_quiz,
    get_ai_answer,
)
from services.rag_service import (
    find_relevant_chunks,
    split_text_into_chunks,
)
from storage.database import (
    get_quiz_summary,
    get_recent_chats,
    get_recent_quiz_results,
    get_topic_performance,
    get_total_chats,
    initialize_database,
    save_chat,
    save_quiz_result,
)


initialize_database()


def apply_styles() -> None:
    st.markdown(
        """
        <style>
        .stApp {
            background:
                radial-gradient(circle at 85% 5%, rgba(124, 58, 237, 0.12), transparent 22%),
                radial-gradient(circle at 15% 90%, rgba(14, 165, 233, 0.08), transparent 20%);
        }

        .block-container {
            max-width: 1120px;
            padding-top: 1.4rem;
            padding-bottom: 2.5rem;
        }

        section[data-testid="stSidebar"] {
            border-right: 1px solid rgba(128, 128, 128, 0.16);
        }

        .sidebar-logo {
            font-size: 1.55rem;
            font-weight: 800;
            margin-bottom: 0.2rem;
        }

        .sidebar-text {
            opacity: 0.70;
            font-size: 0.88rem;
            line-height: 1.45;
            margin-bottom: 1rem;
        }

        .sidebar-tip {
            margin-top: 1rem;
            padding: 0.85rem;
            border-radius: 12px;
            background: rgba(124, 58, 237, 0.09);
            border: 1px solid rgba(124, 58, 237, 0.18);
            font-size: 0.86rem;
            line-height: 1.5;
        }

        .hero {
            padding: 1.45rem 1.55rem;
            border-radius: 18px;
            background: linear-gradient(
                135deg,
                rgba(124, 58, 237, 0.16),
                rgba(14, 165, 233, 0.08)
            );
            border: 1px solid rgba(124, 58, 237, 0.20);
            margin-bottom: 1.1rem;
        }

        .hero-title {
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 0.3rem;
        }

        .hero-subtitle {
            opacity: 0.76;
            line-height: 1.55;
        }

        .mode-card {
            padding: 0.9rem 1rem;
            border-radius: 12px;
            border: 1px solid rgba(128, 128, 128, 0.17);
            background: rgba(255, 255, 255, 0.025);
            margin-bottom: 1rem;
        }

        .mode-title {
            font-weight: 700;
            margin-bottom: 0.2rem;
        }

        .mode-description {
            opacity: 0.70;
            font-size: 0.92rem;
        }

        .feature-card {
            padding: 1rem;
            border-radius: 14px;
            border: 1px solid rgba(128, 128, 128, 0.16);
            background: rgba(255, 255, 255, 0.025);
            min-height: 130px;
        }

        .feature-icon {
            font-size: 1.3rem;
            margin-bottom: 0.4rem;
        }

        .feature-title {
            font-weight: 700;
            margin-bottom: 0.25rem;
        }

        .feature-text {
            opacity: 0.68;
            font-size: 0.88rem;
            line-height: 1.45;
        }

        .example-chip {
            display: inline-block;
            padding: 0.35rem 0.6rem;
            margin: 0.2rem 0.25rem 0.2rem 0;
            border-radius: 999px;
            background: rgba(14, 165, 233, 0.10);
            border: 1px solid rgba(14, 165, 233, 0.18);
            font-size: 0.82rem;
        }

        div[data-testid="stMetric"] {
            border: 1px solid rgba(128, 128, 128, 0.17);
            border-radius: 13px;
            padding: 0.9rem;
            background: rgba(255, 255, 255, 0.025);
        }

        div[data-testid="stExpander"] {
            border-radius: 12px;
            border: 1px solid rgba(128, 128, 128, 0.16);
        }

        div[data-testid="stFileUploader"] {
            border-radius: 13px;
            border: 1px dashed rgba(124, 58, 237, 0.42);
            padding: 0.45rem;
        }

        div.stButton > button {
            border-radius: 10px;
            font-weight: 600;
            min-height: 2.6rem;
        }

        .section-label {
            font-size: 0.88rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            opacity: 0.58;
            margin-bottom: 0.45rem;
        }

        .footer {
            text-align: center;
            opacity: 0.48;
            font-size: 0.82rem;
            margin-top: 2.2rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def initialize_session_state() -> None:
    defaults = {
        "messages": [],
        "notes_messages": [],
        "quiz": None,
        "quiz_topic": "",
        "quiz_submitted": False,
        "quiz_result_saved": False,
        "selected_answer": None,
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def get_mode_info(selected_mode: str) -> tuple[str, str, list[str]]:
    mode_info = {
        "Beginner Mode": (
            "Learn in simple words",
            "Best for understanding a topic for the first time.",
            [
                "What is ETL?",
                "Explain SQL joins simply",
                "What is a data warehouse?",
            ],
        ),
        "Interview Mode": (
            "Prepare for interviews",
            "Get short and professional interview-ready answers.",
            [
                "What is Delta Lake?",
                "Difference between ETL and ELT",
                "What is a star schema?",
            ],
        ),
        "Technical Mode": (
            "Go deeper technically",
            "Get detailed explanations with steps and examples.",
            [
                "Explain ACID transactions",
                "How does RAG work?",
                "Explain CDC in ETL",
            ],
        ),
        "Quiz Mode": (
            "Practice with quizzes",
            "Generate a question, answer it, and track your score.",
            [
                "SQL",
                "Python",
                "Data Warehousing",
            ],
        ),
        "Notes Mode": (
            "Ask from your own notes",
            "Upload TXT, Markdown or PDF files and search them using RAG.",
            [
                "Summarize this file",
                "What skills are mentioned?",
                "Explain the main topic",
            ],
        ),
        "History Mode": (
            "Review your activity",
            "See saved chats and previous quiz attempts.",
            [],
        ),
        "Dashboard Mode": (
            "Track your progress",
            "View accuracy, total questions, and weak topics.",
            [],
        ),
    }

    return mode_info[selected_mode]


def show_sidebar() -> str:
    with st.sidebar:
        st.markdown(
            """
            <div class="sidebar-logo">🤖 DataBuddy AI</div>
            <div class="sidebar-text">
                Learn, practise and revise Data Engineering in one place.
            </div>
            """,
            unsafe_allow_html=True,
        )

        selected_mode = st.radio(
            "Choose a mode",
            [
                "Beginner Mode",
                "Interview Mode",
                "Technical Mode",
                "Quiz Mode",
                "Notes Mode",
                "History Mode",
                "Dashboard Mode",
            ],
        )

        st.markdown(
            """
            <div class="sidebar-tip">
                <strong>Quick tip</strong><br>
                Start with Beginner Mode, then practise the same topic in Quiz Mode.
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.divider()

        total_chats = get_total_chats()
        total_quizzes, correct_answers = get_quiz_summary()

        st.caption("Your progress")
        st.write(f"Questions asked: **{total_chats}**")
        st.write(f"Quizzes attempted: **{total_quizzes}**")
        st.write(f"Correct answers: **{correct_answers}**")

    return selected_mode


def show_header(selected_mode: str) -> None:
    mode_title, mode_description, examples = get_mode_info(selected_mode)

    st.markdown(
        """
        <div class="hero">
            <div class="hero-title">DataBuddy AI</div>
            <div class="hero-subtitle">
                Your personal Data Engineering learning assistant for concepts,
                interview preparation, quizzes and notes.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        f"""
        <div class="mode-card">
            <div class="mode-title">{mode_title}</div>
            <div class="mode-description">{mode_description}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if examples:
        chips = "".join(
            f'<span class="example-chip">{example}</span>'
            for example in examples
        )

        st.markdown(
            f"""
            <div class="section-label">Example prompts</div>
            <div>{chips}</div>
            """,
            unsafe_allow_html=True,
        )

        st.write("")


def show_start_cards() -> None:
    first, second, third = st.columns(3)

    with first:
        st.markdown(
            """
            <div class="feature-card">
                <div class="feature-icon">📘</div>
                <div class="feature-title">Understand concepts</div>
                <div class="feature-text">
                    Learn topics using simple, interview or technical explanations.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with second:
        st.markdown(
            """
            <div class="feature-card">
                <div class="feature-icon">📝</div>
                <div class="feature-title">Practice quizzes</div>
                <div class="feature-text">
                    Generate questions, check answers and identify weak topics.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with third:
        st.markdown(
            """
            <div class="feature-card">
                <div class="feature-icon">📄</div>
                <div class="feature-title">Search your notes</div>
                <div class="feature-text">
                    Upload TXT, Markdown or PDF files and ask questions from them.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.write("")


def show_chat_mode(selected_mode: str) -> None:
    top_left, top_right = st.columns([1, 4])

    with top_left:
        if st.button("Clear chat", use_container_width=True):
            st.session_state.messages = []
            st.rerun()

    st.divider()

    if not st.session_state.messages:
        show_start_cards()
        st.info("Type a question in the box below to begin.")

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    question = st.chat_input("Ask DataBuddy a question")

    if not question:
        return

    st.session_state.messages.append(
        {
            "role": "user",
            "content": question,
        }
    )

    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):
        with st.spinner("DataBuddy is thinking..."):
            answer = get_ai_answer(
                question,
                selected_mode,
            )

        st.markdown(answer)

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": answer,
        }
    )

    save_chat(
        question=question,
        answer=answer,
        answer_mode=selected_mode,
    )


def reset_quiz() -> None:
    st.session_state.quiz = None
    st.session_state.quiz_topic = ""
    st.session_state.quiz_submitted = False
    st.session_state.quiz_result_saved = False
    st.session_state.selected_answer = None


def show_quiz_mode() -> None:
    left, right = st.columns([2, 1])

    with left:
        st.subheader("Create a quiz")

        topic = st.text_input(
            "Enter a topic",
            placeholder="Example: SQL joins",
        )

        if st.button(
            "Generate Quiz",
            type="primary",
            use_container_width=True,
        ):
            if not topic.strip():
                st.warning("Please enter a topic first.")
            else:
                with st.spinner("Creating your quiz..."):
                    quiz, error_message = generate_quiz(topic)

                if error_message:
                    st.error(error_message)

                if quiz:
                    st.session_state.quiz = quiz
                    st.session_state.quiz_topic = topic
                    st.session_state.quiz_submitted = False
                    st.session_state.quiz_result_saved = False
                    st.session_state.selected_answer = None
                    st.rerun()

    with right:
        total_quizzes, correct_answers = get_quiz_summary()

        score = (
            round((correct_answers / total_quizzes) * 100, 1)
            if total_quizzes
            else 0
        )

        st.metric("Quizzes attempted", total_quizzes)
        st.metric("Current accuracy", f"{score}%")

    quiz = st.session_state.quiz

    if not quiz:
        st.info("Enter a topic above to create a quiz.")
        return

    st.divider()
    st.write("### Your question")
    st.write(quiz["question"])

    selected_answer = st.radio(
        "Choose one answer",
        quiz["options"],
        index=None,
    )

    if st.button(
        "Submit Answer",
        type="primary",
        use_container_width=True,
    ):
        if selected_answer is None:
            st.warning("Please choose an answer first.")
        else:
            st.session_state.quiz_submitted = True
            st.session_state.selected_answer = selected_answer

            correct_answer = quiz["correct_answer"]
            is_correct = selected_answer == correct_answer

            if not st.session_state.quiz_result_saved:
                save_quiz_result(
                    topic=st.session_state.quiz_topic,
                    question=quiz["question"],
                    selected_answer=selected_answer,
                    correct_answer=correct_answer,
                    is_correct=is_correct,
                )

                st.session_state.quiz_result_saved = True

    if st.session_state.quiz_submitted:
        selected_answer = st.session_state.selected_answer
        correct_answer = quiz["correct_answer"]

        if selected_answer == correct_answer:
            st.success("Correct answer! 🎉")
        else:
            st.error("Incorrect answer.")

        st.write(f"**Correct answer:** {correct_answer}")
        st.info(quiz["explanation"])

    if st.button("Create another quiz", use_container_width=True):
        reset_quiz()
        st.rerun()


def read_uploaded_file(uploaded_file) -> str:
    file_extension = uploaded_file.name.lower().split(".")[-1]

    if file_extension in ["txt", "md"]:
        return uploaded_file.getvalue().decode("utf-8")

    if file_extension == "pdf":
        pdf_reader = PdfReader(uploaded_file)
        pages_text = []

        for page in pdf_reader.pages:
            page_text = page.extract_text()

            if page_text:
                pages_text.append(page_text)

        return "\n\n".join(pages_text)

    return ""


def show_notes_mode() -> None:
    left, right = st.columns([2, 1])

    with left:
        st.subheader("Upload your notes")

        uploaded_file = st.file_uploader(
            "Choose TXT, Markdown or PDF",
            type=["txt", "md", "pdf"],
        )

    with right:
        st.metric(
            "Supported formats",
            "TXT · MD · PDF",
        )

    if uploaded_file is None:
        st.info("Upload a file to start asking questions from it.")
        return

    try:
        notes_content = read_uploaded_file(uploaded_file)

    except UnicodeDecodeError:
        st.error("This text file could not be read.")
        return

    except Exception as error:
        st.error(f"The file could not be read: {error}")
        return

    if not notes_content.strip():
        st.warning(
            "No readable text was found. "
            "The PDF may contain only scanned images."
        )
        return

    chunks = split_text_into_chunks(notes_content)

    file_col, chunk_col, button_col = st.columns([2, 1, 1])

    with file_col:
        st.success(f"Uploaded: {uploaded_file.name}")

    with chunk_col:
        st.metric("Chunks", len(chunks))

    with button_col:
        if st.button("Clear chat", use_container_width=True):
            st.session_state.notes_messages = []
            st.rerun()

    with st.expander("Preview extracted text"):
        st.text(notes_content[:3000])

        if len(notes_content) > 3000:
            st.caption("Only the first 3000 characters are shown.")

    st.divider()

    for message in st.session_state.notes_messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    question = st.chat_input("Ask a question from the uploaded file")

    if not question:
        return

    st.session_state.notes_messages.append(
        {
            "role": "user",
            "content": question,
        }
    )

    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):
        with st.spinner("Searching your notes..."):
            relevant_chunks = find_relevant_chunks(
                question=question,
                chunks=chunks,
                top_k=3,
            )

            if not relevant_chunks:
                answer = (
                    "I could not find relevant information "
                    "in the uploaded notes."
                )
            else:
                relevant_text = "\n\n".join(relevant_chunks)

                answer = answer_from_notes(
                    question=question,
                    notes_content=relevant_text,
                    filename=uploaded_file.name,
                )

        st.markdown(answer)
        st.caption(
            f"Source: {uploaded_file.name} · "
            f"Relevant chunks used: {len(relevant_chunks)}"
        )

    st.session_state.notes_messages.append(
        {
            "role": "assistant",
            "content": answer,
        }
    )


def show_history_mode() -> None:
    st.subheader("Learning history")

    total_chats = get_total_chats()
    total_quizzes, correct_answers = get_quiz_summary()

    score = (
        round((correct_answers / total_quizzes) * 100, 1)
        if total_quizzes
        else 0
    )

    first, second, third, fourth = st.columns(4)

    first.metric("Saved chats", total_chats)
    second.metric("Quizzes", total_quizzes)
    third.metric("Correct", correct_answers)
    fourth.metric("Accuracy", f"{score}%")

    chats_tab, quiz_tab = st.tabs(
        ["Recent chats", "Quiz attempts"]
    )

    with chats_tab:
        chats = get_recent_chats()

        if not chats:
            st.info("No saved chats yet.")
        else:
            for question, answer, answer_mode, created_at in chats:
                with st.expander(question):
                    st.caption(f"{answer_mode} · {created_at}")
                    st.markdown(answer)

    with quiz_tab:
        quiz_results = get_recent_quiz_results()

        if not quiz_results:
            st.info("No saved quiz results yet.")
        else:
            for result in quiz_results:
                (
                    topic,
                    question,
                    selected_answer,
                    correct_answer,
                    is_correct,
                    created_at,
                ) = result

                status = "Correct" if is_correct else "Incorrect"

                with st.expander(f"{topic} · {status}"):
                    st.caption(created_at)
                    st.write(f"**Question:** {question}")
                    st.write(f"**Your answer:** {selected_answer}")
                    st.write(f"**Correct answer:** {correct_answer}")


def show_dashboard_mode() -> None:
    st.subheader("Learning dashboard")

    total_chats = get_total_chats()
    total_quizzes, correct_answers = get_quiz_summary()

    accuracy = (
        round((correct_answers / total_quizzes) * 100, 1)
        if total_quizzes
        else 0
    )

    first, second, third, fourth = st.columns(4)

    first.metric("Questions", total_chats)
    second.metric("Quizzes", total_quizzes)
    third.metric("Correct", correct_answers)
    fourth.metric("Accuracy", f"{accuracy}%")

    st.divider()
    st.write("### Topic performance")

    topic_results = get_topic_performance()

    if not topic_results:
        st.info("Complete some quizzes to see your progress.")
        return

    weak_topics = []

    for topic, total_attempts, topic_correct in topic_results:
        topic_accuracy = round(
            (topic_correct / total_attempts) * 100,
            1,
        )

        topic_name = topic.title()

        left, right = st.columns([4, 1])

        with left:
            st.write(
                f"**{topic_name}** — "
                f"{topic_correct}/{total_attempts} correct"
            )
            st.progress(topic_accuracy / 100)

        with right:
            st.metric("Accuracy", f"{topic_accuracy}%")

        if topic_accuracy < 60:
            weak_topics.append((topic_name, topic_accuracy))

    st.divider()
    st.write("### Topics to practise")

    if weak_topics:
        for topic_name, topic_accuracy in weak_topics:
            st.warning(
                f"{topic_name} needs more practice "
                f"({topic_accuracy}% accuracy)."
            )
    else:
        st.success("No weak topics found.")


def main() -> None:
    st.set_page_config(
        page_title="DataBuddy AI",
        page_icon="🤖",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    apply_styles()
    initialize_session_state()

    selected_mode = show_sidebar()
    show_header(selected_mode)

    if selected_mode == "Quiz Mode":
        show_quiz_mode()

    elif selected_mode == "Notes Mode":
        show_notes_mode()

    elif selected_mode == "History Mode":
        show_history_mode()

    elif selected_mode == "Dashboard Mode":
        show_dashboard_mode()

    else:
        show_chat_mode(selected_mode)

    st.markdown(
        """
        <div class="footer">
            DataBuddy AI · Data Engineering learning assistant
        </div>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
