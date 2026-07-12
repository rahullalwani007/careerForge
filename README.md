# CareerForge AI

**AI-Based Career Guidance & Skill Assessment System** — a full-stack mini project.

CareerForge AI's centerpiece is a **Placement Drive Simulator** that chains Aptitude (elimination),
Group Discussion, Technical, and HR rounds into one continuous simulation with a real Selected /
Waitlisted / Not Selected outcome — something no generic "AI interview bot" attempts, because it
requires actually knowing how Indian campus recruitment drives work, not just wrapping an LLM. On
top of that sits an adaptive AI mock-interview coach (**ARIA**), a real scored **Skill Assessment
Center**, an AI-generated career roadmap, a resume/JD matcher, a peer leaderboard, and a Focus &
Integrity monitor — built entirely on free-tier services (Groq + the YouTube Data API v3) behind a
proper Node.js/Express/SQLite backend.

> This project was rebuilt from an earlier interview-practice prototype into a distinct "career
> guidance + skill assessment" system, and then rebuilt again around the Placement Drive / Group
> Discussion concept specifically to stand apart from other "AI interview feedback" style projects.
> See [`VIVA_GUIDE.md`](./VIVA_GUIDE.md) for a presentation-ready walkthrough of every decision below
> — it's written so you can explain any part of this codebase confidently in a review.

---

## 1. What makes this different

The single biggest differentiator: **the Group Discussion round.** GD rounds are a real, near-universal
part of Indian campus placements (TCS, Infosys, Wipro, Accenture, Cognizant all run them) that almost
no interview-prep tool covers, because most are modeled on US-style LeetCode/behavioral prep. Building
one requires actually knowing the recruitment process, not just calling an LLM with a bigger prompt.

| Feature | What it does | Where the logic lives |
|---|---|---|
| **Placement Drive Simulator** | Chains Aptitude (hard 40% cutoff, like a real elimination round) → Group Discussion → Technical → HR into one journey, ending in a deterministic Selected/Waitlisted/Not Selected verdict with a disclosed weighting formula. | `frontend/src/pages/PlacementDrivePage.jsx`, `backend/src/routes/drive.js` |
| **Group Discussion Simulator** | 4 AI personas with genuinely different stances debate live; you jump in whenever you want. Scored on initiative, articulation, listening, and assertiveness — including a verdict for talking too little *or* dominating too much. | `frontend/src/pages/GroupDiscussionPage.jsx`, `backend/src/routes/gd.js`, `groqService.js` → `generateGDScenario/generateGDReactions/evaluateGD` |
| **Adaptive Difficulty Engine** | Instead of pre-writing all questions, each *next* question is generated live, calibrated to your rolling score — the same idea behind computerized adaptive testing (GRE/GMAT). | `backend/src/services/groqService.js` → `generateAdaptiveQuestion()` |
| **Skill Assessment Center** | A dedicated, properly-scored multiple-choice test across DSA / OOP / DBMS / OS / Networks / Aptitude, visualized as a radar chart, with a progress-over-time history — separate from interview practice. | `frontend/src/pages/SkillAssessmentPage.jsx`, `backend/src/routes/skillAssessment.js` |
| **Focus & Integrity Monitor** | Tracks tab switches (Page Visibility API), pasted answers, and idle typing gaps during a live session, and turns them into a transparent, hand-computable Focus Score — the same signal real remote-assessment tools use. | `frontend/src/hooks/useFocusMonitor.js` |
| **Peer Leaderboard + Percentile** | "You scored better than X% of everyone practicing this mode" — only possible because sessions now live in a shared SQLite database instead of `localStorage`. | `backend/src/routes/leaderboard.js` |
| **Unified activity tracking** | Streaks and the activity heatmap are computed from a single endpoint that merges interview sessions, GD rounds, skill assessments, and placement drives — doing *any* kind of practice keeps your streak alive, not just one specific mode. | `backend/src/routes/activity.js`, `frontend/src/utils/sessionStats.js` |
| **Multi-dimension rubric + Resume↔JD match** | Every answer is scored on 4 dimensions (technical/communication/structure/confidence), not one number; the resume analyzer does a deterministic keyword-overlap against a pasted job description on top of the AI's qualitative read. | `groqService.js` → `generateFeedback()`, `analyzeResume()` / `keywordMatchScore()` |

Smaller but deliberate touches: ARIA can *speak* questions aloud (Voice Mode, Web Speech API, not
just listen), a downloadable SVG "Certificate of Readiness" / "Offer Letter," and a job board where
each listing shows a computed skill-match % against your profile.

