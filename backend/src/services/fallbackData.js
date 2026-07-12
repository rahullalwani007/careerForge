// ================================================================
// Fallback content bank.
//
// Every AI-backed route tries Groq first. If the call fails for
// ANY reason (no API key configured, network blip, rate limit,
// malformed JSON) the route falls back to this curated content
// instead of crashing or showing an error. This is what keeps a
// live demo/viva from ever going blank on stage, even on
// conference-room wifi.
// ================================================================

const HR_QUESTIONS = [
  'Tell me about yourself and your journey into this field.',
  "Where do you see yourself in 5 years? What's your long-term vision?",
  'Describe a time you worked with a difficult colleague and how you handled it.',
  'Tell me about a time you failed at something important. What did you learn?',
  'Walk me through your most impactful project. What was your contribution?',
  'How do you handle tight deadlines with multiple competing priorities?',
  'Describe a time you went above and beyond expectations.',
  'Tell me about a time you disagreed with your manager. What did you do?',
  'How do you approach learning a completely new technology or skill?',
  'Why are you leaving your current role? What excites you about this opportunity?',
  'Describe your biggest professional achievement and how you measured success.',
  'Tell me about a time you took ownership of a problem outside your scope.',
];

const SYSTEM_DESIGN_QUESTIONS = [
  'Design a URL shortening service like bit.ly. Cover the full architecture, DB schema, and API design.',
  'Design a real-time chat app like WhatsApp. Handle message delivery, read receipts, and offline users.',
  'Design a scalable notification system sending 10 million push notifications per day.',
  'Design a ride-sharing platform. Focus on real-time location tracking and driver-rider matching.',
  'Design a video streaming service like YouTube. Cover upload, transcoding, and CDN delivery.',
  'Design a distributed rate-limiting system working across multiple microservices.',
  'Design a news feed system. Explain the fanout strategy for posts with different follower counts.',
  'Design a search autocomplete that handles 100K queries/sec with under 50ms latency.',
  'Design a payment fraud detection system processing 50K transactions/second in real time.',
  'Design a distributed cache. Cover eviction policies, replication, and consistency models.',
];

const MOCK_QUESTIONS = {
  swe: [
    'Explain the difference between stack and heap. When would a memory leak occur in managed languages?',
    'How would you design a URL shortener? Detail the DB schema, hashing strategy, and caching layer.',
    "Explain the CAP theorem and how you'd apply it when designing a financial system.",
    'Walk me through Big-O of a hash map. When does it degrade to O(n)?',
    'How would you implement an LRU cache? Which data structures would you combine?',
    'Explain the event loop in Node.js and how I/O works without blocking.',
    'What is the difference between optimistic and pessimistic locking?',
    'Describe SOLID principles. How does violating SRP create technical debt?',
  ],
  frontend: [
    "Explain React's reconciliation algorithm. What triggers a full vs partial re-render?",
    'Walk me through the browser critical rendering path and how to optimize Core Web Vitals.',
    'What is the virtual DOM and how does React diffing algorithm work?',
    "Explain CSS specificity and how you'd architect a scalable CSS system.",
    'How do you implement code splitting and lazy loading in a large React app?',
    'What is memoization in React? When does useMemo actually improve performance?',
    'Describe accessibility best practices and how screen readers interact with the DOM.',
    "How would you debug a React app that's re-rendering too frequently?",
  ],
  backend: [
    'Explain REST vs GraphQL. When would you choose one over the other?',
    'How do you design a database schema for a social media platform?',
    'What is database indexing? Explain B-tree vs hash indexes.',
    'How do you handle distributed transactions across multiple microservices?',
    'Explain the difference between SQL and NoSQL. How do you choose?',
    'What are the patterns for securing a REST API? Explain JWT vs sessions.',
    'How would you implement pagination for an API returning millions of records?',
    'Explain idempotency and why it matters for POST requests.',
  ],
  'data-scientist': [
    'Explain the bias-variance tradeoff and how it affects model selection.',
    'What is the difference between L1 and L2 regularization? When would you use each?',
    'How do you handle class imbalance in a classification problem?',
    'Walk me through how gradient boosting works and how it differs from random forests.',
    "Explain cross-validation. Why is k-fold better than a single train/test split?",
    'How do you approach feature selection for a high-dimensional dataset?',
    'Explain A/B testing. What statistical test would you use for conversion rate comparison?',
    'What is a confusion matrix? Explain precision, recall, and when to optimize for each.',
  ],
  devops: [
    'Explain the difference between Docker containers and virtual machines.',
    "Walk me through a CI/CD pipeline you've designed. What stages did it include?",
    'How does Kubernetes handle service discovery and load balancing?',
    'Explain blue-green vs canary deployments. When would you use each?',
    'How do you implement infrastructure as code? Describe Terraform vs Ansible.',
    'What monitoring and alerting stack would you set up for a production microservice?',
    'How do you handle secrets management in a containerized environment?',
    'Explain horizontal vs vertical scaling and when each is appropriate.',
  ],
  default: [
    'Tell me about your most challenging technical project. What obstacles did you overcome?',
    "How do you approach debugging a problem you've never seen before?",
    'Describe your experience with version control. Walk me through your Git workflow.',
    'How do you stay current with new technologies in your field?',
    'Explain a technical concept from your area to someone non-technical.',
    "What's your approach to writing maintainable, readable code?",
    'How do you handle technical debt in a fast-moving codebase?',
  ],
};

