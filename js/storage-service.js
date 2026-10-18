/**
 * StorageService - Manages client-side persistence for DataBuddy AI
 * Saves chats, quiz results, API keys, and settings to localStorage.
 * Includes enterprise seed data for instant visual WOW on first load.
 */

const STORAGE_KEYS = {
  CHATS: 'databuddy_chats',
  QUIZZES: 'databuddy_quizzes',
  API_KEY: 'databuddy_gemini_api_key',
  MODEL: 'databuddy_selected_model',
  THEME: 'databuddy_theme'
};

const SEED_CHATS = [
  {
    id: 'seed-1',
    question: 'What is the core difference between ETL and ELT in modern data lakehouses?',
    answer: '### ETL vs. ELT in Modern Data Platforms\n\n- **ETL (Extract, Transform, Load)**: Data is transformed in a secondary processing engine (e.g. Informatica, Python scripts) **before** loading into the target warehouse. Used heavily with legacy architectures where storage and compute are coupled.\n- **ELT (Extract, Load, Transform)**: Raw data is loaded directly into scalable cloud storage (S3, ADLS, Snowflake, BigQuery) first, and transformations run inside the data warehouse using tools like **dbt** and **Spark SQL**.\n\n> 💡 **Key Takeaway**: ELT maximizes cloud parallel compute, supports schema-on-read, and prevents data loss since raw events are preserved forever in bronze/raw layers.',
    mode: 'Technical Mode',
    timestamp: '2026-10-17 10:14 AM'
  },
  {
    id: 'seed-2',
    question: 'Can you explain what a Data Warehouse is using a simple real-life analogy?',
    answer: '### Think of a Data Warehouse like a Giant Supermarket 🏬\n\n1. **The Farms and Factories (Source Systems)**: These are your company\'s raw databases, mobile app clicks, and sales registers.\n2. **The Delivery Trucks & Sorting (ETL Pipelines)**: Trucks bring fresh items, inspect quality, peel packaging, and price-tag everything.\n3. **The Organized Aisles (Data Warehouse)**: Products are organized cleanly into sections (Dairy, Bakery, Produce) so shoppers (Business Analysts & Dashboards) can immediately find exactly what they need without rummaging through dusty store basements.',
    mode: 'Beginner Mode',
    timestamp: '2026-10-17 02:45 PM'
  },
  {
    id: 'seed-3',
    question: 'How do you explain Delta Lake ACID transactions in an interview?',
    answer: '**Executive Interview Answer**:\n\nDelta Lake brings ACID transactions to Apache Spark by coupling Apache Parquet columnar storage with an immutable, ordered JSON-based **transaction log (_delta_log)**.\n\n- **Atomicity & Consistency**: Writes succeed completely or fail cleanly using mutual exclusion and optimistic concurrency control (OCC).\n- **Isolation**: Readers only see snapshot commits that have been officially logged in the transaction log, preventing dirty reads during active batch/streaming writes.\n- **Durability**: All modifications are persisted directly to cloud object storage (S3/ADLS/GCS).',
    mode: 'Interview Mode',
    timestamp: '2026-10-18 09:30 AM'
  }
];