## 2. Architecture

```
                 ┌─────────────────────────┐
   Browser  ───▶ │  React + Vite frontend  │   :5173 (dev)
                 │  (careerforge-ai/frontend)│
                 └────────────┬────────────┘
                              │  /api/*  (fetch, JWT bearer token)
                              ▼
                 ┌─────────────────────────┐
                 │  Express REST API       │   :5000
                 │  (careerforge-ai/backend)│
                 │  auth · profile ·        │
                 │  career-path · interview │
                 │  skill-assessment ·      │
                 │  notes · resume ·        │
                 │  learning · jobs · chat ·│
                 │  badges · leaderboard    │
                 └────┬───────────────┬─────┘
                      │               │
              ┌───────▼──────┐ ┌──────▼───────┐
              │   SQLite DB   │ │   Groq API    │
              │ (better-      │ │ (openai/gpt-  │
              │  sqlite3,     │ │  oss-20b/120b)│
              │  file-based)  │ └──────┬────────┘
              └───────────────┘        │
                                ┌───────▼────────┐
                                │ YouTube Data   │
                                │ API v3 (cached)│
                                └────────────────┘
```

**Why a backend at all, instead of calling Groq straight from the browser (like the earlier
prototype did)?** Three reasons, all worth saying out loud in a review:
1. **Security** — API keys never reach the browser's network tab.
2. **A real multi-user database** is what makes the leaderboard/percentile features possible at all;
   `localStorage` is per-browser and can't be compared across people.
3. **Quota protection** — the backend caches YouTube search results (search costs 100 of your
   10,000 daily free units; caching one popular query can save 99 of those units).

SQLite (`better-sqlite3`) was chosen deliberately over a hosted database: it's a single file, needs
no server process, ships with normal `npm install` (prebuilt binary, no compiler needed), and is
still a *real* relational database with foreign keys, indexes, and joins — see the schema in
`backend/src/db/schema.sql` for the 15-table design (users, profiles, career_paths,
roadmap_progress, sessions, session_answers, skill_assessments, notes, badges_unlocked, saved_jobs,
saved_videos, chat_messages, gd_sessions, placement_drives, youtube_cache).

## 3. Tech stack

- **Frontend:** React 18, React Router, Vite, Tailwind CSS, lucide-react icons. No chart library —
  the radar chart, score rings, and activity heatmap are hand-rolled SVG (see `src/components/`).
- **Backend:** Node.js, Express, `better-sqlite3`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`.
- **AI:** Groq's free tier (`openai/gpt-oss-20b` for latency-sensitive calls,
  `openai/gpt-oss-120b` for career-path/report/resume quality) — see §5 for why the model choice
  matters.
- **External data:** YouTube Data API v3 (free Google Cloud tier), server-cached.

Everything else (voice input/output, tab-switch/paste detection, PDF text extraction, the SVG
certificate export) uses only native browser APIs — zero extra services, zero extra cost.

## 4. Project structure

```
careerforge-ai/
├── backend/
│   ├── src/
│   │   ├── db/            schema.sql, connection, seed script, badge logic
│   │   ├── middleware/     JWT auth guard, error handler
│   │   ├── routes/         one file per resource (auth, interview, gd, drive, skillAssessment, ...)
│   │   ├── services/       groqService.js, youtubeService.js, fallbackData.js
│   │   └── server.js       entry point
│   ├── test_backend.sh     end-to-end smoke test — hits every route with curl, including GD/Drive
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     Navbar, AIAssistant (ARIA chat), SkillRadarChart, CertificateModal, ...
    │   ├── context/        AppContext.jsx — auth + career path + active session state
    │   ├── hooks/          useFocusMonitor.js
    │   ├── pages/           one per route (Dashboard, PlacementDrive, GroupDiscussion, Interview, ...)
    │   ├── services/       api.js (the ONLY place that calls the backend), pdfParser.js
    │   └── utils/          sessionStats.js (streaks, heatmap — pure functions)
    ├── .env.example
    └── package.json
