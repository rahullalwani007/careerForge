// ================================================================
// Seed script — populates realistic, clearly-synthetic session
// history so features that need many users (Leaderboard, Peer
// Percentile) have something meaningful to show the very first
// time the app runs, before any real person has practiced.
//
// Run with: npm run seed
//
// This is a completely normal thing to do in a demo/mini-project
// context — just say so if asked in the viva ("these are seed
// accounts we generated to demonstrate the benchmarking feature;
// in real use it grows from real users"). Seed users are tagged
// is_guest = 0 but use a recognizable @seed.careerforge.ai email
// domain so they're easy to find and wipe (see the SQL at the
// bottom of this file).
// ================================================================
const bcrypt = require('bcryptjs');
const db = require('./index');

const SEED_MARKER = '@seed.careerforge.ai';

const NAMES = [
  'Aarav Sharma', 'Priya Nair', 'Rohan Gupta', 'Ananya Iyer', 'Vikram Reddy',
  'Sneha Patel', 'Karthik Menon', 'Ishita Verma', 'Aditya Rao', 'Meera Joshi',
  'Arjun Singh', 'Divya Krishnan', 'Rahul Kulkarni', 'Pooja Desai', 'Sanjay Pillai',
  'Neha Bhatt', 'Vishal Kumar', 'Riya Chatterjee', 'Kunal Malhotra', 'Tanvi Shah',
];

const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist'];
const MODES = ['technical', 'hr', 'aptitude', 'system-design'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const CATEGORIES = ['DSA', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude'];

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Scores cluster realistically around 6-7.5 rather than a flat
// random spread, so the percentile feature has a believable curve.
function gaussianScore() {
  const s = (Math.random() + Math.random() + Math.random()) / 3; // ~triangular, centered .5
  const score = 3.5 + s * 6.5; // maps to roughly 3.5 - 10
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

function seed({ silent = false } = {}) {
  const log = (...args) => { if (!silent) console.log(...args); };
  const already = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE email LIKE ?`).get(`%${SEED_MARKER}`);
  if (already.c > 0) {
    log(`Seed data already present (${already.c} seed users). Skipping. Run "npm run reset-db" first if you want to reseed.`);
    return;
  }

  const passwordHash = bcrypt.hashSync('seed-account-not-for-login', 8);
  const insertUser = db.prepare(`INSERT INTO users (name, email, password_hash, is_guest) VALUES (?, ?, ?, 0)`);
  const insertSession = db.prepare(`
    INSERT INTO sessions (user_id, role, mode, difficulty, company, question_count, average_score, readiness_level, focus_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSkill = db.prepare(`
    INSERT INTO skill_assessments (user_id, categories_json, overall_score, total_questions, correct_answers, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalSessions = 0;
  let totalUsers = 0;

  const insertAll = db.transaction(() => {
    NAMES.forEach((name, i) => {
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}${SEED_MARKER}`;
      const { lastInsertRowid: userId } = insertUser.run(name, email, passwordHash);
      totalUsers++;

      const sessionCount = Math.floor(rand(3, 9));
      for (let s = 0; s < sessionCount; s++) {
        const score = gaussianScore();
        const readiness = score >= 8.5 ? 'Exceptional' : score >= 7.5 ? 'Strong Candidate' : score >= 6 ? 'Interview Ready' : score >= 4.5 ? 'Needs Preparation' : 'Not Ready';
        insertSession.run(
          userId, pick(ROLES), pick(MODES), pick(DIFFICULTIES), '',
          Math.floor(rand(3, 8)), score, readiness,
          Math.round(rand(70, 100)),
          daysAgo(Math.floor(rand(0, 75)))
        );
        totalSessions++;
      }

      // 0-3 skill assessment attempts per seed user
      const skillAttempts = Math.floor(rand(0, 3));
      for (let a = 0; a < skillAttempts; a++) {
        const cats = {};
        CATEGORIES.forEach(c => { cats[c] = Math.round(rand(35, 95)); });
        const overall = Math.round(Object.values(cats).reduce((x, y) => x + y, 0) / CATEGORIES.length);
        const total = 20;
        insertSkill.run(userId, JSON.stringify(cats), overall, total, Math.round((overall / 100) * total), daysAgo(Math.floor(rand(0, 60))));
      }
    });
  });

  insertAll();
  log(`Seeded ${totalUsers} demo users with ${totalSessions} practice sessions.`);
  log('These power the Leaderboard and Peer Percentile features on a fresh install.');
  log(`To remove them later: DELETE FROM users WHERE email LIKE '%${SEED_MARKER}';`);
}

module.exports = seed;

// Allow running directly via `node src/db/seed.js` / `npm run seed`
if (require.main === module) seed();
