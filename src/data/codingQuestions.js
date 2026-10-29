/**
 * Computer Science & Software Engineering Questions Database Module
 * 
 * Powered by internal JSON database: src/data/coding_questions.json
 * Covering 6 Core Computer Science Disciplines with 100 questions each (600 total):
 * - ⚡ All Computer Science Gauntlet (600 Qs)
 * - 🧠 Data Structures & Algorithms (100 Qs)
 * - 🌐 Web & Frontend Engineering (100 Qs)
 * - 🗄️ Backend, Databases & Cloud (100 Qs)
 * - 💻 Programming Languages & OOP (100 Qs)
 * - 🛡️ Systems, Networks & Cybersecurity (100 Qs)
 * - 🤖 Machine Learning & AI (100 Qs)
 */

import questionsData from './coding_questions.json';

export const CODING_TOPICS = questionsData.topics;
export const CODING_QUESTIONS = questionsData.questions;

// Big Categories Definition with icons and descriptions
export const BIG_CATEGORIES = [
  {
    id: "all",
    name: "All Computer Science",
    icon: "⚡",
    desc: "Complete 600-question grand gauntlet across all software disciplines"
  },
  {
    id: "dsa",
    name: "Data Structures & Algorithms",
    icon: "🧠",
    desc: "Arrays, Trees, Graphs, Sorting, Dynamic Programming & Complexity (100 Qs)"
  },
  {
    id: "web_dev",
    name: "Web & Frontend Engineering",
    icon: "🌐",
    desc: "HTML5, CSS3, JavaScript, TypeScript, React & Browser APIs (100 Qs)"
  },
  {
    id: "backend_db",
    name: "Backend, Databases & Cloud",
    icon: "🗄️",
    desc: "SQL, NoSQL, Relational Schema, REST APIs, Microservices & Docker (100 Qs)"
  },
  {
    id: "languages_oop",
    name: "Programming Languages & OOP",
    icon: "💻",
    desc: "Python, Java, C++, Go, Object-Oriented Principles & Concurrency (100 Qs)"
  },
  {
    id: "systems_security",
    name: "Systems, Networks & Security",
    icon: "🛡️",
    desc: "Linux, Virtual Memory, TCP/IP, DNS, Cryptography & Cybersecurity (100 Qs)"
  },
  {
    id: "ml_ai",
    name: "Machine Learning & AI",
    icon: "🤖",
    desc: "Neural Networks, Deep Learning, Transformers, LLMs & RAG (100 Qs)"
  }
];

/**
 * Resolves any input (single topic, Big Category, array, Set) into a flat array of valid subtopic IDs
 */
export function resolveTopicIds(topicInput) {
  if (!topicInput || topicInput === 'all') return ['all'];

  let rawIds = [];
  if (Array.isArray(topicInput)) {
    rawIds = topicInput;
  } else if (topicInput instanceof Set) {
    rawIds = Array.from(topicInput);
  } else if (typeof topicInput === 'string') {
    rawIds = [topicInput];
  }

  if (rawIds.length === 0 || rawIds.includes('all')) return ['all'];

  const resolved = new Set();
  const bigCatIds = ['dsa', 'web_dev', 'backend_db', 'languages_oop', 'systems_security', 'ml_ai'];

  rawIds.forEach(id => {
    if (bigCatIds.includes(id)) {
      // Expand Big Category to all its subtopics
      CODING_TOPICS.filter(t => t.category === id).forEach(t => resolved.add(t.id));
    } else {
      resolved.add(id);
    }
  });

  return resolved.size > 0 ? Array.from(resolved) : ['all'];
}

/**
 * Filter questions by topic and difficulty without repetition!
 * Prioritizes unseen questions from the selected topic(s).
 */
export function getQuestionsForRound(topicInput = 'all', targetDifficulty = 'easy', count = 5, seenQuestionIds = new Set()) {
  const activeIds = resolveTopicIds(topicInput);
  let pool = CODING_QUESTIONS;

  if (!activeIds.includes('all') && activeIds.length > 0) {
    const filtered = pool.filter(q => activeIds.includes(q.topic));
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  // 1. Separate unseen questions from seen questions to prevent repeats
  let unseen = pool.filter(q => !seenQuestionIds.has(q.id));

  // If all questions in this topic pool have been seen, recycle pool so game never breaks
  if (unseen.length === 0) {
    unseen = [...pool];
  }

  // 2. Prioritize matching difficulty among unseen questions
  const diffMatching = unseen.filter(q => q.difficulty === targetDifficulty);
  const diffOther = unseen.filter(q => q.difficulty !== targetDifficulty);

  // Fisher-Yates shuffle helper
  const shuffle = (arr) => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  const shuffledMatching = shuffle(diffMatching);
  const shuffledOther = shuffle(diffOther);

  // Combine: matching difficulty first, then others to meet requested count
  let selected = [];
  if (shuffledMatching.length >= count) {
    selected = shuffledMatching.slice(0, count);
  } else {
    selected = [...shuffledMatching, ...shuffledOther.slice(0, count - shuffledMatching.length)];
  }

  // If still not enough, draw from seen pool (recycled)
  if (selected.length < count) {
    const seenAvailable = shuffle(pool.filter(q => !selected.some(s => s.id === q.id)));
    selected = [...selected, ...seenAvailable.slice(0, count - selected.length)];
  }

  return selected;
}

/**
 * Returns total count of questions for a specific topic ID
 */
export function getQuestionCountForTopic(topicId) {
  if (topicId === 'all') return CODING_QUESTIONS.length;
  return CODING_QUESTIONS.filter(q => q.topic === topicId).length;
}

/**
 * Returns total count of questions for a Big Category ID
 */
export function getQuestionCountForCategory(category) {
  if (category === 'all') return CODING_QUESTIONS.length;
  const subtopicIds = CODING_TOPICS.filter(t => t.category === category).map(t => t.id);
  return CODING_QUESTIONS.filter(q => subtopicIds.includes(q.topic)).length;
}

/**
 * Get human-readable summary of active topic(s)
 */
export function getTopicDisplayName(topicInput) {
  if (!topicInput || topicInput === 'all') return '⚡ All Subjects Gauntlet';

  const ids = Array.isArray(topicInput) ? topicInput : (topicInput instanceof Set ? Array.from(topicInput) : [topicInput]);
  if (ids.length === 0 || ids.includes('all')) return '⚡ All Subjects Gauntlet';

  // Check if it matches a Big Category exactly
  const bigCat = BIG_CATEGORIES.find(c => c.id === ids[0] && ids.length === 1);
  if (bigCat) return `${bigCat.icon} ${bigCat.name}`;

  if (ids.length === 1) {
    const found = CODING_TOPICS.find(t => t.id === ids[0]);
    return found ? `${found.icon} ${found.name}` : ids[0].toUpperCase();
  }

  return `🎯 Multi-Subject (${ids.length} Selected)`;
}

/**
 * Filter topics by category: 'all' | 'dino' | 'code' | 'stem' | 'math' | 'humanities'
 */
export function getTopicsByCategory(category = 'all') {
  if (category === 'all') return CODING_TOPICS;
  return CODING_TOPICS.filter(t => t.category === category);
}