const SEED_QUIZZES = [
  {
    id: 'quiz-seed-1',
    topic: 'SQL Joins',
    question: 'Which SQL join returns all rows from the left table and only matching rows from the right table?',
    selectedAnswer: 'LEFT JOIN',
    correctAnswer: 'LEFT JOIN',
    isCorrect: true,
    explanation: 'LEFT JOIN returns all records from the left table, and the matched records from the right table. NULL is returned for unmatched right rows.',
    timestamp: '2026-10-16 11:20 AM'
  },
  {
    id: 'quiz-seed-2',
    topic: 'SQL Joins',
    question: 'What happens when you execute an INNER JOIN without an ON or WHERE condition?',
    selectedAnswer: 'It acts as a Cartesian Product (CROSS JOIN)',
    correctAnswer: 'It acts as a Cartesian Product (CROSS JOIN)',
    isCorrect: true,
    explanation: 'Joining two tables without specifying matching conditions produces every combination of rows from both tables.',
    timestamp: '2026-10-16 11:24 AM'
  },
  {
    id: 'quiz-seed-3',
    topic: 'Delta Lake',
    question: 'Where does Delta Lake maintain the single source of truth for all table commits?',
    selectedAnswer: 'In the _delta_log directory',
    correctAnswer: 'In the _delta_log directory',
    isCorrect: true,
    explanation: 'Delta Lake uses the _delta_log transaction log directory to maintain atomic commit history and provide ACID isolation.',
    timestamp: '2026-10-17 01:15 PM'
  },
  {
    id: 'quiz-seed-4',
    topic: 'Apache Spark',
    question: 'What is the default number of shuffle partitions in Apache Spark SQL?',
    selectedAnswer: '100',
    correctAnswer: '200',
    isCorrect: false,
    explanation: 'spark.sql.shuffle.partitions defaults to 200, which can cause excessive small tasks on smaller datasets or out-of-memory on large ones.',
    timestamp: '2026-10-17 04:05 PM'
  },
  {
    id: 'quiz-seed-5',
    topic: 'Apache Spark',
    question: 'Which operation causes a wide transformation and triggers a data shuffle across the cluster?',
    selectedAnswer: 'groupByKey() / reduceByKey()',
    correctAnswer: 'groupByKey() / reduceByKey()',
    isCorrect: true,
    explanation: 'Wide transformations require data from multiple partitions across worker nodes to be reorganized, triggering a cluster shuffle.',
    timestamp: '2026-10-18 10:12 AM'
  },
  {
    id: 'quiz-seed-6',
    topic: 'Kafka',
    question: 'In Kafka, which mechanism guarantees in-order message processing within a topic?',
    selectedAnswer: 'Assigning related messages to the same partition key',
    correctAnswer: 'Assigning related messages to the same partition key',
    isCorrect: true,
    explanation: 'Kafka strictly guarantees message ordering per partition. Messages sharing the same key are hashed into the same partition.',
    timestamp: '2026-10-18 11:05 AM'
  },
  {
    id: 'quiz-seed-7',
    topic: 'Data Modeling',
    question: 'In a dimensional model, what type of table stores quantitative measurements, metrics, and foreign keys?',
    selectedAnswer: 'Dimension table',
    correctAnswer: 'Fact table',
    isCorrect: false,
    explanation: 'Fact tables store numerical business metrics (sales amount, quantity, clicks) surrounded by dimension foreign keys.',
    timestamp: '2026-10-18 11:45 AM'
  }
];

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    // Seed initial data if first visit
    if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(SEED_CHATS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(SEED_QUIZZES));
    }
  }

  // --- API Key & Settings ---
  getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  }

  setApiKey(key) {
    if (!key) {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    }
  }

  getModel() {
    return localStorage.getItem(STORAGE_KEYS.MODEL) || 'gemini-1.5-flash';
  }

  setModel(model) {
    localStorage.setItem(STORAGE_KEYS.MODEL, model);
  }

  // --- Chats ---
  getChats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS)) || [];
    } catch {
      return [];
    }
  }

  saveChat(question, answer, mode = 'Beginner Mode') {
    const chats = this.getChats();
    const newChat = {
      id: 'chat-' + Date.now(),
      question,
      answer,
      mode,
      timestamp: new Date().toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    chats.unshift(newChat);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    return newChat;
  }

  clearChats() {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify([]));
  }

  // --- Quizzes ---
  getQuizzes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES)) || [];
    } catch {
      return [];
    }
  }

  saveQuizResult({ topic, question, selectedAnswer, correctAnswer, isCorrect, explanation }) {
    const quizzes = this.getQuizzes();
    const newQuiz = {
      id: 'quiz-' + Date.now(),
      topic: topic || 'General Data Engineering',
      question,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      explanation,
      timestamp: new Date().toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    quizzes.unshift(newQuiz);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    return newQuiz;
  }

  getQuizSummary() {
    const quizzes = this.getQuizzes();
    const total = quizzes.length;
    const correct = quizzes.filter(q => q.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, accuracy };
  }

  getTopicPerformance() {
    const quizzes = this.getQuizzes();
    const map = {};

    quizzes.forEach(q => {
      const t = (q.topic || 'General').trim();
      if (!map[t]) {
        map[t] = { total: 0, correct: 0 };
      }
      map[t].total += 1;
      if (q.isCorrect) map[t].correct += 1;
    });

    return Object.entries(map).map(([topic, stats]) => ({
      topic,
      total: stats.total,
      correct: stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100)
    })).sort((a, b) => b.total - a.total);
  }

  clearQuizzes() {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([]));
  }

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    localStorage.removeItem(STORAGE_KEYS.QUIZZES);
    this.init();
  }

  exportJSON() {
    const data = {
      exportDate: new Date().toISOString(),
      chats: this.getChats(),
      quizzes: this.getQuizzes(),
      stats: this.getQuizSummary()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `databuddy-ai-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportCSV() {
    const quizzes = this.getQuizzes();
    if (!quizzes.length) return;
    
    let csv = 'ID,Topic,Question,SelectedAnswer,CorrectAnswer,IsCorrect,Timestamp\n';
    quizzes.forEach(q => {
      const clean = (str) => `"${(str || '').replace(/"/g, '""')}"`;
      csv += `${q.id},${clean(q.topic)},${clean(q.question)},${clean(q.selectedAnswer)},${clean(q.correctAnswer)},${q.isCorrect},${clean(q.timestamp)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `databuddy-quizzes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.storageService = new StorageService();
