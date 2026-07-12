require('dotenv').config();
const express = require('express');
const cors = require('cors');

const db = require('./db'); // running this import also runs the migration
const seed = require('./db/seed');
const { errorHandler } = require('./middleware/errorHandler');
const groq = require('./services/groqService');
const youtube = require('./services/youtubeService');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Auto-seed demo leaderboard data on first boot only (no-op if it
// already ran). See src/db/seed.js for what this creates.
if (process.env.AUTO_SEED !== 'false') {
  try { seed({ silent: true }); } catch (e) { console.warn('Seed skipped:', e.message); }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiMode: groq.isMockMode() ? 'mock-fallback (no GROQ_API_KEY set)' : 'live (Groq)',
    youtubeMode: youtube.isConfigured() ? 'live (YouTube Data API v3)' : 'mock-fallback (no YOUTUBE_API_KEY set)',
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/career-path', require('./routes/careerPath'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/skill-assessment', require('./routes/skillAssessment'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/gd', require('./routes/gd'));
app.use('/api/drive', require('./routes/drive'));
app.use('/api/activity', require('./routes/activity'));

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n  CareerForge AI backend running → http://localhost:${PORT}`);
  console.log(`  AI mode:       ${groq.isMockMode() ? 'MOCK fallback data (set GROQ_API_KEY in .env for real AI)' : 'LIVE Groq'}`);
  console.log(`  YouTube mode:  ${youtube.isConfigured() ? 'LIVE YouTube Data API v3' : 'MOCK fallback data (set YOUTUBE_API_KEY in .env)'}`);
  console.log(`  Database:      ${process.env.DB_PATH || 'data/careerforge.db'}\n`);
});
