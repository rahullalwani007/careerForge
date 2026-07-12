// ================================================================
// Pure functions that turn a `sessions` array (fetched from the
// backend via interviewApi.listSessions()) into the derived stats
// the Dashboard/Profile pages show: streaks, the activity heatmap,
// and simple aggregates. Kept dependency-free and side-effect-free
// on purpose — easy to unit test, easy to explain in a viva.
// ================================================================

export function calculateStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => new Date(s.date).toDateString()));
  const today = new Date();
  let streak = 0;
  const d = new Date(today);
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function getLongestStreak(sessions) {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => new Date(s.date).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => a - b);
  let max = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (days[i] - days[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) { cur++; max = Math.max(max, cur); } else cur = 1;
  }
  return days.length ? max : 0;
}

export function getActivityData(sessions) {
  const data = {};
  sessions.forEach(s => {
    const d = new Date(s.date).toDateString();
    data[d] = (data[d] || 0) + 1;
  });
  const result = [];
  const today = new Date();
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push({ date: d.toDateString(), count: data[d.toDateString()] || 0 });
  }
  return result;
}

export function hasDoneSessionToday(sessions) {
  const today = new Date().toDateString();
  return sessions.some(s => new Date(s.date).toDateString() === today);
}

export function getStats(sessions) {
  if (!sessions.length) return { totalSessions: 0, avgScore: 0, bestScore: 0, totalQuestions: 0, streak: 0 };
  const scores = sessions.map(s => s.averageScore || 0);
  return {
    totalSessions: sessions.length,
    avgScore: (scores.reduce((a, b) => a + b, 0) / sessions.length).toFixed(1),
    bestScore: Math.max(...scores).toFixed(1),
    totalQuestions: sessions.reduce((a, s) => a + (s.questionCount || 0), 0),
    streak: calculateStreak(sessions),
  };
}
