// ================================================================
// Local-only UI state.
//
// Everything that needs to persist across devices or be visible to
// more than one browser tab lives on the backend now (see api.js) —
// sessions, notes, career path, badges, chat history, saved
// jobs/videos. This file only keeps the handful of things that are
// genuinely per-browser and ephemeral: dark mode, "today's goal"
// and the once-a-day proactive-tip flag.
// ================================================================

const K = {
  DARK: 'cf_dark',
  TODAY_GOAL: 'cf_today_goal',
  TIP_DATE: 'cf_tip_date',
};

const get = k => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function getStoredDark() {
  try { return localStorage.getItem(K.DARK) === 'true'; } catch { return false; }
}
export function setStoredDark(v) {
  try { localStorage.setItem(K.DARK, String(v)); } catch {}
}

export function getTodayGoal() {
  const stored = get(K.TODAY_GOAL);
  const today = new Date().toDateString();
  if (stored?.date === today) return stored;
  const goal = { date: today, text: 'Complete 1 practice session', done: false };
  set(K.TODAY_GOAL, goal);
  return goal;
}
export function setTodayGoalDone(done) {
  const g = getTodayGoal();
  set(K.TODAY_GOAL, { ...g, done });
}

export function shouldShowTip() {
  const today = new Date().toDateString();
  const last = localStorage.getItem(K.TIP_DATE);
  if (last !== today) {
    localStorage.setItem(K.TIP_DATE, today);
    return true;
  }
  return false;
}
