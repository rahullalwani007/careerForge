#!/bin/bash
set -e
cd "$(dirname "$0")"
rm -f data/*.db*

echo "=== Starting server ==="
node src/server.js > /tmp/backend.log 2>&1 &
SERVER_PID=$!
sleep 2
cat /tmp/backend.log

fail() { echo "FAIL: $1"; kill $SERVER_PID 2>/dev/null; exit 1; }

echo -e "\n=== Health ==="
curl -s http://localhost:5000/api/health | tee /tmp/out.json
echo

echo -e "\n=== Register ==="
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@example.com","password":"password123"}' | tee /tmp/out.json
TOKEN=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/out.json','utf8')).token)")
[ -z "$TOKEN" ] && fail "no token from register"
echo -e "\nToken acquired: ${TOKEN:0:20}..."

AUTH="Authorization: Bearer $TOKEN"

echo -e "\n=== Duplicate register should 409 ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@example.com","password":"password123"}'

echo -e "\n=== Login ==="
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | head -c 200
echo

echo -e "\n=== Wrong password should 401 ==="
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

echo -e "\n=== /me ==="
curl -s http://localhost:5000/api/auth/me -H "$AUTH"
echo

echo -e "\n=== Guest login ==="
curl -s -X POST http://localhost:5000/api/auth/guest | head -c 150
echo

echo -e "\n=== No token should 401 ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/profile

echo -e "\n=== Get profile (empty) ==="
curl -s http://localhost:5000/api/profile -H "$AUTH"
echo

echo -e "\n=== Update profile ==="
curl -s -X PUT http://localhost:5000/api/profile -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"targetRole":"Software Engineer","level":"fresher","skills":["Python","React","SQL"],"bio":"Aspiring SWE"}'
echo

echo -e "\n=== Generate career path (mock mode) ==="
curl -s -X POST http://localhost:5000/api/career-path/generate -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"targetRole":"Software Engineer","roleId":"swe","currentLevel":"fresher","skills":["Python"]}' | tee /tmp/cp.json | head -c 300
echo
node -e "const cp=JSON.parse(require('fs').readFileSync('/tmp/cp.json','utf8')); if(!cp.careerPath || !cp.careerPath.readinessPercent) throw new Error('bad career path shape')" || fail "career path shape"

echo -e "\n=== Get career path ==="
curl -s http://localhost:5000/api/career-path -H "$AUTH" | head -c 150
echo

echo -e "\n=== Roadmap progress toggle ==="
curl -s -X PUT http://localhost:5000/api/career-path/progress -H "$AUTH" -H "Content-Type: application/json" -d '{"phaseKey":"phase_0","done":true}'
curl -s http://localhost:5000/api/career-path/progress -H "$AUTH"
echo

echo -e "\n=== Interview: generate questions (technical, batch) ==="
curl -s -X POST http://localhost:5000/api/interview/questions -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"config":{"mode":"technical","roleId":"swe","roleTitle":"Software Engineer","difficulty":"medium","questionCount":3}}' | tee /tmp/q.json | head -c 300
echo
node -e "const q=JSON.parse(require('fs').readFileSync('/tmp/q.json','utf8')); if(!Array.isArray(q.questions)||q.questions.length!==3) throw new Error('expected 3 questions, got '+JSON.stringify(q))" || fail "questions shape"

echo -e "\n=== Interview: generate questions (aptitude MCQ) ==="
curl -s -X POST http://localhost:5000/api/interview/questions -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"config":{"mode":"aptitude","aptitudeTopic":"dsa","aptitudeTopicLabel":"DSA","questionCount":4}}' | tee /tmp/mcq.json | head -c 400
echo
node -e "const q=JSON.parse(require('fs').readFileSync('/tmp/mcq.json','utf8')); if(!q.questions[0].options || q.questions[0].options.length!==4) throw new Error('bad mcq shape')" || fail "mcq shape"

echo -e "\n=== Interview: adaptive next-question ==="
curl -s -X POST http://localhost:5000/api/interview/next-question -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"config":{"mode":"technical","roleId":"swe","roleTitle":"Software Engineer","difficulty":"medium"},"history":[{"question":"Explain closures","score":9}]}'
echo

echo -e "\n=== Interview: feedback ==="
curl -s -X POST http://localhost:5000/api/interview/feedback -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"question":"What is a hash map?","answer":"A hash map stores key-value pairs using a hash function to compute an index into an array of buckets.","mode":"technical","difficulty":"medium"}' | tee /tmp/fb.json
echo
node -e "const f=JSON.parse(require('fs').readFileSync('/tmp/fb.json','utf8')).feedback; if(!f.rubric||typeof f.rubric.technical!=='number') throw new Error('missing rubric: '+JSON.stringify(f))" || fail "feedback rubric shape"

echo -e "\n=== Interview: coding question ==="
curl -s -X POST http://localhost:5000/api/interview/coding-question -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"config":{"difficulty":"easy","roleTitle":"Software Engineer"}}' | head -c 200
echo

echo -e "\n=== Interview: evaluate-code ==="
curl -s -X POST http://localhost:5000/api/interview/evaluate-code -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"code":"function twoSum(a,b){return [0,1]}","problem":{"title":"Two Sum","difficulty":"Easy"},"testResults":[{"passed":true},{"passed":true}],"language":"javascript"}'
echo

echo -e "\n=== Interview: submit full session ==="
curl -s -X POST http://localhost:5000/api/interview/sessions -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"config":{"roleTitle":"Software Engineer","mode":"technical","difficulty":"medium"},"timeline":[{"question":"Q1","answer":"A1 is a fairly detailed answer about hash maps and complexity.","score":8,"strengths":["good"],"improvements":["more depth"],"rubric":{"technical":8,"communication":7,"structure":8,"confidence":7},"timeSpent":45},{"question":"Q2","answer":"A2 talks about closures and scope in JS in reasonable detail.","score":7,"strengths":["clear"],"improvements":["example"],"rubric":{"technical":7,"communication":7,"structure":7,"confidence":6},"timeSpent":60}],"focusStats":{"focusScore":92,"tabSwitches":1,"pasteEvents":0,"idleEvents":0}}' | tee /tmp/sess.json
echo
node -e "const s=JSON.parse(require('fs').readFileSync('/tmp/sess.json','utf8')); if(!s.sessionId||!s.report) throw new Error('bad session response: '+JSON.stringify(s))" || fail "session submit shape"
SESSION_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/sess.json','utf8')).sessionId)")

echo -e "\n=== Get sessions list ==="
curl -s http://localhost:5000/api/interview/sessions -H "$AUTH" | head -c 300
echo

echo -e "\n=== Get single session ==="
curl -s http://localhost:5000/api/interview/sessions/$SESSION_ID -H "$AUTH" | head -c 300
echo

echo -e "\n=== Badges after session ==="
curl -s http://localhost:5000/api/badges -H "$AUTH"
echo

echo -e "\n=== Skill Assessment: get quiz ==="
curl -s -X POST http://localhost:5000/api/skill-assessment/quiz -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"categories":["dsa","oop","dbms"],"perCategory":2}' | tee /tmp/quiz.json | head -c 300
echo
node -e "const q=JSON.parse(require('fs').readFileSync('/tmp/quiz.json','utf8')); if(q.questions.length!==6) throw new Error('expected 6 got '+q.questions.length)" || fail "skill quiz count"

echo -e "\n=== Skill Assessment: submit ==="
curl -s -X POST http://localhost:5000/api/skill-assessment/submit -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"categoryScores":{"dsa":80,"oop":60,"dbms":100},"totalQuestions":6,"correctAnswers":5}'
echo

echo -e "\n=== Skill Assessment: history ==="
curl -s http://localhost:5000/api/skill-assessment/history -H "$AUTH"
echo

echo -e "\n=== Notes: create / list / ai-enhance / delete ==="
curl -s -X POST http://localhost:5000/api/notes -H "$AUTH" -H "Content-Type: application/json" -d '{"title":"Test note","content":"Remember to revise DBMS normal forms."}' | tee /tmp/note.json
NOTE_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/note.json','utf8')).note.id)")
echo
curl -s http://localhost:5000/api/notes -H "$AUTH" | head -c 200
echo
curl -s -X POST http://localhost:5000/api/notes/ai/summarize -H "$AUTH" -H "Content-Type: application/json" -d '{"content":"Long notes about normalization, ACID, and indexing."}'
echo
curl -s -X DELETE http://localhost:5000/api/notes/$NOTE_ID -H "$AUTH"
echo

echo -e "\n=== Resume analyze (with JD match) ==="
curl -s -X POST http://localhost:5000/api/resume/analyze -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"resumeText":"Experienced with React, Node.js, PostgreSQL and REST APIs.","targetRole":"Backend Developer","jobDescription":"Looking for React, Node.js, MongoDB, Docker, Kubernetes and AWS experience."}' | tee /tmp/resume.json | head -c 400
echo
node -e "const r=JSON.parse(require('fs').readFileSync('/tmp/resume.json','utf8')).result; if(!r.jdMatch) throw new Error('no jdMatch')" || fail "resume jdMatch"

echo -e "\n=== Learning: search (mock) ==="
curl -s "http://localhost:5000/api/learning/search?q=system+design+interview" -H "$AUTH" | head -c 300
echo

echo -e "\n=== Jobs: list with skill match ==="
curl -s http://localhost:5000/api/jobs -H "$AUTH" | head -c 400
echo

echo -e "\n=== Chat ==="
curl -s -X POST http://localhost:5000/api/chat -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How is my progress?"}],"page":"/dashboard"}'
echo

echo -e "\n=== Leaderboard (seeded data) ==="
curl -s http://localhost:5000/api/leaderboard -H "$AUTH" | head -c 500
echo

echo -e "\n=== Percentile ==="
curl -s "http://localhost:5000/api/leaderboard/percentile?mode=technical&score=7.5" -H "$AUTH"
echo

echo -e "\n=== Group Discussion: start ==="
curl -s -X POST http://localhost:5000/api/gd/start -H "$AUTH" -H "Content-Type: application/json" -d '{}' | tee /tmp/gd.json | head -c 300
echo
node -e "const s=JSON.parse(require('fs').readFileSync('/tmp/gd.json','utf8')).scenario; if(!s.topic||!s.personas.length||!s.transcript.length) throw new Error('bad GD scenario')" || fail "GD scenario shape"

echo -e "\n=== Group Discussion: respond ==="
node -e "
const s = JSON.parse(require('fs').readFileSync('/tmp/gd.json','utf8')).scenario;
console.log(JSON.stringify({topic:s.topic, personas:s.personas, transcript:s.transcript, userMessage:'I see merit on both sides, but the implementation details matter most here.'}));
" > /tmp/gd_respond_body.json
curl -s -X POST http://localhost:5000/api/gd/respond -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/gd_respond_body.json > /tmp/gd_respond.json
head -c 300 /tmp/gd_respond.json
echo
node -e "const t=JSON.parse(require('fs').readFileSync('/tmp/gd_respond.json','utf8')).transcript; if(!Array.isArray(t)||t.length<4) throw new Error('bad GD respond')" || fail "GD respond shape"

echo -e "\n=== Group Discussion: evaluate ==="
node -e "
const t = JSON.parse(require('fs').readFileSync('/tmp/gd_respond.json','utf8')).transcript;
const s = JSON.parse(require('fs').readFileSync('/tmp/gd.json','utf8')).scenario;
console.log(JSON.stringify({topic: s.topic, transcript: t}));
" > /tmp/gd_eval_body.json
curl -s -X POST http://localhost:5000/api/gd/evaluate -H "$AUTH" -H "Content-Type: application/json" -d @/tmp/gd_eval_body.json
echo

echo -e "\n=== Group Discussion: history ==="
curl -s http://localhost:5000/api/gd/history -H "$AUTH"
echo

echo -e "\n=== Placement Drive: complete (Selected) ==="
curl -s -X POST http://localhost:5000/api/drive/complete -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"company":"Amazon","roleTitle":"Software Engineer","roundScores":{"aptitude":80,"gd":75,"technical":85,"hr":80}}' | tee /tmp/drive.json
echo
node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/drive.json','utf8')); if(d.verdict!=='Selected') throw new Error('expected Selected, got '+d.verdict)" || fail "drive verdict Selected"

echo -e "\n=== Placement Drive: complete (eliminated at aptitude) ==="
curl -s -X POST http://localhost:5000/api/drive/complete -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"company":"Google","roleTitle":"SWE","roundScores":{"aptitude":30,"gd":0,"technical":0,"hr":0}}' | tee /tmp/drive2.json
echo
node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/drive2.json','utf8')); if(d.verdict!=='Not Selected'||d.eliminatedAt!=='Aptitude Round') throw new Error('bad elimination result')" || fail "drive elimination"

echo -e "\n=== Placement Drive: history ==="
curl -s http://localhost:5000/api/drive/history -H "$AUTH"
echo

echo -e "\n=== Unified Activity (should include interview + GD + skill assessment + drive events) ==="
curl -s http://localhost:5000/api/activity -H "$AUTH" > /tmp/activity.json
head -c 300 /tmp/activity.json
echo
node -e "
const a = JSON.parse(require('fs').readFileSync('/tmp/activity.json','utf8')).activity;
const types = new Set(a.map(x=>x.type));
console.log('activity count:', a.length, '| types seen:', [...types].join(', '));
if (!types.has('interview') || !types.has('gd') || !types.has('skill_assessment') || !types.has('drive')) {
  throw new Error('expected all 4 activity types, got: ' + [...types].join(','));
}
" || fail "activity aggregation missing a type"

echo -e "\n=== 404 for unknown route ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/does-not-exist

echo -e "\n\n=== ALL TESTS PASSED ==="
kill $SERVER_PID 2>/dev/null