// Skill Assessment Center categories. Each question is written so the
// explanation is independently verifiable — worth double-checking any
// quant "puzzle" style question by hand before trusting it live.
const MCQ_QUESTIONS = {
  dsa: [
    { q: 'What is the time complexity of searching in a balanced BST?', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correct: 1, exp: 'Balanced BSTs have height log n, so search is O(log n).' },
    { q: 'Which data structure is used in BFS traversal?', opts: ['Stack', 'Queue', 'Heap', 'Array'], correct: 1, exp: 'BFS uses a Queue (FIFO) to process nodes level by level.' },
    { q: 'What is the worst-case time complexity of QuickSort?', opts: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], correct: 1, exp: 'QuickSort degrades to O(n²) when the pivot is always the smallest/largest element.' },
    { q: 'Which sorting algorithm is stable?', opts: ['QuickSort', 'HeapSort', 'Merge Sort', 'Selection Sort'], correct: 2, exp: 'Merge Sort is stable — equal elements keep their relative order.' },
    { q: 'In a min-heap, the minimum element is at:', opts: ['Any leaf node', 'The root', 'The last node', 'It depends on input'], correct: 1, exp: 'The root of a min-heap always holds the minimum element.' },
    { q: 'What is the space complexity of DFS using recursion?', opts: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correct: 1, exp: 'DFS uses O(n) space for the call stack in the worst case (a linear chain).' },
    { q: 'A hash table has O(1) average lookup. What causes O(n) worst case?', opts: ['Large input', 'All keys hash to the same bucket', 'Memory overflow', 'Wrong hash function type'], correct: 1, exp: 'Collisions cause all elements to chain in one bucket, degrading to O(n).' },
    { q: 'Which traversal of a BST gives elements in sorted order?', opts: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correct: 1, exp: 'In-order traversal (Left → Root → Right) visits BST nodes in ascending order.' },
    { q: "Dijkstra's algorithm fails on graphs with:", opts: ['Self-loops', 'Negative weight edges', 'Disconnected components', 'Undirected edges'], correct: 1, exp: 'Dijkstra assumes non-negative weights; negative edges can produce incorrect results.' },
    { q: 'What is the average-case time complexity of inserting into a hash table?', opts: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], correct: 2, exp: 'Hash tables give O(1) average-case insertion with a good hash function.' },
  ],
  oop: [
    { q: 'Which OOP pillar allows a subclass to provide its own version of a method?', opts: ['Encapsulation', 'Abstraction', 'Polymorphism', 'Composition'], correct: 2, exp: 'Polymorphism lets a subclass override a method to provide specialized behavior.' },
    { q: 'What is encapsulation primarily used for?', opts: ['Speeding up execution', 'Hiding internal state and exposing controlled access', 'Allowing multiple inheritance', 'Reducing memory usage'], correct: 1, exp: 'Encapsulation bundles data with the methods that operate on it and restricts direct access to internal state.' },
    { q: 'A class that cannot be instantiated and exists only to be extended is called:', opts: ['A final class', 'An abstract class', 'A static class', 'An interface only'], correct: 1, exp: 'An abstract class defines shared structure/behavior but cannot be instantiated directly.' },
    { q: 'Method overloading is resolved at:', opts: ['Runtime (dynamic binding)', 'Compile time (static binding)', 'Link time', 'It is never resolved'], correct: 1, exp: 'Overload resolution happens at compile time based on argument types/count — this is static binding.' },
    { q: 'Which relationship best describes "a Car has an Engine"?', opts: ['Inheritance', 'Composition', 'Polymorphism', 'Interface'], correct: 1, exp: '"Has-a" relationships are composition/aggregation, not inheritance ("is-a").' },
    { q: 'What is the main risk multiple inheritance introduces?', opts: ['Slower compilation only', 'The diamond problem (ambiguous inherited members)', 'Loss of encapsulation always', 'It cannot be implemented in any language'], correct: 1, exp: 'The diamond problem occurs when a class inherits the same member from two parents through a shared ancestor, creating ambiguity.' },
    { q: 'A constructor is best described as:', opts: ['A method that destroys an object', 'A special method that initializes a new object', 'A static utility method', 'A getter for private fields'], correct: 1, exp: 'Constructors run when an object is created, to set up its initial state.' },
    { q: 'Which principle suggests depending on interfaces, not concrete implementations?', opts: ['Single Responsibility', 'Open/Closed', 'Dependency Inversion', 'Liskov Substitution'], correct: 2, exp: "Dependency Inversion (the 'D' in SOLID) says high-level code should depend on abstractions, not concrete classes." },
  ],
  os: [
    { q: 'Which scheduling algorithm can cause starvation?', opts: ['Round Robin', 'FCFS', 'Priority Scheduling', 'SJF (Shortest Job First)'], correct: 2, exp: 'Priority Scheduling starves low-priority processes if higher-priority ones keep arriving.' },
    { q: 'What is thrashing in an OS?', opts: ['Excessive CPU usage', 'Excessive paging causing low CPU utilization', 'A memory leak', 'A deadlock condition'], correct: 1, exp: 'Thrashing happens when the system spends more time swapping pages than executing processes.' },
    { q: 'A deadlock requires four conditions. Which of these is NOT one of them?', opts: ['Mutual exclusion', 'Starvation', 'Circular wait', 'Hold and wait'], correct: 1, exp: 'The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait — starvation is a separate phenomenon.' },
    { q: 'What is the purpose of a page table?', opts: ['Store process priority', 'Map virtual addresses to physical addresses', 'Store process IDs', 'Handle interrupts'], correct: 1, exp: 'Page tables translate virtual (logical) addresses to physical memory addresses.' },
    { q: 'Which IPC mechanism is fastest for processes on the same machine?', opts: ['Sockets', 'Pipes', 'Shared memory', 'Message queues'], correct: 2, exp: 'Shared memory avoids copying data between processes, making it the fastest local IPC mechanism.' },
    { q: 'In Round Robin scheduling, what determines fairness?', opts: ['Priority value', 'Burst time', 'Time quantum', 'Arrival time'], correct: 2, exp: 'The time quantum determines how much CPU time each process gets before preemption.' },
    { q: 'A semaphore initialized to 1 is commonly called a:', opts: ['Counting semaphore', 'Binary semaphore / mutex', 'Spin lock', 'Monitor'], correct: 1, exp: 'A semaphore initialized to 1 behaves as a mutex — only one process may enter the critical section.' },
    { q: 'What does fork() return to the parent process?', opts: ['0', "The child's process ID", "The parent's process ID", '-1 always'], correct: 1, exp: "fork() returns the child's PID to the parent, and 0 to the child." },
  ],
  dbms: [
    { q: 'Which normal form eliminates transitive dependencies?', opts: ['1NF', '2NF', '3NF', 'BCNF only'], correct: 2, exp: '3NF removes transitive dependencies of non-key attributes on other non-key attributes.' },
    { q: 'A foreign key constraint prevents:', opts: ['Duplicate rows', 'Orphan records', 'Null values', 'Slow queries'], correct: 1, exp: "Foreign keys enforce referential integrity — you can't reference a row that doesn't exist." },
    { q: 'ACID stands for:', opts: ['Atomicity, Consistency, Integrity, Durability', 'Atomicity, Consistency, Isolation, Durability', 'Access, Concurrency, Isolation, Data', 'Accuracy, Consistency, Integrity, Distribution'], correct: 1, exp: 'ACID = Atomicity, Consistency, Isolation, Durability.' },
    { q: 'What does a clustered index do?', opts: ['Creates a copy of the table', 'Physically reorders data rows to match the index key', 'Stores the index in a separate tablespace', 'Only improves JOIN performance'], correct: 1, exp: 'A clustered index reorders the physical rows so the data storage order matches the index.' },
    { q: 'Which SQL clause filters results AFTER grouping?', opts: ['WHERE', 'HAVING', 'FILTER', 'GROUP BY'], correct: 1, exp: 'HAVING filters groups after GROUP BY; WHERE filters rows before grouping.' },
  ],
  networks: [
    { q: 'Which OSI layer handles routing?', opts: ['Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 5 (Session)'], correct: 1, exp: 'The Network layer (Layer 3) handles logical addressing and routing — IP operates here.' },
    { q: 'TCP vs UDP: which guarantees delivery?', opts: ['UDP', 'TCP', 'Both', 'Neither'], correct: 1, exp: 'TCP guarantees delivery via acknowledgments, retransmission, and sequencing; UDP does not.' },
    { q: 'What is a subnet mask used for?', opts: ['Assigning IP addresses', 'Dividing an IP into network and host portions', 'Encrypting traffic', 'Routing packets between networks'], correct: 1, exp: 'A subnet mask identifies which part of an IP address is the network portion vs the host portion.' },
    { q: 'HTTP status code 401 means:', opts: ['Not Found', 'Internal Server Error', 'Unauthorized', 'Forbidden'], correct: 2, exp: '401 Unauthorized means missing or invalid authentication credentials.' },
    { q: 'Which protocol resolves IP addresses to MAC addresses?', opts: ['DNS', 'DHCP', 'ARP', 'ICMP'], correct: 2, exp: 'ARP (Address Resolution Protocol) maps IP addresses to physical MAC addresses on a LAN.' },
  ],
  general: [
    { q: 'A train travels 300 km at 60 km/h. How long does the journey take?', opts: ['4 hours', '5 hours', '6 hours', '3.5 hours'], correct: 1, exp: 'Time = Distance / Speed = 300 / 60 = 5 hours.' },
    { q: 'What is 15% of 240?', opts: ['36', '24', '32', '28'], correct: 0, exp: '15% × 240 = 0.15 × 240 = 36.' },
    { q: "A sum of ₹7,200 is divided among A, B and C in the ratio 2:3:4. What is C's share?", opts: ['₹1,600', '₹2,400', '₹3,200', '₹2,800'], correct: 2, exp: 'Total parts = 2+3+4 = 9. C gets 4/9 × 7200 = ₹3,200.' },
    { q: 'A pipe fills a tank in 6 hours; another empties it in 12 hours. If both are open, how long to fill the tank?', opts: ['6 hours', '12 hours', '8 hours', '10 hours'], correct: 1, exp: 'Net rate = 1/6 − 1/12 = 1/12 of the tank per hour, so it takes 12 hours.' },
    { q: '2, 4, 8, 16, 32 — what comes next?', opts: ['48', '60', '64', '56'], correct: 2, exp: 'Each term doubles the previous one: 32 × 2 = 64.' },
  ],
};

