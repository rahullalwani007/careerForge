// ================================================================
// Groq AI service.
//
// Every call in this file follows the same shape:
//   1. Build a system + user prompt.
//   2. Call Groq.
//   3. Parse JSON out of the response defensively.
//   4. On ANY failure (missing key, network error, bad JSON,
//      rate limit) return curated fallback content instead of
//      throwing. Routes never have to think about "what if the
//      AI is down" — this module has already handled it.
//
// Model notes (also see backend README section "About the AI
// model"): llama-3.1-8b-instant (what most Groq tutorials still
// show) was deprecated by Groq in June 2026. This app uses the
// replacement Groq recommends: openai/gpt-oss-20b for fast,
// latency-sensitive calls and openai/gpt-oss-120b for the few
// calls where quality matters more than speed (career path,
// resume analysis, final report). Both are free-tier models.
// ================================================================

const fallback = require('./fallbackData');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_FAST = process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b';
const MODEL_QUALITY = process.env.GROQ_MODEL_QUALITY || 'openai/gpt-oss-120b';
const REASONING_EFFORT = process.env.GROQ_REASONING_EFFORT || 'low';

function isConfigured() {
  const key = process.env.GROQ_API_KEY;
  return !!key && key !== 'your_groq_api_key_here';
}

async function callGroq(system, user, { model = MODEL_FAST, maxTokens = 900, temperature = 0.7, json = true, reasoningEffort = REASONING_EFFORT } = {}) {
  if (!isConfigured()) throw new Error('GROQ_NOT_CONFIGURED');

  const body = {
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    max_completion_tokens: maxTokens,
    temperature,
    include_reasoning: false, // we only want the final answer, not the chain-of-thought
    reasoning_effort: reasoningEffort,
  };
  if (json) body.response_format = { type: 'json_object' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Groq responded ${r.status}`);
    }
    const data = await r.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timeout);
  }
}

// Defensively extract a JSON object/array from a model response even
// if it wrapped the JSON in markdown fences or added stray text.
function parseJSON(text) {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = clean.match(/([[{][\s\S]*[}\]])/);
    return match ? JSON.parse(match[1]) : JSON.parse(clean);
  } catch {
    return null;
  }
}

function normalizeQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(q => {
      if (typeof q === 'string') return { question: q, hints: [] };
      if (q && typeof q === 'object') return { question: q.question || q.q || q.text || '', hints: q.hints || q.tips || [] };
      return { question: String(q), hints: [] };
    })
    .filter(q => q.question);
}

function normalizeMCQ(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(q => ({
      question: q.question || q.q || '',
      options: q.options || q.opts || q.choices || [],
      correct: typeof q.correct === 'number' ? q.correct : 0,
      explanation: q.explanation || q.exp || q.explain || '',
      category: q.category,
    }))
    .filter(q => q.question);
}

// ── Career Path ──────────────────────────────────────────────────
async function generateCareerPath({ resumeText, targetRole, currentLevel, skills }) {
  const fb = fallback.getFallbackCareerPath(targetRole, currentLevel);
  try {
    const resumeCtx = resumeText ? `\nResume/Background:\n${resumeText.substring(0, 800)}` : '';
    const skillsCtx = skills?.length ? `\nCurrent skills: ${skills.join(', ')}` : '';
    const sys = 'You are ARIA, a senior career counselor for the CareerForge AI platform. Generate a comprehensive, personalized career path as JSON only, no markdown.';
    const user = `Target Role: ${targetRole}\nCurrent Level: ${currentLevel}${skillsCtx}${resumeCtx}\n\nReturn JSON exactly matching this shape:\n{"targetRole":"${targetRole}","currentLevel":"${currentLevel}","overview":"2-3 sentence overview","estimatedTimeline":"X months","readinessPercent":40,"keySkillsNeeded":["skill1","skill2","skill3"],"skillsYouHave":["skill1","skill2"],"skillGaps":["gap1","gap2","gap3"],"learningRoadmap":[{"phase":1,"title":"Foundation","duration":"2 weeks","topics":["topic1"],"description":"Focus area"}],"interviewPrepPriority":[{"type":"technical","priority":1,"focus":"area","topics":["t1"]},{"type":"hr","priority":2,"focus":"area","topics":["t1"]}],"recommendedTopics":["Topic 1","Topic 2","Topic 3","Topic 4","Topic 5"],"jobTitles":["Title 1","Title 2"],"salaryRange":"₹X LPA - ₹Y LPA","topCompanies":["Co1","Co2","Co3"],"nextStep":"Most important next action"}`;
    const txt = await callGroq(sys, user, { model: MODEL_QUALITY, maxTokens: 1600 });
    const parsed = parseJSON(txt);
    if (parsed?.keySkillsNeeded) {
      if (Array.isArray(parsed.recommendedTopics)) {
        parsed.recommendedTopics = parsed.recommendedTopics.map(t => (typeof t === 'string' ? t : t.topic || t.title || JSON.stringify(t)));
      }
      return parsed;
    }
  } catch {}
  return fb;
}

// ── Interview Questions (batch — used for aptitude/coding/non-adaptive) ──
async function generateQuestions(config) {
  const { roleId, roleTitle, resumeText, questionCount = 5, difficulty, mode = 'technical',
    aptitudeTopic, aptitudeTopicLabel, companyTraits = '', companyName = '' } = config;

  if (mode === 'aptitude') {
    const fb = normalizeMCQ(fallback.getFallbackMCQ(aptitudeTopic || 'dsa', questionCount));
    try {
      const sys = 'You are ARIA, an interview question generator. Return ONLY a JSON object of the shape {"questions":[{"question":"Q?","options":["A","B","C","D"],"correct":0,"explanation":"Reason"}]}.';
      const user = `${questionCount} multiple-choice questions on ${aptitudeTopicLabel || 'Data Structures'}. Mix easy and medium difficulty.`;
      const txt = await callGroq(sys, user, { maxTokens: 1400 });
      const parsed = parseJSON(txt);
      const list = Array.isArray(parsed) ? parsed : parsed?.questions;
      if (Array.isArray(list) && list.length >= questionCount) return normalizeMCQ(list.slice(0, questionCount));
    } catch {}
    return fb;
  }

  let fb;
  if (mode === 'hr') fb = normalizeQuestions(fallback.getFallbackHRQuestions(questionCount));
  else if (mode === 'system-design') fb = normalizeQuestions(fallback.getFallbackSystemDesignQuestions(questionCount));
  else fb = normalizeQuestions(fallback.getFallbackQuestions(roleId, questionCount));

  try {
    const modeCtx = mode === 'hr'
      ? 'behavioral / HR / situational questions (use STAR method). Include a hint in each question.'
      : mode === 'system-design'
      ? 'system design and architecture questions'
      : `technical coding/concept questions for a ${roleTitle || 'Software Engineer'} at ${difficulty} level`;
    const resumeCtx = resumeText ? `\nCandidate context:\n${resumeText.substring(0, 500)}` : '';
    const companyCtx = companyTraits ? `\n\nIMPORTANT: These questions are for a ${companyName} interview. Style accordingly: ${companyTraits}` : '';
    const sys = `You are ARIA, an expert ${companyName ? companyName + ' ' : ''}interviewer. Return ONLY a JSON object: {"questions":[{"question":"Q?","hints":["hint1","hint2"]}]}${companyCtx}`;
    const user = `Generate ${questionCount} ${modeCtx} questions.${resumeCtx}`;
    const txt = await callGroq(sys, user, { maxTokens: 900 });
    const parsed = parseJSON(txt);
    const list = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (Array.isArray(list) && list.length >= questionCount) {
      const normalized = normalizeQuestions(list.slice(0, questionCount));
      if (normalized.length >= questionCount) return normalized;
    }
  } catch {}
  return fb;
}

// ── Adaptive next-question generation ────────────────────────────
// Powers the Adaptive Difficulty Engine: instead of a fixed batch of
// pre-written questions, technical/HR/system-design sessions ask for
// ONE new question at a time, calibrated to how the candidate has
// been doing so far (like computerized adaptive testing — GRE/GMAT
// use the same underlying idea).
async function generateAdaptiveQuestion(config, history) {
  const { roleTitle, difficulty = 'medium', mode = 'technical', companyName = '', companyTraits = '' } = config;
  const askedQuestions = history.map(h => h.question);
  const avg = history.length ? history.reduce((s, h) => s + (h.score || 0), 0) / history.length : 5;
  const lastScore = history.length ? history[history.length - 1].score : 5;

  // Fallback: grab an unseen question from the static bank.
  const fbPool = mode === 'hr' ? fallback.HR_QUESTIONS
    : mode === 'system-design' ? fallback.SYSTEM_DESIGN_QUESTIONS
    : (fallback.MOCK_QUESTIONS[config.roleId] || fallback.MOCK_QUESTIONS.default);
  const fbUnseen = fbPool.filter(q => !askedQuestions.includes(q));
  const fb = { question: fbUnseen[0] || fbPool[Math.floor(Math.random() * fbPool.length)], hints: [] };

  try {
    const direction = lastScore >= 8
      ? 'The candidate is doing very well. Go deeper on a related, harder aspect, or probe a more advanced follow-up in the same theme.'
      : lastScore <= 4
      ? 'The candidate is struggling. Step back to a more fundamental question, ideally on a different sub-topic, to rebuild confidence.'
      : 'The candidate is doing reasonably. Ask a new question of similar difficulty on a related but different sub-topic.';
    const companyCtx = companyTraits ? ` Style the question the way ${companyName} would ask it: ${companyTraits}` : '';
    const sys = `You are ARIA, an adaptive AI interviewer for a ${mode} interview at ${difficulty} difficulty for a ${roleTitle || 'Software Engineer'} candidate.${companyCtx}
Rolling average score so far: ${avg.toFixed(1)}/10. Most recent answer scored: ${lastScore}/10.
${direction}
Never repeat a question already asked. Return ONLY JSON: {"question":"...","hints":["hint1","hint2"]}`;
    const user = `Questions already asked:\n${askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') || '(none yet — this is the first question)'}\n\nGenerate the next question now.`;
    const txt = await callGroq(sys, user, { maxTokens: 350 });
    const parsed = parseJSON(txt);
    if (parsed?.question && !askedQuestions.includes(parsed.question)) {
      return { question: parsed.question, hints: Array.isArray(parsed.hints) ? parsed.hints : [] };
    }
  } catch {}
  return fb;
}

// ── Evaluate a conversational answer (with multi-dimension rubric) ──
async function generateFeedback(question, answer, mode = 'technical', difficulty = 'medium') {
  if (!answer || answer.trim().length < 10) {
    return { score: 2, strengths: ['Attempt made'], improvements: ['Please provide a more detailed answer'], explanation: '', tags: [], rubric: { technical: 2, communication: 2, structure: 2, confidence: 2 } };
  }
  const fb = fallback.getFallbackFeedback();
  try {
    const criteria = mode === 'hr'
      ? 'STAR structure, communication clarity, authenticity, examples'
      : mode === 'system-design'
      ? 'system understanding, scalability thinking, trade-off analysis, architecture clarity'
      : 'technical accuracy, depth of knowledge, problem-solving approach, code quality';
    const sys = `You are ARIA, a strict, no-nonsense technical interviewer grading a candidate's answer. Your #1 job is to discriminate correctly between weak and strong answers — do NOT default to a "safe" middle score.

Grade using this scale, based on ${criteria}:
1-2 = blank, nonsensical, entirely wrong, or completely off-topic.
3-4 = attempts the question but is largely incorrect, very shallow, or reveals a fundamental misunderstanding.
5-6 = partially correct: gets the general idea but has real gaps, errors, or missing depth.
7-8 = solid and mostly correct, reasonably complete, minor gaps at most.
9-10 = excellent: correct, thorough, well-communicated, and shows real depth.

Read the actual answer below and judge it on its merits — a wrong or empty answer MUST score 1-4, not 6-7. Return ONLY JSON in exactly this shape (the numbers here are placeholders showing the required format, not a suggested score):
{"score":<1-10>,"strengths":["strength1","strength2"],"improvements":["improve1","improve2"],"explanation":"ideal approach in 2 sentences","tags":["Tag1","Tag2"],"rubric":{"technical":<1-10>,"communication":<1-10>,"structure":<1-10>,"confidence":<1-10>}}
rubric.technical = depth of correct knowledge, rubric.communication = clarity/articulation, rubric.structure = how well-organized the answer was, rubric.confidence = decisiveness/hedging. All values are integers 1-10.`;
    const user = `Mode: ${mode} | Difficulty: ${difficulty} | Criteria: ${criteria}\nQ: ${question}\nA: ${answer}`;
    const txt = await callGroq(sys, user, { maxTokens: 550, temperature: 0.3, reasoningEffort: 'medium' });
    const parsed = parseJSON(txt);
    if (typeof parsed?.score === 'number' && !Number.isNaN(parsed.score)) {
      const score = Math.min(10, Math.max(1, Math.round(parsed.score)));
      return {
        score,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter(Boolean) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter(Boolean) : [],
        explanation: parsed.explanation || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        rubric: {
          technical: clamp10(parsed.rubric?.technical, score),
          communication: clamp10(parsed.rubric?.communication, score),
          structure: clamp10(parsed.rubric?.structure, score),
          confidence: clamp10(parsed.rubric?.confidence, score),
        },
      };
    }
  } catch {}
  return fb;
}

function clamp10(v, fallbackVal) {
  const n = typeof v === 'number' ? v : fallbackVal;
  return Math.min(10, Math.max(1, Math.round(n)));
}

// ── Holistic session report ──────────────────────────────────────
async function generateSystemReport(timeline, config) {
  const { roleTitle = 'Software Engineer', mode = 'technical' } = config || {};
  if (!timeline || !timeline.length) return fallback.getFallbackSummary(5, roleTitle, mode);

  const scores = timeline.map(t => t.score || 0);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const fb = fallback.getFallbackSummary(avg, roleTitle, mode);
  try {
    const qa = timeline.slice(0, 8).map((t, i) => `Q${i + 1}: ${t.question}\nA: ${(t.answer || '').substring(0, 200)}\nScore: ${t.score || 0}/10`).join('\n\n');
    const sys = `You are ARIA, a career coach writing a holistic session report. Base your judgment on the ACTUAL mechanical average given below and the actual answers — do not be more generous than the data supports.
Map readinessLevel strictly to the mechanical average: 8.5-10 = Exceptional, 7-8.4 = Strong Candidate, 5.5-6.9 = Interview Ready, 3.5-5.4 = Needs Preparation, below 3.5 = Not Ready.
Return ONLY JSON in exactly this shape (the overallScore number below is a placeholder, not a suggested value):
{"overallScore":<match the mechanical average>,"readinessLevel":"...","summary":"2-3 sentence verdict","strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"],"actionPlan":["a1","a2","a3"]}`;
    const user = `Role: ${roleTitle} | Mode: ${mode} | Mechanical average: ${avg}/10\n\n${qa}`;
    const txt = await callGroq(sys, user, { model: MODEL_QUALITY, maxTokens: 800, temperature: 0.4, reasoningEffort: 'medium' });
    const parsed = parseJSON(txt);
    if (parsed?.readinessLevel) return { ...fb, ...parsed, overallScore: parseFloat(avg) };
  } catch {}
  return { ...fb, overallScore: parseFloat(avg) };
}

// ── Coding problems ───────────────────────────────────────────────
async function generateCodingQuestion(config) {
  const { difficulty = 'medium', roleTitle = 'Software Engineer' } = config;
  const fb = fallback.CODING_PROBLEMS[Math.floor(Math.random() * fallback.CODING_PROBLEMS.length)];
  try {
    const diffMap = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    const diff = diffMap[difficulty] || 'Medium';
    const sys = `You are ARIA, a coding interview problem generator. Return ONLY valid JSON — no markdown, no backticks.
Generate a ${diff} coding problem suitable for a ${roleTitle} interview.
The function name should be camelCase. testCases.callCode must be valid JavaScript like functionName(arg1, arg2).
Expected values in testCases must be actual JSON values (arrays, numbers, booleans, strings).`;
    const user = `Return JSON matching this structure exactly:
{"id":"unique-id","title":"Problem Title","difficulty":"${diff}","tags":["tag1","tag2"],"description":"Clear problem description with examples in backticks","examples":[{"input":"param = value","output":"result","explanation":"why"}],"constraints":["constraint 1"],"testCases":[{"callCode":"funcName(arg)","expected":"value","hidden":false},{"callCode":"funcName(arg)","expected":"value","hidden":false},{"callCode":"funcName(arg)","expected":"value","hidden":false},{"callCode":"funcName(arg)","expected":"value","hidden":true},{"callCode":"funcName(arg)","expected":"value","hidden":true}],"startCode":{"javascript":"function funcName(params) {\\n  \\n}","python":"def func_name(params):\\n    pass","java":"public type funcName(params) {\\n    \\n}","cpp":"type funcName(params) {\\n    \\n}"},"hints":["hint 1","hint 2"],"timeComplexity":"O(n)","spaceComplexity":"O(1)"}`;
    const txt = await callGroq(sys, user, { maxTokens: 1300 });
    const parsed = parseJSON(txt);
    if (parsed?.title && parsed?.testCases?.length >= 3 && parsed?.startCode?.javascript) return parsed;
  } catch {}
  return fb;
}

async function evaluateCode(code, problem, testResults, language) {
  const passing = testResults.filter(r => r.passed).length;
  const total = testResults.length || 1;
  const baseScore = Math.round((passing / total) * 10 * 10) / 10;
  try {
    const sys = `You are ARIA, a code reviewer. Evaluate this submission briefly. Return ONLY JSON:
{"score":8,"strengths":["s1","s2"],"improvements":["i1","i2"],"explanation":"one sentence","timeComplexity":"O(n)","tags":["tag1"]}
score must be between ${baseScore} and ${Math.min(10, baseScore + 1.5)}, based on code quality on top of test correctness.`;
    const user = `Problem: ${problem.title} (${problem.difficulty})\nLanguage: ${language}\nTest Results: ${passing}/${total} passed\nCode:\n${code.substring(0, 600)}`;
    const txt = await callGroq(sys, user, { maxTokens: 400, temperature: 0.3, reasoningEffort: 'medium' });
    const parsed = parseJSON(txt);
    if (typeof parsed?.score === 'number' && !Number.isNaN(parsed.score)) {
      return {
        score: Math.min(10, Math.max(0, parsed.score)),
        strengths: parsed.strengths || [], improvements: parsed.improvements || [],
        explanation: parsed.explanation || '', tags: parsed.tags || [], timeComplexity: parsed.timeComplexity || '',
        testsPassed: passing, testsTotal: total,
      };
    }
  } catch {}
  return {
    score: baseScore,
    strengths: passing === total ? ['All test cases passed!'] : passing > 0 ? [`${passing}/${total} test cases passed`] : [],
    improvements: passing < total ? [`${total - passing} test case(s) failed — check edge cases`] : [],
    explanation: passing === total ? 'All test cases passed.' : `Passed ${passing} of ${total} test cases.`,
    tags: [], timeComplexity: '', testsPassed: passing, testsTotal: total,
  };
}

// ── Skill Assessment Center quiz ─────────────────────────────────
async function generateSkillQuiz(categories, perCategory = 4) {
  const fb = fallback.getFallbackSkillQuiz(categories, perCategory);
  try {
    const labels = categories.map(c => fallback.SKILL_CATEGORY_LABELS[c] || c);
    const sys = `You are ARIA, a skill-assessment quiz generator. Return ONLY a JSON object: {"questions":[{"question":"Q?","options":["A","B","C","D"],"correct":0,"explanation":"why","category":"category_key"}]}. Use the exact category key given, not the label.`;
    const user = `Generate ${perCategory} multiple-choice questions for EACH of these categories: ${categories.map((c, i) => `${c} (${labels[i]})`).join(', ')}. Mix easy and medium difficulty. Total questions = ${categories.length * perCategory}.`;
    const txt = await callGroq(sys, user, { maxTokens: 2000 });
    const parsed = parseJSON(txt);
    const list = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (Array.isArray(list) && list.length >= categories.length * perCategory * 0.6) return normalizeMCQ(list);
  } catch {}
  return fb;
}

// ── Resume analysis (+ optional job description match) ───────────
async function analyzeResume(resumeText, targetRole, jobDescription) {
  const fbResult = {
    atsScore: 68,
    sections: { experience: 72, skills: 65, education: 80, projects: 55 },
    strengths: ['Clear work experience section', 'Technical skills listed', 'Education details present'],
    missing: ['Quantified achievements (e.g. "improved performance by 30%")', 'Action verbs in bullet points', 'Keywords matching the job description'],
    improvements: [
      { original: 'Worked on backend APIs', improved: 'Designed and implemented RESTful backend APIs serving 50K+ requests/day' },
      { original: 'Know JavaScript and Python', improved: 'Proficient in JavaScript (ES6+) and Python with 2+ years of professional development experience' },
      { original: 'Did project management', improved: 'Led a cross-functional team of 5 engineers to deliver a feature 2 weeks ahead of schedule' },
    ],
    summary: `Your resume has a solid foundation but needs more quantified achievements and stronger action verbs to pass ATS systems targeting ${targetRole} roles.`,
    jdMatch: jobDescription ? keywordMatchScore(resumeText, jobDescription) : null,
  };
  try {
    const jdCtx = jobDescription ? `\n\nAlso compare it against this job description and list up to 6 important keywords/skills from the JD that are MISSING from the resume:\n${jobDescription.substring(0, 1500)}` : '';
    const sys = `You are ARIA, a strict resume reviewer and ATS optimization specialist grading a resume for a ${targetRole} position. Do not default to a "safe" middling score — a thin, generic, or poorly-written resume must score low.
Scoring bands for atsScore and each section: 0-40 = missing/very weak in that area. 41-60 = present but generic, vague, or lacking metrics. 61-80 = solid, reasonably specific. 81-100 = excellent, quantified, highly targeted to the role.
Return ONLY valid JSON, no markdown.`;
    const user = `Resume Text:\n${resumeText.substring(0, 2000)}${jdCtx}\n\nReturn JSON in exactly this shape (the numbers below are placeholders showing the required format, not a suggested score):\n{"atsScore":<0-100>,"sections":{"experience":<0-100>,"skills":<0-100>,"education":<0-100>,"projects":<0-100>},"strengths":["strength1","strength2","strength3"],"missing":["missing1","missing2","missing3"],"improvements":[{"original":"existing bullet","improved":"better version"}],"summary":"2 sentence verdict"${jobDescription ? ',"jdMissingKeywords":["keyword1","keyword2"]' : ''}}`;
    const txt = await callGroq(sys, user, { model: MODEL_QUALITY, maxTokens: 1100, temperature: 0.3, reasoningEffort: 'medium' });
    const parsed = parseJSON(txt);
    if (typeof parsed?.atsScore === 'number' && !Number.isNaN(parsed.atsScore)) {
      const result = { ...parsed };
      if (jobDescription) {
        const kw = keywordMatchScore(resumeText, jobDescription);
        result.jdMatch = { ...kw, missingKeywords: parsed.jdMissingKeywords?.length ? parsed.jdMissingKeywords : kw.missingKeywords };
      }
      return result;
    }
  } catch {}
  return fbResult;
}

// Deterministic, explainable keyword-overlap score between a resume
// and a job description — classic IR technique (tokenize, strip
// stopwords, compare term sets) layered underneath the LLM's
// qualitative read. Good to point to in a viva as "not just an API
// call" — it's a real (if simple) information-retrieval algorithm.
const STOPWORDS = new Set('a an the and or of to in on for with is are be as at by from your you we our will will looking look seeking wanted this that it its into over under across per etc using use used via role team years experience strong good excellent ability skills skill responsibilities requirement requirements job description candidate work working'.split(' '));
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, '')) // trim leading/trailing punctuation, keep internal (node.js, c++, c#)
    .filter(w => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}
