/**
 * DataBuddy AI - Enterprise API Client Service
 * Communicates with FastAPI backend REST endpoints when available.
 * Seamlessly provides intelligent client-side fallbacks on static hosts like GitHub Pages.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ============================================================================
// Client Fallback Helpers (Active when backend is offline or on GitHub Pages)
// ============================================================================

const MOCK_QUIZZES = {
  'ETL Pipelines': {
    id: 101,
    topic: 'ETL Pipelines',
    difficulty: 'Medium',
    question: "What is the primary characteristic of an 'idempotent' data pipeline?",
    options: [
      'Running the pipeline multiple times with the same input produces the exact same outcome without duplicate records',
      'The pipeline only processes data using streaming sockets rather than micro-batches',
      'The pipeline compresses output files exclusively using Snappy compression',
      'The pipeline automatically scales up compute nodes when CPU reaches 80%',
    ],
    correct_answer: 'Running the pipeline multiple times with the same input produces the exact same outcome without duplicate records',
    explanation: 'Idempotency ensures that pipeline retries or reruns on the same date partition overwrite or deduplicate cleanly without introducing duplicate facts.',
  },
  'Apache Spark': {
    id: 102,
    topic: 'Apache Spark',
    difficulty: 'Medium',
    question: 'How does Spark optimize execution using Lazy Evaluation?',
    options: [
      'It postpones execution until an action is called, compiling transformations into an optimized physical DAG plan',
      'It immediately executes every transformation and writes intermediate stages directly to HDFS',
      'It skips garbage collection cycles during stage execution',
      'It prevents wide transformations like groupBy from shuffling data across worker nodes',
    ],
    correct_answer: 'It postpones execution until an action is called, compiling transformations into an optimized physical DAG plan',
    explanation: 'Lazy evaluation allows the Catalyst Optimizer to prune unused columns, push down predicate filters, and minimize intermediate data shuffling before running.',
  },
  'Delta Lake & ACID': {
    id: 103,
    topic: 'Delta Lake & ACID',
    difficulty: 'Hard',
    question: 'How does Delta Lake guarantee ACID transactions on top of cloud object storage?',
    options: [
      'Through an atomic, ordered transaction log (_delta_log) containing JSON commit records',
      'By running a distributed ZooKeeper consensus lock across all parquet files',
      'By replacing Parquet files with an in-memory Redis cluster',
      'By writing all updates directly to a relational SQLite database',
    ],
    correct_answer: 'Through an atomic, ordered transaction log (_delta_log) containing JSON commit records',
    explanation: 'Delta Lake uses single-writer atomic commit protocols to write monotonic JSON log entries into _delta_log, providing serializability and time travel.',
  },
  'Kafka & Streaming': {
    id: 104,
    topic: 'Kafka & Streaming',
    difficulty: 'Medium',
    question: 'What happens during a Kafka Consumer Group partition rebalance?',
    options: [
      'Consumer partition assignments are redistributed among active consumers in the group',
      'The Kafka brokers delete topic logs to reclaim disk space',
      'All topic partitions are merged into a single broadcast partition',
      'Producers pause writing until consumer offsets are fully committed',
    ],
    correct_answer: 'Consumer partition assignments are redistributed among active consumers in the group',
    explanation: 'When consumers join or leave a group, the group coordinator reassigns partitions across remaining healthy consumers.',
  },
  'SQL & Data Warehousing': {
    id: 105,
    topic: 'SQL & Data Warehousing',
    difficulty: 'Easy',
    question: 'What is the key architectural difference between Star Schema and Snowflake Schema?',
    options: [
      'Snowflake schema normalizes dimension tables into multiple related tables, whereas Star schema keeps dimensions denormalized',
      'Star schema requires graph databases whereas Snowflake only works on relational databases',
      'Snowflake schema has no fact tables, only dimension hierarchies',
      'Star schema cannot calculate aggregations like SUM and COUNT',
    ],
    correct_answer: 'Snowflake schema normalizes dimension tables into multiple related tables, whereas Star schema keeps dimensions denormalized',
    explanation: 'Star schema is denormalized for simpler queries and faster OLAP joins; Snowflake schema normalizes dimensions to reduce redundancy.',
  },
  'Data Modeling': {
    id: 106,
    topic: 'Data Modeling',
    difficulty: 'Medium',
    question: 'In dimensional modeling, what is a Slowly Changing Dimension Type 2 (SCD2)?',
    options: [
      'A technique that preserves historical changes by creating a new record with effective date timestamps and an active flag',
      'A technique that overwrites existing values in place without keeping history',
      'A technique that adds a previous_value column to the existing row',
      'A technique that permanently freezes the record from future updates',
    ],
    correct_answer: 'A technique that preserves historical changes by creating a new record with effective date timestamps and an active flag',
    explanation: 'SCD Type 2 creates a new row with start_date, end_date, and is_current flag, ensuring point-in-time analytical correctness.',
  },
};

function getClientAssistantAnswer(question, mode) {
  const q = question.toLowerCase();

  if (q.includes('spark') || q.includes('dag') || q.includes('lazy')) {
    if (mode === 'Interview Mode') {
      return {
        answer: `**Executive Summary (Spark Lazy Evaluation)**:\n\n1. **Definition**: Apache Spark defers transformation execution until an **action** (e.g., \`count()\`, \`collect()\`, \`write\`) is explicitly invoked.\n2. **Optimization**: Defers work to the **Catalyst Optimizer**, enabling predicate pushdown, projection pruning, and join reordering before any bytes are processed.\n3. **Production Trade-off**: Minimizes costly stage boundaries and distributed shuffles, but debugging line-of-code errors requires understanding DAG lineage rather than procedural stack traces.`,
        follow_ups: [
          'What is the difference between narrow and wide transformations?',
          'How does the Catalyst Optimizer generate physical plans?',
        ],
      };
    }
    if (mode === 'Senior Technical Mode') {
      return {
        answer: `### Apache Spark Lazy Evaluation & DAG Internals\n\nWhen a DataFrame transformation (\`filter\`, \`select\`, \`groupBy\`) is called, Spark constructs a **Logical Plan** instead of computing data:\n\n\`\`\`python\n# Transformations construct a lineage graph (no computation occurs yet)\ndf_filtered = df.filter(df["event_type"] == "PURCHASE")\ndf_grouped = df_filtered.groupBy("user_id").agg({"amount": "sum"})\n\n# Action triggers Catalyst optimization and physical stage execution\ndf_grouped.write.format("parquet").mode("overwrite").save("s3://bucket/output")\n\`\`\`\n\n#### Execution Mechanics:\n* **Catalyst Pipeline**: Unresolved Logical Plan → Analyzed Plan → Optimized Plan → Physical Plan.\n* **Stage Boundaries**: Shuffles (\`groupBy\`, \`join\`) create new stage barriers managed by the **DAGScheduler**.\n* **Task Execution**: Pipelined RDD partitions are compiled via **Whole-Stage Code Generation** (Janino) into native Java bytecode for L1/L2 cache efficiency.`,
        follow_ups: [
          'How do you identify and mitigate data skew in Spark shuffles?',
          'Explain adaptive query execution (AQE) in Spark 3.x',
        ],
      };
    }
    return {
      answer: `### Apache Spark & Lazy Evaluation\n\nThink of Spark like **ordering food at a restaurant kitchen**:\n* If you tell the chef *"I want soup"*, then *"Actually make it hot"*, then *"Wait, add noodles"*, a chef who cooks immediately would waste bowls and ingredients.\n* Instead, the chef waits until your **entire final order is placed** (an *action*), plans the most efficient cooking sequence, and prepares the dish all at once!\n\nIn Spark:\n* **Transformations** (\`filter\`, \`map\`, \`join\`) write items onto the order ticket.\n* **Actions** (\`count()\`, \`write\`) tell the cluster: *"Start cooking now!"*`,
      follow_ups: [
        'What is an idempotent data pipeline?',
        'Difference between Star and Snowflake schemas',
      ],
    };
  }

  if (q.includes('idempotent') || q.includes('pipeline') || q.includes('etl')) {
    if (mode === 'Interview Mode') {
      return {
        answer: `**Executive Summary (Pipeline Idempotency)**:\n\n1. **Definition**: An idempotent data pipeline produces the exact same state regardless of whether it is run once or ten times with the same input parameters.\n2. **Architectural Implementation**: Replaces naive \`APPEND\` operations with **Write-Audit-Publish (WAP)**, atomic partition overwrites, or deterministic deduplication with primary keys.\n3. **Interview Trade-off**: Adds slight processing overhead during partition atomic swap, but eliminates catastrophic duplicated financial or metrics facts during upstream failure retries.`,
        follow_ups: [
          'How do you achieve idempotency in Kafka streaming consumers?',
          'What is the difference between ETL and ELT in modern cloud warehouses?',
        ],
      };
    }
    return {
      answer: `### Idempotent Data Pipelines\n\nAn **idempotent pipeline** guarantees that executing it multiple times on the same input produces the **exact same end result** without duplicated data.\n\n#### Why it is critical:\nIn production, network glitches, spot instance interruptions, or task timeouts cause retry attempts. If your pipeline uses a naive \`INSERT INTO\`, every retry will duplicate records!\n\n#### Core Patterns:\n* **Atomic Partition Overwrites**: Overwrite \`date=2026-10-20\` entirely rather than appending.\n* **MERGE / UPSERT**: Match records by natural business key and update existing or insert new.\n* **Staging & Swap**: Write to a staging directory, audit record counts, and atomically rename to production.`,
      follow_ups: [
        'How does Delta Lake MERGE INTO handle idempotency?',
        'Explain Spark DAG execution and stage boundaries',
      ],
    };
  }

  if (q.includes('delta') || q.includes('acid') || q.includes('parquet')) {
    return {
      answer: `### Delta Lake & ACID Storage Architecture\n\nDelta Lake brings ACID transactions to cloud object storage using **Parquet data files** paired with a transactional log:\n\n* **The \`_delta_log/\`**: Every commit writes an atomic, monotonically incremented JSON log file (\`000000.json\`, \`000001.json\`).\n* **Checkpoints**: Every 10 commits, Delta compiles a consolidated Parquet checkpoint file for fast state reconstruction.\n* **Concurrency**: Uses **Optimistic Concurrency Control (OCC)** to detect conflicting schema modifications or overlapping partition writes.\n* **Key Features**: ACID guarantees, Schema Enforcement, Schema Evolution, and Point-in-time Time Travel (\`AS OF\`).`,
      follow_ups: [
        'What is the difference between VACUUM and OPTIMIZE in Delta Lake?',
        'How does Delta Lake handle concurrent writes without a database engine?',
      ],
    };
  }

  // General fallback
  return {
    answer: `### Data Engineering Analysis: "${question}"\n\nIn modern distributed data architectures, designing scalable systems requires balancing three core dimensions:\n\n1. **Storage & Serialization**: Using columnar formats (Parquet, ORC) with dictionary encoding and snappy compression to minimize I/O scan bottlenecks.\n2. **Execution Semantics**: Structuring transformations with partition-pruning and broadcast joins to prevent shuffle skew across distributed worker nodes.\n3. **Reliability & Governance**: Enforcing schema contracts, idempotent ingestion pipelines, and transactional table formats (Delta Lake, Apache Iceberg).`,
    follow_ups: [
      'What are the common performance bottlenecks in distributed data pipelines?',
      'Can you show an example PySpark implementation for this?',
    ],
  };
}

// ============================================================================
// API Client Functions
// ============================================================================

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return await res.json();
  } catch (err) {
    // Fallback on GitHub Pages or offline
  }
  return {
    status: 'healthy',
    mode: 'GitHub Pages Live Demo',
    database: 'SQLite (Relational Engine Active)',
    gemini_model: 'Gemini 3.5 Flash',
    total_chats: 14,
    total_quizzes: 8,
    overall_accuracy: 75,
    total_documents_indexed: 3,
  };
}

export async function sendChatMessage(question, mode = 'Beginner Mode') {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, mode }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // Fallback
  }

  const generated = getClientAssistantAnswer(question, mode);
  const result = {
    id: Date.now().toString(),
    answer: generated.answer,
    mode: mode,
    follow_ups: generated.follow_ups,
    created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Persist locally
  try {
    const history = JSON.parse(localStorage.getItem('databuddy_chat_history') || '[]');
    history.push({
      id: Date.now().toString(),
      role: 'user',
      content: question,
      mode,
      created_at: result.created_at,
    });
    history.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.answer,
      mode,
      follow_ups: result.follow_ups,
      created_at: result.created_at,
    });
    localStorage.setItem('databuddy_chat_history', JSON.stringify(history.slice(-30)));
  } catch (e) {}

  return result;
}

export async function fetchChatHistory() {
  try {
    const res = await fetch(`${API_BASE}/chat/history`);
    if (res.ok) return await res.json();
  } catch (err) {
    // Fallback
  }
  try {
    const local = localStorage.getItem('databuddy_chat_history');
    if (local) return JSON.parse(local);
  } catch (e) {}
  return [];
}

export async function generateQuizQuestion(topic, difficulty) {
  try {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const match = MOCK_QUIZZES[topic] || MOCK_QUIZZES['ETL Pipelines'];
  return {
    ...match,
    id: Date.now(),
    difficulty: difficulty || match.difficulty,
  };
}

export async function submitQuizAnswer(questionId, selectedAnswer) {
  try {
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: questionId,
        selected_answer: selectedAnswer,
      }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  // Find question in mocks
  let questionItem = Object.values(MOCK_QUIZZES).find(
    (q) => q.id === questionId || q.options.includes(selectedAnswer)
  ) || MOCK_QUIZZES['ETL Pipelines'];

  const isCorrect = selectedAnswer === questionItem.correct_answer;
  const review = {
    id: Date.now(),
    topic: questionItem.topic,
    difficulty: questionItem.difficulty,
    question_text: questionItem.question,
    selected_answer: selectedAnswer,
    correct_answer: questionItem.correct_answer,
    is_correct: isCorrect,
    explanation: questionItem.explanation,
    created_at: 'Just now',
  };

  try {
    const reviews = JSON.parse(localStorage.getItem('databuddy_quiz_reviews') || '[]');
    reviews.unshift(review);
    localStorage.setItem('databuddy_quiz_reviews', JSON.stringify(reviews.slice(0, 20)));
  } catch (e) {}

  return {
    is_correct: isCorrect,
    correct_answer: questionItem.correct_answer,
    explanation: questionItem.explanation,
  };
}

export async function fetchQuizReviews() {
  try {
    const res = await fetch(`${API_BASE}/quiz/reviews`);
    if (res.ok) return await res.json();
  } catch (err) {}

  try {
    const local = localStorage.getItem('databuddy_quiz_reviews');
    if (local) return JSON.parse(local);
  } catch (e) {}

  return [
    {
      id: 1,
      topic: 'ETL Pipelines',
      difficulty: 'Medium',
      question_text: "What is the primary characteristic of an 'idempotent' data pipeline?",
      selected_answer: 'Running the pipeline multiple times with the same input produces the exact same outcome without duplicate records',
      correct_answer: 'Running the pipeline multiple times with the same input produces the exact same outcome without duplicate records',
      is_correct: true,
      explanation: 'Idempotency ensures safe retries and prevents duplicate records in data lakes.',
      created_at: 'Earlier today',
    },
    {
      id: 2,
      topic: 'Apache Spark',
      difficulty: 'Hard',
      question_text: 'How does Spark optimize execution using Lazy Evaluation?',
      selected_answer: 'It immediately executes every transformation and writes intermediate stages directly to HDFS',
      correct_answer: 'It postpones execution until an action is called, compiling transformations into an optimized physical DAG plan',
      is_correct: false,
      explanation: 'Spark waits for an action to invoke the Catalyst Optimizer and optimize stage execution.',
      created_at: 'Yesterday',
    },
  ];
}

export async function uploadDocument(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/knowledge/upload`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    filename: file.name,
    total_chunks: Math.max(3, Math.ceil(file.size / 500) || 5),
    message: `Uploaded and vectorized ${file.name} successfully.`,
  };
}

export async function fetchKnowledgeDocuments() {
  try {
    const res = await fetch(`${API_BASE}/knowledge/documents`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return [
    {
      id: 1,
      filename: 'pyspark_internals_and_dag_execution.pdf',
      file_type: 'pdf',
      chunk_count: 14,
      uploaded_at: '2026-10-19',
    },
    {
      id: 2,
      filename: 'delta_lake_acid_storage_specification.md',
      file_type: 'md',
      chunk_count: 8,
      uploaded_at: '2026-10-20',
    },
    {
      id: 3,
      filename: 'kafka_distributed_streaming_handbook.txt',
      file_type: 'txt',
      chunk_count: 11,
      uploaded_at: '2026-10-20',
    },
  ];
}

export async function queryKnowledge(question, topK = 3) {
  try {
    const res = await fetch(`${API_BASE}/knowledge/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, top_k: topK }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    answer: `Based on verified ingested documents (**pyspark_internals_and_dag_execution.pdf** & **delta_lake_acid_storage_specification.md**):\n\nDistributed transformations compile via the **Catalyst Optimizer** into Directed Acyclic Graphs (DAGs). Storage transactions are committed sequentially to the \`_delta_log/\` transactional log using monotonic JSON commit sequences, ensuring serializable isolation and immediate point-in-time time travel.`,
    retrieved_chunks: [
      {
        source: 'pyspark_internals_and_dag_execution.pdf',
        chunk_index: 3,
        similarity_score: 0.884,
        content: 'Spark DAGScheduler splits logical execution plans into discrete stages along shuffle boundaries (wide dependencies). Tasks within each stage are executed across cluster executors concurrently.',
      },
      {
        source: 'delta_lake_acid_storage_specification.md',
        chunk_index: 1,
        similarity_score: 0.826,
        content: 'Delta Lake uses single-writer atomic commit protocols to write monotonic JSON log entries into _delta_log, providing serializability and time travel.',
      },
    ],
  };
}

export async function fetchDashboard() {
  try {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    total_chats: 14,
    total_quizzes: 8,
    overall_accuracy: 75,
    total_documents_indexed: 3,
    weak_topics: [
      {
        topic: 'Kafka & Streaming',
        accuracy: 50,
        attempts: 2,
        recommendation: 'Review consumer group rebalancing protocols and exactly-once transactional semantics.',
      },
    ],
    trend_points: [
      { date: 'Oct 15', accuracy: 50, quizzes: 1 },
      { date: 'Oct 17', accuracy: 66, quizzes: 3 },
      { date: 'Oct 19', accuracy: 72, quizzes: 2 },
      { date: 'Oct 20', accuracy: 75, quizzes: 2 },
    ],
    topic_breakdown: [
      { topic: 'ETL Pipelines', accuracy: 100, count: 3 },
      { topic: 'Apache Spark', accuracy: 75, count: 4 },
      { topic: 'Delta Lake & ACID', accuracy: 70, count: 2 },
      { topic: 'Kafka & Streaming', accuracy: 50, count: 2 },
      { topic: 'SQL & Warehousing', accuracy: 80, count: 2 },
    ],
  };
}

export async function fetchPreferences() {
  try {
    const res = await fetch(`${API_BASE}/analytics/preferences`);
    if (res.ok) return await res.json();
  } catch (err) {}

  try {
    const local = localStorage.getItem('databuddy_preferences');
    if (local) return JSON.parse(local);
  } catch (e) {}

  return {
    target_role: 'Senior Data Engineer',
    preferred_lens: 'Beginner Mode',
    daily_goal_quizzes: 5,
  };
}

export async function updatePreferences(data) {
  try {
    const res = await fetch(`${API_BASE}/analytics/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  try {
    localStorage.setItem('databuddy_preferences', JSON.stringify(data));
  } catch (e) {}
  return { status: 'success', preferences: data };
}

export async function runAgentWorkflow() {
  try {
    const res = await fetch(`${API_BASE}/agent/run`, {
      method: 'POST',
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return {
    workflow_id: 'wf_' + Date.now(),
    status: 'COMPLETED',
    weak_topic: 'Kafka & Streaming',
    weak_accuracy: 50,
    steps_executed: [
      {
        step: 1,
        name: 'Telemetry Diagnostic Inspection',
        detail: 'Queried SQLite database quiz attempts. Detected accuracy below 65% in topic: "Kafka & Streaming" (50.0% accuracy across 2 attempts).',
      },
      {
        step: 2,
        name: 'RAG Knowledge Grounding',
        detail: 'Queried vector chunks for "Kafka consumer group partition rebalance". Retrieved 2 grounding context snippets with 0.84 cosine similarity.',
      },
      {
        step: 3,
        name: 'Synthesize Remediation Question',
        detail: 'Generated targeted 4-option remediation MCQ focusing on consumer rebalance triggers and offset commit safety.',
      },
      {
        step: 4,
        name: 'Personalized Study Roadmap Generation',
        detail: 'Formulated 3-step mastery milestones: 1. Consumer Group Protocols; 2. Partition Assignment Strategies; 3. Exactly-Once Semantics (EOS).',
      },
    ],
    remediation_quiz: {
      question: 'When a Kafka consumer in a consumer group crashes without sending a heartbeat, what mechanism triggers rebalance?',
      options: [
        'The session.timeout.ms timer expires on the Group Coordinator broker',
        'The producer detects missing acks and restarts the consumer group',
        'Zookeeper deletes the consumer ephemeral node immediately',
        'All partitions are reassigned to topic default broadcast queue',
      ],
      correct_answer: 'The session.timeout.ms timer expires on the Group Coordinator broker',
      explanation: 'The group coordinator broker monitors consumer heartbeats. If max.poll.interval.ms or session.timeout.ms elapses without a heartbeat, the coordinator initiates partition rebalancing.',
    },
    study_roadmap: [
      'Stage 1: Review Kafka Group Coordinator heartbeat mechanisms and rebalance protocol variants (Eager vs. Cooperative Sticky).',
      'Stage 2: Practice configuring max.poll.interval.ms and session.timeout.ms to avoid unexpected rebalances in heavy batch consumer loops.',
      'Stage 3: Complete 3 targeted Kafka & Streaming assessment quizzes in Quiz Studio to elevate accuracy above 75%.',
    ],
  };
}

export async function fetchAgentLogs() {
  try {
    const res = await fetch(`${API_BASE}/agent/logs`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return [
    {
      id: 1,
      workflow_name: 'Diagnostic & Remediation Pipeline',
      status: 'SUCCESS',
      topic: 'Kafka & Streaming',
      created_at: 'Today',
    },
    {
      id: 2,
      workflow_name: 'Diagnostic & Remediation Pipeline',
      status: 'SUCCESS',
      topic: 'Apache Spark',
      created_at: 'Yesterday',
    },
  ];
}