const SKILL_CATEGORY_LABELS = {
  dsa: 'Data Structures & Algorithms',
  oop: 'Object-Oriented Programming',
  os: 'Operating Systems',
  dbms: 'Database Management',
  networks: 'Computer Networks',
  general: 'Quantitative Aptitude',
};

function getFallbackQuestions(roleId, count = 5) {
  const qs = MOCK_QUESTIONS[roleId] || MOCK_QUESTIONS.default;
  return shuffle(qs).slice(0, count).map(q => ({ question: q, hints: [] }));
}

function getFallbackHRQuestions(count = 5) {
  return shuffle(HR_QUESTIONS).slice(0, count).map(q => ({ question: q, hints: [] }));
}

function getFallbackSystemDesignQuestions(count = 5) {
  return shuffle(SYSTEM_DESIGN_QUESTIONS).slice(0, count).map(q => ({ question: q, hints: [] }));
}

function getFallbackMCQ(topic, count = 10) {
  const qs = MCQ_QUESTIONS[topic] || MCQ_QUESTIONS.dsa;
  return shuffle(qs).slice(0, Math.min(count, qs.length)).map(m => ({
    question: m.q, options: m.opts, correct: m.correct, explanation: m.exp,
  }));
}

// Builds a mixed-category quiz for the Skill Assessment Center.
// Returns { question, options, correct, explanation, category }[]
function getFallbackSkillQuiz(categories, perCategory = 4) {
  const cats = categories && categories.length ? categories : Object.keys(MCQ_QUESTIONS);
  const out = [];
  cats.forEach(cat => {
    const bank = MCQ_QUESTIONS[cat] || [];
    shuffle(bank).slice(0, perCategory).forEach(m => {
      out.push({ question: m.q, options: m.opts, correct: m.correct, explanation: m.exp, category: cat });
    });
  });
  return shuffle(out);
}

