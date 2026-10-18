/**
 * Main Application Controller - DataBuddy AI Enterprise Edition
 * Controls navigation, view rendering, user interactions, audio synthesis, and event handlers.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mode Configurations
  const MODES = {
    beginner: {
      id: 'beginner',
      title: 'Beginner Mode',
      badge: 'Concept Foundations',
      description: 'Master core Data Engineering concepts in plain English with intuitive real-world analogies.',
      chips: [
        'What is an ETL pipeline?',
        'Explain SQL joins with simple examples',
        'Data Warehouse vs Data Lake',
        'What is Medallion Architecture?'
      ]
    },
    interview: {
      id: 'interview',
      title: 'Interview Mode',
      badge: 'Executive & Concise',
      description: 'Sharpen short, punchy 4-7 line answers, trade-offs, and pro-tips for senior DE interviews.',
      chips: [
        'Delta Lake vs Parquet format',
        'ETL vs ELT trade-offs',
        'Star Schema vs Snowflake Schema',
        'Log-based CDC vs Query-based CDC'
      ]
    },
    technical: {
      id: 'technical',
      title: 'Technical Mode',
      badge: 'Deep Architecture',
      description: 'Deep dive into internal mechanics, ACID distributed locks, Spark shuffle optimizations, and code.',
      chips: [
        'Explain ACID transactions in Delta Lake',
        'How does TF-IDF RAG retrieval work?',
        'Apache Spark shuffle partitions tuning',
        'Kafka partition key hashing mechanics'
      ]
    },
    quiz: {
      id: 'quiz',
      title: 'AI Quiz Arena',
      badge: 'Interactive Assessment',
      description: 'Test your technical recall with AI-generated challenges, instant feedback, and streak tracking.',
      chips: ['SQL Joins', 'Apache Spark', 'Delta Lake', 'Kafka', 'dbt & Modeling', 'Python for DE']
    },
    notes: {
      id: 'notes',
      title: 'RAG Notes Lab',
      badge: 'Client-Side Semantic Search',
      description: 'Upload your TXT, Markdown, or PDF notes and query them using TF-IDF & Cosine Similarity.',
      chips: ['Summarize key topics', 'What are the main architecture layers?', 'Explain ACID from these notes']
    },
    history: {
      id: 'history',
      title: 'Audit & Learning History',
      badge: 'Activity Transcript',
      description: 'Review saved Q&A discussions, inspect quiz attempts, and export learning transcripts.',
      chips: []
    },
    dashboard: {
      id: 'dashboard',
      title: 'Executive Dashboard',
      badge: 'Performance Analytics',
      description: 'Track accuracy metrics, monitor topic mastery, and address identified weak areas.',
      chips: []
    }
  };

  let currentMode = 'beginner';
  let currentQuiz = null;
  let activeFilter = 'all';

  // Elements
  const activeModeTitleEl = document.getElementById('activeModeTitle');
  const activeModeBadgeEl = document.getElementById('activeModeBadge');
  const contentBodyEl = document.getElementById('contentBody');
  const sidebarEl = document.getElementById('sidebar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const modelSelectEl = document.getElementById('modelSelect');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const quickQuestionsCountEl = document.getElementById('quickQuestionsCount');
  const quickAccuracyEl = document.getElementById('quickAccuracy');

  // Initialize App
  function init() {
    setupEventListeners();
    loadSidebarStats();
    renderCurrentMode();
  }

  function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = item.getAttribute('data-mode');
        switchMode(mode);
        if (window.innerWidth <= 768) {
          sidebarEl.classList.remove('mobile-open');
        }
      });
    });

    // Mobile menu toggle
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebarEl.classList.toggle('mobile-open');
      });
    }

    // Model Selector
    if (modelSelectEl) {
      modelSelectEl.value = window.storageService.getModel();
      modelSelectEl.addEventListener('change', (e) => {
        window.storageService.setModel(e.target.value);
        showNotification(`Switched active model to ${e.target.value}`, 'success');
      });
    }

    // Settings Modal
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => {
        apiKeyInput.value = window.storageService.getApiKey();
        settingsModal.classList.add('open');
      });
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('open');
      });
    }

    if (saveApiKeyBtn) {
      saveApiKeyBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.trim();
        window.storageService.setApiKey(val);
        settingsModal.classList.remove('open');
        showNotification(val ? 'Gemini API Key securely saved!' : 'Switched to offline Demo Mode', 'success');
      });
    }

    // Keyboard Shortcuts (1 to 7)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const keyMap = {
        '1': 'beginner',
        '2': 'interview',
        '3': 'technical',
        '4': 'quiz',
        '5': 'notes',
        '6': 'history',
        '7': 'dashboard'
      };
      if (keyMap[e.key]) {
        switchMode(keyMap[e.key]);
      }
    });
  }

  function loadSidebarStats() {
    const summary = window.storageService.getQuizSummary();
    const chats = window.storageService.getChats();
    if (quickQuestionsCountEl) quickQuestionsCountEl.textContent = chats.length;
    if (quickAccuracyEl) quickAccuracyEl.textContent = `${summary.accuracy}%`;
  }

  function switchMode(modeKey) {
    if (!MODES[modeKey]) return;
    currentMode = modeKey;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-mode') === modeKey);
    });

    // Update Topbar
    const config = MODES[modeKey];
    if (activeModeTitleEl) activeModeTitleEl.textContent = config.title;
    if (activeModeBadgeEl) activeModeBadgeEl.textContent = config.badge;

    renderCurrentMode();
  }

  function renderCurrentMode() {
    const config = MODES[currentMode];

    // Scroll to top
    contentBodyEl.scrollTop = 0;

    switch (currentMode) {
      case 'beginner':
      case 'interview':
      case 'technical':
        renderChatMode(config);
        break;
      case 'quiz':
        renderQuizMode(config);
        break;
      case 'notes':
        renderNotesMode(config);
        break;
      case 'history':
        renderHistoryMode(config);
        break;
      case 'dashboard':
        renderDashboardMode(config);
        break;
    }
  }

  // --- 1. CHAT MODES (Beginner, Interview, Technical) ---
  function renderChatMode(config) {
    const chats = window.storageService.getChats().filter(c => c.mode === config.title);

    contentBodyEl.innerHTML = `
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-tag">
            <span class="pulse-dot"></span>
            ${config.badge}
          </div>
          <h1 class="hero-title">${config.title}</h1>
          <p class="hero-subtitle">${config.description}</p>
        </div>
      </div>

      <div class="chips-tray">
        <span class="chip-label">Quick Prompts:</span>
        ${config.chips.map(chip => `
          <button class="prompt-chip" data-prompt="${chip}">
            <i data-lucide="sparkles" style="width:14px;height:14px;"></i>
            ${chip}
          </button>
        `).join('')}
      </div>

      <div class="chat-container">
        <div class="chat-messages" id="chatMessages">
          ${chats.length === 0 ? `
            <div class="feature-quick-grid">
              <div class="feature-pill-card" data-prompt="${config.chips[0]}">
                <div class="feature-pill-icon"><i data-lucide="book-open"></i></div>
                <div class="feature-pill-info">
                  <h4>${config.chips[0]}</h4>
                  <p>Click to generate an instant explanation tailored for ${config.title}.</p>
                </div>
              </div>
              <div class="feature-pill-card" data-prompt="${config.chips[1]}">
                <div class="feature-pill-icon"><i data-lucide="layers"></i></div>
                <div class="feature-pill-info">
                  <h4>${config.chips[1]}</h4>
                  <p>Explore real-world architecture principles and code demonstrations.</p>
                </div>
              </div>
              <div class="feature-pill-card" data-prompt="${config.chips[2]}">
                <div class="feature-pill-icon"><i data-lucide="database"></i></div>
                <div class="feature-pill-info">
                  <h4>${config.chips[2]}</h4>
                  <p>Learn trade-offs, performance nuances, and interview highlights.</p>
                </div>
              </div>
            </div>
          ` : chats.map(chat => renderChatBubble(chat)).join('')}
        </div>

        <div class="chat-input-sticky">
          <div class="input-box-wrapper">
            <input type="text" id="chatInput" placeholder="Ask DataBuddy a question in ${config.title}..." autocomplete="off">
            <button class="send-btn" id="sendBtn" title="Send Question">
              <i data-lucide="arrow-up" style="width: 20px; height: 20px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();

    // Attach Chat Handlers
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    function handleSend() {
      const q = chatInput.value.trim();
      if (!q) return;
      chatInput.value = '';
      executeChatQuery(q, config.title);
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    // Prompt Chips and Card Clicks
    contentBodyEl.querySelectorAll('[data-prompt]').forEach(el => {
      el.addEventListener('click', () => {
        const prompt = el.getAttribute('data-prompt');
        executeChatQuery(prompt, config.title);
      });
    });

    // Attach copy & audio buttons
    attachBubbleTools();
  }

  function renderChatBubble(chat) {
    const renderedAnswer = window.marked ? window.marked.parse(chat.answer) : chat.answer.replace(/\n/g, '<br>');
    return `
      <div class="chat-bubble user-bubble">
        <div class="bubble-avatar">You</div>
        <div class="bubble-body">
          <div class="bubble-meta">
            <span>Query</span>
            <span>${chat.timestamp || 'Just now'}</span>
          </div>
          <p>${escapeHtml(chat.question)}</p>
        </div>
      </div>

      <div class="chat-bubble bot-bubble">
        <div class="bubble-avatar"><i data-lucide="bot"></i></div>
        <div class="bubble-body">
          <div class="bubble-meta">
            <span>DataBuddy AI · ${chat.mode}</span>
            <span>${chat.timestamp || 'Just now'}</span>
          </div>
          <div class="markdown-content">${renderedAnswer}</div>
          <div class="bubble-tools">
            <button class="bubble-tool-btn copy-btn" data-text="${escapeHtml(chat.answer)}">
              <i data-lucide="copy" style="width:14px;height:14px;"></i> Copy
            </button>
            <button class="bubble-tool-btn speech-btn" data-text="${escapeHtml(chat.answer)}">
              <i data-lucide="volume-2" style="width:14px;height:14px;"></i> Read Aloud
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async function executeChatQuery(question, mode) {
    const chatMessagesEl = document.getElementById('chatMessages');
    if (!chatMessagesEl) return;

    // Append user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble';
    userBubble.innerHTML = `
      <div class="bubble-avatar">You</div>
      <div class="bubble-body">
        <div class="bubble-meta"><span>Query</span><span>Just now</span></div>
        <p>${escapeHtml(question)}</p>
      </div>
    `;
    chatMessagesEl.appendChild(userBubble);

    // Append loading bubble
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble bot-bubble';
    loadingBubble.innerHTML = `
      <div class="bubble-avatar"><i data-lucide="bot"></i></div>
      <div class="bubble-body">
        <div class="bubble-meta"><span>DataBuddy AI · Synthesizing...</span></div>
        <div style="display:flex;align-items:center;gap:8px;color:var(--text-muted);font-size:0.9rem;">
          <span class="pulse-dot"></span> Generating ${mode} response...
        </div>
      </div>
    `;
    chatMessagesEl.appendChild(loadingBubble);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    lucide.createIcons();

    try {
      const answer = await window.aiService.getAiAnswer(question, mode);
      const savedChat = window.storageService.saveChat(question, answer, mode);

      loadingBubble.remove();
      chatMessagesEl.insertAdjacentHTML('beforeend', renderChatBubble(savedChat));
      lucide.createIcons();
      attachBubbleTools();
      loadSidebarStats();
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    } catch (err) {
      loadingBubble.innerHTML = `
        <div class="bubble-avatar"><i data-lucide="alert-triangle" style="color:var(--danger)"></i></div>
        <div class="bubble-body" style="border-color:var(--danger-border);background:var(--danger-bg)">
          <div class="bubble-meta"><span style="color:var(--danger)">Error</span></div>
          <p style="color:#fca5a5;">${escapeHtml(err.message)}</p>
        </div>
      `;
      lucide.createIcons();
    }
  }

  function attachBubbleTools() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = () => {
        const text = btn.getAttribute('data-text');
        navigator.clipboard.writeText(text);
        btn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i> Copied!`;
        lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = `<i data-lucide="copy" style="width:14px;height:14px;"></i> Copy`;
          lucide.createIcons();
        }, 1800);
      };
    });

    document.querySelectorAll('.speech-btn').forEach(btn => {
      btn.onclick = () => {
        if (!('speechSynthesis' in window)) {
          showNotification('Text-to-speech is not supported on this browser.', 'warning');
          return;
        }
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          btn.innerHTML = `<i data-lucide="volume-2" style="width:14px;height:14px;"></i> Read Aloud`;
          lucide.createIcons();
          return;
        }
        const text = btn.getAttribute('data-text').replace(/```[\s\S]*?```/g, 'Code block omitted.');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        btn.innerHTML = `<i data-lucide="square" style="width:14px;height:14px;"></i> Stop`;
        lucide.createIcons();
        utterance.onend = () => {
          btn.innerHTML = `<i data-lucide="volume-2" style="width:14px;height:14px;"></i> Read Aloud`;
          lucide.createIcons();
        };
        window.speechSynthesis.speak(utterance);
      };
    });
  }

  // --- 2. QUIZ MODE ---
  function renderQuizMode(config) {
    const summary = window.storageService.getQuizSummary();

    contentBodyEl.innerHTML = `
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-tag"><span class="pulse-dot"></span> ${config.badge}</div>
          <h1 class="hero-title">${config.title}</h1>
          <p class="hero-subtitle">${config.description}</p>
        </div>
      </div>

      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-header"><span>Quizzes Attempted</span><i data-lucide="activity"></i></div>
          <div class="metric-val" id="quizMetricTotal">${summary.total}</div>
          <div class="metric-delta positive"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> ${summary.correct} correct answers</div>
        </div>
        <div class="metric-card">
          <div class="metric-header"><span>Overall Accuracy</span><i data-lucide="target"></i></div>
          <div class="metric-val" id="quizMetricAccuracy">${summary.accuracy}%</div>
          <div class="metric-delta ${summary.accuracy >= 70 ? 'positive' : 'neutral'}">
            <i data-lucide="trending-up" style="width:14px;height:14px;"></i> ${summary.accuracy >= 70 ? 'Proficient' : 'In Progress'}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-header"><span>Active Topic</span><i data-lucide="bookmark"></i></div>
          <div class="metric-val" style="font-size:1.4rem;padding-top:8px;" id="quizActiveTopicDisplay">SQL Joins</div>
          <div class="metric-delta neutral">Select below or type custom</div>
        </div>
        <div class="metric-card">
          <div class="metric-header"><span>AI Engine</span><i data-lucide="cpu"></i></div>
          <div class="metric-val" style="font-size:1.4rem;padding-top:8px;">Active</div>
          <div class="metric-delta positive"><i data-lucide="zap" style="width:14px;height:14px;"></i> Real-time Evaluation</div>
        </div>
      </div>

      <div class="quiz-setup-card">
        <div class="card-title-row">
          <h3 class="card-title">Choose or Enter Topic</h3>
        </div>
        <div class="topic-pills-row" id="topicPillsRow">
          ${config.chips.map((topic, i) => `
            <div class="topic-select-pill ${i === 0 ? 'active' : ''}" data-topic="${topic}">${topic}</div>
          `).join('')}
        </div>
        <div style="display:flex;gap:12px;margin-top:6px;">
          <input type="text" id="customTopicInput" class="form-input" placeholder="Or type a custom topic (e.g. Parquet Row Groups, Airflow DAGs)...">
          <button class="btn-enterprise btn-primary" id="generateQuizBtn" style="white-space:nowrap;">
            <i data-lucide="sparkles"></i> Generate Challenge
          </button>
        </div>
      </div>

      <div id="quizDisplayArea">
        <!-- Rendered question appears here -->
      </div>
    `;

    lucide.createIcons();

    // Event listeners
    let selectedTopic = config.chips[0];
    const customTopicInput = document.getElementById('customTopicInput');
    const generateQuizBtn = document.getElementById('generateQuizBtn');
    const activeTopicDisplay = document.getElementById('quizActiveTopicDisplay');

    document.querySelectorAll('.topic-select-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.topic-select-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedTopic = pill.getAttribute('data-topic');
        customTopicInput.value = '';
        if (activeTopicDisplay) activeTopicDisplay.textContent = selectedTopic;
      });
    });

    generateQuizBtn.addEventListener('click', () => {
      const topic = customTopicInput.value.trim() || selectedTopic;
      if (activeTopicDisplay) activeTopicDisplay.textContent = topic;
      startQuizQuestion(topic);
    });

    // Auto-load first question
    startQuizQuestion(selectedTopic);
  }

  async function startQuizQuestion(topic) {
    const displayArea = document.getElementById('quizDisplayArea');
    if (!displayArea) return;

    displayArea.innerHTML = `
      <div class="quiz-question-card" style="text-align:center;padding:50px;">
        <div class="pulse-dot" style="margin:0 auto 16px;width:12px;height:12px;"></div>
        <h3>Generating a high-yield question on <strong>${escapeHtml(topic)}</strong>...</h3>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-top:8px;">Formulating choices, distractor analysis, and conceptual explanation.</p>
      </div>
    `;

    try {
      currentQuiz = await window.aiService.generateQuiz(topic);
      currentQuiz.topic = topic;
      renderQuizQuestion(currentQuiz);
    } catch (err) {
      displayArea.innerHTML = `
        <div class="quiz-question-card" style="border-color:var(--danger-border);background:var(--danger-bg)">
          <h3 style="color:var(--danger)">Quiz Generation Error</h3>
          <p style="color:#fca5a5;margin-top:6px;">${escapeHtml(err.message)}</p>
          <button class="btn-enterprise btn-secondary" onclick="startQuizQuestion('${escapeHtml(topic)}')" style="margin-top:16px;">Try Again</button>
        </div>
      `;
    }
  }

  function renderQuizQuestion(quiz) {
    const displayArea = document.getElementById('quizDisplayArea');
    if (!displayArea) return;

    const keys = ['A', 'B', 'C', 'D'];

    displayArea.innerHTML = `
      <div class="quiz-question-card">
        <div class="quiz-badge-row">
          <span class="quiz-topic-tag">${escapeHtml(quiz.topic)}</span>
          <span style="font-size:0.8rem;color:var(--text-muted);"><i data-lucide="clock" style="width:13px;height:13px;display:inline;"></i> Standard Challenge</span>
        </div>
        <div class="quiz-question-text">${escapeHtml(quiz.question)}</div>

        <div class="quiz-options-list" id="quizOptionsList">
          ${quiz.options.map((opt, i) => `
            <div class="quiz-option-item" data-index="${i}" data-val="${escapeHtml(opt)}">
              <span class="quiz-option-key">${keys[i]}</span>
              <span>${escapeHtml(opt)}</span>
            </div>
          `).join('')}
        </div>

        <div id="quizFeedbackBox" style="display:none;"></div>

        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;">
          <button class="btn-enterprise btn-secondary" id="nextQuizBtn" style="display:none;">
            Next Question <i data-lucide="arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    lucide.createIcons();

    // Option Clicks
    let answered = false;
    document.querySelectorAll('.quiz-option-item').forEach(item => {
      item.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const selected = item.getAttribute('data-val');
        const correct = quiz.correct_answer;
        const isCorrect = selected.trim() === correct.trim();

        // Save result
        window.storageService.saveQuizResult({
          topic: quiz.topic,
          question: quiz.question,
          selectedAnswer: selected,
          correctAnswer: correct,
          isCorrect,
          explanation: quiz.explanation
        });

        loadSidebarStats();

        // Visual feedback on options
        document.querySelectorAll('.quiz-option-item').forEach(optEl => {
          const val = optEl.getAttribute('data-val');
          if (val.trim() === correct.trim()) {
            optEl.classList.add('correct');
          } else if (val.trim() === selected.trim() && !isCorrect) {
            optEl.classList.add('incorrect');
          }
        });

        // Confetti if correct
        if (isCorrect && window.confetti) {
          window.confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
        }

        // Feedback box
        const feedbackBox = document.getElementById('quizFeedbackBox');
        feedbackBox.className = 'quiz-feedback-box';
        feedbackBox.style.display = 'block';
        feedbackBox.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-weight:700;color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">
            <i data-lucide="${isCorrect ? 'check-circle' : 'x-circle'}"></i>
            ${isCorrect ? 'Outstanding! Correct Answer 🎉' : 'Incorrect.'}
          </div>
          <p style="font-size:0.92rem;color:var(--text-muted);line-height:1.55;">
            <strong>Explanation:</strong> ${escapeHtml(quiz.explanation)}
          </p>
        `;
        lucide.createIcons();

        // Reveal Next Button
        const nextQuizBtn = document.getElementById('nextQuizBtn');
        if (nextQuizBtn) {
          nextQuizBtn.style.display = 'inline-flex';
          nextQuizBtn.onclick = () => startQuizQuestion(quiz.topic);
        }
      });
    });
  }

  // --- 3. NOTES MODE (Client-Side RAG) ---
  function renderNotesMode(config) {
    const doc = window.ragService.currentDocument;

    contentBodyEl.innerHTML = `
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-tag"><span class="pulse-dot"></span> ${config.badge}</div>
          <h1 class="hero-title">${config.title}</h1>
          <p class="hero-subtitle">${config.description}</p>
        </div>
      </div>

      <div class="rag-layout-grid">
        <!-- Sidebar Controls / Upload -->
        <div class="upload-card">
          <h3 class="card-title">Document Ingestion</h3>
          <p style="font-size:0.85rem;color:var(--text-muted);">
            Drop TXT, Markdown, or PDF notes. All parsing and vector indexing runs directly in your browser.
          </p>

          <div class="drop-zone" id="dropZone">
            <div class="drop-zone-icon"><i data-lucide="upload-cloud"></i></div>
            <div style="font-weight:600;font-size:0.92rem;margin-bottom:4px;">Drag & Drop or Click to Browse</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">Supports .txt, .md, .pdf</div>
            <input type="file" id="fileInput" accept=".txt,.md,.pdf,.csv,.json,.sql" style="display:none;">
          </div>

          <button class="btn-enterprise btn-secondary" id="loadSampleNotesBtn" style="width:100%;justify-content:center;">
            <i data-lucide="file-text"></i> Load Sample DE Architecture Notes
          </button>

          ${doc ? `
            <div class="file-info-badge">
              <div>
                <strong>${escapeHtml(doc.name)}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted);">${doc.chunks.length} chunks · ${(doc.size / 1024).toFixed(1)} KB</div>
              </div>
              <span class="pulse-dot"></span>
            </div>

            <details style="font-size:0.84rem;color:var(--text-muted);cursor:pointer;">
              <summary style="font-weight:600;color:var(--accent-secondary);margin-bottom:8px;">Inspect Generated Chunks</summary>
              <div style="max-height:240px;overflow-y:auto;padding-right:4px;">
                ${doc.chunks.map((c, i) => `
                  <div class="chunk-card">
                    <strong>Chunk ${i + 1}:</strong> ${escapeHtml(c.slice(0, 160))}...
                  </div>
                `).join('')}
              </div>
            </details>
          ` : `
            <div style="font-size:0.82rem;color:var(--text-dim);text-align:center;">
              No document currently indexed. Upload one or load the sample above to start.
            </div>
          `}
        </div>

        <!-- Query & Results Area -->
        <div class="chat-container">
          <div class="chips-tray">
            <span class="chip-label">Sample Questions:</span>
            ${config.chips.map(chip => `
              <button class="prompt-chip" data-rag-prompt="${chip}">
                <i data-lucide="search" style="width:13px;height:13px;"></i>
                ${chip}
              </button>
            `).join('')}
          </div>

          <div class="chat-messages" id="ragMessages">
            ${doc ? `
              <div class="chat-bubble bot-bubble">
                <div class="bubble-avatar"><i data-lucide="bot"></i></div>
                <div class="bubble-body">
                  <div class="bubble-meta"><span>DataBuddy RAG Assistant</span><span>Ready</span></div>
                  <p>Document <strong>${escapeHtml(doc.name)}</strong> is indexed with <strong>${doc.chunks.length} semantic chunks</strong>. Type any question below to extract answers using TF-IDF & Cosine Similarity!</p>
                </div>
              </div>
            ` : `
              <div class="chat-bubble bot-bubble">
                <div class="bubble-avatar"><i data-lucide="bot"></i></div>
                <div class="bubble-body">
                  <p>Please upload a notes file or click <strong>"Load Sample DE Architecture Notes"</strong> on the left to begin.</p>
                </div>
              </div>
            `}
          </div>

          <div class="chat-input-sticky">
            <div class="input-box-wrapper">
              <input type="text" id="ragInput" placeholder="Ask a question from your indexed notes..." ${!doc ? 'disabled' : ''}>
              <button class="send-btn" id="ragSendBtn" ${!doc ? 'disabled' : ''}>
                <i data-lucide="arrow-up" style="width: 20px; height: 20px;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();

    // Drag and drop listeners
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const loadSampleNotesBtn = document.getElementById('loadSampleNotesBtn');
    const ragInput = document.getElementById('ragInput');
    const ragSendBtn = document.getElementById('ragSendBtn');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent-primary)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '';
      if (e.dataTransfer.files?.length) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        handleFileUpload(fileInput.files[0]);
      }
    });

    loadSampleNotesBtn.addEventListener('click', () => {
      window.ragService.loadSampleNotes();
      showNotification('Sample Data Engineering notes loaded!', 'success');
      renderNotesMode(config);
    });

    function handleRagSubmit() {
      const q = ragInput.value.trim();
      if (!q) return;
      ragInput.value = '';
      executeRagQuery(q);
    }

    if (ragSendBtn) ragSendBtn.addEventListener('click', handleRagSubmit);
    if (ragInput) ragInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleRagSubmit();
    });

    contentBodyEl.querySelectorAll('[data-rag-prompt]').forEach(el => {
      el.addEventListener('click', () => {
        executeRagQuery(el.getAttribute('data-rag-prompt'));
      });
    });
  }

  async function handleFileUpload(file) {
    try {
      showNotification(`Processing ${file.name}...`, 'neutral');
      await window.ragService.processFile(file);
      showNotification(`Successfully indexed ${file.name}!`, 'success');
      renderNotesMode(MODES.notes);
    } catch (err) {
      showNotification(err.message, 'danger');
    }
  }

  async function executeRagQuery(question) {
    const doc = window.ragService.currentDocument;
    if (!doc) {
      showNotification('Please load or upload a document first.', 'warning');
      return;
    }

    const ragMessagesEl = document.getElementById('ragMessages');
    if (!ragMessagesEl) return;

    // Append user query
    ragMessagesEl.innerHTML += `
      <div class="chat-bubble user-bubble">
        <div class="bubble-avatar">You</div>
        <div class="bubble-body"><p>${escapeHtml(question)}</p></div>
      </div>
    `;

    // 1. Vector Search using TF-IDF & Cosine Similarity
    const relevantChunks = window.ragService.findRelevantChunks(question, doc.chunks, 3);

    // 2. Synthesize AI answer
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble bot-bubble';
    loadingBubble.innerHTML = `
      <div class="bubble-avatar"><i data-lucide="bot"></i></div>
      <div class="bubble-body">
        <div class="bubble-meta"><span>RAG Engine · Searching Chunks</span></div>
        <div style="display:flex;align-items:center;gap:8px;color:var(--text-muted);">
          <span class="pulse-dot"></span> Ranking ${doc.chunks.length} chunks via Cosine Similarity...
        </div>
      </div>
    `;
    ragMessagesEl.appendChild(loadingBubble);
    lucide.createIcons();
    ragMessagesEl.scrollTop = ragMessagesEl.scrollHeight;

    try {
      const answer = await window.aiService.answerFromNotes(question, relevantChunks, doc.name);
      loadingBubble.remove();

      const renderedAnswer = window.marked ? window.marked.parse(answer) : answer.replace(/\n/g, '<br>');

      const answerBubble = document.createElement('div');
      answerBubble.className = 'chat-bubble bot-bubble';
      answerBubble.innerHTML = `
        <div class="bubble-avatar"><i data-lucide="bot"></i></div>
        <div class="bubble-body">
          <div class="bubble-meta">
            <span>RAG Synthesis · Source: ${escapeHtml(doc.name)}</span>
            <span>${relevantChunks.length} chunks retrieved</span>
          </div>
          <div class="markdown-content">${renderedAnswer}</div>

          <!-- Retrieved Chunks Badges -->
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-subtle);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--text-dim);text-transform:uppercase;margin-bottom:8px;">
              Retrieved Semantic Evidence:
            </div>
            ${relevantChunks.map((c, i) => `
              <div class="chunk-card" style="margin-bottom:6px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="font-weight:700;color:var(--text-main);">Chunk #${c.chunkIndex || i + 1}</span>
                  <span class="similarity-badge">Match: ${(c.score * 100).toFixed(0)}%</span>
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(c.chunk.slice(0, 200))}...</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
      ragMessagesEl.appendChild(answerBubble);
      lucide.createIcons();
      ragMessagesEl.scrollTop = ragMessagesEl.scrollHeight;
    } catch (err) {
      loadingBubble.innerHTML = `<div class="bubble-body" style="color:var(--danger)">Error: ${escapeHtml(err.message)}</div>`;
    }
  }

  // --- 4. HISTORY MODE ---
  function renderHistoryMode(config) {
    const chats = window.storageService.getChats();
    const quizzes = window.storageService.getQuizzes();

    contentBodyEl.innerHTML = `
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-tag"><span class="pulse-dot"></span> ${config.badge}</div>
          <h1 class="hero-title">${config.title}</h1>
          <p class="hero-subtitle">${config.description}</p>
        </div>
      </div>

      <div class="history-controls">
        <div class="search-input-wrap">
          <i data-lucide="search" style="color:var(--text-dim)"></i>
          <input type="text" id="historySearchInput" placeholder="Search prompts, questions, or topics...">
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn-enterprise btn-secondary" id="exportJsonBtn"><i data-lucide="download"></i> Export JSON</button>
          <button class="btn-enterprise btn-secondary" id="exportCsvBtn"><i data-lucide="file-spreadsheet"></i> Export CSV</button>
          <button class="btn-enterprise btn-secondary" id="clearHistoryBtn" style="color:#f87171;"><i data-lucide="trash-2"></i> Clear</button>
        </div>
      </div>

      <div class="chips-tray" style="margin-bottom:16px;">
        <span class="chip-label">Filter:</span>
        <div class="topic-select-pill ${activeFilter === 'all' ? 'active' : ''}" data-hist-filter="all">All (${chats.length + quizzes.length})</div>
        <div class="topic-select-pill ${activeFilter === 'chats' ? 'active' : ''}" data-hist-filter="chats">Chats (${chats.length})</div>
        <div class="topic-select-pill ${activeFilter === 'quizzes' ? 'active' : ''}" data-hist-filter="quizzes">Quizzes (${quizzes.length})</div>
      </div>

      <div id="historyListContainer">
        <!-- Rendered items -->
      </div>
    `;

    lucide.createIcons();

    const searchInput = document.getElementById('historySearchInput');
    const container = document.getElementById('historyListContainer');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    function refreshHistory() {
      const q = (searchInput?.value || '').toLowerCase();
      let html = '';

      if (activeFilter === 'all' || activeFilter === 'chats') {
        const filteredChats = chats.filter(c => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q));
        filteredChats.forEach(c => {
          html += `
            <div class="history-item">
              <div class="history-header">
                <span class="mode-badge-pill">${c.mode}</span>
                <span style="font-size:0.75rem;color:var(--text-dim);">${c.timestamp}</span>
              </div>
              <h4 style="font-size:0.98rem;margin-bottom:6px;">${escapeHtml(c.question)}</h4>
              <p style="font-size:0.86rem;color:var(--text-muted);line-height:1.5;">${escapeHtml(c.answer.slice(0, 220))}...</p>
            </div>
          `;
        });
      }

      if (activeFilter === 'all' || activeFilter === 'quizzes') {
        const filteredQuizzes = quizzes.filter(qz => qz.topic.toLowerCase().includes(q) || qz.question.toLowerCase().includes(q));
        filteredQuizzes.forEach(qz => {
          html += `
            <div class="history-item">
              <div class="history-header">
                <span class="quiz-topic-tag">${qz.topic}</span>
                <span style="font-size:0.8rem;font-weight:700;color:${qz.isCorrect ? 'var(--success)' : 'var(--danger)'}">
                  ${qz.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                </span>
              </div>
              <h4 style="font-size:0.95rem;margin-bottom:6px;">${escapeHtml(qz.question)}</h4>
              <div style="font-size:0.82rem;color:var(--text-muted);">
                Selected: <strong>${escapeHtml(qz.selectedAnswer)}</strong> · Correct: <strong>${escapeHtml(qz.correctAnswer)}</strong>
              </div>
            </div>
          `;
        });
      }

      if (!html) {
        html = `<div style="text-align:center;padding:40px;color:var(--text-dim);">No historical records match your filter.</div>`;
      }

      container.innerHTML = html;
    }

    refreshHistory();

    searchInput.addEventListener('input', refreshHistory);

    document.querySelectorAll('[data-hist-filter]').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('[data-hist-filter]').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        activeFilter = el.getAttribute('data-hist-filter');
        refreshHistory();
      });
    });

    exportJsonBtn.addEventListener('click', () => window.storageService.exportJSON());
    exportCsvBtn.addEventListener('click', () => window.storageService.exportCSV());
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all chat and quiz history?')) {
        window.storageService.clearAllData();
        showNotification('History cleared.', 'neutral');
        loadSidebarStats();
        renderHistoryMode(config);
      }
    });
  }

  // --- 5. DASHBOARD MODE ---
  function renderDashboardMode(config) {
    const summary = window.storageService.getQuizSummary();
    const chats = window.storageService.getChats();
    const topicStats = window.storageService.getTopicPerformance();
    const weakTopics = topicStats.filter(t => t.accuracy < 60);

    contentBodyEl.innerHTML = `
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-tag"><span class="pulse-dot"></span> ${config.badge}</div>
          <h1 class="hero-title">${config.title}</h1>
          <p class="hero-subtitle">${config.description}</p>
        </div>
      </div>

      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-header"><span>Knowledge Queries</span><i data-lucide="message-square"></i></div>
          <div class="metric-val">${chats.length}</div>
          <div class="metric-delta positive"><i data-lucide="arrow-up-right"></i> Active Learning</div>
        </div>
        <div class="metric-card">
          <div class="metric-header"><span>Assessments Taken</span><i data-lucide="award"></i></div>
          <div class="metric-val">${summary.total}</div>
          <div class="metric-delta neutral"><i data-lucide="check"></i> ${summary.correct} passed</div>
        </div>
        <div class="metric-card">
          <div class="metric-header"><span>Retention Accuracy</span><i data-lucide="pie-chart"></i></div>
          <div class="metric-val">${summary.accuracy}%</div>
          <div class="metric-delta ${summary.accuracy >= 70 ? 'positive' : 'neutral'}">
            ${summary.accuracy >= 70 ? 'Target Achieved' : 'Needs Optimization'}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-header"><span>Weak Topics Flagged</span><i data-lucide="alert-circle"></i></div>
          <div class="metric-val" style="color:${weakTopics.length > 0 ? 'var(--warning)' : 'var(--success)'};">${weakTopics.length}</div>
          <div class="metric-delta ${weakTopics.length > 0 ? 'neutral' : 'positive'}">
            ${weakTopics.length > 0 ? 'Action Recommended' : 'All Topics Mastered'}
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Topic Performance Bars -->
        <div class="analytics-card">
          <div class="card-title-row">
            <h3 class="card-title">Topic Performance Matrix</h3>
            <span style="font-size:0.8rem;color:var(--text-muted);">${topicStats.length} Domains Evaluated</span>
          </div>

          ${topicStats.length === 0 ? `
            <div style="text-align:center;padding:30px;color:var(--text-dim);">No quiz performance recorded yet. Head over to Quiz Arena to populate stats!</div>
          ` : topicStats.map(stat => `
            <div class="topic-bar-row">
              <div class="topic-bar-info">
                <span>${escapeHtml(stat.topic)} (${stat.correct}/${stat.total} correct)</span>
                <span style="color:${stat.accuracy < 60 ? 'var(--warning)' : 'var(--text-main)'}; font-family:var(--font-mono);">${stat.accuracy}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill ${stat.accuracy < 60 ? 'warning' : ''}" style="width: ${stat.accuracy}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Weak Topics / Revision Center -->
        <div class="analytics-card">
          <div class="card-title-row">
            <h3 class="card-title">Targeted Revision Center</h3>
            <i data-lucide="crosshair" style="color:var(--accent-primary)"></i>
          </div>

          ${weakTopics.length === 0 ? `
            <div style="background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--radius-lg);padding:24px;text-align:center;">
              <i data-lucide="check-check" style="color:var(--success);width:32px;height:32px;margin-bottom:8px;"></i>
              <div style="font-weight:700;color:#34d399;">Mastery Maintained</div>
              <div style="font-size:0.84rem;color:var(--text-muted);margin-top:4px;">No critical weak topics identified. Keep up the high retention!</div>
            </div>
          ` : `
            <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:16px;">
              The following topics currently sit below the 60% accuracy threshold:
            </p>
            ${weakTopics.map(w => `
              <div class="weak-topic-item">
                <div>
                  <div style="font-weight:700;font-size:0.92rem;color:#fde047;">${escapeHtml(w.topic)}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted);">${w.accuracy}% accuracy (${w.correct}/${w.total})</div>
                </div>
                <button class="btn-enterprise btn-primary practice-weak-btn" data-topic="${escapeHtml(w.topic)}" style="padding:6px 12px;font-size:0.8rem;">
                  Practice Now
                </button>
              </div>
            `).join('')}
          `}
        </div>
      </div>
    `;

    lucide.createIcons();

    // Practice Now buttons
    document.querySelectorAll('.practice-weak-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const topic = btn.getAttribute('data-topic');
        switchMode('quiz');
        setTimeout(() => {
          startQuizQuestion(topic);
        }, 150);
      });
    });
  }

  // --- UTILITIES ---
  function showNotification(text, type = 'neutral') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid ${type === 'success' ? 'var(--success)' : type === 'danger' ? 'var(--danger)' : 'var(--border-accent)'};
      color: #fff;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 9999;
      font-size: 0.88rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeIn 0.25s ease-out;
    `;
    toast.innerHTML = `<span class="pulse-dot"></span> <span>${escapeHtml(text)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Launch application
  init();
});
