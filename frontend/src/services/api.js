// ================================================================
// CareerForge AI — Backend API client.
//
// Every network call the frontend makes goes through here. This is
// the ONE place that knows the backend's base URL and attaches the
// JWT — no component ever touches fetch() or an API key directly.
// ================================================================

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'cf_token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true, query } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let url = `${BASE_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null));
    if ([...qs].length) url += `?${qs}`;
  }
  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Could not reach the CareerForge AI backend. Is it running on port 5000?', 0);
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    if (res.status === 401) clearToken();
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: { name, email, password }, auth: false }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  guest: () => request('/auth/guest', { method: 'POST', auth: false }),
  me: () => request('/auth/me'),
};

// ── Profile ───────────────────────────────────────────────────────
export const profileApi = {
  get: () => request('/profile'),
  update: profile => request('/profile', { method: 'PUT', body: profile }),
};

// ── Career Path ───────────────────────────────────────────────────
export const careerPathApi = {
  get: () => request('/career-path'),
  generate: payload => request('/career-path/generate', { method: 'POST', body: payload }),
  adjustReadiness: delta => request('/career-path/readiness', { method: 'PUT', body: { delta } }),
  getProgress: () => request('/career-path/progress'),
  setProgress: (phaseKey, done) => request('/career-path/progress', { method: 'PUT', body: { phaseKey, done } }),
};

// ── Interview ─────────────────────────────────────────────────────
export const interviewApi = {
  generateQuestions: config => request('/interview/questions', { method: 'POST', body: { config } }),
  nextQuestion: (config, history) => request('/interview/next-question', { method: 'POST', body: { config, history } }),
  feedback: (question, answer, mode, difficulty) => request('/interview/feedback', { method: 'POST', body: { question, answer, mode, difficulty } }),
  codingQuestion: config => request('/interview/coding-question', { method: 'POST', body: { config } }),
  evaluateCode: (code, problem, testResults, language) => request('/interview/evaluate-code', { method: 'POST', body: { code, problem, testResults, language } }),
  submitSession: (config, timeline, focusStats) => request('/interview/sessions', { method: 'POST', body: { config, timeline, focusStats } }),
  listSessions: () => request('/interview/sessions'),
  getSession: id => request(`/interview/sessions/${id}`),
};

// ── Skill Assessment Center ───────────────────────────────────────
export const skillAssessmentApi = {
  getQuiz: (categories, perCategory) => request('/skill-assessment/quiz', { method: 'POST', body: { categories, perCategory } }),
  submit: (categoryScores, totalQuestions, correctAnswers) => request('/skill-assessment/submit', { method: 'POST', body: { categoryScores, totalQuestions, correctAnswers } }),
  history: () => request('/skill-assessment/history'),
  latest: () => request('/skill-assessment/latest'),
};

// ── Notes ─────────────────────────────────────────────────────────
export const notesApi = {
  list: () => request('/notes'),
  create: note => request('/notes', { method: 'POST', body: note }),
  update: (id, note) => request(`/notes/${id}`, { method: 'PUT', body: note }),
  remove: id => request(`/notes/${id}`, { method: 'DELETE' }),
  ai: (task, content) => request(`/notes/ai/${task}`, { method: 'POST', body: { content } }),
};

// ── Resume ────────────────────────────────────────────────────────
export const resumeApi = {
  analyze: (resumeText, targetRole, jobDescription) => request('/resume/analyze', { method: 'POST', body: { resumeText, targetRole, jobDescription } }),
};

// ── Learning Hub ──────────────────────────────────────────────────
export const learningApi = {
  search: (q, maxResults) => request('/learning/search', { query: { q, maxResults } }),
  savedVideos: () => request('/learning/saved'),
  saveVideo: video => request('/learning/saved', { method: 'POST', body: video }),
  removeVideo: videoId => request(`/learning/saved/${videoId}`, { method: 'DELETE' }),
};

// ── Jobs ──────────────────────────────────────────────────────────
export const jobsApi = {
  list: () => request('/jobs'),
  savedIds: () => request('/jobs/saved'),
  save: jobId => request('/jobs/saved', { method: 'POST', body: { jobId } }),
  remove: jobId => request(`/jobs/saved/${jobId}`, { method: 'DELETE' }),
};

// ── Chat (ARIA assistant) ─────────────────────────────────────────
export const chatApi = {
  send: (messages, page) => request('/chat', { method: 'POST', body: { messages, page } }),
  history: () => request('/chat/history'),
  clear: () => request('/chat/history', { method: 'DELETE' }),
};

// ── Badges ────────────────────────────────────────────────────────
export const badgesApi = {
  get: () => request('/badges'),
  check: () => request('/badges/check', { method: 'POST' }),
};

// ── Leaderboard ───────────────────────────────────────────────────
export const leaderboardApi = {
  get: mode => request('/leaderboard', { query: { mode } }),
  percentile: (mode, score) => request('/leaderboard/percentile', { query: { mode, score } }),
};

// ── Group Discussion Simulator ────────────────────────────────────
export const gdApi = {
  start: topic => request('/gd/start', { method: 'POST', body: { topic } }),
  respond: (topic, personas, transcript, userMessage) => request('/gd/respond', { method: 'POST', body: { topic, personas, transcript, userMessage } }),
  evaluate: (topic, transcript) => request('/gd/evaluate', { method: 'POST', body: { topic, transcript } }),
  history: () => request('/gd/history'),
};

// ── Placement Drive ───────────────────────────────────────────────
export const driveApi = {
  complete: (company, roleTitle, roundScores) => request('/drive/complete', { method: 'POST', body: { company, roleTitle, roundScores } }),
  history: () => request('/drive/history'),
};

// ── Unified Activity (streaks/heatmap across all practice types) ──
export const activityApi = {
  get: () => request('/activity'),
};

export { ApiError };