function keywordMatchScore(resumeText, jobDescription) {
  const jdTokens = [...new Set(tokenize(jobDescription))];
  const resumeTokens = new Set(tokenize(resumeText));
  const matched = jdTokens.filter(w => resumeTokens.has(w));
  const missing = jdTokens.filter(w => !resumeTokens.has(w));
  const matchPercent = jdTokens.length ? Math.round((matched.length / jdTokens.length) * 100) : 0;
  // Rank missing keywords by frequency in the JD so the most
  // important ones surface first.
  const freq = {};
  tokenize(jobDescription).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const missingKeywords = missing.sort((a, b) => (freq[b] || 0) - (freq[a] || 0)).slice(0, 10);
  return { matchPercent, matchedCount: matched.length, totalKeywords: jdTokens.length, missingKeywords };
}

// ── Notes AI helper (enhance / summarize / flashcards) ────────────
async function enhanceNotes(content, task = 'enhance') {
  const prompts = {
    enhance: 'You are a study assistant. Improve and structure these interview-prep notes. Add headers, bullet points, clarify concepts, and note what seems to be missing. Keep the same content but make it cleaner and more useful. Return only the improved content as plain text (markdown-style headers/bullets are fine), no preamble, no JSON.',
    summarize: 'Summarize these notes into 3-5 concise bullet points for quick review. Return only the bullets as plain text, no preamble, no JSON.',
    flashcard: 'Create 5 flashcard Q&A pairs from these notes. Format strictly as:\nQ: question\nA: answer\n\nReturn only the flashcards as plain text, no preamble, no JSON.',
  };
  if (!isConfigured()) {
    return task === 'summarize'
      ? '• Key point 1 from your notes\n• Key point 2\n• Key point 3'
      : task === 'flashcard'
      ? 'Q: What is the main topic of these notes?\nA: Review your notes to fill this in.\n\nQ: What should you revisit before your next interview?\nA: The weakest-scoring topic from your last session.'
      : `# Enhanced Notes\n\n${content}\n\n## Key Takeaways\n• Review this regularly\n• Practice the concepts\n• Apply in mock interviews`;
  }
  try {
    return await callGroq(prompts[task] || prompts.enhance, content, { maxTokens: 800, temperature: 0.5, json: false });
  } catch {
    return content;
  }
}

