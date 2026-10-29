import { CODING_TOPICS, CODING_QUESTIONS, getQuestionsForRound, getTopicDisplayName } from '../data/codingQuestions.js';
import { grokAI } from '../services/GrokAIService.js';

/**
 * QuizManager
 * 
 * Orchestrates questions, countdown timers, answer validation across all 4 formats:
 * - Single Select
 * - Multi Select
 * - True / False
 * - Code Output Prediction
 * 
 * Integrates with xAI Grok AI for dynamic question generation across
 * multiple user-selected subjects with instantaneous local fallback.
 */
export class QuizManager {
  constructor(audio, ui) {
    this.audio = audio;
    this.ui = ui;

    // Supports single or multiple topics
    this.topicIds = ['all'];
    this.currentQuestion = null;
    this.currentStageIndex = 0;
    this.questionQueue = [];

    // Timer state
    this.timerDuration = 20;
    this.timerRemaining = 20;
    this.timerInterval = null;
    this.isTimerActive = false;
    this.questionStartTime = 0;

    // Session Statistics
    this.stats = {
      totalAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalTimeSpent: 0,
      missedQuestions: [] // Array of { question, code, userAnswers, correctAnswers, explanation, aiGenerated }
    };

    // User selection state for multi-select
    this.selectedOptionIndices = new Set();

    // Seen questions tracker to guarantee zero repeats across stages
    this.seenQuestionIds = new Set();
  }

  setTopic(topicId) {
    if (Array.isArray(topicId)) {
      this.topicIds = topicId.length ? topicId : ['all'];
    } else if (topicId instanceof Set) {
      this.topicIds = topicId.size ? Array.from(topicId) : ['all'];
    } else {
      this.topicIds = [topicId || 'all'];
    }
  }

  setTopics(topicIds) {
    this.setTopic(topicIds);
  }

  getActiveTopicNames() {
    if (this.topicIds.includes('all')) {
      return CODING_TOPICS.filter(t => t.id !== 'all').map(t => t.name);
    }
    return CODING_TOPICS.filter(t => this.topicIds.includes(t.id)).map(t => t.name);
  }

  resetSession() {
    this.stats = {
      totalAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalTimeSpent: 0,
      missedQuestions: []
    };
    this.seenQuestionIds.clear();
    this.clearQuestionState();
  }

  clearQuestionState() {
    this.selectedOptionIndices.clear();
    this.stopTimer();
    this.currentQuestion = null;
  }

  getDifficultyForStage(stageIndex) {
    if (stageIndex <= 1) return 'easy';
    if (stageIndex <= 3) return 'medium';
    if (stageIndex <= 5) return 'hard';
    return 'pro';
  }

  getTimerDurationForDifficulty(difficulty) {
    switch (difficulty) {
      case 'easy': return 25;
      case 'medium': return 20;
      case 'hard': return 18;
      case 'pro': return 15;
      default: return 20;
    }
  }

  async prepareStageQuestions(stageIndex) {
    this.currentStageIndex = stageIndex;
    const diff = this.getDifficultyForStage(stageIndex);
    this.questionQueue = getQuestionsForRound(this.topicIds, diff, 6, this.seenQuestionIds);

    // Register all queued questions as seen
    this.questionQueue.forEach(q => {
      if (q && q.id) this.seenQuestionIds.add(q.id);
    });

    // If Grok AI is connected, attempt to prefetch an AI question to mix in
    if (grokAI.isConnected()) {
      try {
        const subjectNames = this.getActiveTopicNames();
        const aiQ = await grokAI.generateQuestion(subjectNames, diff);
        if (aiQ) {
          // Insert AI question right at the start or early in queue
          this.questionQueue.unshift(aiQ);
        }
      } catch (err) {
        console.warn('Could not prefetch Grok AI question:', err);
      }
    }
  }

  /**
   * Retrieves the next question, either from Grok AI or from local queue
   */
  async nextQuestion() {
    this.clearQuestionState();
    const diff = this.getDifficultyForStage(this.currentStageIndex);

    // If Grok AI is active and connected, fetch dynamically
    if (grokAI.isConnected() && Math.random() < 0.75) {
      try {
        const subjectNames = this.getActiveTopicNames();
        const aiQuestion = await grokAI.generateQuestion(subjectNames, diff);
        if (aiQuestion && aiQuestion.options && aiQuestion.options.length >= 2) {
          this.currentQuestion = aiQuestion;
          this.setupQuestionTimer();
          return this.currentQuestion;
        }
      } catch (e) {
        console.warn('Grok generation failed, falling back to local pool:', e);
      }
    }

    // Fallback or standard queue
    if (!this.questionQueue || this.questionQueue.length === 0) {
      this.questionQueue = getQuestionsForRound(this.topicIds, diff, 6, this.seenQuestionIds);
      this.questionQueue.forEach(q => {
        if (q && q.id) this.seenQuestionIds.add(q.id);
      });
    }

    this.currentQuestion = this.questionQueue.shift();
    if (this.currentQuestion && this.currentQuestion.id) {
      this.seenQuestionIds.add(this.currentQuestion.id);
    }
    this.setupQuestionTimer();
    return this.currentQuestion;
  }

  setupQuestionTimer() {
    const duration = this.getTimerDurationForDifficulty(this.currentQuestion.difficulty || 'medium');
    this.timerDuration = duration;
    this.timerRemaining = duration;
    this.questionStartTime = performance.now();
  }

