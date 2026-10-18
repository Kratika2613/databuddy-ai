/**
 * RagService - Client-side Retrieval-Augmented Generation (RAG)
 * Performs document parsing (TXT, MD, PDF), chunking,
 * TF-IDF unigram+bigram vectorization, and Cosine Similarity ranking in pure JavaScript.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d',
  'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more',
  'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);

class RagService {
  constructor() {
    this.currentDocument = null; // { name, text, chunks: [] }
  }

  /**
   * Splits raw text into overlapping character chunks
   */
  splitIntoChunks(text, chunkSize = 800, overlap = 150) {
    if (!text || !text.trim()) return [];

    const cleanText = text.replace(/\s+/g, ' ').trim();
    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
      let end = start + chunkSize;
      let chunk = cleanText.substring(start, end).trim();

      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      if (end >= cleanText.length) {
        break;
      }

      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Tokenizes text into lowercase tokens + bigrams, filtering out punctuation and stop words
   */
  tokenize(text) {
    const rawTokens = (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));

    const tokens = [...rawTokens];

    // Add bigrams to capture compound DE terms (e.g., 'delta lake', 'acid transactions', 'star schema')
    for (let i = 0; i < rawTokens.length - 1; i++) {
      tokens.push(`${rawTokens[i]}_${rawTokens[i + 1]}`);
    }

    return tokens;
  }

  /**
   * Computes TF-IDF vectors and finds top_k most similar chunks using Cosine Similarity
   */
  findRelevantChunks(question, chunks, topK = 3) {
    if (!question || !chunks || chunks.length === 0) return [];

    const docTokens = chunks.map(chunk => this.tokenize(chunk));
    const queryTokens = this.tokenize(question);

    if (queryTokens.length === 0) {
      return chunks.slice(0, topK).map(chunk => ({ chunk, score: 0.5 }));
    }

    // Build vocabulary
    const vocab = new Set();
    queryTokens.forEach(t => vocab.add(t));
    docTokens.forEach(tokens => tokens.forEach(t => vocab.add(t)));
    const vocabArray = Array.from(vocab);
    const vocabIndex = new Map(vocabArray.map((term, i) => [term, i]));

    const N = chunks.length;

    // Document frequencies (DF) for IDF calculation
    const df = new Array(vocabArray.length).fill(0);
    vocabArray.forEach((term, idx) => {
      let count = 0;
      docTokens.forEach(tokens => {
        if (tokens.includes(term)) count++;
      });
      df[idx] = count;
    });

    // Compute IDF
    const idf = df.map(count => Math.log((N + 1) / (count + 1)) + 1);

    // Vectorize query
    const queryVec = new Array(vocabArray.length).fill(0);
    queryTokens.forEach(term => {
      const idx = vocabIndex.get(term);
      if (idx !== undefined) queryVec[idx] += 1;
    });

    // Apply IDF to query
    let queryNorm = 0;
    for (let i = 0; i < queryVec.length; i++) {
      queryVec[i] *= idf[i];
      queryNorm += queryVec[i] * queryVec[i];
    }
    queryNorm = Math.sqrt(queryNorm) || 1e-9;

    // Vectorize and calculate cosine similarity for each chunk
    const scoredChunks = chunks.map((chunk, docIdx) => {
      const tokens = docTokens[docIdx];
      const chunkVec = new Array(vocabArray.length).fill(0);

      tokens.forEach(term => {
        const idx = vocabIndex.get(term);
        if (idx !== undefined) chunkVec[idx] += 1;
      });

      let dotProduct = 0;
      let chunkNorm = 0;

      for (let i = 0; i < chunkVec.length; i++) {
        if (chunkVec[i] > 0) {
          chunkVec[i] *= idf[i];
          chunkNorm += chunkVec[i] * chunkVec[i];
          dotProduct += chunkVec[i] * queryVec[i];
        }
      }

      chunkNorm = Math.sqrt(chunkNorm) || 1e-9;
      const cosineSimilarity = dotProduct / (chunkNorm * queryNorm);

      return {
        chunk,
        score: Math.max(0, Math.min(1, cosineSimilarity)),
        chunkIndex: docIdx + 1
      };
    });

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK);
  }

  /**
   * Reads plain text from a File object
   */
  async readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Reads PDF content using client-side PDF.js
   */
  async readPdfFile(file) {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library is not loaded. Please verify internet connection.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  }

  /**
   * Processes an uploaded file and initializes RAG state
   */
  async processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    let text = '';

    if (ext === 'pdf') {
      text = await this.readPdfFile(file);
    } else if (['txt', 'md', 'csv', 'json', 'sql'].includes(ext)) {
      text = await this.readTextFile(file);
    } else {
      throw new Error(`Unsupported file type: .${ext}. Please upload a .txt, .md, or .pdf file.`);
    }

    if (!text.trim()) {
      throw new Error('No readable text found in this file.');
    }

    const chunks = this.splitIntoChunks(text);
    this.currentDocument = {
      name: file.name,
      size: file.size,
      text,
      chunks
    };

    return this.currentDocument;
  }

  /**
   * Loads sample built-in Data Engineering notes
   */
  loadSampleNotes() {
    const sampleText = `ETL Architecture and Modern Lakehouse Principles
=====================================================

1. Fundamentals of ETL vs ELT
Extract, Transform, and Load (ETL) is the traditional data pipeline paradigm where data is processed prior to destination storage.
In Modern Cloud Data Warehouses (Snowflake, BigQuery, Databricks), ELT has become the standard. ELT extracts raw data and loads it directly into object storage (Bronze layer) before running scalable in-database transformations (Silver and Gold layers) using tools like dbt and Apache Spark.

2. Delta Lake & ACID Transactions
Delta Lake is an open-source storage framework that brings ACID transactions to Apache Parquet files on cloud storage.
- Storage: Data files are stored as immutable Snappy-compressed Parquet files.
- Transaction Log (_delta_log): Every transaction is recorded as an atomic JSON commit log. Every 10 commits, Delta writes a Parquet checkpoint file to optimize read performance.
- Features: Time Travel allows querying previous table snapshots (VERSION AS OF or TIMESTAMP AS OF). Schema Enforcement prevents corrupted records, and Schema Evolution allows backward-compatible changes.

3. Change Data Capture (CDC) Patterns
CDC tracks row-level changes (INSERT, UPDATE, DELETE) occurring in transactional databases like PostgreSQL, MySQL, and Oracle.
- Log-based CDC (using Debezium and Kafka Connect) reads database WAL (Write-Ahead Logs) or binary logs without putting query overhead on production OLTP databases.
- Upserting with Merge: Downstream lakehouses use the MERGE INTO SQL statement on unique primary keys to apply updates and deletes with minimal re-writing.

4. Medallion Architecture (Bronze -> Silver -> Gold)
- Bronze: Raw append-only ingestion layer. Retains full fidelity and historical lineage.
- Silver: Cleaned, deduplicated, enriched, and validated data. Normalized or conformed.
- Gold: Aggregated business-level metrics, dimensional models (star schemas), and feature stores ready for BI dashboards and machine learning models.`;

    const chunks = this.splitIntoChunks(sampleText);
    this.currentDocument = {
      name: 'etl_architecture_guide.txt',
      size: sampleText.length,
      text: sampleText,
      chunks
    };

    return this.currentDocument;
  }
}

window.ragService = new RagService();
