import * as THREE from 'three';
import { BIG_CATEGORIES, getQuestionCountForTopic, getQuestionCountForCategory, resolveTopicIds } from '../data/codingQuestions.js';

/**
 * UIManager
 * 
 * Manages all HUD, Quiz Card, Grok AI Connector Modal, Multi-Subject Selection,
 * Countdown Timer, Clean Question Transitions, Combat Banners, and Comprehensive Scoreboard.
 */
export class UIManager {
  constructor(camera) {
    this.camera = camera;

    // HUD Elements
    this.p1HealthBar = document.getElementById('p1-health');
    this.p1HealthGhost = document.getElementById('p1-health-ghost');
    this.p1HpText = document.getElementById('p1-hp-text');

    this.p2HealthBar = document.getElementById('p2-health');
    this.p2HealthGhost = document.getElementById('p2-health-ghost');
    this.p2HpText = document.getElementById('p2-hp-text');
    this.p2ElementName = document.getElementById('p2-element-name');

    this.hudStageTag = document.getElementById('hud-stage-tag');
    this.hudTopicTag = document.getElementById('hud-topic-tag');
    this.hudStreakCrest = document.getElementById('hud-streak-crest');

    // Floating Damage & Banners
    this.damageContainer = document.getElementById('floating-damage-container');
    this.actionBanner = document.getElementById('action-banner');
    this.bannerTimer = null;

    // Arcade Giant Announcement
    this.arcadeAnnouncement = document.getElementById('arcade-announcement');
    this.arcadeMainText = document.getElementById('arcade-main-text');
    this.arcadeSubText = document.getElementById('arcade-sub-text');
    this.arcadeTimer = null;

    // Quiz Card Overlay Elements
    this.quizOverlay = document.getElementById('quiz-card-overlay');
    this.quizCardPanel = document.getElementById('quiz-card-panel');
    this.quizDiffBadge = document.getElementById('quiz-diff-badge');
    this.quizSubjectBadge = document.getElementById('quiz-subject-badge');
    this.quizTypeBadge = document.getElementById('quiz-type-badge');
    this.quizAiBadge = document.getElementById('quiz-ai-badge');
    this.quizTimerText = document.getElementById('quiz-timer-text');
    this.quizTimerBar = document.getElementById('quiz-timer-bar');
    this.quizAiLoading = document.getElementById('quiz-ai-loading');
    this.aiLoadingText = document.getElementById('ai-loading-text');
    this.quizContentArea = document.getElementById('quiz-content-area');
    this.quizQuestionText = document.getElementById('quiz-question-text');
    this.quizCodeContainer = document.getElementById('quiz-code-container');
    this.quizCodeText = document.getElementById('quiz-code-text');
    this.quizMultiHint = document.getElementById('quiz-multi-hint');
    this.quizOptionsContainer = document.getElementById('quiz-options-container');
    this.quizFooterActions = document.getElementById('quiz-footer-actions');
    this.btnQuizSubmit = document.getElementById('btn-quiz-submit');
    this.quizFeedbackBanner = document.getElementById('quiz-feedback-banner');
    this.feedbackIcon = document.getElementById('feedback-icon');
    this.feedbackText = document.getElementById('feedback-text');

    // AI UI Elements (Google Gemini + xAI Grok)
    this.btnGrokHeader = document.getElementById('btn-grok-header');
    this.grokHudStatusDot = document.getElementById('grok-hud-status-dot');
    this.grokHudLabel = document.getElementById('grok-hud-label');
    this.grokModalOverlay = document.getElementById('grok-modal-overlay');
    this.btnCloseGrokModal = document.getElementById('btn-close-grok-modal');
    this.tabGemini = document.getElementById('tab-gemini');
    this.tabXai = document.getElementById('tab-xai');
    this.aiSectionGemini = document.getElementById('ai-section-gemini');
    this.aiSectionXai = document.getElementById('ai-section-xai');
    this.geminiApiKey = document.getElementById('gemini-api-key');
    this.geminiModelSelect = document.getElementById('gemini-model-select');
    this.btnToggleGeminiKeyVisibility = document.getElementById('btn-toggle-gemini-key-visibility');
    this.grokEnableToggle = document.getElementById('grok-enable-toggle');
    this.grokDemoToggle = document.getElementById('grok-demo-toggle');
    this.grokApiKey = document.getElementById('grok-api-key');
    this.btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
    this.grokModelSelect = document.getElementById('grok-model-select');
    this.grokTestStatus = document.getElementById('grok-test-status');
    this.grokTestIcon = document.getElementById('grok-test-icon');
    this.grokTestMsg = document.getElementById('grok-test-msg');
    this.btnTestGrokConn = document.getElementById('btn-test-grok-conn');
    this.btnSaveGrokConfig = document.getElementById('btn-save-grok-config');
    this.startGrokBanner = document.getElementById('start-grok-banner');
    this.startGrokStatusText = document.getElementById('start-grok-status-text');
    this.btnOpenGrokFromStart = document.getElementById('btn-open-grok-from-start');
    this.btnOpenGrokFromPause = document.getElementById('btn-open-grok-from-pause');
    this.currentAiProvider = 'gemini';

    // Modals
    this.homeModalOverlay = document.getElementById('home-modal-overlay');
    this.arcadeLadderOverlay = document.getElementById('arcade-ladder-overlay');
    this.ladderTowerContainer = document.getElementById('ladder-tower-container');
    this.btnFightNext = document.getElementById('btn-fight-next');
    this.btnLadderHome = document.getElementById('btn-ladder-home');
    this.ladderHealBadge = document.getElementById('ladder-heal-badge');
    this.ladderStreakBadge = document.getElementById('ladder-streak-badge');

    // Scoreboard Modal
    this.quizScoreboardOverlay = document.getElementById('quiz-scoreboard-overlay');
    this.scoreboardOutcomeIcon = document.getElementById('scoreboard-outcome-icon');
    this.scoreboardOutcomeTitle = document.getElementById('scoreboard-outcome-title');
    this.scoreboardOutcomeSubtitle = document.getElementById('scoreboard-outcome-subtitle');
    this.skillBadgeTier = document.getElementById('skill-badge-tier');
    this.skillBadgeName = document.getElementById('skill-badge-name');
    this.skillBadgeDesc = document.getElementById('skill-badge-desc');
    this.scoreAccuracy = document.getElementById('score-accuracy');
    this.scoreCorrectWrong = document.getElementById('score-correct-wrong');
    this.scoreStages = document.getElementById('score-stages');
    this.scoreSpeed = document.getElementById('score-speed');
    this.reviewCountBadge = document.getElementById('review-count-badge');
    this.missedQuestionsContainer = document.getElementById('missed-questions-container');
    this.btnScoreRetry = document.getElementById('btn-score-retry');
    this.btnScoreTopic = document.getElementById('btn-score-topic');
    this.btnScoreHome = document.getElementById('btn-score-home');

    // Start Screen & Multi-Subject Elements
    this.startOverlay = document.getElementById('start-overlay');
    this.chkMultiSubject = document.getElementById('chk-multi-subject');
    this.btnPlayCategory = document.getElementById('btn-play-category');
    this.btnSelectAllTopics = document.getElementById('btn-select-all-topics');
    this.btnClearAllTopics = document.getElementById('btn-clear-all-topics');
    this.topicCategoryTabs = document.getElementById('topic-category-tabs');
    this.topicSummaryText = document.getElementById('topic-summary-text');
    this.topicsGridContainer = document.getElementById('topics-grid-container');
    this.playerDinoGrid = document.getElementById('player-dino-grid');
    this.btnStart = document.getElementById('btn-start');

    // Countdown Overlay
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownArenaIcon = document.getElementById('countdown-arena-icon');
    this.countdownArenaName = document.getElementById('countdown-arena-name');
    this.countdownRoundTag = document.getElementById('countdown-round-tag');
    this.countdownNumber = document.getElementById('countdown-number');
    this.countdownTip = document.getElementById('countdown-tip');

    // Internal selection cache for multi-select question
    this.selectedMultiIndices = new Set();
  }

