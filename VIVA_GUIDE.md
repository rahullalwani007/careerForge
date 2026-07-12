# Viva / Presentation Guide

A cheat sheet for explaining this project confidently — organized as: what to say, why it's true,
and where the code backs it up. Read this once before your review; you don't need to memorize it.

## 30-second pitch

> "CareerForge AI is an AI-based career guidance and skill assessment system. Its centerpiece is a
> Placement Drive Simulator — it chains an Aptitude elimination round, a Group Discussion with 4 AI
> participants, a Technical round, and an HR round into one continuous simulation with a real
> Selected/Waitlisted/Not Selected outcome. On top of that there's an adaptive AI mock-interview coach
> called ARIA, a separately-scored Skill Assessment Center with a radar-chart breakdown, and an
> AI-generated career roadmap — all backed by a real Express/SQLite backend, not just a frontend
> calling an API directly. It runs entirely on free-tier services: Groq for the language model, and
> the YouTube Data API for learning resources."

## Architecture — the 90-second version

Draw (or point to) this while talking:

```
Browser → React frontend (Vite) → REST API (Express) → SQLite (data) + Groq (AI) + YouTube API
```

Say: *"The frontend never talks to Groq or YouTube directly — every request goes through our own
backend first. That's deliberate: it keeps the API keys off the browser, it lets us cache YouTube
results to protect our free quota, and — most importantly — it gives us a real shared database, which
is what makes cross-user features like the leaderboard possible at all. A pure frontend app using
localStorage can never compare your score to someone else's, because there's no shared place for
that data to live."*

If asked **"why SQLite and not MySQL/PostgreSQL/MongoDB?"**:
> "SQLite is a single file — `better-sqlite3` ships a prebuilt binary, so `npm install` just works,
> no separate database server to install or configure. It's still a real relational database with
> foreign keys and indexes (see `schema.sql` — 11 tables, proper `REFERENCES ... ON DELETE CASCADE`).
> For a project this size that has to run on a grader's laptop with zero setup, that reliability
> matters more than PostgreSQL's extra features."

## Feature-by-feature: what to say, and the one question it invites

### 0. Placement Drive Simulator (lead with this one)
**Say:** "This is the centerpiece. Instead of practicing isolated interview questions, you go through
an entire simulated drive: Aptitude first, which is a hard elimination gate at 40% — score below that
and the drive ends immediately, exactly like a real campus screening round. Clear it, and you move
through Group Discussion, Technical, and HR, and at the end we compute a weighted score — Technical
carries the most weight at 45%, then HR at 30%, then GD at 25% — and translate that into Selected,
Waitlisted, or Not Selected. The whole verdict formula is disclosed and deterministic, on purpose —
it's arithmetic you can check by hand, not another AI judgment call." *(Code: `backend/src/routes/drive.js`
→ `computeVerdict()`; frontend: `PlacementDrivePage.jsx`)*

**Likely question: "Why those specific weights?"**
Answer: "They approximate how most Indian campus drives actually weight rounds in practice — technical
ability matters most, but GD and HR are real signals too, not afterthoughts. It's a judgment call, and
I can defend it, but it's not arbitrary."

### 1. Group Discussion Simulator
**Say:** "This is the feature I'm most confident nobody else in this review has built, because it
requires knowing that GD rounds are a real, near-universal part of Indian placements — TCS, Infosys,
Wipro, Accenture all run them — and most interview-prep tools are modeled on US-style behavioral/
LeetCode prep, which doesn't have an equivalent. Four AI personas with genuinely different stances
open the discussion, you jump in whenever you want, and after each contribution 1-2 personas react —
sometimes directly challenging what you just said. At the end, ARIA scores you on initiative,
articulation, listening, and assertiveness, with a verdict that can be 'Needs to Speak Up More' just
as easily as 'Overly Dominant' — most tools only ever tell you to talk more; this can tell you to talk
less." *(Code: `backend/src/routes/gd.js`, `groqService.js` → `generateGDScenario/generateGDReactions/evaluateGD`)*

**Likely question: "How do the personas know what to say?"**
Answer: "Each reaction call gets the full transcript so far, including your last message, and is asked
to react to what was JUST said — often directly to the candidate's point. If you look at a real
transcript, you'll see a persona reference the specific thing you argued." *(Show a transcript live if
possible — it's the most convincing thing in the whole demo.)*

### 2. Adaptive Difficulty Engine
**Say:** "Instead of generating all 5 questions upfront, we generate one question at a time. After
each answer, we tell the model the rolling average score and the most recent score, and it decides
whether to go deeper (if you're doing well) or step back to fundamentals (if you're struggling) —
the same underlying idea as computerized adaptive testing, which the GRE and GMAT use."

**Likely question: "How do you prevent it repeating a question?"**
Answer: "We pass the full list of already-asked questions into the prompt and explicitly instruct
the model not to repeat them, and we also check client-side that the returned question isn't an
exact match before accepting it." *(Code: `groqService.js` → `generateAdaptiveQuestion`)*

**Likely question: "What if the AI call fails?"**
Answer: "Every AI call in this project has a fallback. For adaptive questions specifically, we fall
back to an unseen question from a curated static bank for that mode." *(Same function, `fbUnseen`)*