// ── ARIA chat assistant (needs multi-turn history, unlike the
// single system+user calls above, so it talks to Groq directly) ──
async function chatWithHistory(history, systemPrompt) {
  if (!isConfigured()) {
    return "I'm ARIA! I can help you prep for interviews, navigate the app, and track your progress. Try asking me anything, or use the suggestions below. 🎯";
  }
  const body = {
    model: MODEL_FAST,
    messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-8)],
    max_completion_tokens: 220,
    temperature: 0.7,
    include_reasoning: false,
    reasoning_effort: REASONING_EFFORT,
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(`Groq responded ${r.status}`);
    const data = await r.json();
    return data.choices?.[0]?.message?.content || "I couldn't respond right now. Please try again!";
  } catch {
    return "I'm having trouble reaching the AI service right now — please try again in a moment.";
  } finally {
    clearTimeout(timeout);
  }
}

// ── Group Discussion Simulator ────────────────────────────────────
// A GD round is a genuinely different interaction shape from Q&A:
// multiple AI "participants" with distinct stances talk past and
// around each other, and the candidate has to find a moment to
// contribute, build on someone's point, or push back — the actual
// skill a GD round tests, which no single-question interview does.
async function generateGDScenario(requestedTopic) {
  const fb = fallback.getFallbackGDScenario(requestedTopic);
  try {
    const topicLine = requestedTopic?.trim()
      ? `Use this exact topic: "${requestedTopic.trim()}"`
      : 'Pick an interesting, debatable topic suitable for a campus placement group discussion (current affairs, technology, business, or society — nothing overly political or sensitive).';
    const sys = `You are ARIA, simulating a group discussion with 4 participants for placement interview practice. ${topicLine}
Create 4 distinct personas with Indian first names and clearly different stances on the topic (at least one should genuinely disagree with another). Return ONLY JSON:
{"topic":"the topic as a question","personas":[{"name":"Name","avatar":"an emoji","stance":"one-line stance"}],"openers":[{"persona":"Name","text":"their opening remark, 2-3 sentences, in a natural spoken register"}]}
Include an opener from exactly 3 of the 4 personas (leave one silent at first, like a real GD).`;
    const txt = await callGroq(sys, 'Generate the scenario now.', { model: MODEL_QUALITY, maxTokens: 700 });
    const parsed = parseJSON(txt);
    if (parsed?.personas?.length && parsed?.openers?.length) {
      return {
        topic: parsed.topic || fb.topic,
        personas: parsed.personas,
        transcript: parsed.openers.map(o => ({ speaker: o.persona, text: o.text, isUser: false })),
      };
    }
  } catch {}
  return { topic: fb.topic, personas: fb.personas, transcript: fb.transcript };
}