  // ============================================================
  // AI ENGINE MODAL & STATUS CONTROLS (GEMINI + GROK)
  // ============================================================
  setupGrokUI(grokService, onConfigUpdated) {
    if (!grokService) return;

    // Load initial config values into UI
    const cfg = grokService.config;
    this.currentAiProvider = cfg.provider || 'gemini';

    if (this.grokEnableToggle) this.grokEnableToggle.checked = Boolean(cfg.enabled);
    if (this.grokDemoToggle) this.grokDemoToggle.checked = Boolean(cfg.demoMode);
    
    // Gemini Fields
    if (this.geminiApiKey) this.geminiApiKey.value = cfg.geminiApiKey || '';
    if (this.geminiModelSelect) this.geminiModelSelect.value = cfg.geminiModel || 'gemini-1.5-flash';

    // xAI Grok Fields
    if (this.grokApiKey) this.grokApiKey.value = cfg.xaiApiKey || cfg.apiKey || '';
    if (this.grokModelSelect) this.grokModelSelect.value = cfg.xaiModel || cfg.model || 'grok-2-latest';

    // Provider Tabs setup
    const switchProviderTab = (provider) => {
      this.currentAiProvider = provider;
      if (this.tabGemini && this.tabXai) {
        if (provider === 'gemini') {
          this.tabGemini.classList.add('active');
          this.tabXai.classList.remove('active');
          if (this.aiSectionGemini) this.aiSectionGemini.classList.remove('hidden');
          if (this.aiSectionXai) this.aiSectionXai.classList.add('hidden');
          if (this.btnTestGrokConn) this.btnTestGrokConn.textContent = '📡 TEST GEMINI API CONNECTION';
          if (this.btnSaveGrokConfig) this.btnSaveGrokConfig.textContent = '✓ SAVE & ACTIVATE GEMINI';
        } else {
          this.tabXai.classList.add('active');
          this.tabGemini.classList.remove('active');
          if (this.aiSectionXai) this.aiSectionXai.classList.remove('hidden');
          if (this.aiSectionGemini) this.aiSectionGemini.classList.add('hidden');
          if (this.btnTestGrokConn) this.btnTestGrokConn.textContent = '📡 TEST GROK API CONNECTION';
          if (this.btnSaveGrokConfig) this.btnSaveGrokConfig.textContent = '✓ SAVE & ACTIVATE GROK';
        }
      }
      if (this.grokTestStatus) this.grokTestStatus.classList.add('hidden');
    };

    if (this.tabGemini) this.tabGemini.addEventListener('click', () => switchProviderTab('gemini'));
    if (this.tabXai) this.tabXai.addEventListener('click', () => switchProviderTab('xai'));

    switchProviderTab(this.currentAiProvider);
    this.updateGrokStatusBadges(grokService);

    // Auto-disable demo mode when user types or pastes an API key
    const onKeyInput = (inputEl) => {
      if (!inputEl) return;
      inputEl.addEventListener('input', () => {
        const val = inputEl.value.trim();
        if (val.length > 5) {
          if (this.grokDemoToggle) this.grokDemoToggle.checked = false;
          if (this.grokEnableToggle) this.grokEnableToggle.checked = true;
        }
      });
    };
    onKeyInput(this.geminiApiKey);
    onKeyInput(this.grokApiKey);

    // Open AI Modal from header button or start banner
    const openModal = () => {
      if (this.grokModalOverlay) {
        this.grokModalOverlay.classList.remove('hidden');
        if (this.grokTestStatus) this.grokTestStatus.classList.add('hidden');
      }
    };

    if (this.btnGrokHeader) this.btnGrokHeader.addEventListener('click', openModal);
    if (this.btnOpenGrokFromStart) this.btnOpenGrokFromStart.addEventListener('click', openModal);
    if (this.startGrokBanner) {
      const bannerLeft = this.startGrokBanner.querySelector('.grok-quick-left');
      if (bannerLeft) {
        bannerLeft.style.cursor = 'pointer';
        bannerLeft.addEventListener('click', openModal);
      }
    }
    if (this.btnOpenGrokFromPause) this.btnOpenGrokFromPause.addEventListener('click', () => {
      if (this.homeModalOverlay) this.homeModalOverlay.classList.add('hidden');
      openModal();
    });

    // Close Modal
    const closeModal = () => {
      if (this.grokModalOverlay) this.grokModalOverlay.classList.add('hidden');
    };
    if (this.btnCloseGrokModal) this.btnCloseGrokModal.addEventListener('click', closeModal);
    if (this.grokModalOverlay) {
      this.grokModalOverlay.addEventListener('click', (e) => {
        if (e.target === this.grokModalOverlay) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.grokModalOverlay && !this.grokModalOverlay.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Toggle Gemini API Key visibility
    if (this.btnToggleGeminiKeyVisibility && this.geminiApiKey) {
      this.btnToggleGeminiKeyVisibility.addEventListener('click', () => {
        const isPassword = this.geminiApiKey.type === 'password';
        this.geminiApiKey.type = isPassword ? 'text' : 'password';
        this.btnToggleGeminiKeyVisibility.textContent = isPassword ? '🙈' : '👁️';
      });
    }

    // Toggle Grok API Key visibility
    if (this.btnToggleKeyVisibility && this.grokApiKey) {
      this.btnToggleKeyVisibility.addEventListener('click', () => {
        const isPassword = this.grokApiKey.type === 'password';
        this.grokApiKey.type = isPassword ? 'text' : 'password';
        this.btnToggleKeyVisibility.textContent = isPassword ? '🙈' : '👁️';
      });
    }

    // Test Connection Button
    if (this.btnTestGrokConn) {
      this.btnTestGrokConn.addEventListener('click', async () => {
        const provider = this.currentAiProvider;
        const key = provider === 'gemini'
          ? (this.geminiApiKey ? this.geminiApiKey.value.trim().replace(/^["']|["']$/g, '') : '')
          : (this.grokApiKey ? this.grokApiKey.value.trim().replace(/^["']|["']$/g, '') : '');
        const model = provider === 'gemini'
          ? (this.geminiModelSelect ? this.geminiModelSelect.value : 'gemini-1.5-flash')
          : (this.grokModelSelect ? this.grokModelSelect.value : 'grok-2-latest');

        // Check if user accidentally pasted cross-provider keys
        if (provider === 'gemini' && key.startsWith('xai-')) {
          switchProviderTab('xai');
          if (this.grokApiKey) this.grokApiKey.value = key;
        } else if (provider === 'xai' && key.startsWith('AIzaSy')) {
          switchProviderTab('gemini');
          if (this.geminiApiKey) this.geminiApiKey.value = key;
        }

        const activeProvider = this.currentAiProvider;
        const activeKey = activeProvider === 'gemini'
          ? (this.geminiApiKey ? this.geminiApiKey.value.trim().replace(/^["']|["']$/g, '') : '')
          : (this.grokApiKey ? this.grokApiKey.value.trim().replace(/^["']|["']$/g, '') : '');
        const activeModel = activeProvider === 'gemini'
          ? (this.geminiModelSelect ? this.geminiModelSelect.value : 'gemini-1.5-flash')
          : (this.grokModelSelect ? this.grokModelSelect.value : 'grok-2-latest');

        if (this.grokTestStatus && this.grokTestIcon && this.grokTestMsg) {
          this.grokTestStatus.classList.remove('hidden');
          this.grokTestStatus.className = 'grok-test-status-box testing';
          this.grokTestIcon.textContent = '⏳';
          this.grokTestMsg.textContent = `Pinging ${activeProvider === 'gemini' ? 'Google Gemini' : 'xAI Grok'} API (${activeModel})...`;
        }

        const res = await grokService.testConnection({ provider: activeProvider, apiKey: activeKey, model: activeModel });

        if (this.grokTestStatus && this.grokTestIcon && this.grokTestMsg) {
          if (res.success) {
            this.grokTestStatus.className = 'grok-test-status-box success';
            this.grokTestIcon.textContent = '✓';
            this.grokTestMsg.textContent = res.message;
            // Key validated, turn off demo toggle
            if (this.grokDemoToggle) this.grokDemoToggle.checked = false;
          } else {
            this.grokTestStatus.className = 'grok-test-status-box error';
            this.grokTestIcon.textContent = '⚠️';
            this.grokTestMsg.textContent = res.message;
          }
        }
      });
    }

    // Save and Activate Button
    if (this.btnSaveGrokConfig) {
      this.btnSaveGrokConfig.addEventListener('click', () => {
        const enabled = this.grokEnableToggle ? this.grokEnableToggle.checked : true;
        let demoMode = this.grokDemoToggle ? this.grokDemoToggle.checked : false;
        const provider = this.currentAiProvider || 'gemini';
        const geminiKey = this.geminiApiKey ? this.geminiApiKey.value.trim().replace(/^["']|["']$/g, '') : '';
        const geminiModel = this.geminiModelSelect ? this.geminiModelSelect.value : 'gemini-1.5-flash';
        const xaiKey = this.grokApiKey ? this.grokApiKey.value.trim().replace(/^["']|["']$/g, '') : '';
        const xaiModel = this.grokModelSelect ? this.grokModelSelect.value : 'grok-2-latest';
        const activeKey = provider === 'gemini' ? geminiKey : xaiKey;

        // If user entered a valid API key, disable demoMode so real API runs live!
        if (activeKey.length > 5) {
          demoMode = false;
          if (this.grokDemoToggle) this.grokDemoToggle.checked = false;
        }

        grokService.saveConfig({
          provider,
          enabled,
          demoMode,
          geminiApiKey: geminiKey,
          geminiModel,
          xaiApiKey: xaiKey,
          xaiModel,
          apiKey: activeKey,
          model: provider === 'gemini' ? geminiModel : xaiModel
        });

        this.updateGrokStatusBadges(grokService);
        closeModal();
        const activeName = provider === 'gemini' ? 'Google Gemini' : 'xAI Grok';
        const activeModelName = provider === 'gemini' ? geminiModel : xaiModel;
        this.showActionBanner(enabled ? `✨ ${activeName} Engine Activated (${activeModelName})` : 'AI Engine Disabled (Offline Curated Bank Active)');
        onConfigUpdated?.(grokService.config);
      });
    }
  }

  updateGrokStatusBadges(grokService) {
    const isReal = grokService.isRealApiActive();
    const isConnected = grokService.isConnected();
    const provider = grokService.config.provider || 'gemini';
    const isGemini = provider === 'gemini';
    const providerName = isGemini ? 'Gemini' : 'Grok';
    const activeModel = grokService.getActiveModel();

    // Header Label & Status Dot
    if (this.grokHudLabel) {
      this.grokHudLabel.textContent = isConnected ? `${providerName.toUpperCase()} AI` : 'AI ENGINE';
    }

    if (this.grokHudStatusDot) {
      if (isReal) {
        this.grokHudStatusDot.className = 'grok-hud-dot live-active';
        this.grokHudStatusDot.title = `${providerName} Live API Connected (${activeModel})`;
      } else if (isConnected) {
        this.grokHudStatusDot.className = 'grok-hud-dot demo-active';
        this.grokHudStatusDot.title = `${providerName} Demo Engine Active`;
      } else {
        this.grokHudStatusDot.className = 'grok-hud-dot offline';
        this.grokHudStatusDot.title = 'AI Engine Disabled (Offline Bank)';
      }
    }

    // Start Screen Banner Text
    if (this.startGrokStatusText) {
      if (isReal) {
        this.startGrokStatusText.textContent = `${providerName} Live API Active (${activeModel})`;
        this.startGrokStatusText.style.color = isGemini ? '#38bdf8' : '#facc15';
      } else if (isConnected) {
        this.startGrokStatusText.textContent = `Instant ${providerName} Engine Ready (Demo Mode)`;
        this.startGrokStatusText.style.color = '#22c55e';
      } else {
        this.startGrokStatusText.textContent = 'Curated Offline Subject Bank Active';
        this.startGrokStatusText.style.color = '#94a3b8';
      }
    }
  }

  // ============================================================
  // FIGHTERS & HUD SETUP
  // ============================================================
  setupFighters(p1Dino, p2Dino, stageConfig = null, currentStage = 1, totalStages = 6, topicName = 'ALL CS TOPICS', streak = 0) {
    const p1Name = document.getElementById('p1-name');
    const p1Avatar = document.getElementById('p1-avatar');
    if (p1Name) p1Name.textContent = p1Dino.stats.name;
    if (p1Avatar) p1Avatar.textContent = p1Dino.stats.avatar;

    const p2Name = document.getElementById('p2-name');
    const p2Avatar = document.getElementById('p2-avatar');
    const p2Title = document.getElementById('p2-title');
    const p2BadgeTag = document.getElementById('p2-badge-tag');

    const isBoss = stageConfig ? !!stageConfig.boss : false;
    if (p2Name) p2Name.textContent = stageConfig?.name || p2Dino.stats.name;
    if (p2Avatar) p2Avatar.textContent = stageConfig?.avatar || p2Dino.stats.avatar;
    if (p2Title) p2Title.textContent = stageConfig?.subtitle || (isBoss ? 'FINAL BOSS' : p2Dino.stats.title);

    if (p2BadgeTag) {
      p2BadgeTag.textContent = isBoss ? 'FINAL BOSS 👑' : 'CPU';
      if (isBoss) p2BadgeTag.classList.add('boss-tag');
      else p2BadgeTag.classList.remove('boss-tag');
    }

    if (this.p2ElementName && stageConfig?.attackName) {
      const iconMap = { run_hit: '💨', wind: '🌪️', fire: '🔥', ice: '❄️', laser: '⚡', water: '🌊', tidal: '🌊' };
      const icon = iconMap[stageConfig.attackType] || '💥';
      this.p2ElementName.textContent = `${icon} ${stageConfig.attackName}`;
    }

    if (this.hudStageTag) {
      this.hudStageTag.textContent = isBoss ? 'FINAL APEX STAGE' : `STAGE ${currentStage} / ${totalStages}`;
    }
    if (this.hudTopicTag) {
      this.hudTopicTag.textContent = topicName.toUpperCase();
    }
    if (this.hudStreakCrest) {
      this.hudStreakCrest.textContent = `🔥 STREAK: ${streak}`;
    }
  }

  updateBars(p1, p2) {
    if (p1) {
      const p1HpRatio = Math.max(0, p1.health / p1.stats.maxHealth);
      const pct = (p1HpRatio * 100).toFixed(1);
      if (this.p1HealthBar) this.p1HealthBar.style.width = `${pct}%`;
      if (this.p1HealthGhost) this.p1HealthGhost.style.width = `${pct}%`;
      if (this.p1HpText) this.p1HpText.textContent = `${Math.ceil(p1.health)} / ${p1.stats.maxHealth}`;
    }

    if (p2) {
      const p2HpRatio = Math.max(0, p2.health / p2.stats.maxHealth);
      const pct = (p2HpRatio * 100).toFixed(1);
      if (this.p2HealthBar) this.p2HealthBar.style.width = `${pct}%`;
      if (this.p2HealthGhost) this.p2HealthGhost.style.width = `${pct}%`;
      if (this.p2HpText) this.p2HpText.textContent = `${Math.ceil(p2.health)} / ${p2.stats.maxHealth}`;
    }
  }

  // ============================================================
  // MULTI-SUBJECT & BIG CATEGORY SELECTION UI
  // ============================================================
  setupTopicSelectionUI(topics, initialSelectedIds, onSelectionChanged) {
    let selectedSet = new Set(Array.isArray(initialSelectedIds) ? initialSelectedIds : [initialSelectedIds || 'all']);
    let currentCategory = 'all';

    const getSelectionQuestionCount = () => {
      if (selectedSet.has('all') || selectedSet.size === 0) {
        return getQuestionCountForCategory('all');
      }
      const resolved = resolveTopicIds(Array.from(selectedSet));
      if (resolved.includes('all')) return getQuestionCountForCategory('all');
      let total = 0;
      resolved.forEach(id => total += getQuestionCountForTopic(id));
      return total;
    };

    const updateSummary = () => {
      if (!this.topicSummaryText) return;
      const totalCount = getSelectionQuestionCount();

      if (selectedSet.has('all') || selectedSet.size === 0) {
        this.topicSummaryText.textContent = `All Computer Science Gauntlet (${totalCount} Questions Available)`;
      } else if (selectedSet.size === 1) {
        const id = Array.from(selectedSet)[0];
        const bigCat = BIG_CATEGORIES.find(c => c.id === id);
        if (bigCat) {
          this.topicSummaryText.textContent = `${bigCat.icon} ${bigCat.name} (${totalCount} Questions in Pool)`;
        } else {
          const t = topics.find(item => item.id === id);
          this.topicSummaryText.textContent = t ? `${t.icon} ${t.name} (${totalCount} Questions)` : `${id.toUpperCase()} (${totalCount} Qs)`;
        }
      } else {
        const names = Array.from(selectedSet)
          .map(id => {
            const bigCat = BIG_CATEGORIES.find(c => c.id === id);
            if (bigCat) return bigCat.name;
            return topics.find(item => item.id === id)?.name || id;
          })
          .slice(0, 2)
          .join(', ');
        const extra = selectedSet.size > 2 ? ` +${selectedSet.size - 2} more` : '';
        this.topicSummaryText.textContent = `${selectedSet.size} Subjects Active (${names}${extra}) • ${totalCount} Questions Available`;
      }
    };

    const render = () => {
      if (!this.topicsGridContainer) return;
      this.topicsGridContainer.innerHTML = '';

      const isMulti = this.chkMultiSubject ? this.chkMultiSubject.checked : true;
      const filtered = currentCategory === 'all'
        ? topics
        : topics.filter(t => t.id === 'all' || t.category === currentCategory);

      filtered.forEach((topic) => {
        const isSelected = selectedSet.has(topic.id);
        const card = document.createElement('div');
        card.className = `topic-select-card ${isSelected ? 'active' : ''}`;
        card.dataset.topicId = topic.id;

        const count = getQuestionCountForTopic(topic.id);
        const countBadge = `${count} Qs`;

        card.innerHTML = `
          <div class="topic-card-top-row">
            <span class="topic-card-icon">${topic.icon}</span>
            <span class="topic-card-count-pill">${countBadge}</span>
            <div class="topic-card-check-indicator ${isSelected ? 'checked' : ''}">✓</div>
          </div>
          <div class="topic-card-title">${topic.name}</div>
          <div class="topic-card-desc">${topic.desc}</div>
        `;

        card.addEventListener('click', () => {
          if (!isMulti) {
            // Single subject mode
            selectedSet.clear();
            selectedSet.add(topic.id);
          } else {
            // Multi-subject mode
            if (topic.id === 'all') {
              selectedSet.clear();
              selectedSet.add('all');
            } else {
              selectedSet.delete('all');
              if (selectedSet.has(topic.id)) {
                selectedSet.delete(topic.id);
                if (selectedSet.size === 0) selectedSet.add('all');
              } else {
                selectedSet.add(topic.id);
              }
            }
          }

          updateSummary();
          render();
          onSelectionChanged(Array.from(selectedSet));
        });

        this.topicsGridContainer.appendChild(card);
      });

      updateSummary();
    };

    // Category Tabs
    if (this.topicCategoryTabs) {
      const tabs = this.topicCategoryTabs.querySelectorAll('.cat-tab');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentCategory = tab.dataset.category || 'all';

          if (this.btnPlayCategory) {
            const catObj = BIG_CATEGORIES.find(c => c.id === currentCategory);
            const count = getQuestionCountForCategory(currentCategory);
            this.btnPlayCategory.textContent = currentCategory === 'all'
              ? '⚡ Select All Domains (299)'
              : `⚡ Select Entire ${catObj ? catObj.name : 'Category'} (${count})`;
          }

          render();
        });
      });
    }

    // Play Entire Category Button
    if (this.btnPlayCategory) {
      this.btnPlayCategory.addEventListener('click', () => {
        selectedSet.clear();
        if (currentCategory === 'all') {
          selectedSet.add('all');
        } else {
          topics.filter(t => t.category === currentCategory).forEach(t => selectedSet.add(t.id));
        }
        updateSummary();
        render();
        onSelectionChanged(Array.from(selectedSet));
      });
    }

    // Select All
    if (this.btnSelectAllTopics) {
      this.btnSelectAllTopics.addEventListener('click', () => {
        selectedSet.clear();
        selectedSet.add('all');
        updateSummary();
        render();
        onSelectionChanged(Array.from(selectedSet));
      });
    }

    // Reset / Clear All (Reset to All Gauntlet)
    if (this.btnClearAllTopics) {
      this.btnClearAllTopics.addEventListener('click', () => {
        selectedSet.clear();
        selectedSet.add('all');
        updateSummary();
        render();
        onSelectionChanged(Array.from(selectedSet));
      });
    }

    // Multi-select toggle listener
    if (this.chkMultiSubject) {
      this.chkMultiSubject.addEventListener('change', () => {
        if (!this.chkMultiSubject.checked && selectedSet.size > 1) {
          const first = Array.from(selectedSet)[0];
          selectedSet.clear();
          selectedSet.add(first);
        }
        updateSummary();
        render();
        onSelectionChanged(Array.from(selectedSet));
      });
    }

    render();
  }

  renderPlayerFighters(fighters, selectedType, onSelectFighter) {
    if (!this.playerDinoGrid) return;
    this.playerDinoGrid.innerHTML = '';

    fighters.forEach((f) => {
      const btn = document.createElement('div');
      btn.className = `dino-card ${f.id === selectedType ? 'active' : ''}`;
      btn.innerHTML = `
        <div class="dino-avatar">${f.avatar}</div>
        <div class="dino-card-info">
          <div class="dino-name">${f.name}</div>
          <div class="dino-archetype">${f.title}</div>
        </div>
      `;
      btn.addEventListener('click', () => {
        document.querySelectorAll('#player-dino-grid .dino-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        onSelectFighter(f.id);
      });
      this.playerDinoGrid.appendChild(btn);
    });

    // Enable smooth mouse drag scrolling for desktop
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    this.playerDinoGrid.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - this.playerDinoGrid.offsetLeft;
      scrollLeft = this.playerDinoGrid.scrollLeft;
    });

    this.playerDinoGrid.addEventListener('mouseleave', () => { isDown = false; });
    this.playerDinoGrid.addEventListener('mouseup', () => { isDown = false; });
    this.playerDinoGrid.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - this.playerDinoGrid.offsetLeft;
      const walk = (x - startX) * 1.5;
      this.playerDinoGrid.scrollLeft = scrollLeft - walk;
    });
  }

  // ============================================================
  // CLEAN QUESTION TRANSITIONS: CLEAR OLD QUESTION -> ENTER NEW
  // ============================================================
  clearQuestionView() {
    this.selectedMultiIndices.clear();

    // 1. Wipe options cleanly
    if (this.quizOptionsContainer) {
      this.quizOptionsContainer.innerHTML = '';
    }

    // 2. Hide and reset code snippet
    if (this.quizCodeContainer && this.quizCodeText) {
      this.quizCodeContainer.classList.add('hidden');
      this.quizCodeText.textContent = '';
    }

    // 3. Reset title and hint
    if (this.quizQuestionText) {
      this.quizQuestionText.textContent = '';
    }
    if (this.quizMultiHint) {
      this.quizMultiHint.classList.add('hidden');
    }

    // 4. Hide feedback banner
    if (this.quizFeedbackBanner) {
      this.quizFeedbackBanner.classList.add('hidden');
    }

    // 5. Hide multi actions
    if (this.quizFooterActions) {
      this.quizFooterActions.classList.add('hidden');
    }

    // 6. Reset timer bar width to 100%
    if (this.quizTimerBar) {
      this.quizTimerBar.style.width = '100%';
      this.quizTimerBar.classList.remove('urgent');
    }

    // 7. Remove any old animation classes from panel
    if (this.quizCardPanel) {
      this.quizCardPanel.classList.remove('question-animate-in');
    }
  }

  showQuestionLoading(subjectName = '') {
    this.clearQuestionView();
    if (this.quizAiLoading) {
      this.quizAiLoading.classList.remove('hidden');
      if (this.aiLoadingText) {
        const isGemini = this.currentAiProvider === 'gemini';
        const aiName = isGemini ? 'Google Gemini' : 'xAI Grok';
        this.aiLoadingText.textContent = subjectName
          ? `${aiName} is synthesizing a new ${subjectName} challenge...`
          : `${aiName} is synthesizing next subject question...`;
      }
    }
    if (this.quizOverlay) {
      this.quizOverlay.classList.remove('hidden');
    }
  }

  displayQuestion(question, timerRemaining, totalDuration, onSelectOption, onSubmitMulti) {
    if (!this.quizOverlay || !question) return;

    // 1. Clear out all traces of previous question
    this.clearQuestionView();

    // 2. Hide loading spinner
    if (this.quizAiLoading) {
      this.quizAiLoading.classList.add('hidden');
    }

    // 3. Trigger smooth enter animation on the question card panel
    if (this.quizCardPanel) {
      void this.quizCardPanel.offsetWidth; // Force DOM reflow
      this.quizCardPanel.classList.add('question-animate-in');
    }

    // 4. Badges: Difficulty, Subject, Type, and AI
    if (this.quizDiffBadge) {
      const diff = question.difficulty || 'medium';
      this.quizDiffBadge.textContent = diff.toUpperCase();
      this.quizDiffBadge.className = `badge-pill badge-diff diff-${diff}`;
    }

    if (this.quizSubjectBadge) {
      const subject = question.topicName || question.topic || 'CS & SCIENCE';
      this.quizSubjectBadge.textContent = subject.toUpperCase();
    }

    if (this.quizTypeBadge) {
      const typeLabels = {
        single: 'SINGLE SELECT',
        multi: 'MULTI SELECT (CHOOSE ALL)',
        boolean: 'TRUE / FALSE',
        code_output: 'CODE PREDICTION'
      };
      this.quizTypeBadge.textContent = typeLabels[question.type] || 'QUESTION';
    }

    if (this.quizAiBadge) {
      if (question.aiGenerated) {
        this.quizAiBadge.classList.remove('hidden');
        const isGemini = question.provider === 'gemini';
        if (question.simulated) {
          this.quizAiBadge.textContent = isGemini ? '✨ GEMINI (DEMO)' : '⚡ GROK (DEMO)';
        } else {
          this.quizAiBadge.textContent = isGemini ? '✨ GEMINI AI' : '⚡ GROK AI';
        }
        this.quizAiBadge.title = `Generated dynamically by ${isGemini ? 'Google Gemini' : 'xAI Grok'} (${question.model || 'AI'})`;
      } else {
        this.quizAiBadge.classList.add('hidden');
      }
    }

    // 5. Timer
    this.updateQuizTimer(timerRemaining, totalDuration, false);

    // 6. Question Prompt
    if (this.quizQuestionText) {
      this.quizQuestionText.textContent = question.question;
    }

    // 7. Code Block
    if (this.quizCodeContainer && this.quizCodeText) {
      if (question.code) {
        this.quizCodeText.textContent = question.code;
        this.quizCodeContainer.classList.remove('hidden');
      } else {
        this.quizCodeContainer.classList.add('hidden');
      }
    }

    // 8. Multi-select hint
    if (this.quizMultiHint) {
      if (question.type === 'multi') {
        this.quizMultiHint.classList.remove('hidden');
      } else {
        this.quizMultiHint.classList.add('hidden');
      }
    }

    // 9. Options Grid
    if (this.quizOptionsContainer && Array.isArray(question.options)) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

      question.options.forEach((optText, index) => {
        const optCard = document.createElement('div');
        optCard.className = `quiz-option-card ${question.type === 'boolean' ? 'boolean-card' : ''}`;
        optCard.dataset.index = index;

        if (question.type === 'multi') {
          optCard.innerHTML = `
            <div class="option-checkbox" id="chk-${index}"></div>
            <div class="option-content">
              <span class="option-letter">${letters[index] || index + 1}</span>
              <span class="option-text">${optText}</span>
            </div>
          `;
          optCard.addEventListener('click', () => {
            if (this.selectedMultiIndices.has(index)) {
              this.selectedMultiIndices.delete(index);
              optCard.classList.remove('selected');
            } else {
              this.selectedMultiIndices.add(index);
              optCard.classList.add('selected');
            }
          });
        } else {
          optCard.innerHTML = `
            <span class="option-letter">${letters[index] || index + 1}</span>
            <span class="option-text">${optText}</span>
          `;
          optCard.addEventListener('click', () => {
            // Disable further clicks
            document.querySelectorAll('.quiz-option-card').forEach(c => c.style.pointerEvents = 'none');
            optCard.classList.add('selected');
            onSelectOption(index);
          });
        }

        this.quizOptionsContainer.appendChild(optCard);
      });
    }

    // 10. Multi-select submit footer
    if (this.quizFooterActions && this.btnQuizSubmit) {
      if (question.type === 'multi') {
        this.quizFooterActions.classList.remove('hidden');
        this.btnQuizSubmit.disabled = false;
        this.btnQuizSubmit.onclick = () => {
          document.querySelectorAll('.quiz-option-card').forEach(c => c.style.pointerEvents = 'none');
          this.btnQuizSubmit.disabled = true;
          onSubmitMulti(Array.from(this.selectedMultiIndices));
        };
      } else {
        this.quizFooterActions.classList.add('hidden');
      }
    }

    // Show Card Overlay
    this.quizOverlay.classList.remove('hidden');
  }

  updateQuizTimer(remaining, total, isUrgent) {
    if (this.quizTimerText) {
      this.quizTimerText.textContent = `${remaining}s`;
    }
    if (this.quizTimerBar) {
      const pct = Math.max(0, (remaining / total) * 100);
      this.quizTimerBar.style.width = `${pct}%`;
      if (isUrgent) {
        this.quizTimerBar.classList.add('urgent');
      } else {
        this.quizTimerBar.classList.remove('urgent');
      }
    }
  }

  showAnswerFeedback(isCorrect, message = '', correctIndices = []) {
    if (!this.quizFeedbackBanner) return;

    this.quizFeedbackBanner.classList.remove('hidden');
    if (isCorrect) {
      this.quizFeedbackBanner.className = 'quiz-feedback-banner correct-banner';
      if (this.feedbackIcon) this.feedbackIcon.textContent = '✓';
      if (this.feedbackText) this.feedbackText.textContent = message || 'CORRECT! YOUR DINOSAUR ATTACKS!';
    } else {
      this.quizFeedbackBanner.className = 'quiz-feedback-banner wrong-banner';
      if (this.feedbackIcon) this.feedbackIcon.textContent = '✗';
      if (this.feedbackText) this.feedbackText.textContent = message || 'INCORRECT! CPU DINOSAUR ATTACKS!';

      // Highlight correct answers in options
      if (correctIndices && correctIndices.length) {
        correctIndices.forEach(idx => {
          const card = this.quizOptionsContainer?.querySelector(`[data-index="${idx}"]`);
          if (card) card.classList.add('highlight-correct');
        });
      }
    }
  }

  hideQuizCard() {
    if (this.quizOverlay) {
      this.quizOverlay.classList.add('hidden');
    }
    this.clearQuestionView();
  }

  // ============================================================
  // SCOREBOARD & REVIEW MODAL
  // ============================================================
  showScoreboard(summary, onRetry, onChangeTopic, onMainMenu) {
    if (!this.quizScoreboardOverlay) return;
    this.hideQuizCard();

    const isChampion = summary.stagesCleared >= 5 && summary.accuracy >= 70;

    if (this.scoreboardOutcomeIcon) {
      this.scoreboardOutcomeIcon.textContent = isChampion ? '👑' : (summary.accuracy >= 50 ? '🏆' : '💀');
    }
    if (this.scoreboardOutcomeTitle) {
      this.scoreboardOutcomeTitle.textContent = isChampion ? 'COLOSSEUM GRANDMASTER!' : (summary.accuracy >= 50 ? 'BATTLE CONCLUDED!' : 'TOURNAMENT DEFEAT');
    }
    if (this.scoreboardOutcomeSubtitle) {
      this.scoreboardOutcomeSubtitle.textContent = isChampion
        ? 'YOU DEFEATED ALL 6 JURASSIC APEX PREDATORS WITH FLAWLESS KNOWLEDGE!'
        : 'YOUR TECHNICAL & SCIENTIFIC MASTERY WAS TESTED IN JURASSIC COMBAT.';
    }

    // Skill Badge
    const badge = summary.skillBadge;
    if (this.skillBadgeTier) this.skillBadgeTier.textContent = badge.badge;
    if (this.skillBadgeName) this.skillBadgeName.textContent = badge.title;
    if (this.skillBadgeDesc) this.skillBadgeDesc.textContent = badge.desc;

    // Stats
    if (this.scoreAccuracy) this.scoreAccuracy.textContent = `${summary.accuracy}%`;
    if (this.scoreCorrectWrong) this.scoreCorrectWrong.textContent = `${summary.totalCorrect} / ${summary.totalWrong}`;
    if (this.scoreStages) this.scoreStages.textContent = `STAGE ${summary.stagesCleared + 1}`;
    if (this.scoreSpeed) this.scoreSpeed.textContent = `${summary.avgTime}s`;

    // Missed Questions Review
    if (this.reviewCountBadge) {
      this.reviewCountBadge.textContent = `${summary.missedQuestions.length} Questions Missed`;
    }
    if (this.missedQuestionsContainer) {
      this.missedQuestionsContainer.innerHTML = '';
      if (!summary.missedQuestions.length) {
        this.missedQuestionsContainer.innerHTML = '<div class="no-missed-msg">🌟 PERFECT RUN! You didn\'t miss a single question!</div>';
      } else {
        summary.missedQuestions.forEach((item, idx) => {
          const card = document.createElement('div');
          card.className = 'missed-question-card';
          card.innerHTML = `
            <div class="missed-header">
              <span class="missed-number">#${idx + 1} [${(item.difficulty || 'medium').toUpperCase()}]</span>
              <span class="missed-topic-pill">${item.topic ? item.topic.toUpperCase() : 'SUBJECT'}</span>
              ${item.aiGenerated ? '<span class="missed-ai-pill">⚡ GROK AI</span>' : ''}
            </div>
            <div class="missed-q-text">${item.question}</div>
            ${item.code ? `<pre class="missed-code-block"><code>${item.code}</code></pre>` : ''}
            <div class="missed-answers-box">
              <div class="user-ans-row"><strong>Your Answer:</strong> <span class="wrong-ans-text">${item.userSelected}</span></div>
              <div class="corr-ans-row"><strong>Correct Answer:</strong> <span class="right-ans-text">${item.correctAnswer}</span></div>
            </div>
            <div class="missed-explanation-box">
              <strong>💡 Explanation:</strong> ${item.explanation}
            </div>
          `;
          this.missedQuestionsContainer.appendChild(card);
        });
      }
    }

    // Buttons
    if (this.btnScoreRetry) this.btnScoreRetry.onclick = () => {
      this.quizScoreboardOverlay.classList.add('hidden');
      onRetry();
    };
    if (this.btnScoreTopic) this.btnScoreTopic.onclick = () => {
      this.quizScoreboardOverlay.classList.add('hidden');
      onChangeTopic();
    };
    if (this.btnScoreHome) this.btnScoreHome.onclick = () => {
      this.quizScoreboardOverlay.classList.add('hidden');
      onMainMenu();
    };

    this.quizScoreboardOverlay.classList.remove('hidden');
  }

  showArcadeLadder(ladder, nextStageIdx, streak, healAmount, onNext, onQuit) {
    if (!this.arcadeLadderOverlay) return;
    this.hideQuizCard();

    if (this.ladderStreakBadge) this.ladderStreakBadge.textContent = `⚡ STREAK: ${streak}`;
    if (this.ladderHealBadge) this.ladderHealBadge.textContent = `❤️ +${healAmount} HP RESTORED`;

    if (this.ladderTowerContainer) {
      this.ladderTowerContainer.innerHTML = '';
      [...ladder].reverse().forEach((stage) => {
        const isCompleted = stage.stage < nextStageIdx;
        const isCurrent = stage.stage === nextStageIdx;
        const isLocked = stage.stage > nextStageIdx;

        const card = document.createElement('div');
        card.className = `ladder-stage-card ${isCurrent ? 'active-target' : ''} ${isCompleted ? 'defeated-stamp' : ''} ${isLocked ? 'locked-stage' : ''}`;
        card.innerHTML = `
          <div class="stage-num-badge">STAGE ${stage.stage}</div>
          <div class="stage-dino-avatar">${stage.avatar}</div>
          <div class="stage-dino-details">
            <div class="stage-dino-name">${stage.name}</div>
            <div class="stage-dino-sub">${stage.subtitle} • ${stage.difficulty}</div>
          </div>
          <div class="stage-status-icon">${isCompleted ? '💀 K.O.' : (isCurrent ? '⚔️ NEXT' : '🔒')}</div>
        `;
        this.ladderTowerContainer.appendChild(card);
      });
    }

    if (this.btnFightNext) {
      this.btnFightNext.onclick = () => {
        this.arcadeLadderOverlay.classList.add('hidden');
        onNext();
      };
    }
    if (this.btnLadderHome) {
      this.btnLadderHome.onclick = () => {
        this.arcadeLadderOverlay.classList.add('hidden');
        onQuit();
      };
    }

    this.arcadeLadderOverlay.classList.remove('hidden');
  }

  showArcadeAnnouncement(mainText, subText, duration = 1200, isKO = false) {
    if (!this.arcadeAnnouncement) return;
    if (this.arcadeTimer) clearTimeout(this.arcadeTimer);

    if (this.arcadeMainText) {
      this.arcadeMainText.textContent = mainText;
      if (isKO) this.arcadeMainText.classList.add('ko-text');
      else this.arcadeMainText.classList.remove('ko-text');
    }
    if (this.arcadeSubText) {
      this.arcadeSubText.textContent = subText;
    }

    this.arcadeAnnouncement.classList.remove('hidden');
    this.arcadeTimer = setTimeout(() => {
      this.arcadeAnnouncement.classList.add('hidden');
    }, duration);
  }

  showActionBanner(text) {
    if (!this.actionBanner) return;
    if (this.bannerTimer) clearTimeout(this.bannerTimer);

    this.actionBanner.textContent = text;
    this.actionBanner.classList.add('show');
    this.bannerTimer = setTimeout(() => {
      this.actionBanner.classList.remove('show');
    }, 2000);
  }

  showDamageNumber(worldPos, damage, isCrit = false) {
    if (!this.damageContainer || !this.camera) return;

    const screenPos = worldPos.clone().project(this.camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `floating-dmg-num ${isCrit ? 'crit-dmg' : ''}`;
    el.textContent = isCrit ? `💥 -${damage}!` : `-${damage}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    this.damageContainer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 950);
  }

  startCountdown(stageNum, arenaTheme, onTick, onComplete) {
    if (!this.countdownOverlay) {
      onComplete?.();
      return;
    }

    this.hideQuizCard();
    this.countdownOverlay.classList.remove('hidden');

    if (this.countdownArenaName && arenaTheme) {
      this.countdownArenaName.textContent = arenaTheme.name || 'JURASSIC CALDERA';
    }
    if (this.countdownArenaIcon && arenaTheme) {
      this.countdownArenaIcon.textContent = arenaTheme.icon || '🌋';
    }
    if (this.countdownRoundTag) {
      this.countdownRoundTag.textContent = `STAGE ${stageNum}`;
    }

    const steps = [
      { text: '3', sound: 'tick3' },
      { text: '2', sound: 'tick2' },
      { text: '1', sound: 'tick1' },
      { text: 'CODE!', sound: 'clash' }
    ];

    let stepIdx = 0;
    const runStep = () => {
      if (stepIdx < steps.length) {
        const item = steps[stepIdx];
        if (this.countdownNumber) {
          this.countdownNumber.textContent = item.text;
          this.countdownNumber.classList.remove('pop-anim');
          void this.countdownNumber.offsetWidth;
          this.countdownNumber.classList.add('pop-anim');
        }
        onTick?.(item.sound);
        stepIdx++;
        setTimeout(runStep, 750);
      } else {
        this.countdownOverlay.classList.add('hidden');
        onComplete?.();
      }
    };

    runStep();
  }
}
