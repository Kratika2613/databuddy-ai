/**
 * DataBuddy AI - Enterprise API Client Service
 * Fully integrates with FastAPI backend REST endpoints.
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function sendChatMessage(question, mode) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return await res.json();
}

export async function fetchChatHistory() {
  const res = await fetch(`${API_BASE}/chat/history`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function generateQuizQuestion(topic, difficulty) {
  const res = await fetch(`${API_BASE}/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Quiz generation failed: ${res.status}`);
  }
  return await res.json();
}

export async function submitQuizAnswer(questionId, selectedAnswer) {
  const res = await fetch(`${API_BASE}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: questionId,
      selected_answer: selectedAnswer,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Answer submission failed: ${res.status}`);
  }
  return await res.json();
}

export async function fetchQuizReviews() {
  const res = await fetch(`${API_BASE}/quiz/reviews`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/knowledge/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${res.status}`);
  }
  return await res.json();
}

export async function fetchKnowledgeDocuments() {
  const res = await fetch(`${API_BASE}/knowledge/documents`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function queryKnowledge(question, topK = 3) {
  const res = await fetch(`${API_BASE}/knowledge/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Query failed: ${res.status}`);
  }
  return await res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/analytics/dashboard`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchPreferences() {
  const res = await fetch(`${API_BASE}/analytics/preferences`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function updatePreferences(data) {
  const res = await fetch(`${API_BASE}/analytics/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function runAgentWorkflow() {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Agent workflow failed: ${res.status}`);
  }
  return await res.json();
}

export async function fetchAgentLogs() {
  const res = await fetch(`${API_BASE}/agent/logs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
