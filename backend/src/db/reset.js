// Deletes the local SQLite database file so the next server start
// creates a fresh, empty schema. Handy before a live demo/viva if
// you want to show the "first run" experience.
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'careerforge.db');

for (const suffix of ['', '-wal', '-shm']) {
  const p = DB_PATH + suffix;
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Removed ${p}`);
  }
}
console.log('Database reset. Run "npm run seed" to add demo leaderboard data again.');