function getFallbackFeedback() {
  const scores = [6, 7, 7, 8, 8, 9];
  const score = scores[Math.floor(Math.random() * scores.length)];
  const goods = [
    'Good use of concrete examples to support your answer.',
    'Clear structure and logical flow in your response.',
    'Demonstrated solid foundational knowledge.',
    "Good problem-solving approach — broke the problem down well.",
    'Showed awareness of trade-offs, which interviewers value.',
  ];
  const missings = [
    'Consider quantifying your impact with specific metrics.',
    'A brief mention of edge cases would strengthen the answer.',
    'Adding a real-world example would make this more compelling.',
    'You could deepen the technical detail in the second part.',
    'Connecting back to the original question at the end would help.',
  ];
  return {
    score,
    strengths: [pick(goods)],
    improvements: [pick(missings)],
    explanation: '',
    tags: [],
    rubric: { technical: score, communication: Math.max(1, score - 1), structure: score, confidence: Math.max(1, score - 1) },
  };
}

function getFallbackSummary(avg, roleTitle, mode) {
  const avgNum = parseFloat(avg);
  const level = avgNum >= 8.5 ? 'Exceptional' : avgNum >= 7.5 ? 'Strong Candidate' : avgNum >= 6 ? 'Interview Ready' : avgNum >= 4.5 ? 'Needs Preparation' : 'Not Ready';
  return {
    overallScore: avgNum,
    readinessLevel: level,
    summary: `You scored ${avg}/10 in this ${mode} session for ${roleTitle}. ${level === 'Exceptional' ? 'Outstanding performance!' : level === 'Strong Candidate' ? "You're well-prepared for real interviews." : "Keep practicing and you'll be ready soon."}`,
    strengths: ['Clear and structured communication', 'Good technical knowledge base', 'Problem-solving approach is methodical'],
    improvements: ['Add more specific metrics to your examples', 'Deepen knowledge of advanced concepts', 'Practice thinking aloud more consistently'],
    actionPlan: ['Practice 2 coding problems daily', 'Review system design patterns weekly', 'Record yourself and review your answers', 'Join mock interview communities for feedback'],
  };
}

function getFallbackCareerPath(targetRole, currentLevel) {
  const timeline = currentLevel === 'fresher' ? '3-4 months' : currentLevel === 'junior' ? '2-3 months' : '1-2 months';
  const readiness = currentLevel === 'fresher' ? 25 : currentLevel === 'junior' ? 45 : currentLevel === 'mid' ? 65 : 80;
  return {
    targetRole,
    currentLevel,
    overview: `Your path to becoming a ${targetRole} is well-defined. Based on your current level, you have a clear roadmap ahead across technical skills, problem-solving, and communication.`,
    estimatedTimeline: timeline,
    readinessPercent: readiness,
    keySkillsNeeded: ['Data Structures & Algorithms', 'System Design Basics', 'Problem Solving', 'Communication', 'Technical Depth'],
    skillsYouHave: currentLevel === 'fresher' ? ['Basic Programming', 'Fundamentals'] : ['Programming', 'Project Experience', 'Team Collaboration'],
    skillGaps: ['Advanced DSA', 'Distributed Systems', 'Performance Optimization'],
    learningRoadmap: [
      { phase: 1, title: 'Foundation & Gaps', duration: '2 weeks', topics: ['DSA Revision', 'Core Concepts'], description: 'Solidify fundamentals and address skill gaps' },
      { phase: 2, title: 'Deep Dive', duration: '3 weeks', topics: ['System Design', 'Advanced Topics'], description: 'Go deep on role-specific technical skills' },
      { phase: 3, title: 'Interview Practice', duration: '2 weeks', topics: ['Mock Interviews', 'Behavioral Prep'], description: 'Practice under real interview conditions' },
    ],
    interviewPrepPriority: [
      { type: 'technical', priority: 1, focus: 'Role-specific coding and concepts', topics: ['DSA', 'System Design', 'Debugging'] },
      { type: 'hr', priority: 2, focus: 'Behavioral and cultural fit', topics: ['STAR Stories', 'Motivation', 'Teamwork'] },
      { type: 'aptitude', priority: 3, focus: 'Screening rounds', topics: ['DSA MCQ', 'OS Concepts', 'DBMS'] },
      { type: 'system-design', priority: 4, focus: 'Architecture and design', topics: ['Scalability', 'Databases', 'APIs'] },
    ],
    recommendedTopics: ['Data Structures & Algorithms', 'System Design', 'Behavioral Interviews', `${targetRole} Skills`],
    jobTitles: [targetRole, 'Associate ' + targetRole, 'Junior ' + targetRole],
    salaryRange: '₹4 LPA - ₹18 LPA',
    topCompanies: ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'HCL', 'Amazon', 'Flipkart', 'Swiggy'],
    nextStep: 'Start with 2 practice coding problems today and rehearse your introduction pitch',
  };
}

