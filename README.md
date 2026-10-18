# 🤖 DataBuddy AI — Enterprise Edition

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?style=for-the-badge&logo=github)](https://kratika2613.github.io/databuddy-ai/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Flash%20%26%20Pro-blueviolet?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![Pure Web Tech](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-orange?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Zero Config](https://img.shields.io/badge/Server-100%25%20Client--Side-blue?style=for-the-badge)](https://kratika2613.github.io/databuddy-ai/)

> **Live Demo**: [https://kratika2613.github.io/databuddy-ai/](https://kratika2613.github.io/databuddy-ai/)

**DataBuddy AI** is an enterprise-grade learning assistant created for Data Engineering beginners and professionals. It runs **100% directly in your browser** with zero servers, zero lag, and instant loading on **GitHub Pages**.

---

## 🌟 What Can You Do With DataBuddy AI?

| Mode | What It Does | Best For |
|---|---|---|
| 🟢 **Beginner Mode** | Explains complex topics in simple English with real-life analogies | First-time learners |
| 💼 **Interview Mode** | Gives short, punchy 4–7 line answers with definitions & trade-offs | Interview preparation |
| ⚙️ **Technical Mode** | Deep dives with architecture details, ACID mechanics & code | Advanced engineers |
| 📝 **Quiz Arena** | Generates multiple-choice challenges with instant feedback & confetti | Active recall practice |
| 📄 **RAG Notes Lab** | Upload `.txt`, `.md`, or `.pdf` notes and search them using client-side RAG | Studying personal notes |
| 🕒 **Learning History** | Filter, search, and export your past chats & quiz attempts to JSON/CSV | Tracking your study log |
| 📊 **Performance Matrix** | Visual accuracy meters, topic mastery & practice buttons for weak areas | Targeting weak topics |

---

## 🚀 How to Open and Deploy on GitHub Pages

You can deploy and open this project on GitHub Pages in under **1 minute**:

### 1-Minute GitHub Pages Setup:
1. Go to your repository on GitHub: **[https://github.com/Kratika2613/databuddy-ai](https://github.com/Kratika2613/databuddy-ai)**
2. Click on **Settings** (top right tab)
3. In the left sidebar, click on **Pages** (under *Code and automation*)
4. Under **Build and deployment** > **Source**:
   - Select **Deploy from a branch**
   - Branch: select `main`
   - Folder: select `/ (root)`
   - Click **Save**
5. Wait **30 to 60 seconds** and refresh the page. You will see:
   > *Your site is live at https://kratika2613.github.io/databuddy-ai/*
6. Click the link to open DataBuddy AI directly from GitHub!

*(Note: An automated GitHub Actions workflow is also included in `.github/workflows/deploy.yml` so any future push to `main` deploys automatically!)*

---

## 💻 How to Run Locally

Because DataBuddy AI is built with modern standard web technologies (HTML5, Vanilla CSS, JavaScript), you **do not need to install Python, Streamlit, or any pip packages**!

### Option 1: Just Double-Click!
Open `index.html` directly in Google Chrome, Edge, Safari, or Firefox.

### Option 2: Using a Local Server (Recommended for PDF RAG):
```bash
# Using Python (already on Mac / Linux / Windows):
python3 -m http.server 8000

# Or using Node.js:
npx serve .
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🔑 How to Add Your Gemini API Key (Or Use Demo Mode)

DataBuddy AI works right out of the box!

1. **Instant Demo Mode (Zero Setup)**:
   - Leave the API key field empty! DataBuddy includes pre-configured Data Engineering intelligence and quizzes so anyone visiting your live site can test all 7 modes immediately.
2. **Live Gemini AI Mode**:
   - Click **API Settings** in the top navigation bar.
   - Paste your free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Click **Save Configuration**.
   - Your key is saved **only in your browser's local storage** (`localStorage`) and never sent to any external server.

---

## 📁 Project Structure

```text
databuddy-ai/
├── index.html                   # Enterprise single-page web application
├── README.md                    # Project documentation & GitHub Pages guide
├── etl_notes.txt                # Sample Data Engineering notes for RAG testing
├── .gitignore                   # Ignored files (.env, system caches)
├── .github/
│   └── workflows/
│       └── deploy.yml           # Automated GitHub Pages CI/CD workflow
├── css/
│   └── style.css                # Enterprise design system, glassmorphism & dark mode
└── js/
    ├── app.js                   # Application controller & UI rendering
    ├── ai-service.js            # Gemini API client & intelligent fallback
    ├── rag-service.js           # Client-side RAG (TF-IDF & Cosine Similarity)
    └── storage-service.js       # LocalStorage persistence & metrics analytics
```

---

## 🧠 Client-Side RAG Architecture

DataBuddy AI features an in-browser **Retrieval-Augmented Generation (RAG)** pipeline:
1. **Document Ingestion**: Extracts text client-side from `.txt`, `.md`, or `.pdf` (using PDF.js).
2. **Text Chunking**: Splits text into 800-character windows with 150-character overlapping context.
3. **TF-IDF Vectorization**: Tokenizes unigrams and bigrams, computes inverse document frequencies (IDF).
4. **Cosine Similarity**: Ranks chunks based on dot product over Euclidean norms.
5. **Context Augmentation**: Sends the top-3 matching chunks directly to the model for source-grounded answers.

---

## 📄 License
MIT License. Free for educational and professional learning use.