async function generateGDReactions(topic, personas, transcript) {
  try {
    const names = personas.map(p => p.name).join(', ');
    const history = transcript.map(t => `${t.isUser ? 'Candidate' : t.speaker}: ${t.text}`).join('\n');
    const sys = `You are ARIA, running a live group discussion on "${topic}" with participants: ${names}, plus a Candidate (the human being evaluated).
Continue the discussion naturally: 1-2 participants should react to what was JUST said — ideally referencing or challenging the Candidate's last point if they contributed, or continuing the debate otherwise. Keep each line to 1-3 sentences, natural spoken register, not a lecture. Do NOT add a Candidate line. Return ONLY JSON:
{"messages":[{"speaker":"Name","text":"..."}]}`;
    const txt = await callGroq(sys, `Transcript so far:\n${history}\n\nGenerate the next 1-2 participant reactions.`, { maxTokens: 350 });
    const parsed = parseJSON(txt);
    if (Array.isArray(parsed?.messages) && parsed.messages.length) {
      return parsed.messages.map(m => ({ speaker: m.speaker, text: m.text, isUser: false }));
    }
  } catch {}
  return fallback.getFallbackGDReactions(topic);
}

async function evaluateGD(topic, transcript) {
  const fb = fallback.getFallbackGDEvaluation(transcript);
  try {
    const history = transcript.map(t => `${t.isUser ? 'CANDIDATE' : t.speaker}: ${t.text}`).join('\n');
    const sys = `You are ARIA, a strict group-discussion assessor for campus placements. Evaluate ONLY the CANDIDATE's contributions in this transcript. Do NOT default to a "safe" middle score — a candidate who barely contributed, rambled, or added nothing of substance must score low.

Score each dimension 1-10 using this scale: 1-2 = did not meaningfully do this at all. 3-4 = weak/minimal. 5-6 = adequate but unremarkable. 7-8 = clearly good. 9-10 = outstanding.
- initiative: did they speak up, especially early, versus staying silent or only reacting late?
- articulation: was what they said clear and well-structured, or vague/rambling?
- listening: did they actually build on or reference others' points, or just talk past them?
- assertiveness: confident and clear without dominating or interrupting others?

If the candidate contributed only once with a short, generic line, that is weak (3-5 range), not automatically a 7. Return ONLY JSON in exactly this shape (the numbers below are placeholders showing the required format, not a suggested score):
{"score":<1-10>,"initiative":<1-10>,"articulation":<1-10>,"listening":<1-10>,"assertiveness":<1-10>,"verdict":"...","strengths":["s1","s2"],"improvements":["i1","i2"]}
verdict must be one of: Strong Contributor | Balanced Participant | Needs to Speak Up More | Overly Dominant
All numeric fields are integers 1-10.`;
    const txt = await callGroq(sys, `Topic: ${topic}\n\n${history}`, { model: MODEL_QUALITY, maxTokens: 500, temperature: 0.3, reasoningEffort: 'medium' });
    const parsed = parseJSON(txt);
    if (typeof parsed?.score === 'number' && !Number.isNaN(parsed.score)) {
      return {
        score: clamp10(parsed.score, fb.score),
        initiative: clamp10(parsed.initiative, fb.initiative),
        articulation: clamp10(parsed.articulation, fb.articulation),
        listening: clamp10(parsed.listening, fb.listening),
        assertiveness: clamp10(parsed.assertiveness, fb.assertiveness),
        verdict: parsed.verdict || fb.verdict,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fb.strengths,
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : fb.improvements,
      };
    }
  } catch {}
  return fb;
}

module.exports = {
  isMockMode: () => !isConfigured(),
  generateCareerPath,
  generateQuestions,
  generateAdaptiveQuestion,
  generateFeedback,
  generateSystemReport,
  generateCodingQuestion,
  evaluateCode,
  generateSkillQuiz,
  analyzeResume,
  keywordMatchScore,
  enhanceNotes,
  chatWithHistory,
  generateGDScenario,
  generateGDReactions,
  evaluateGD,
};