```

## 5. Setup

### Requirements
Node.js 18+ and npm. That's it — SQLite ships as a prebuilt binary inside `better-sqlite3`, no
separate database server to install.

### Get your free API keys (optional — the app runs without them)
- **Groq** (LLM): sign up free at <https://console.groq.com>, create an API key.
  - ⚠️ **Model note:** Groq deprecated `llama-3.1-8b-instant` in June 2026, which is what most
    tutorials still show. This project already uses the replacement models Groq recommends
    (`openai/gpt-oss-20b` / `120b`), configured in `backend/.env`. If Groq changes its lineup again,
    change `GROQ_MODEL_FAST`/`GROQ_MODEL_QUALITY` in one place — nothing else needs to change.
- **YouTube Data API v3** (Google Cloud, free): console.cloud.google.com → enable "YouTube Data API
  v3" → Credentials → API key.

Without either key, every AI/YouTube feature still works using curated fallback content (useful for
a zero-setup demo) — the app tells you which mode it's in via `/api/health`.

### Run it (two terminals)

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env        # already has working defaults; add real keys if you have them
npm start                    # → http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                  # → http://localhost:5173
```

Open `http://localhost:5173`. The backend seeds ~20 realistic demo accounts with practice history on
first boot (see §7) so the Leaderboard and Percentile features have something to show immediately.

To reset to a completely empty database: `cd backend && npm run reset-db`.

## 6. Feature list (full)

**The Placement Drive (headline feature)**
- One continuous simulation chaining 4 rounds: Aptitude (hard 40% cutoff) → Group Discussion →
  Technical → HR, ending in a deterministic Selected / Waitlisted / Not Selected verdict
- Group Discussion Simulator standalone mode too: pick or randomize a topic, 4 AI personas with
  real disagreement, jump in whenever you want, get scored on initiative/articulation/listening/
  assertiveness — plus a "talked too little vs. dominated" axis nothing else measures
- Both persist history (`gd_sessions`, `placement_drives`) and feed into badges

**Career guidance**
- Resume/skills/target-role onboarding → AI-generated personalized roadmap (phases, skill gaps,
  recommended topics, target companies/salary band)
- Roadmap progress tracking, regenerate-on-demand
- ARIA chat assistant, aware of your current page, career path, and last session — can navigate the
  app for you ("go to notes")
- Job board with a deterministic skill-match % per listing, saved jobs, recommended tab

**Skill assessment**
- Dedicated multi-category MCQ Skill Assessment Center with a radar chart and history-over-time
- Mock interview practice in 4 modes (Technical, HR/Behavioral, Aptitude, System Design), each with
  Easy/Medium/Hard difficulty and optional company-style flavoring (Amazon, Google, Meta, ...)
- Code Mode: real coding problems with an in-browser JS test runner (multi-language problem
  statements; live pass/fail execution for JavaScript)
- Adaptive Difficulty Engine (see §1) for the three conversational modes
- 4-dimension rubric per answer + holistic end-of-session AI report
- Resume ATS scoring + optional job-description keyword match
- Focus & Integrity Monitor + Peer Leaderboard/Percentile (see §1)

**Supporting features**
- Notes with AI enhance/summarize/flashcard actions
- YouTube Learning Hub, keyed off your career path's recommended topics
- Streaks, activity heatmap, 19 unlockable badges (including GD and Drive specific ones)
- Voice Mode (ARIA speaks questions) + voice dictation for answers
- Downloadable SVG "Certificate of Readiness" / "Offer Letter," print-friendly report, LinkedIn share

## 7. About the seeded demo data

`backend/src/db/seed.js` runs automatically the first time the server starts (control with
`AUTO_SEED=false` in `.env`) and inserts ~20 realistic practice accounts (`@seed.careerforge.ai`
emails) with randomized-but-plausible session history. This is what makes the Leaderboard and
Percentile features look populated from the very first run, instead of showing "not enough data" —
completely normal for a demo, and worth mentioning plainly if asked ("these are seed accounts to
demonstrate the benchmarking feature; in real use it grows from real users"). Remove them anytime:
`DELETE FROM users WHERE email LIKE '%@seed.careerforge.ai'`, or just `npm run reset-db`.

## 8. Known limitations / future scope

- Code Mode only executes JavaScript live in-browser; Python/Java/C++ show the problem but don't run
  (running arbitrary code in 4 languages safely needs a sandboxed execution service, out of scope for
  a free-tier project).
- Camera-based presence/eye-contact analysis was considered and deliberately **not** shipped — it
  would need a model file fetched from a CDN at runtime, which is a fragile dependency for a live
  demo. The Focus & Integrity Monitor (tab-switch/paste/idle, all native browser APIs) was chosen
  instead as a reliable alternative that measures a related signal.
- Auth is email/password + guest only (no Google OAuth) — deliberately, to avoid depending on a
  Firebase/OAuth project the grader can't set up in 30 seconds.

## 9. License / credits

Built for academic (mini-project) submission. Uses Groq's free API tier and the YouTube Data API v3
free quota. No paid services required.
