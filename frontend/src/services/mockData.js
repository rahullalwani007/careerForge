// CareerForge AI — UI configuration constants.
//
// This file intentionally holds ONLY presentation data (labels,
// icons, colors used to render selectors). Anything that used to be
// "fallback content for when the AI is down" now lives on the
// backend (backend/src/services/fallbackData.js) since that's
// where the AI calls actually happen now.

export const INTERVIEW_MODES = [
  { id: 'technical', label: 'Technical', sub: 'Coding, DSA, system concepts', icon: '💻', color: '#4f46e5', badge: 'SDE / Dev' },
  { id: 'hr', label: 'HR & Behavioral', sub: 'STAR method, soft skills', icon: '🤝', color: '#10b981', badge: 'All roles' },
  { id: 'aptitude', label: 'Aptitude MCQ', sub: 'DSA, OS, DBMS, Networks, Quant', icon: '🧮', color: '#f59e0b', badge: 'Screening' },
  { id: 'system-design', label: 'System Design', sub: 'Architecture, scalability', icon: '🏗️', color: '#3b82f6', badge: 'SDE-2/Senior' },
];

export const TARGET_ROLES = [
  { id: 'swe', title: 'Software Engineer', icon: '💻', category: 'Engineering', desc: 'Full-stack development, core CS' },
  { id: 'frontend', title: 'Frontend Developer', icon: '🎨', category: 'Engineering', desc: 'React, Vue, CSS, performance' },
  { id: 'backend', title: 'Backend Developer', icon: '⚙️', category: 'Engineering', desc: 'APIs, databases, scalability' },
  { id: 'fullstack', title: 'Full Stack Developer', icon: '🔧', category: 'Engineering', desc: 'End-to-end web development' },
  { id: 'data-analyst', title: 'Data Analyst', icon: '📊', category: 'Data & AI', desc: 'SQL, Python, BI tools, dashboards' },
  { id: 'data-scientist', title: 'Data Scientist', icon: '🧠', category: 'Data & AI', desc: 'ML, statistics, model building' },
  { id: 'ml-engineer', title: 'ML Engineer', icon: '🤖', category: 'Data & AI', desc: 'MLOps, deep learning, PyTorch' },
  { id: 'devops', title: 'DevOps Engineer', icon: '☁️', category: 'Infrastructure', desc: 'CI/CD, Docker, Kubernetes, AWS' },
  { id: 'product', title: 'Product Manager', icon: '🎯', category: 'Product', desc: 'Roadmaps, OKRs, stakeholder mgmt' },
  { id: 'uiux', title: 'UI/UX Designer', icon: '✨', category: 'Design', desc: 'Figma, user research, prototyping' },
  { id: 'cybersecurity', title: 'Cybersecurity Analyst', icon: '🔒', category: 'Security', desc: 'Threat analysis, penetration testing' },
  { id: 'cloud', title: 'Cloud Architect', icon: '🌩️', category: 'Infrastructure', desc: 'AWS/GCP/Azure architecture design' },
];

export const ROLES = TARGET_ROLES;

export const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher', desc: '0-1 year, college student / recent graduate', icon: '🌱' },
  { id: 'junior', label: 'Junior', desc: '1-2 years of professional experience', icon: '🔥' },
  { id: 'mid', label: 'Mid-level', desc: '2-5 years, ready for senior roles', icon: '⚡' },
  { id: 'senior', label: 'Senior', desc: '5+ years, leading teams and systems', icon: '🚀' },
];

export const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', desc: 'Freshers / 0-2 years', icon: '🌱', color: '#10b981' },
  { id: 'medium', label: 'Medium', desc: 'Industry standard', icon: '🔥', color: '#4f46e5' },
  { id: 'hard', label: 'Hard', desc: 'FAANG / Senior level', icon: '⚡', color: '#ef4444' },
];

export const QUESTION_COUNTS = [3, 5, 7, 10];

export const APTITUDE_TOPICS = [
  { id: 'dsa', label: 'Data Structures & Algorithms', icon: '🌳' },
  { id: 'os', label: 'Operating Systems', icon: '💿' },
  { id: 'dbms', label: 'Database Management', icon: '🗄️' },
  { id: 'networks', label: 'Computer Networks', icon: '🌐' },
  { id: 'general', label: 'Quantitative Aptitude', icon: '🔢' },
];

// Skill Assessment Center categories — one multi-select quiz can mix
// several of these. Keys must match backend SKILL_CATEGORY_LABELS.
export const SKILL_CATEGORIES = [
  { id: 'dsa', label: 'Data Structures & Algorithms', icon: '🌳', color: '#4f46e5' },
  { id: 'oop', label: 'Object-Oriented Programming', icon: '🧩', color: '#8b5cf6' },
  { id: 'dbms', label: 'Database Management', icon: '🗄️', color: '#10b981' },
  { id: 'os', label: 'Operating Systems', icon: '💿', color: '#f59e0b' },
  { id: 'networks', label: 'Computer Networks', icon: '🌐', color: '#3b82f6' },
  { id: 'general', label: 'Quantitative Aptitude', icon: '🔢', color: '#ec4899' },
];