const CODING_PROBLEMS = [
  {
    id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Map'],
    description: 'Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`. You may assume exactly one solution exists.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '−10⁹ ≤ nums[i] ≤ 10⁹', 'Exactly one valid answer'],
    testCases: [
      { callCode: 'twoSum([2,7,11,15], 9)', expected: [0, 1], hidden: false },
      { callCode: 'twoSum([3,2,4], 6)', expected: [1, 2], hidden: false },
      { callCode: 'twoSum([3,3], 6)', expected: [0, 1], hidden: false },
      { callCode: 'twoSum([1,2,3,4,5], 9)', expected: [3, 4], hidden: true },
      { callCode: 'twoSum([-1,-2,-3,-4,-5], -8)', expected: [2, 4], hidden: true },
    ],
    startCode: {
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  \n}',
      python: 'def two_sum(nums: list[int], target: int) -> list[int]:\n    pass',
      java: 'public int[] twoSum(int[] nums, int target) {\n    \n}',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    \n}',
    },
    hints: ['Try a hash map to store each number and its index', 'For each number, check if (target - num) exists in the map'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
  },
  {
    id: 'reverse-string', title: 'Reverse String', difficulty: 'Easy', tags: ['String', 'Two Pointers'],
    description: 'Write a function that reverses a string. The input string is given as an array of characters `s`. Modify the array **in-place** and return the reversed array.',
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: 'Reverse in place' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: '' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁵', 's[i] is a printable ASCII character'],
    testCases: [
      { callCode: 'reverseString(["h","e","l","l","o"])', expected: ['o', 'l', 'l', 'e', 'h'], hidden: false },
      { callCode: 'reverseString(["H","a","n","n","a","h"])', expected: ['h', 'a', 'n', 'n', 'a', 'H'], hidden: false },
      { callCode: 'reverseString(["a"])', expected: ['a'], hidden: false },
      { callCode: 'reverseString(["a","b"])', expected: ['b', 'a'], hidden: true },
    ],
    startCode: {
      javascript: '/**\n * @param {character[]} s\n * @return {character[]}\n */\nfunction reverseString(s) {\n  \n}',
      python: 'def reverse_string(s: list[str]) -> list[str]:\n    pass',
      java: 'public void reverseString(char[] s) {\n    \n}',
      cpp: 'void reverseString(vector<char>& s) {\n    \n}',
    },
    hints: ['Use two pointers — one at start, one at end', 'Swap and move toward center'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
  },
  {
    id: 'valid-palindrome', title: 'Valid Palindrome', difficulty: 'Easy', tags: ['String', 'Two Pointers'],
    description: 'A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: 'After cleanup: "amanaplanacanalpanama"' },
      { input: 's = "race a car"', output: 'false', explanation: 'After cleanup: "raceacar"' },
    ],
    constraints: ['1 ≤ s.length ≤ 2 × 10⁵', 's consists only of printable ASCII characters'],
    testCases: [
      { callCode: 'isPalindrome("A man, a plan, a canal: Panama")', expected: true, hidden: false },
      { callCode: 'isPalindrome("race a car")', expected: false, hidden: false },
      { callCode: 'isPalindrome(" ")', expected: true, hidden: false },
      { callCode: 'isPalindrome("Was it a car or a cat I saw?")', expected: true, hidden: true },
      { callCode: 'isPalindrome("hello")', expected: false, hidden: true },
    ],
    startCode: {
      javascript: '/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n  \n}',
      python: 'def is_palindrome(s: str) -> bool:\n    pass',
      java: 'public boolean isPalindrome(String s) {\n    \n}',
      cpp: 'bool isPalindrome(string s) {\n    \n}',
    },
    hints: ['First clean the string — keep only alphanumeric, lowercase all', 'Then use two pointers to compare'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
  },
  {
    id: 'max-subarray', title: 'Maximum Subarray', difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'],
    description: "Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nThis is the classic **Kadane's Algorithm** problem.",
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'Subarray [4,-1,2,1] has the largest sum = 6' },
      { input: 'nums = [1]', output: '1', explanation: '' },
      { input: 'nums = [5,4,-1,7,8]', output: '23', explanation: 'The entire array' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '−10⁴ ≤ nums[i] ≤ 10⁴'],
    testCases: [
      { callCode: 'maxSubArray([-2,1,-3,4,-1,2,1,-5,4])', expected: 6, hidden: false },
      { callCode: 'maxSubArray([1])', expected: 1, hidden: false },
      { callCode: 'maxSubArray([5,4,-1,7,8])', expected: 23, hidden: false },
      { callCode: 'maxSubArray([-1])', expected: -1, hidden: true },
      { callCode: 'maxSubArray([-2,-1])', expected: -1, hidden: true },
    ],
    startCode: {
      javascript: '/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n  \n}',
      python: 'def max_sub_array(nums: list[int]) -> int:\n    pass',
      java: 'public int maxSubArray(int[] nums) {\n    \n}',
      cpp: 'int maxSubArray(vector<int>& nums) {\n    \n}',
    },
    hints: ['Kadane\'s algorithm: track current sum and max sum', 'If current sum drops below 0, reset it'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
  },
  {
    id: 'fizzbuzz', title: 'FizzBuzz', difficulty: 'Easy', tags: ['Math', 'String'],
    description: 'Write a function `fizzBuzz(n)` that returns an array of strings from `"1"` to `"n"` where:\n- Multiples of 3 → `"Fizz"`\n- Multiples of 5 → `"Buzz"`\n- Multiples of both → `"FizzBuzz"`\n- Otherwise → the number as a string',
    examples: [
      { input: 'n = 3', output: '["1","2","Fizz"]', explanation: '3 is divisible by 3' },
      { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]', explanation: '5 is divisible by 5' },
      { input: 'n = 15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', explanation: '15 is divisible by both' },
    ],
    constraints: ['1 ≤ n ≤ 10⁴'],
    testCases: [
      { callCode: 'fizzBuzz(3)', expected: ['1', '2', 'Fizz'], hidden: false },
      { callCode: 'fizzBuzz(5)', expected: ['1', '2', 'Fizz', '4', 'Buzz'], hidden: false },
      { callCode: 'fizzBuzz(1)', expected: ['1'], hidden: false },
      { callCode: 'fizzBuzz(15)', expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'], hidden: true },
    ],
    startCode: {
      javascript: '/**\n * @param {number} n\n * @return {string[]}\n */\nfunction fizzBuzz(n) {\n  \n}',
      python: 'def fizz_buzz(n: int) -> list[str]:\n    pass',
      java: 'public List<String> fizzBuzz(int n) {\n    \n}',
      cpp: 'vector<string> fizzBuzz(int n) {\n    \n}',
    },
    hints: ['Use the modulo operator %', 'Check divisibility by 15 first (both 3 and 5)'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
  },
  {
    id: 'climbing-stairs', title: 'Climbing Stairs', difficulty: 'Easy', tags: ['Dynamic Programming', 'Math'],
    description: 'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb `1` or `2` steps. In how many **distinct ways** can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, or 2+1' },
    ],
    constraints: ['1 ≤ n ≤ 45'],
    testCases: [
      { callCode: 'climbStairs(2)', expected: 2, hidden: false },
      { callCode: 'climbStairs(3)', expected: 3, hidden: false },
      { callCode: 'climbStairs(1)', expected: 1, hidden: false },
      { callCode: 'climbStairs(5)', expected: 8, hidden: true },
      { callCode: 'climbStairs(10)', expected: 89, hidden: true },
    ],
    startCode: {
      javascript: '/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n  \n}',
      python: 'def climb_stairs(n: int) -> int:\n    pass',
      java: 'public int climbStairs(int n) {\n    \n}',
      cpp: 'int climbStairs(int n) {\n    \n}',
    },
    hints: ['This is essentially Fibonacci!', 'dp[n] = dp[n-1] + dp[n-2]'],
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
  },
];

