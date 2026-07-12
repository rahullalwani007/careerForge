const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Single shared connection for the whole backend process.
// SQLite is file-based — this is the entire "database server":
// no separate service to install or run, which is exactly why it's
// a good fit for a free-tier mini project (zero hosting cost).
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'careerforge.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

migrate();

module.exports = db;
