// ================================================================
// Badge unlock logic. Ported from the original localStorage-based
// version to run against the SQLite session history instead, which
// is what makes "sessions_25" etc. meaningful across devices.
//
// Badge metadata (name/emoji/color) lives on the frontend since
// it's pure display data; this file only decides which badge IDs
// a user has earned.
// ================================================================
const db = require('./index');

function calculateStreak(userId) {
  const rows = db.prepare(`SELECT DISTINCT date(created_at) AS d FROM sessions WHERE user_id = ?`).all(userId);
  const days = new Set(rows.map(r => r.d));
  if (!days.size) return 0;
  let streak = 0;
  const d = new Date();
  const todayStr = d.toISOString().slice(0, 10);
  if (!days.has(todayStr)) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function checkAndUnlockBadges(userId) {
  const sessions = db.prepare('SELECT mode, average_score, question_count FROM sessions WHERE user_id = ?').all(userId);
  const noteCount = db.prepare('SELECT COUNT(*) AS c FROM notes WHERE user_id = ?').get(userId).c;
  const careerPath = db.prepare('SELECT data_json FROM career_paths WHERE user_id = ?').get(userId);
  const readinessPercent = careerPath ? (JSON.parse(careerPath.data_json).readinessPercent || 0) : 0;
  const skillAssessments = db.prepare('SELECT categories_json FROM skill_assessments WHERE user_id = ?').all(userId);
  const focusedSession = db.prepare('SELECT 1 FROM sessions WHERE user_id = ? AND focus_score >= 95 AND tab_switches = 0 LIMIT 1').get(userId);
  const adaptiveAce = db.prepare('SELECT 1 FROM sessions WHERE user_id = ? AND adaptive = 1 AND average_score >= 8 LIMIT 1').get(userId);
  const gdSessions = db.prepare('SELECT score FROM gd_sessions WHERE user_id = ?').all(userId);
  const drives = db.prepare('SELECT verdict FROM placement_drives WHERE user_id = ?').all(userId);

  const streak = calculateStreak(userId);
  const totalSessions = sessions.length;
  const bestScore = sessions.length ? Math.max(...sessions.map(s => s.average_score || 0)) : 0;
  const modesAttempted = new Set(sessions.map(s => s.mode)).size;
  const highScoreSessions = sessions.filter(s => (s.average_score || 0) >= 8).length;
  const skillMaster = skillAssessments.some(a => Object.values(JSON.parse(a.categories_json || '{}')).some(v => v >= 90));

  const checks = [
    { id: 'first_session', cond: totalSessions >= 1 },
    { id: 'streak_3', cond: streak >= 3 },
    { id: 'streak_7', cond: streak >= 7 },
    { id: 'streak_30', cond: streak >= 30 },
    { id: 'perfect_10', cond: bestScore >= 10 },
    { id: 'all_modes', cond: modesAttempted >= 4 },
    { id: 'sessions_10', cond: totalSessions >= 10 },
    { id: 'sessions_25', cond: totalSessions >= 25 },
    { id: 'score_8plus', cond: highScoreSessions >= 3 },
    { id: 'readiness_75', cond: readinessPercent >= 75 },
    { id: 'notes_5', cond: noteCount >= 5 },
    { id: 'speed_demon', cond: sessions.some(s => (s.average_score || 0) >= 8 && (s.question_count || 0) >= 7) },
    { id: 'skill_assessed', cond: skillAssessments.length >= 1 },
    { id: 'skill_master', cond: skillMaster },
    { id: 'focused', cond: !!focusedSession },
    { id: 'adaptive_ace', cond: !!adaptiveAce },
    { id: 'gd_champion', cond: gdSessions.some(g => (g.score || 0) >= 8) },
    { id: 'first_drive', cond: drives.length >= 1 },
    { id: 'drive_selected', cond: drives.some(d => d.verdict === 'Selected') },
  ];

  const already = new Set(db.prepare('SELECT badge_id FROM badges_unlocked WHERE user_id = ?').all(userId).map(r => r.badge_id));
  const newly = [];
  const insert = db.prepare('INSERT INTO badges_unlocked (user_id, badge_id) VALUES (?, ?)');
  checks.forEach(c => {
    if (c.cond && !already.has(c.id)) {
      insert.run(userId, c.id);
      newly.push(c.id);
    }
  });
  return newly;
}

function getUnlockedBadges(userId) {
  return db.prepare('SELECT badge_id, unlocked_at FROM badges_unlocked WHERE user_id = ?').all(userId);
}

module.exports = { checkAndUnlockBadges, getUnlockedBadges, calculateStreak };
