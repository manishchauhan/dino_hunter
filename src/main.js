import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DINO_TYPES, DINO_STATS, ARCADE_LADDER } from './constants.js';
import { CODING_TOPICS, getTopicDisplayName } from './data/codingQuestions.js';
import { grokAI } from './services/GrokAIService.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { GraphicsRenderer } from './graphics/Renderer.js';
import { ArenaLighting } from './graphics/Lighting.js';
import { Arena } from './graphics/Arena.js';
import { ParticleSystem } from './graphics/Particles.js';
import { SoundEffects } from './audio/SoundEffects.js';
import { ActiveRagdollRig } from './physics/ActiveRagdollRig.js';
import { UIManager } from './ui/UIManager.js';
import { QuizManager } from './quiz/QuizManager.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.renderer = new GraphicsRenderer(this.canvas);
    this.physics = new PhysicsWorld();
    this.lighting = new ArenaLighting(this.renderer.scene);
    this.arena = new Arena(this.renderer.scene);
    this.particles = new ParticleSystem(this.renderer.scene);
    this.audio = new SoundEffects();
    this.ui = new UIManager(this.renderer.camera);
    this.quizManager = new QuizManager(this.audio, this.ui);

    // Selected Subjects (Supports single or multiple) & Player Fighter
    this.selectedTopicIds = ['all'];
    this.playerType = DINO_TYPES.TREX;

    // Arcade Progression State
    this.currentStageIndex = 0;
    this.savedPlayerHealth = null;

    // Fighters
    this.playerRig = null;
    this.cpuRig = null;

    this.clock = new THREE.Clock();
    this.isRunning = false;
    this.isMatchOver = false;
    this.isAdvancingRound = false;
    this.isExecutingDuelAttack = false;

    this.setupStartScreen();
    this.setupHomeMenuListener();

    this.animate();
  }

  setupStartScreen() {
    const startOverlay = document.getElementById('start-overlay');
    const btnStart = document.getElementById('btn-start');

    // Setup Grok AI Modal and Controls
    this.ui.setupGrokUI(grokAI, (newConfig) => {
      console.log('Grok AI config updated:', newConfig);
    });

    // Render Multi-Subject Selection UI
    this.ui.setupTopicSelectionUI(CODING_TOPICS, this.selectedTopicIds, (chosenIds) => {
      this.selectedTopicIds = chosenIds;
      this.quizManager.setTopics(chosenIds);
    });

    // Render Player Fighters (All 12 Iconic Dinosaurs from Land to River/Sea)
    const playableDinos = [
      { id: DINO_TYPES.TREX, name: 'T-REX', title: 'Apex Carnivore', avatar: '🦖' },
      { id: DINO_TYPES.SPINOSAURUS, name: 'SPINOSAURUS', title: 'River Behemoth', avatar: '🐊' },
      { id: DINO_TYPES.TRICERATOPS, name: 'TRICERATOPS', title: 'Armored Titan', avatar: '🦏' },
      { id: DINO_TYPES.CARNOTAURUS, name: 'CARNOTAURUS', title: 'Horned Brawler', avatar: '🐂' },
      { id: DINO_TYPES.ANKYLOSAURUS, name: 'ANKYLOSAURUS', title: 'Living Fortress', avatar: '🐢' },
      { id: DINO_TYPES.STEGOSAURUS, name: 'STEGOSAURUS', title: 'Plated Guardian', avatar: '🛡️' },
      { id: DINO_TYPES.ALLOSAURUS, name: 'ALLOSAURUS', title: 'Jurassic Slasher', avatar: '🗡️' },
      { id: DINO_TYPES.VELOCIRAPTOR, name: 'VELOCIRAPTOR', title: 'Pack Hunter', avatar: '🦎' },
      { id: DINO_TYPES.DILOPHOSAURUS, name: 'DILOPHOSAURUS', title: 'Crested Spitter', avatar: '🐉' },
      { id: DINO_TYPES.THERIZINOSAURUS, name: 'THERIZINOSAURUS', title: 'Scythe Reaper', avatar: '⚔️' },
      { id: DINO_TYPES.BARYONYX, name: 'BARYONYX', title: 'Wetland Predator', avatar: '🌊' },
      { id: DINO_TYPES.GIGANOTOSAURUS, name: 'GIGANOTOSAURUS', title: 'Primal Apex King', avatar: '👑' }
    ];

    this.ui.renderPlayerFighters(playableDinos, this.playerType, (dinoType) => {
      this.playerType = dinoType;
    });

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.audio.init();
        if (startOverlay) {
          startOverlay.classList.remove('active');
          startOverlay.classList.add('hidden');
        }
        this.currentStageIndex = 0;
        this.savedPlayerHealth = null;
        this.quizManager.resetSession();
        this.quizManager.setTopics(this.selectedTopicIds);
        this.startBattle(0, false);
      });
    }
  }

  setupHomeMenuListener() {
    const btnHome = document.getElementById('btn-home');
    const homeModal = document.getElementById('home-modal-overlay');
    const btnResume = document.getElementById('btn-resume');
    const btnRestartStage = document.getElementById('btn-restart-stage');
    const btnChangeTopic = document.getElementById('btn-change-topic');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');

    if (btnHome && homeModal) {
      btnHome.addEventListener('click', () => {
        homeModal.classList.remove('hidden');
      });
    }

    if (btnResume && homeModal) {
      btnResume.addEventListener('click', () => {
        homeModal.classList.add('hidden');
      });
    }

    if (btnRestartStage && homeModal) {
      btnRestartStage.addEventListener('click', () => {
        homeModal.classList.add('hidden');
        this.startBattle(this.currentStageIndex, false);
      });
    }

    if (btnChangeTopic && homeModal) {
      btnChangeTopic.addEventListener('click', () => {
        homeModal.classList.add('hidden');
        this.ui.hideQuizCard();
        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) {
          startOverlay.classList.remove('hidden');
          startOverlay.classList.add('active');
        }
      });
    }

    if (btnSoundToggle) {
      btnSoundToggle.addEventListener('click', () => {
        const isMuted = !this.audio.toggleMute();
        btnSoundToggle.textContent = isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
      });
    }
  }

  startBattle(stageIndex = 0, isAdvancing = false) {
    this.currentStageIndex = stageIndex;
    const stageConfig = ARCADE_LADDER[stageIndex];
    if (!stageConfig) return;

    // 1. Clean up previous rigs from physics & scene
    if (this.playerRig) {
      if (typeof this.playerRig.dispose === 'function') this.playerRig.dispose();
      else if (typeof this.playerRig.destroy === 'function') this.playerRig.destroy();
      this.playerRig = null;
    }
    if (this.cpuRig) {
      if (typeof this.cpuRig.dispose === 'function') this.cpuRig.dispose();
      else if (typeof this.cpuRig.destroy === 'function') this.cpuRig.destroy();
      this.cpuRig = null;
    }

    // 2. Position Fighters Face-to-Face in 3D Arena (Elevated away from bottom HUD overlay)
    const p1StartPos = new THREE.Vector3(-5.2, 0, -3.2);
    const p2StartPos = new THREE.Vector3(5.2, 0, -3.2);

    // 3. Spawn Player Dinosaur
    this.playerRig = new ActiveRagdollRig(this.playerType, {
      scene: this.renderer.scene,
      physicsWorld: this.physics,
      audio: this.audio,
      particles: this.particles,
      ui: this.ui,
      renderer: this.renderer,
      isPlayer: true,
      startPosition: p1StartPos,
      startRotation: Math.PI / 2
    });

    if (isAdvancing && this.savedPlayerHealth) {
      this.playerRig.health = this.savedPlayerHealth;
    }

    this.playerRig.setDuelPosition(p1StartPos, Math.PI / 2);

    // 4. Spawn CPU Opponent Dinosaur
    const opponentType = stageConfig.dinoType || DINO_TYPES.VELOCIRAPTOR;
    this.cpuRig = new ActiveRagdollRig(opponentType, {
      scene: this.renderer.scene,
      physicsWorld: this.physics,
      audio: this.audio,
      particles: this.particles,
      ui: this.ui,
      renderer: this.renderer,
      isPlayer: false,
      startPosition: p2StartPos,
      startRotation: -Math.PI / 2,
      isBoss: !!stageConfig.boss,
      bossScale: stageConfig.boss ? 1.35 : 1.0
    });

    // Set stage-tuned CPU max health
    this.cpuRig.stats.maxHealth = stageConfig.maxHp || 400;
    this.cpuRig.health = this.cpuRig.stats.maxHealth;
    this.cpuRig.setDuelPosition(p2StartPos, -Math.PI / 2);

    // 5. Update Theme & Atmosphere for this stage
    const themeInfo = this.arena.setTheme(stageConfig.theme || 'jungle');
    this.lighting.setTheme(stageConfig.theme || 'jungle');
    this.particles.setTheme(stageConfig.theme || 'jungle');

    // 6. Update HUD
    const topicDisplayName = getTopicDisplayName(this.selectedTopicIds);
    this.ui.setupFighters(
      this.playerRig,
      this.cpuRig,
      stageConfig,
      this.currentStageIndex + 1,
      ARCADE_LADDER.length,
      topicDisplayName,
      this.quizManager.stats.currentStreak
    );

    this.isMatchOver = false;
    this.isAdvancingRound = false;
    this.isExecutingDuelAttack = false;
    this.isRunning = true;

    // 7. Prepare Questions for this stage difficulty
    this.quizManager.prepareStageQuestions(this.currentStageIndex);

    // 8. Start Countdown
    this.ui.startCountdown(
      this.currentStageIndex + 1,
      themeInfo,
      (step) => {
        if (step === 'clash') {
          this.audio.playClashGong();
          this.audio.playAnnouncer('fight');
        } else {
          this.audio.playCountdownTick(step);
        }
      },
      () => {
        // Countdown finished -> Serve first coding question!
        this.serveNextQuestion();
      }
    );
  }

  async serveNextQuestion() {
    if (this.isMatchOver || !this.isRunning) return;

    // Check if either dinosaur is down
    if (this.cpuRig.health <= 0 || this.playerRig.health <= 0) {
      return;
    }

    // 1. Cleanly clear previous question from view (removes old text, options, feedback)
    this.ui.clearQuestionView();

    // 2. If Grok AI is connected, display smooth holographic synthesizing indicator
    if (grokAI.isConnected()) {
      const activeNames = this.quizManager.getActiveTopicNames();
      const sample = activeNames[Math.floor(Math.random() * activeNames.length)] || 'Subject';
      this.ui.showQuestionLoading(sample);
    }

    // 3. Fetch next question asynchronously from Grok AI or curated bank
    const question = await this.quizManager.nextQuestion();
    if (!question || this.isMatchOver || !this.isRunning) return;

    // 4. Reset dinosaurs to clean duel stances elevated away from bottom overlay
    this.playerRig.setDuelPosition(new THREE.Vector3(-5.2, 0, -3.2), Math.PI / 2);
    this.cpuRig.setDuelPosition(new THREE.Vector3(5.2, 0, -3.2), -Math.PI / 2);

    // 5. Display Clean New Question Card
    this.ui.displayQuestion(
      question,
      this.quizManager.timerRemaining,
      this.quizManager.timerDuration,
      (selectedOptionIdx) => {
        // Single choice / boolean / code prediction
        this.handleAnswerSubmit(selectedOptionIdx);
      },
      (selectedMultiIndices) => {
        // Multi select submit
        this.handleAnswerSubmit(selectedMultiIndices);
      }
    );

    // 6. Start Timer
    this.quizManager.startTimer(
      (remaining, total, isUrgent) => {
        this.ui.updateQuizTimer(remaining, total, isUrgent);
      },
      () => {
        // Time expired! Treated as wrong answer
        this.handleAnswerSubmit(null);
      }
    );
  }

  handleAnswerSubmit(userInput) {
    if (this.isExecutingDuelAttack || this.isMatchOver) return;
    this.isExecutingDuelAttack = true;

    const result = this.quizManager.evaluateAnswer(userInput);
    const stageConfig = ARCADE_LADDER[this.currentStageIndex];

    // Update streak crest in HUD
    this.ui.setupFighters(
      this.playerRig,
      this.cpuRig,
      stageConfig,
      this.currentStageIndex + 1,
      ARCADE_LADDER.length,
      this.hudTopicTag?.textContent || 'CS',
      this.quizManager.stats.currentStreak
    );

    const q = result.question;
    const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];

    if (result.isCorrect) {
      // -------------------------------------------------------------
      // USER CORRECT -> PLAYER DINOSAUR CHARGES & ATTACKS CPU!
      // -------------------------------------------------------------
      this.ui.showAnswerFeedback(true, 'CORRECT! YOUR DINOSAUR ATTACKS!', correctArr);

      setTimeout(() => {
        this.ui.hideQuizCard();

        // Calculate player damage (150 - 180 dmg)
        const damage = Math.round(155 + Math.random() * 30);

        this.playerRig.executeDuelAttack('run_hit', this.cpuRig, damage, () => {
          this.isExecutingDuelAttack = false;
          this.ui.updateBars(this.playerRig, this.cpuRig);

          // Check if CPU opponent defeated!
          if (this.cpuRig.health <= 0) {
            this.handleStageVictory();
          } else {
            // Next Question!
            setTimeout(() => this.serveNextQuestion(), 400);
          }
        });
      }, 550);

    } else {
      // -------------------------------------------------------------
      // USER WRONG / TIMEOUT -> CPU ENEMY UNLEASHES LEVEL ATTACK!
      // -------------------------------------------------------------
      const feedbackMsg = userInput === null
        ? `TIME'S UP! ${stageConfig.name} UNLEASHES ${stageConfig.attackName}!`
        : `INCORRECT! ${stageConfig.name} COUNTERS WITH ${stageConfig.attackName}!`;

      this.ui.showAnswerFeedback(false, feedbackMsg, correctArr);

      setTimeout(() => {
        this.ui.hideQuizCard();

        const attackType = stageConfig.attackType || 'run_hit';
        const damage = stageConfig.attackDamage || 110;

        this.cpuRig.executeDuelAttack(attackType, this.playerRig, damage, () => {
          this.isExecutingDuelAttack = false;
          this.ui.updateBars(this.playerRig, this.cpuRig);

          // Check if Player is defeated!
          if (this.playerRig.health <= 0) {
            this.handlePlayerDefeated();
          } else {
            // Next Question!
            setTimeout(() => this.serveNextQuestion(), 400);
          }
        });
      }, 750);
    }
  }

  handleStageVictory() {
    this.isMatchOver = true;
    this.isAdvancingRound = true;
    this.audio.playKO();
    this.renderer.triggerSlowMotion(1.8, 0.18);
    this.ui.showArcadeAnnouncement('K.O.!', 'STAGE CLEAR!', 1800, true);

    const isFinalBoss = this.currentStageIndex >= ARCADE_LADDER.length - 1;

    setTimeout(() => {
      if (isFinalBoss) {
        // Player defeated all 6 stages! Grandmaster victory!
        this.audio.playAnnouncer('perfect');
        const summary = this.quizManager.getSummary();
        this.ui.showScoreboard(
          summary,
          () => this.startBattle(0, false),
          () => {
            const startOverlay = document.getElementById('start-overlay');
            if (startOverlay) {
              startOverlay.classList.remove('hidden');
              startOverlay.classList.add('active');
            }
          },
          () => {
            const startOverlay = document.getElementById('start-overlay');
            if (startOverlay) {
              startOverlay.classList.remove('hidden');
              startOverlay.classList.add('active');
            }
          }
        );
      } else {
        // Heal player by +25% of max health for the next challenge!
        const healAmount = Math.round(this.playerRig.stats.maxHealth * 0.25);
        this.savedPlayerHealth = Math.min(this.playerRig.stats.maxHealth, this.playerRig.health + healAmount);

        const nextStageIdx = this.currentStageIndex + 1;

        // Display Arcade Ladder progression tower
        this.ui.showArcadeLadder(
          ARCADE_LADDER,
          nextStageIdx,
          this.quizManager.stats.currentStreak,
          healAmount,
          () => {
            // Battle Next Opponent
            this.startBattle(nextStageIdx, true);
          },
          () => {
            // Quit to Menu
            const startOverlay = document.getElementById('start-overlay');
            if (startOverlay) {
              startOverlay.classList.remove('hidden');
              startOverlay.classList.add('active');
            }
          }
        );
      }
    }, 1800);
  }

  handlePlayerDefeated() {
    this.isMatchOver = true;
    this.audio.playImpactCrunch(true);
    this.renderer.triggerSlowMotion(1.5, 0.2);

    setTimeout(() => {
      const summary = this.quizManager.getSummary();
      this.ui.showScoreboard(
        summary,
        () => this.startBattle(this.currentStageIndex, false),
        () => {
          const startOverlay = document.getElementById('start-overlay');
          if (startOverlay) {
            startOverlay.classList.remove('hidden');
            startOverlay.classList.add('active');
          }
        },
        () => {
          const startOverlay = document.getElementById('start-overlay');
          if (startOverlay) {
            startOverlay.classList.remove('hidden');
            startOverlay.classList.add('active');
          }
        }
      );
    }, 1200);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const rawDelta = Math.min(this.clock.getDelta(), 0.08);
    const elapsedTime = this.clock.getElapsedTime();

    // Hit-stop freeze frame & slow-mo scaling
    const delta = this.renderer.getEffectiveDelta(rawDelta);

    this.lighting.update(elapsedTime);
    this.particles.update(delta);

    if (this.isRunning) {
      if (!this.renderer.isHitStopped()) {
        this.physics.step(delta);

        // Update duel dinosaur models
        if (this.playerRig) {
          this.playerRig.updateBalancing(delta);
          this.playerRig.syncMeshes();
        }
        if (this.cpuRig) {
          this.cpuRig.updateBalancing(delta);
          this.cpuRig.syncMeshes();
        }
      }

      // Update UI Bars
      if (this.playerRig && this.cpuRig) {
        this.ui.updateBars(this.playerRig, this.cpuRig);
      }
    }

    // Cinematic Duel Camera Framing
    if (this.playerRig && this.cpuRig) {
      this.renderer.updateCamera(this.playerRig, this.cpuRig, rawDelta);
    } else if (this.playerRig) {
      this.renderer.updateCamera(this.playerRig, null, rawDelta);
    }

    this.renderer.render();
  }
}

new GameApp();