### 3. Skill Assessment Center
**Say:** "This is a separate, dedicated module from interview practice — you pick categories (DSA,
OOP, DBMS, OS, Networks, Aptitude), take a real multiple-choice test, and get scored deterministically
— we compare your selected option index against the correct index, no AI judgment involved in the
scoring itself. The AI's job is just to generate fair questions; grading is 100% deterministic
arithmetic." *(Backend: `routes/skillAssessment.js`; frontend: `SkillAssessmentPage.jsx`)*

**Likely question: "Why is this different from the Aptitude interview mode?"**
Answer: "Aptitude interview mode asks you to explain your reasoning in free text, like a real
screening round would — the AI evaluates your explanation qualitatively. The Skill Assessment
Center is a stricter, faster, objectively-graded test, more like a certification exam. They serve
different purposes on purpose."

### 4. Focus & Integrity Monitor
**Say:** "During a live session we track three signals with plain browser APIs: tab switches via the
Page Visibility API, pasted answers via the native paste event, and idle gaps by checking time since
the last keystroke every 2 seconds. We turn that into a Focus Score with a fully disclosed formula —
start at 100, subtract 8 per tab switch, 10 per paste, 4 per idle gap, floor at zero. It's the same
category of signal real remote-assessment platforms use, built from first principles instead of a
third-party proctoring SDK." *(Code: `hooks/useFocusMonitor.js`)*

**Likely question: "Doesn't a paste always mean cheating?"**
Answer: "No — it's a soft signal, not an accusation. Someone might paste a note they wrote in another
tab. That's why it's a score contribution, not a hard block."

### 5. Peer Leaderboard & Percentile
**Say:** "This runs two SQL queries: one groups all sessions by user and averages their score for the
leaderboard, the other counts how many historical sessions scored at or below yours to compute a
percentile. Both are only possible because sessions live in a shared database now instead of each
browser's own localStorage." *(Code: `routes/leaderboard.js`)*

**Likely question: "Where did all this history come from if I just installed it?"**
Answer, said plainly: "We seed about 20 realistic demo accounts with randomized practice history on
first boot, specifically so this feature has something meaningful to show immediately instead of
saying 'not enough data.' They're clearly tagged (`@seed.careerforge.ai` email domain) and documented
in the README — in a real deployment this would grow from actual users." *(Don't be evasive about
this if asked — it's a completely normal and transparent thing to do, and the code comments say so.)*

### 6. Multi-dimension rubric + Resume/JD match
**Say:** "Instead of one opaque score, every answer is rated on four dimensions — technical depth,
communication, structure, confidence — all from the same AI call (we just ask for a richer JSON
shape, so it costs nothing extra). The resume analyzer layers something more classic underneath the
AI: we tokenize the pasted job description, strip stopwords, and compute a literal keyword-overlap
percentage against the resume — a real (if simple) information-retrieval technique, not just another
prompt." *(Code: `groqService.js` → `generateFeedback`, `keywordMatchScore`)*

## "What would you add next?" (a favorite panel question)

Answer with the camera-based idea from the README's limitations section: *"We considered a webcam-based
presence/eye-contact analysis using an on-device model like MediaPipe, and decided against shipping
it because it depends on fetching a model file from an external CDN at runtime — too fragile for a
live demo. The Focus & Integrity Monitor we built instead measures a related signal using only
native, permission-free browser APIs. Given more time, running that vision model fully offline with a
bundled model file would be the natural next step."* This shows you evaluated a tradeoff deliberately,
not that you ran out of time.

## Live demo script (safe order)

1. **Register / continue as guest** → onboarding (pick a role, add 2-3 skills, skip resume for speed)
   → career path generates.
2. **Dashboard** — point out the Placement Drive banner (flagship feature, impossible to miss), the
   readiness %, streak, and the Peer Leaderboard widget.
3. **Placement Drive** — pick a company, start the drive. Answer the aptitude questions (deliberately
   get a couple wrong is fine, just clear 40%). In the GD round, contribute once or twice — narrate
   that a persona is reacting to what you just said. Do 1 technical + 1 HR question each (you can
   trim to keep time). Land on the final verdict screen and show the round-by-round breakdown.
4. **Group Discussion (standalone)** — briefly show it also works as its own mode, not just inside a
   drive, in case there isn't time to redo it live.
5. **Skill Assessment** — pick 2 categories, 3 questions each, answer, submit → show the radar chart.
6. **Interview** — Technical mode, turn on **Adaptive Difficulty**, answer 2 questions — narrate that
   the second question's difficulty visibly reacts to your last score.
7. **Report** — show the rubric radar, Focus Score, and percentile card.

Keep the whole demo under 6-7 minutes; the Placement Drive alone (steps 2-3) demonstrates the most
"unexpected" ground if time is very short — it's the one thing you can say with confidence no one
else in the room built.

## If the internet/Groq is down during your demo

Say this, don't panic: *"Every AI call in this app has a curated fallback — if Groq is unreachable
right now, you're seeing pre-written but still fully functional content instead of an error. That's
a deliberate design choice, not a workaround I added because something broke."* Then keep going —
the app is designed to behave identically either way except for content originality.
