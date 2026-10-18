/**
 * AiService - Handles Google Gemini API calls client-side
 * Supports live Gemini 1.5/2.5 Flash models via REST API with fallback to
 * domain-rich mock generators for instant zero-config testing on GitHub Pages.
 */

class AiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  getModeInstructions(mode) {
    if (mode === 'Beginner Mode') {
      return `Explain in simple, encouraging English for a complete beginner.
Use short paragraphs and include one clear real-life analogy (e.g., comparing data pipelines to a water purification plant, kitchen, or library).
Avoid overwhelming jargon and explain any technical term introduced.`;
    }

    if (mode === 'Interview Mode') {
      return `Provide an executive, interview-ready answer formatted for technical interviews.
Keep it concise (between 4 and 7 lines).
Include:
1. Core formal definition.
2. Key architectural trade-off or advantage.
3. One real-world enterprise example or common interview trap.`;
    }

    return `Provide an exhaustive technical explanation suitable for Senior Data Engineers.
Include:
1. Architectural principles and internal mechanics.
2. Step-by-step pipeline execution flow.
3. Code snippet (SQL, Python, or PySpark) or configuration pattern.
4. Edge cases, performance bottlenecks, and best practices.`;
  }

  /**
   * Calls Google Gemini REST API or falls back to intelligent domain responses
   */
  async askGemini(prompt, systemInstruction = '') {
    const apiKey = window.storageService.getApiKey();
    const model = window.storageService.getModel() || 'gemini-1.5-flash';

    if (!apiKey) {
      // Offline / Demo mode simulation
      await new Promise(r => setTimeout(r, 650));
      return this.generateSimulatedAnswer(prompt);
    }

    const endpoint = `${this.baseUrl}/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: (systemInstruction ? systemInstruction + '\n\n' : '') + prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2048
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || response.statusText;

        if (status === 400 && msg.includes('API_KEY_INVALID')) {
          throw new Error('Invalid Gemini API Key. Please verify your key in Settings.');
        }
        if (status === 429) {
          throw new Error('Gemini API quota exceeded (Rate Limit). Please wait a moment or try again later.');
        }
        if (status === 503) {
          throw new Error('Gemini service is temporarily unavailable. Please retry in a few seconds.');
        }
        throw new Error(`Gemini API error (${status}): ${msg}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini returned an empty response. Please try rephrasing your question.');
      }

      return text;
    } catch (err) {
      console.warn('API call failed, falling back to simulated response if network error:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        return `⚠️ **Network connection error**: Unable to reach Google Gemini API directly. Please check your internet connection or verify CORS settings.\n\n*Here is a local reference summary for your question:*\n\n` + this.generateSimulatedAnswer(prompt);
      }
      throw err;
    }
  }

  /**
   * Generates response for general chat modes (Beginner, Interview, Technical)
   */
  async getAiAnswer(question, mode) {
    const modeInstructions = this.getModeInstructions(mode);
    const systemPrompt = `You are DataBuddy AI, an enterprise-grade learning assistant for Data Engineering.
Selected answer mode: ${mode}.
Follow these guidelines carefully:
${modeInstructions}
Important rules:
- Strictly answer the user's data engineering question.
- Do not make patronizing remarks.
- Format code and key terms in markdown.`;

    return await this.askGemini(question, systemPrompt);
  }

  /**
   * Generates structured quiz JSON
   */
  async generateQuiz(topic) {
    const prompt = `Create one high-quality, beginner-friendly multiple-choice question on the Data Engineering topic: "${topic}".
Return ONLY a valid JSON object with no markdown code fences, matching this structure exactly:
{
  "question": "Clear technical question here?",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correct_answer": "Option A",
  "explanation": "Clear, concise explanation why this option is correct and others are incorrect."
}

Rules:
- Exactly 4 realistic options.
- Only one unambiguous correct answer.
- "correct_answer" must exactly match one of the items in "options".
- Return raw JSON only.`;

    const apiKey = window.storageService.getApiKey();

    if (!apiKey) {
      await new Promise(r => setTimeout(r, 600));
      return this.generateSimulatedQuiz(topic);
    }

    try {
      let rawText = await this.askGemini(prompt);
      rawText = rawText.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      const parsed = JSON.parse(rawText);
      if (!parsed.question || !Array.isArray(parsed.options) || !parsed.correct_answer) {
        throw new Error('Malformed quiz response');
      }
      return parsed;
    } catch (err) {
      console.warn('Live quiz generation failed or returned invalid JSON. Using smart fallback quiz:', err);
      return this.generateSimulatedQuiz(topic);
    }
  }

  /**
   * Generates answer from RAG context
   */
  async answerFromNotes(question, retrievedChunks, filename) {
    const context = retrievedChunks.map((c, i) => `[Source Chunk ${i + 1} (Relevance: ${(c.score * 100).toFixed(0)}%)]:\n${c.chunk}`).join('\n\n');

    const prompt = `You are DataBuddy AI's RAG agent.
Answer the user's question using ONLY the provided reference chunks from the uploaded document: "${filename}".

Rules:
- Rely strictly on the facts present in the uploaded text.
- If the answer cannot be determined from the provided chunks, respond: "I could not find information regarding this in the uploaded document."
- Cite the relevant chunk numbers where applicable.
- Explain clearly and concisely.

Uploaded Document Name: ${filename}

Document Reference Chunks:
-------------------------
${context}
-------------------------

Student's Question:
${question}`;

    const apiKey = window.storageService.getApiKey();
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 600));
      return `### Answer from ${filename} (RAG Engine)\n\nBased on the uploaded document:\n\n${retrievedChunks[0]?.chunk || 'Relevant content extracted.'}\n\n*Synthesized from **${retrievedChunks.length}** semantic chunks with top match score of **${(retrievedChunks[0]?.score * 100).toFixed(0)}%**.*`;
    }

    return await this.askGemini(prompt);
  }

  /**
   * Domain-expert fallback responses for instant demo capability without API keys
   */
  generateSimulatedAnswer(question) {
    const q = (question || '').toLowerCase();

    if (q.includes('join') || q.includes('sql')) {
      return `### SQL Joins in Modern Data Pipelines\n\nSQL Joins allow you to combine records from two or more tables based on a related column:\n\n1. **INNER JOIN**: Returns only rows where the join condition evaluates to TRUE in both tables.\n2. **LEFT (OUTER) JOIN**: Preserves all rows from the left table and populates NULL values for unmatched right table columns.\n3. **FULL OUTER JOIN**: Returns all rows from both sides, matching where possible.\n4. **CROSS JOIN**: Computes the Cartesian Product ($M \\times N$ rows), useful for calendar tables or matrix generation.\n\n\`\`\`sql\n-- Efficient Broadcast Hash Join in PySpark / SQL\nSELECT /*+ BROADCAST(dim_customers) */\n  f.order_id,\n  f.order_amount,\n  c.customer_name\nFROM fact_orders f\nJOIN dim_customers c ON f.customer_id = c.customer_id;\n\`\`\`\n\n💡 **Optimization Tip**: In distributed systems like Spark, small dimension tables (<10MB) should be broadcast to avoid expensive cluster network shuffles.`;
    }

    if (q.includes('etl') || q.includes('elt')) {
      return `### ETL vs ELT: Architectural Comparison\n\n- **ETL (Extract, Transform, Load)**:\n  - Transformations occur in a dedicated staging engine before reaching storage.\n  - Best for legacy on-premises databases where compute is constrained.\n- **ELT (Extract, Load, Transform)**:\n  - Raw data is ingested straight into cloud storage (Data Lake/S3) or Lakehouses (Snowflake, Databricks, BigQuery).\n  - In-warehouse SQL engines and **dbt** perform transformations at scale.\n\n> 🎯 **Production Standard**: ELT is the enterprise standard because storage is cheap, raw audit history is never lost, and compute scales elastically on demand.`;
    }

    if (q.includes('delta') || q.includes('lakehouse') || q.includes('acid')) {
      return `### Delta Lake & ACID Architecture\n\nDelta Lake adds a transactional storage layer on top of Apache Parquet cloud object storage:\n\n1. **Atomic Commits**: Uses an immutable transaction log (\`_delta_log/\`) tracking JSON actions.\n2. **Time Travel**: Query historical versions: \`SELECT * FROM table VERSION AS OF 12\`.\n3. **Schema Enforcement**: Blocks rogue writes that don't match the schema definition.\n4. **Z-Ordering & Compaction**: Optimizes columnar file layouts to avoid the "small files problem".`;
    }

    return `### Data Engineering Concept Overview\n\nRegarding: **${question}**\n\nIn modern data platform engineering, this concept is central to building reliable, scalable, and observable pipelines:\n\n- **Core Value**: Enables high throughput, deterministic processing, and fault tolerance across distributed storage and compute engines.\n- **Modern Stack Tools**: Frequently implemented via **Apache Spark**, **Kafka**, **Airflow**, **dbt**, and cloud data warehouses like **Snowflake** or **Databricks**.\n- **Enterprise Best Practice**: Ensure idempotency (safe to rerun without duplicate data) and implement comprehensive data quality assertions (e.g. Great Expectations or dbt tests).`;
  }

  generateSimulatedQuiz(topic) {
    const t = (topic || '').toLowerCase();

    if (t.includes('spark')) {
      return {
        question: 'Which of the following Apache Spark operations does NOT trigger an action?',
        options: [
          'count()',
          'collect()',
          'select()',
          'take(10)'
        ],
        correct_answer: 'select()',
        explanation: 'select() is a narrow transformation that evaluates lazily. count(), collect(), and take() are actions that trigger DAG execution across the cluster.'
      };
    }

    if (t.includes('kafka') || t.includes('stream')) {
      return {
        question: 'What happens in Apache Kafka if a consumer crashes in a consumer group?',
        options: [
          'The topic is locked until the consumer reboots',
          'A partition rebalance occurs to reassign partitions to active consumers',
          'All unprocessed messages in the topic are lost',
          'The broker assigns messages randomly to any random client'
        ],
        correct_answer: 'A partition rebalance occurs to reassign partitions to active consumers',
        explanation: 'Kafka\'s group coordinator triggers a consumer group rebalance, reassigning the partitions previously held by the crashed consumer to healthy group members.'
      };
    }

    if (t.includes('dbt') || t.includes('model')) {
      return {
        question: 'In dbt (data build tool), what is the default materialization if none is specified?',
        options: [
          'table',
          'view',
          'incremental',
          'ephemeral'
        ],
        correct_answer: 'view',
        explanation: 'By default, dbt models are materialized as SQL views in the target database unless overridden with {{ config(materialized="table") }}.'
      };
    }

    return {
      question: `In Data Engineering, why is idempotency considered a critical requirement for ${topic || 'data pipelines'}?`,
      options: [
        'It makes queries run without needing any RAM',
        'It allows a pipeline to be safely re-run multiple times producing the exact same state without duplicates',
        'It automatically converts all CSV files into compressed Parquet files',
        'It forces all tables to be normalized into Third Normal Form'
      ],
      correct_answer: 'It allows a pipeline to be safely re-run multiple times producing the exact same state without duplicates',
      explanation: 'An idempotent pipeline guarantees that re-executing a failed or scheduled job with identical inputs leaves the database in the exact same state without generating duplicate records.'
    };
  }
}

window.aiService = new AiService();