const JOB_LISTINGS = [
  { id: 'j1', featured: true, tags: ['SDE', 'Backend', 'Python', 'Java'], requirements: ['B.Tech/BE in CS or related', 'Strong DSA fundamentals', 'Experience with distributed systems'], title: 'Software Engineer', company: 'Amazon', logo: '🛒', location: 'Hyderabad / Remote', type: 'Full-time', experience: '0-2 years', salary: '₹12-18 LPA', skills: ['Python', 'Java', 'DSA', 'System Design'], description: 'Join our core services team building scalable backend systems handling millions of requests.', posted: '2 days ago', urgent: true, category: 'backend' },
  { id: 'j2', featured: false, tags: ['Frontend', 'React', 'JavaScript', 'CSS'], requirements: ['1+ year React experience', 'TypeScript knowledge', 'Performance optimization skills'], title: 'Frontend Developer (React)', company: 'Flipkart', logo: '🛍️', location: 'Bangalore', type: 'Full-time', experience: '1-3 years', salary: '₹10-16 LPA', skills: ['React', 'TypeScript', 'CSS', 'Performance'], description: 'Build the next generation of e-commerce experiences for 300M+ users.', posted: '3 days ago', urgent: false, category: 'frontend' },
  { id: 'j3', featured: true, tags: ['Data', 'SQL', 'Analytics', 'Python'], requirements: ['SQL proficiency', 'Python basics', 'Experience with BI tools'], title: 'Data Analyst', company: 'Swiggy', logo: '🍔', location: 'Bangalore / Hyderabad', type: 'Full-time', experience: '0-2 years', salary: '₹8-14 LPA', skills: ['SQL', 'Python', 'Tableau', 'Excel'], description: 'Drive data-driven decisions across our food delivery platform.', posted: '1 day ago', urgent: true, category: 'data-analyst' },
  { id: 'j4', featured: false, tags: ['DevOps', 'Cloud', 'Kubernetes', 'Docker'], requirements: ['Kubernetes experience', 'CI/CD pipelines', 'AWS/GCP knowledge'], title: 'DevOps Engineer', company: 'Razorpay', logo: '💳', location: 'Bangalore', type: 'Full-time', experience: '2-4 years', salary: '₹15-22 LPA', skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'], description: "Scale India's leading payments infrastructure.", posted: '4 days ago', urgent: false, category: 'devops' },
  { id: 'j5', featured: true, tags: ['ML', 'AI', 'Python'], requirements: ['ML/DL frameworks', 'MLOps experience', 'Strong statistics background'], title: 'Machine Learning Engineer', company: 'Ola AI Labs', logo: '🚖', location: 'Bangalore / Remote', type: 'Full-time', experience: '1-3 years', salary: '₹16-28 LPA', skills: ['PyTorch', 'Python', 'MLOps', 'Statistics'], description: 'Build AI systems that power mobility for millions.', posted: '1 week ago', urgent: false, category: 'ml-engineer' },
  { id: 'j6', featured: true, tags: ['Backend', 'Node.js', 'Fintech'], requirements: ['Node.js expertise', 'Database design', 'Microservices experience'], title: 'Backend Developer (Node.js)', company: 'CRED', logo: '💎', location: 'Bangalore', type: 'Full-time', experience: '2-4 years', salary: '₹18-28 LPA', skills: ['Node.js', 'PostgreSQL', 'Redis', 'Microservices'], description: "Build the financial infrastructure for India's premium credit card users.", posted: '2 days ago', urgent: true, category: 'backend' },
  { id: 'j7', featured: false, tags: ['Product', 'PM', 'Strategy', 'SQL'], requirements: ['2+ years PM experience', 'SQL basics', 'User research skills'], title: 'Product Manager', company: 'Meesho', logo: '🛍️', location: 'Bangalore', type: 'Full-time', experience: '2-4 years', salary: '₹20-35 LPA', skills: ['Product Strategy', 'SQL', 'User Research', 'Roadmapping'], description: 'Define and drive product strategy for social commerce.', posted: '5 days ago', urgent: false, category: 'product' },
  { id: 'j8', featured: false, tags: ['Full-Stack', 'React', 'Node.js'], requirements: ['React & Node.js experience', 'PostgreSQL knowledge', 'Startup mindset'], title: 'Full Stack Developer', company: 'Zepto', logo: '⚡', location: 'Mumbai', type: 'Full-time', experience: '1-3 years', salary: '₹12-20 LPA', skills: ['React', 'Node.js', 'PostgreSQL', 'Redis'], description: 'Build the fastest grocery delivery experience in India.', posted: '3 days ago', urgent: false, category: 'fullstack' },
  { id: 'j9', featured: false, tags: ['Cloud', 'AWS', 'Architecture'], requirements: ['4+ years cloud experience', 'Architecture design skills', 'Team leadership'], title: 'Cloud Architect', company: 'Infosys', logo: '🏢', location: 'Multiple cities', type: 'Full-time', experience: '4-7 years', salary: '₹22-40 LPA', skills: ['AWS', 'Azure', 'Architecture', 'Security'], description: 'Design cloud migration strategies for Fortune 500 clients.', posted: '1 week ago', urgent: false, category: 'cloud' },
  { id: 'j10', featured: false, tags: ['Design', 'UX', 'Figma'], requirements: ['Figma proficiency', 'Portfolio with B2B SaaS work', 'User research experience'], title: 'UI/UX Designer', company: 'Freshworks', logo: '🌸', location: 'Chennai / Remote', type: 'Full-time', experience: '1-3 years', salary: '₹10-18 LPA', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'], description: 'Design user-centric experiences for B2B SaaS products.', posted: '6 days ago', urgent: false, category: 'uiux' },
  { id: 'j11', featured: true, tags: ['Fresher', 'Java', 'SDE'], requirements: ['B.Tech/BE degree', 'Good CGPA', 'Basic programming skills'], title: 'Software Engineer - Fresher', company: 'TCS Digital', logo: '🏬', location: 'Pan India', type: 'Full-time', experience: '0-1 year', salary: '₹7-9 LPA', skills: ['Java', 'Python', 'SQL', 'DSA'], description: 'Join the TCS Digital fast-track program working on digital transformation projects.', posted: '1 day ago', urgent: true, category: 'swe' },
  { id: 'j12', featured: false, tags: ['Data-Scientist', 'ML', 'Fintech'], requirements: ['ML expertise', 'Python & Spark', 'Statistical modeling skills'], title: 'Data Scientist', company: 'PhonePe', logo: '📱', location: 'Bangalore', type: 'Full-time', experience: '2-4 years', salary: '₹18-30 LPA', skills: ['ML', 'Python', 'Spark', 'Statistics'], description: 'Build ML models powering fraud detection, credit scoring, and personalization.', posted: '3 days ago', urgent: false, category: 'data-scientist' },
];

// ── Group Discussion Simulator fallback content ───────────────────
const GD_PERSONA_POOL = [
  { name: 'Aarav', avatar: '🧑🏽', archetype: 'the optimist' },
  { name: 'Meera', avatar: '👩🏽', archetype: 'the skeptic' },
  { name: 'Rohan', avatar: '🧑🏻', archetype: 'the pragmatist' },
  { name: 'Divya', avatar: '👩🏻', archetype: 'the wildcard/contrarian' },
];

const GD_TOPICS = [
  {
    topic: 'Should coding be a mandatory subject in schools from Class 6?',
    openers: [
      { persona: 'Aarav', text: "I think it's a great idea — early exposure builds problem-solving skills long before careers are decided, the same way we teach math." },
      { persona: 'Meera', text: "I'd push back a little — schools already struggle to teach core subjects well. Adding coding without trained teachers could do more harm than good." },
      { persona: 'Rohan', text: 'Maybe a middle ground — logic and computational thinking, not necessarily a specific language, could be introduced without needing specialist teachers everywhere.' },
    ],
    reactions: [
      { persona: 'Divya', text: "Honestly, aren't we overloading children already? At some point 'mandatory everything' just creates burnout, not skill." },
      { persona: 'Aarav', text: "That's fair, but the same was said about English or computers 20 years ago, and now they're considered essential." },
    ],
  },
  {
    topic: 'Is work-from-home more productive than working from office?',
    openers: [
      { persona: 'Rohan', text: 'For focused, individual work, WFH clearly wins — no commute, fewer interruptions, and people report better work-life balance.' },
      { persona: 'Divya', text: "I disagree for early-career folks specifically — you learn by watching seniors solve problems in real time, which is much harder remotely." },
      { persona: 'Meera', text: "It really depends on the role. Support and creative-collaboration roles seem to suffer more from remote work than deep technical work does." },
    ],
    reactions: [
      { persona: 'Aarav', text: 'A hybrid model seems to be what most companies are converging on precisely because neither extreme works for every role.' },
      { persona: 'Rohan', text: "Sure, but hybrid also means never fully optimizing for either mode — you get some of both tradeoffs, not the best of both." },
    ],
  },
  {
    topic: 'Should social media platforms verify the age of every user?',
    openers: [
      { persona: 'Meera', text: 'Given how much harm unsupervised access causes minors, mandatory verification feels overdue, honestly.' },
      { persona: 'Divya', text: "Verification sounds simple until you ask HOW — ID uploads raise huge privacy and data-breach concerns for everyone, not just minors." },
      { persona: 'Rohan', text: 'On-device age estimation without storing documents might be a workable middle path, technically speaking.' },
    ],
    reactions: [
      { persona: 'Aarav', text: 'Also worth asking: is the platform responsible, or is this fundamentally a parenting and device-level control problem?' },
      { persona: 'Meera', text: "Probably both — but platforms have the data and infrastructure to act fastest, so I'd start there." },
    ],
  },
];

function getFallbackGDScenario(requestedTopic) {
  const pick = GD_TOPICS[Math.floor(Math.random() * GD_TOPICS.length)];
  return {
    topic: requestedTopic?.trim() || pick.topic,
    personas: GD_PERSONA_POOL,
    transcript: pick.openers.map(o => ({ speaker: o.persona, text: o.text, isUser: false })),
    _fallbackKey: pick.topic, // used to fetch matching canned reactions later
  };
}

function getFallbackGDReactions(topicKey) {
  const match = GD_TOPICS.find(t => t.topic === topicKey) || GD_TOPICS[0];
  return match.reactions.map(r => ({ speaker: r.persona, text: r.text, isUser: false }));
}

function getFallbackGDEvaluation(transcript) {
  const userMsgs = transcript.filter(t => t.isUser);
  const totalWords = userMsgs.reduce((s, m) => s + (m.text || '').split(/\s+/).filter(Boolean).length, 0);
  const avgWords = userMsgs.length ? totalWords / userMsgs.length : 0;
  const score = Math.min(9, Math.max(4, Math.round(4 + userMsgs.length * 0.8 + Math.min(avgWords / 10, 2))));
  return {
    score,
    initiative: userMsgs.length >= 3 ? 8 : 5,
    articulation: avgWords >= 15 ? 7 : 5,
    listening: 6,
    assertiveness: 6,
    verdict: score >= 8 ? 'Strong Contributor' : score >= 6 ? 'Balanced Participant' : 'Needs to Speak Up More',
    strengths: ['Participated across multiple rounds', 'Stayed on topic'],
    improvements: ['Try referencing a previous speaker by name before making your point', 'Add a concrete example or statistic to strengthen your argument'],
  };
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }



module.exports = {
  HR_QUESTIONS, SYSTEM_DESIGN_QUESTIONS, MOCK_QUESTIONS, MCQ_QUESTIONS, SKILL_CATEGORY_LABELS,
  CODING_PROBLEMS, JOB_LISTINGS, GD_PERSONA_POOL,
  getFallbackQuestions, getFallbackHRQuestions, getFallbackSystemDesignQuestions,
  getFallbackMCQ, getFallbackSkillQuiz, getFallbackFeedback, getFallbackSummary, getFallbackCareerPath,
  getFallbackGDScenario, getFallbackGDReactions, getFallbackGDEvaluation,
};
