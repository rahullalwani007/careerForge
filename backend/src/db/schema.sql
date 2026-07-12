-- ================================================================
-- CareerForge AI — Database Schema (SQLite)
-- AI-Based Career Guidance & Skill Assessment System
--
-- Design notes (useful for the viva / project report):
--  - One user has: one profile, one career path, many sessions,
--    many skill assessments, many notes, many unlocked badges.
--  - `sessions` + `session_answers` is a classic 1-to-many: a
--    practice session has many question/answer rows.
--  - JSON columns (suffixed `_json`) hold AI-generated structures
--    that don't need their own relational tables for a mini
--    project (e.g. a career roadmap's phases). Everything a
--    query needs to filter/aggregate on (score, mode, role,
--    date) is a real typed column, not buried in JSON.
-- ================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_guest      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  target_role    TEXT,
  level          TEXT,
  skills_json    TEXT NOT NULL DEFAULT '[]',
  bio            TEXT,
  location       TEXT,
  github         TEXT,
  linkedin       TEXT,
  website        TEXT,
  resume_text      TEXT,
  resume_filename  TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS career_paths (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role_id       TEXT,
  data_json     TEXT NOT NULL,      -- full AI-generated roadmap object
  generated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roadmap_progress (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_key  TEXT NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, phase_key)
);

-- One row per completed practice session (interview / coding round).
CREATE TABLE IF NOT EXISTS sessions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role             TEXT,
  mode             TEXT NOT NULL,        -- technical | hr | aptitude | system-design
  difficulty       TEXT,
  company          TEXT,
  question_count   INTEGER NOT NULL DEFAULT 0,
  average_score    REAL NOT NULL DEFAULT 0,
  readiness_level  TEXT,
  adaptive         INTEGER NOT NULL DEFAULT 0,
  -- Focus & Integrity Monitor signals (see focusMonitor.js on the frontend)
  focus_score      REAL,
  tab_switches     INTEGER NOT NULL DEFAULT 0,
  paste_events     INTEGER NOT NULL DEFAULT 0,
  idle_events      INTEGER NOT NULL DEFAULT 0,
  report_json      TEXT,                -- holistic AI report (strengths/improvements/action plan)
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mode_score ON sessions(mode, average_score);

-- One row per question answered inside a session.
CREATE TABLE IF NOT EXISTS session_answers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id        INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question          TEXT NOT NULL,
  answer            TEXT,
  score             REAL,
  strengths_json    TEXT DEFAULT '[]',
  improvements_json TEXT DEFAULT '[]',
  rubric_json       TEXT,               -- {technical, communication, structure, confidence}
  time_spent        INTEGER DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON session_answers(session_id);

-- Skill Assessment Center: one row per multi-category quiz attempt.
CREATE TABLE IF NOT EXISTS skill_assessments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  categories_json  TEXT NOT NULL,      -- {"DSA": 80, "DBMS": 60, ...} percentage per category
  overall_score    REAL NOT NULL,
  total_questions  INTEGER NOT NULL,
  correct_answers  INTEGER NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_skillassess_user ON skill_assessments(user_id);

CREATE TABLE IF NOT EXISTS notes (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              TEXT,
  content            TEXT,
  tags_json          TEXT DEFAULT '[]',
  color              TEXT DEFAULT '#4f46e5',
  linked_session_id  INTEGER,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);

CREATE TABLE IF NOT EXISTS badges_unlocked (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id     TEXT NOT NULL,
  unlocked_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id      TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS saved_videos (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id    TEXT NOT NULL,
  title       TEXT,
  thumbnail   TEXT,
  url         TEXT,
  channel     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,      -- 'user' | 'assistant'
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);

-- Group Discussion Simulator: one row per completed GD round.
CREATE TABLE IF NOT EXISTS gd_sessions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic             TEXT NOT NULL,
  transcript_json   TEXT NOT NULL,
  score             REAL,
  verdict           TEXT,
  strengths_json    TEXT DEFAULT '[]',
  improvements_json TEXT DEFAULT '[]',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gd_user ON gd_sessions(user_id);

-- Placement Drive: the "journey" wrapper that chains Aptitude -> GD ->
-- Technical -> HR into one simulated recruitment drive with a single
-- pass/fail-style verdict at the end. The individual rounds are
-- already persisted by their own endpoints (sessions, gd_sessions) —
-- this table just records the aggregate outcome.
CREATE TABLE IF NOT EXISTS placement_drives (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company           TEXT,
  role_title        TEXT,
  round_scores_json TEXT NOT NULL,   -- {"aptitude":80,"gd":72,"technical":65,"hr":80}
  verdict           TEXT NOT NULL,    -- Selected | Waitlisted | Not Selected
  eliminated_at     TEXT,             -- round name if eliminated early, else null
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_drives_user ON placement_drives(user_id);

-- Server-side cache of YouTube search results, keyed by normalized
-- query text. Saves free-tier quota (search.list costs 100 units;
-- the daily free quota is 10,000 units = ~100 searches/day).
CREATE TABLE IF NOT EXISTS youtube_cache (
  query        TEXT PRIMARY KEY,
  results_json TEXT NOT NULL,
  cached_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