export const BADGES = [
  { id: 'first_session', emoji: '🎯', name: 'First Step', desc: 'Complete your first session', color: '#4f46e5' },
  { id: 'streak_3', emoji: '🔥', name: 'On Fire', desc: 'Achieve a 3-day streak', color: '#f59e0b' },
  { id: 'streak_7', emoji: '⚡', name: 'Lightning Week', desc: '7-day streak', color: '#f59e0b' },
  { id: 'streak_30', emoji: '🌟', name: 'Iron Will', desc: '30-day streak', color: '#f59e0b' },
  { id: 'perfect_10', emoji: '💯', name: 'Perfect Score', desc: 'Score 10/10 on any question', color: '#10b981' },
  { id: 'all_modes', emoji: '🎭', name: 'All-Rounder', desc: 'Try all 4 interview modes', color: '#3b82f6' },
  { id: 'sessions_10', emoji: '🏋️', name: 'Dedicated', desc: 'Complete 10 sessions', color: '#8b5cf6' },
  { id: 'sessions_25', emoji: '🎓', name: 'Scholar', desc: 'Complete 25 sessions', color: '#8b5cf6' },
  { id: 'score_8plus', emoji: '🥇', name: 'High Achiever', desc: 'Average 8+ on 3 sessions', color: '#10b981' },
  { id: 'readiness_75', emoji: '🚀', name: 'Almost There', desc: 'Reach 75% career readiness', color: '#4f46e5' },
  { id: 'notes_5', emoji: '📝', name: 'Note Taker', desc: 'Create 5 notes', color: '#ec4899' },
  { id: 'speed_demon', emoji: '⚡', name: 'Speed Demon', desc: 'Score 8+ with 7+ questions', color: '#ef4444' },
  { id: 'skill_assessed', emoji: '🧪', name: 'Self-Aware', desc: 'Complete your first Skill Assessment', color: '#14b8a6' },
  { id: 'skill_master', emoji: '🏆', name: 'Skill Master', desc: 'Score 90%+ in any skill category', color: '#f59e0b' },
  { id: 'focused', emoji: '🧘', name: 'Laser Focus', desc: 'Finish a session with 95%+ focus, 0 tab switches', color: '#3b82f6' },
  { id: 'adaptive_ace', emoji: '🧠', name: 'Adaptive Ace', desc: 'Score 8+ average in Adaptive mode', color: '#8b5cf6' },
  { id: 'gd_champion', emoji: '🎤', name: 'GD Champion', desc: 'Score 8+ in a Group Discussion round', color: '#8b5cf6' },
  { id: 'first_drive', emoji: '🏢', name: 'First Drive', desc: 'Complete your first Placement Drive', color: '#4f46e5' },
  { id: 'drive_selected', emoji: '🎉', name: 'Selected!', desc: 'Get "Selected" in a Placement Drive', color: '#10b981' },
];

export const COMPANY_MODES = [
  { id: 'amazon', name: 'Amazon', emoji: '🛒', color: '#FF9900', traits: 'Leadership Principles: Customer Obsession, Ownership, Invent & Simplify. Behavioral + system design focused.' },
  { id: 'google', name: 'Google', emoji: '🔍', color: '#4285F4', traits: 'Scalability, distributed systems, coding (Leetcode hard), data structures. Googliness culture fit.' },
  { id: 'meta', name: 'Meta', emoji: '💙', color: '#1877F2', traits: 'Move fast, product impact, distributed systems at scale, data-driven decisions.' },
  { id: 'microsoft', name: 'Microsoft', emoji: '🪟', color: '#00A4EF', traits: 'Growth mindset, collaborative culture, Azure/cloud knowledge, behavioral STAR method.' },
  { id: 'flipkart', name: 'Flipkart', emoji: '🛍️', color: '#F7CB45', traits: 'E-commerce systems, scalability, data structures, core CS fundamentals.' },
  { id: 'razorpay', name: 'Razorpay', emoji: '💳', color: '#3395FF', traits: 'Fintech, payments infrastructure, reliability, distributed systems, strong DSA.' },
  { id: 'swiggy', name: 'Swiggy', emoji: '🍔', color: '#FC8019', traits: 'Real-time systems, geolocation, microservices, high throughput, startup pace.' },
  { id: 'infosys', name: 'Infosys', emoji: '🏢', color: '#007CC3', traits: 'Core CS fundamentals, SDLC, process-oriented, project management, verbal communication.' },
];

export const DAILY_INSIGHTS = [
  'The best interviews are conversations, not interrogations. Practice thinking out loud.',
  'Companies hire problem-solvers, not answer-dispensers. Always explain your approach first.',
  'Preparation is confidence. Each session you do today is one less surprise in the real interview.',
  'The STAR method (Situation, Task, Action, Result) works for 90% of HR questions. Master it.',
  "System Design is about trade-offs. There's no perfect answer — only justified decisions.",
  'Consistency beats intensity. 30 minutes of focused practice daily beats 5 hours on weekends.',
  'Your resume gets you the interview. Your preparation gets you the offer.',
  'Interviewers remember how you made them feel, not just what you said. Be enthusiastic.',
  'When stuck, think aloud. Interviewers value your process as much as the answer.',
  "Every 'no' is one step closer to your 'yes'. Keep going.",
  'Behavioral questions are really asking: can you reflect on your past and learn from it?',
  "Practice easy problems, then medium, then hard. Don't skip the fundamentals.",
  "The best answer to 'Where do you see yourself in 5 years?' aligns with the company's growth.",
  'Strong communication skills can make an average technical answer sound excellent.',
  'Review your weak scores first — that is where the biggest gains hide.',
];

export const CODE_TEMPLATES = {
  javascript: `// JavaScript\nfunction solution(input) {\n  // Your code here\n  \n}\n\nconsole.log(solution());`,
  python: `# Python\ndef solution(input):\n    # Your code here\n    pass\n\nprint(solution())`,
  java: `// Java\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`,
  cpp: `// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}`,
};