  startTimer(onTick, onTimeout) {
    this.stopTimer();
    this.isTimerActive = true;

    this.timerInterval = setInterval(() => {
      this.timerRemaining = Math.max(0, this.timerRemaining - 1);
      const isUrgent = this.timerRemaining <= 5;

      if (this.audio) {
        this.audio.playQuizTick(isUrgent);
      }

      onTick?.(this.timerRemaining, this.timerDuration, isUrgent);

      if (this.timerRemaining <= 0) {
        this.stopTimer();
        onTimeout?.();
      }
    }, 1000);
  }

  stopTimer() {
    this.isTimerActive = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  toggleOptionSelection(index) {
    if (this.selectedOptionIndices.has(index)) {
      this.selectedOptionIndices.delete(index);
    } else {
      this.selectedOptionIndices.add(index);
    }
    return Array.from(this.selectedOptionIndices);
  }

  /**
   * Evaluates the submitted answer against the current question.
   * Supports: single index, array of indices (multi), or timeout (null).
   */
  evaluateAnswer(userInput) {
    this.stopTimer();
    const timeSpent = Math.max(0.5, ((performance.now() - this.questionStartTime) / 1000).toFixed(1));
    this.stats.totalTimeSpent += parseFloat(timeSpent);
    this.stats.totalAnswered++;

    const q = this.currentQuestion;
    let isCorrect = false;

    if (userInput === null || userInput === undefined) {
      // Timeout / expired
      isCorrect = false;
    } else if (q.type === 'multi') {
      // Multi-select array comparison
      const userSelectedArr = Array.isArray(userInput) ? [...userInput].sort((a,b) => a - b) : [userInput];
      const correctArr = Array.isArray(q.correct) ? [...q.correct].sort((a,b) => a - b) : [q.correct];

      isCorrect = (userSelectedArr.length === correctArr.length) &&
                  userSelectedArr.every((val, idx) => val === correctArr[idx]);
    } else {
      // Single select, boolean, or code output
      const selectedIdx = typeof userInput === 'number' ? userInput : parseInt(userInput, 10);
      isCorrect = (selectedIdx === q.correct);
    }

    if (isCorrect) {
      this.stats.totalCorrect++;
      this.stats.currentStreak++;
      if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
      if (this.audio) this.audio.playCorrect();
    } else {
      this.stats.totalWrong++;
      this.stats.currentStreak = 0;
      if (this.audio) this.audio.playWrong();

      // Log for post-game review with deep explanation
      const userLabels = Array.isArray(userInput)
        ? (userInput.length ? userInput.map(i => q.options[i] || 'None').join(', ') : 'None Selected')
        : (userInput !== null && q.options[userInput] ? q.options[userInput] : 'Time Expired / No Answer');

      const correctLabels = Array.isArray(q.correct)
        ? q.correct.map(i => q.options[i]).join(', ')
        : q.options[q.correct];

      this.stats.missedQuestions.push({
        id: q.id,
        topic: q.topicName || q.topic,
        difficulty: q.difficulty,
        question: q.question,
        code: q.code || null,
        userSelected: userLabels,
        correctAnswer: correctLabels,
        explanation: q.explanation,
        aiGenerated: Boolean(q.aiGenerated),
        model: q.model || null
      });
    }

    return {
      isCorrect,
      question: q,
      userInput,
      timeSpent,
      stats: this.stats
    };
  }

  getSkillBadge() {
    const total = this.stats.totalAnswered || 1;
    const accuracy = Math.round((this.stats.totalCorrect / total) * 100);
    const stagesCleared = this.currentStageIndex;

    if (accuracy >= 90 || stagesCleared >= 5) {
      return {
        tier: 'apex',
        title: '👑 PRINCIPAL ARCHITECT / APEX GRANDMASTER',
        desc: 'Astonishing mastery across complex algorithms, systems architecture, sciences, and multi-domain theory. Ready to lead high-scale engineering!',
        color: '#ffaa00',
        badge: 'GRANDMASTER'
      };
    } else if (accuracy >= 75 || stagesCleared >= 4) {
      return {
        tier: 'senior',
        title: '🥇 SENIOR POLYMATH / PRO GLADIATOR',
        desc: 'Deep technical competence, fast analytical problem solving, and robust understanding of foundational principles.',
        color: '#00e5ff',
        badge: 'SENIOR PRO'
      };
    } else if (accuracy >= 50 || stagesCleared >= 2) {
      return {
        tier: 'intermediate',
        title: '🥈 INTERMEDIATE DEVELOPER & SCHOLAR',
        desc: 'Solid grasp of core programming primitives and concepts. Keep sharpening edge-case knowledge to reach Senior tier!',
        color: '#a855f7',
        badge: 'INTERMEDIATE'
      };
    } else {
      return {
        tier: 'learner',
        title: '🥉 CS APPRENTICE / LEARNER',
        desc: 'Great effort in the arena! Review the missed questions below to solidify your mental models and conquer the colosseum next time.',
        color: '#22c55e',
        badge: 'LEARNER'
      };
    }
  }

  getSummary() {
    const total = this.stats.totalAnswered || 1;
    const accuracy = Math.round((this.stats.totalCorrect / total) * 100);
    const avgTime = (this.stats.totalTimeSpent / total).toFixed(1);

    return {
      totalAnswered: this.stats.totalAnswered,
      totalCorrect: this.stats.totalCorrect,
      totalWrong: this.stats.totalWrong,
      accuracy,
      avgTime,
      bestStreak: this.stats.bestStreak,
      stagesCleared: this.currentStageIndex,
      skillBadge: this.getSkillBadge(),
      missedQuestions: this.stats.missedQuestions
    };
  }
}
