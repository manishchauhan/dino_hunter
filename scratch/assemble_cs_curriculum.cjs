// Assemble all 600 Computer Science Questions and Topics into src/data/coding_questions.json
const fs = require('fs');

const dsa = JSON.parse(fs.readFileSync('scratch/dsa_100.json', 'utf8'));
const web = JSON.parse(fs.readFileSync('scratch/web_100.json', 'utf8'));
const backend = JSON.parse(fs.readFileSync('scratch/backend_100.json', 'utf8'));
const languages = JSON.parse(fs.readFileSync('scratch/languages_100.json', 'utf8'));
const systems = JSON.parse(fs.readFileSync('scratch/systems_100.json', 'utf8'));
const ai = JSON.parse(fs.readFileSync('scratch/ai_100.json', 'utf8'));

console.log(`Loaded:
- DSA: ${dsa.length}
- Web Dev: ${web.length}
- Backend & DB: ${backend.length}
- Languages & OOP: ${languages.length}
- Systems & Security: ${systems.length}
- ML & AI: ${ai.length}
`);

const allQuestions = [
  ...dsa,
  ...web,
  ...backend,
  ...languages,
  ...systems,
  ...ai
];

console.log(`Total questions to assemble: ${allQuestions.length}`);

// Validation
const ids = new Set();
for (let i = 0; i < allQuestions.length; i++) {
  const q = allQuestions[i];
  if (!q.id) throw new Error(`Question at index ${i} has no id`);
  if (ids.has(q.id)) throw new Error(`Duplicate id found: ${q.id}`);
  ids.add(q.id);

  if (!q.question || q.question.trim().length === 0) throw new Error(`Empty question text for ${q.id}`);
  if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`Invalid options for ${q.id}`);
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
    throw new Error(`Invalid correct index for ${q.id}: ${q.correct}`);
  }
  if (!q.explanation || q.explanation.trim().length === 0) throw new Error(`Empty explanation for ${q.id}`);
}

const topics = [
  {
    id: "all",
    name: "All Computer Science Gauntlet",
    category: "all",
    icon: "⚡",
    desc: "Complete 600-question grand gauntlet across all software disciplines"
  },
  {
    id: "dsa",
    name: "Data Structures & Algorithms",
    category: "dsa",
    icon: "🧠",
    desc: "Arrays, Trees, Graphs, Sorting, Dynamic Programming & Complexity"
  },
  {
    id: "web_dev",
    name: "Web & Frontend Engineering",
    category: "web_dev",
    icon: "🌐",
    desc: "HTML5, CSS3, JavaScript, TypeScript, React & Browser APIs"
  },
  {
    id: "backend_db",
    name: "Backend, Databases & Cloud",
    category: "backend_db",
    icon: "🗄️",
    desc: "SQL, NoSQL, Relational Schema, REST APIs, Microservices & Docker"
  },
  {
    id: "languages_oop",
    name: "Programming Languages & OOP",
    category: "languages_oop",
    icon: "💻",
    desc: "Python, Java, C++, Go, Object-Oriented Principles & Concurrency"
  },
  {
    id: "systems_security",
    name: "Systems, Networks & Cybersecurity",
    category: "systems_security",
    icon: "🛡️",
    desc: "Linux, Virtual Memory, TCP/IP, DNS, Cryptography & Security"
  },
  {
    id: "ml_ai",
    name: "Machine Learning & AI",
    category: "ml_ai",
    icon: "🤖",
    desc: "Neural Networks, Deep Learning, Transformers, LLMs & RAG"
  }
];

const database = {
  topics,
  questions: allQuestions
};

fs.writeFileSync('src/data/coding_questions.json', JSON.stringify(database, null, 2));
console.log('Successfully written src/data/coding_questions.json!');
