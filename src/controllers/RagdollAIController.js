import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ARENA_RADIUS } from '../constants.js';

/**
 * AAA Pro Combat Enemy Ragdoll AI Controller
 * 
 * Implements a smart, controlled, and realistic combat decision tree:
 * ATTACK -> WAIT SOMETIME (Recovery Pause) -> RUN TO SAVE ITSELF (Controlled Tactical Retreat) -> GAP (Stalk & Evaluate) -> ATTACK
 * 
 * Design Principles:
 * - Controlled & smart: No supersonic running, no crazy spinning or erratic twitching.
 * - Measured fighting game velocities (~4.0 - 7.0 m/s stalk/retreat, crisp 0.5s lunges on strike).
 * - Proper randomized gaps between every single action.
 * - Distinct post-attack recovery windows where the CPU ceases attacks and gives the player punish advantage.
 * - Smart self-preservation: backs up while keeping eyes on the opponent, avoiding arena edges.
 */
export class RagdollAIController {
  constructor(cpuRig, playerRig, audio, particles, ui) {
    this.cpuRig = cpuRig;
    this.playerRig = playerRig;
    this.audio = audio;
    this.particles = particles;
    this.ui = ui;

    // Tactical States:
    // 'TACTICAL_GAP'      -> Controlled pre-attack gap & distance evaluation (prowling at 8-11m)
    // 'APPROACH_ATTACK'   -> Moving in with deliberate intent to strike
    // 'ATTACKING'         -> Executing single attack (bite, heavy, or special)
    // 'WAIT_POST_ATTACK'  -> "Wait sometime" pause/recovery window
    // 'RETREAT_TO_SAFETY' -> "Run to save itself" controlled tactical disengage
    // 'RECOVER_BALANCE'   -> Knockdown recovery -> directly to RETREAT_TO_SAFETY
    this.state = 'TACTICAL_GAP';
    this.stateTimer = 1.6;
    this.circleDir = Math.random() > 0.5 ? 1 : -1;
    this.chosenAttack = 'bite';
    this.strikeExecuted = false;
    this.approachTimer = 0;
    this.dodgeCooldown = 0;
    this.lastCpuHealth = 0;

    this.aggression = 0.7;
    this.isBoss = false;
  }

  setDinosaur(cpuRig, playerRig, stageConfig = {}) {
    this.cpuRig = cpuRig;
    this.playerRig = playerRig;
    this.state = 'TACTICAL_GAP';
    this.stateTimer = this.getGapDuration();
    this.circleDir = Math.random() > 0.5 ? 1 : -1;
    this.strikeExecuted = false;
    this.dodgeCooldown = 0;
    this.lastCpuHealth = cpuRig?.health || 0;
    this.setStageConfig(stageConfig);
  }

  setStageConfig(stageConfig = {}) {
    this.stageConfig = stageConfig;
    this.aggression = stageConfig.aiAggression || 0.7;
    this.isBoss = !!stageConfig.boss;
  }

  /**
   * Action Gap 1: "WAIT SOMETIME" (Post-attack recovery pause)
   * Gives player a clear, rewarding window to punish or counter-attack.
   */
  getWaitDuration() {
    // Stage 1 (Easy): 1.8s - 2.6s
    // Stage 3 (Moderate): 1.4s - 2.0s
    // Stage 6 (Boss): 1.1s - 1.6s
    const base = THREE.MathUtils.lerp(2.2, 1.3, Math.min(1.0, this.aggression));
    return Math.max(1.0, base + (Math.random() - 0.5) * 0.6);
  }

  /**
   * Action Gap 2: "RUN TO SAVE ITSELF" (Controlled tactical retreat)
   * CPU backs away smoothly to put safe distance between itself and the player.
   */
  getRetreatDuration() {
    // Controlled duration: 1.6s - 2.4s
    const base = THREE.MathUtils.lerp(2.2, 1.5, Math.min(1.0, this.aggression));
    return Math.max(1.2, base + (Math.random() - 0.5) * 0.6);
  }

  /**
   * Action Gap 3: "TACTICAL GAP" (Pre-attack stalking & distance assessment)
   * Safe distance pacing before deciding the next attack vector.
   */
  getGapDuration() {
    // Controlled duration: 1.5s - 2.6s
    const base = THREE.MathUtils.lerp(2.4, 1.4, Math.min(1.0, this.aggression));
    return Math.max(1.1, base + (Math.random() - 0.5) * 0.7);
  }

  update(delta) {
    if (!this.cpuRig || this.cpuRig.isDead || !this.playerRig || this.playerRig.isDead) return;

    // 1. Knockdown Priority Recovery
    if (this.cpuRig.isKnockedDown) {
      this.state = 'RECOVER_BALANCE';
      return;
    }

    const cpuPos = this.cpuRig.getPosition();
    const playerPos = this.playerRig.getPosition();

    const dx = playerPos.x - cpuPos.x;
    const dz = playerPos.z - cpuPos.z;
    const dist = Math.hypot(dx, dz);
    const toPlayer = new THREE.Vector2(dx, dz).normalize();

    // Dodge cooldown countdown
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= delta;
    }

    // 2. Heavy Hit Interruption: If struck during wait or gap, disengage to save itself!
    if (this.lastCpuHealth === 0) this.lastCpuHealth = this.cpuRig.health;
    if (this.cpuRig.health < this.lastCpuHealth - 25) {
      this.lastCpuHealth = this.cpuRig.health;
      if (this.state === 'WAIT_POST_ATTACK' || this.state === 'TACTICAL_GAP') {
        this.state = 'RETREAT_TO_SAFETY';
        this.stateTimer = this.getRetreatDuration();
      }
    } else {
      this.lastCpuHealth = this.cpuRig.health;
    }

    // 3. Smart Predator Gaze: Always keep dignified eye contact on opponent
    this.cpuRig.setFacingTarget(new THREE.Vector3(playerPos.x, playerPos.y + 0.5, playerPos.z));

    this.stateTimer -= delta;

    // 4. Decision Tree State Machine
    switch (this.state) {
      // ------------------------------------------------------------------
      // STEP 1: TACTICAL GAP (Controlled prowling, stalking & evaluating distance)
      // ------------------------------------------------------------------
      case 'TACTICAL_GAP': {
        const sideDir = new THREE.Vector2(-toPlayer.y * this.circleDir, toPlayer.x * this.circleDir);

        // Controlled, graceful lateral pacing at safe range (~8.0m to 11.0m)
        let moveX = sideDir.x * 0.45;
        let moveZ = sideDir.y * 0.45;

        if (dist < 7.2) {
          // Player closing in: back up smoothly to maintain spacing
          moveX -= toPlayer.x * 0.45;
          moveZ -= toPlayer.y * 0.45;
        } else if (dist > 12.0) {
          // Too far: step in gently
          moveX += toPlayer.x * 0.35;
          moveZ += toPlayer.y * 0.35;
        }

        // Randomly switch circle direction smoothly
        if (Math.random() < 0.005) {
          this.circleDir *= -1;
        }

        this.cpuRig.applyFootwork(moveX, moveZ, false, delta);

        // When the randomized gap expires -> Choose attack & start approach!
        if (this.stateTimer <= 0) {
          this.selectNextAttack(dist);
        }
        break;
      }

      // ------------------------------------------------------------------
      // STEP 2: APPROACH FOR ATTACK (Moving in with deliberate strike intent)
      // ------------------------------------------------------------------
      case 'APPROACH_ATTACK': {
        this.approachTimer -= delta;

        // Controlled, purposeful stride toward the player (not erratic sprint)
        this.cpuRig.applyFootwork(toPlayer.x * 0.65, toPlayer.y * 0.65, false, delta);

        const strikeReach = (this.chosenAttack === 'heavy') ? 5.8 : 4.8;

        // Once in range or if approach timeout reached -> Strike!
        if (dist <= strikeReach || this.approachTimer <= 0) {
          this.state = 'ATTACKING';
          this.stateTimer = (this.chosenAttack === 'heavy') ? 0.70 : 0.50;
          this.strikeExecuted = false;
        }
        break;
      }

      // ------------------------------------------------------------------
      // STEP 3: ATTACK (Execute the single chosen strike)
      // ------------------------------------------------------------------
      case 'ATTACKING': {
        // Strike execution happens once at start of this state
        if (!this.strikeExecuted) {
          this.strikeExecuted = true;

          if (this.chosenAttack === 'special') {
            this.cpuRig.triggerSpecialAbility(this.playerRig);
            if (this.ui) {
              this.ui.showActionBanner(`⚠️ WARNING! ${this.cpuRig.stats.name} UNLEASHES ${this.cpuRig.ability.name}!`);
            }
          } else {
            this.cpuRig.executeStrike(this.chosenAttack, this.playerRig);
          }
        }

        // When strike duration finishes -> MANDATORY: WAIT SOMETIME!
        if (this.stateTimer <= 0) {
          this.strikeExecuted = false;
          this.state = 'WAIT_POST_ATTACK';
          this.stateTimer = this.getWaitDuration();
        }
        break;
      }

      // ------------------------------------------------------------------
      // STEP 4: WAIT SOMETIME (Recovery pause / punish window for player)
      // ------------------------------------------------------------------
      case 'WAIT_POST_ATTACK': {
        // The CPU STOPS attacking completely!
        // Stands firmly in place recovering its breath / stance (zero forward drive)
        this.cpuRig.applyFootwork(0, 0, false, delta);

        // When the wait gap expires -> MANDATORY: RUN TO SAVE ITSELF!
        if (this.stateTimer <= 0) {
          this.state = 'RETREAT_TO_SAFETY';
          this.stateTimer = this.getRetreatDuration();
          this.circleDir = Math.random() > 0.5 ? 1 : -1;
        }
        break;
      }

      // ------------------------------------------------------------------
      // STEP 5: RUN TO SAVE ITSELF (Controlled tactical retreat & disengage)
      // ------------------------------------------------------------------
      case 'RETREAT_TO_SAFETY': {
        // Calculate retreat vector away from player
        let retX = -toPlayer.x;
        let retZ = -toPlayer.y;

        // Arena wall avoidance: steer gently toward arena center if nearing boundary
        const distFromCenter = Math.hypot(cpuPos.x, cpuPos.z);
        if (distFromCenter > ARENA_RADIUS * 0.65) {
          const toCenterX = -cpuPos.x / (distFromCenter || 1);
          const toCenterZ = -cpuPos.z / (distFromCenter || 1);
          retX = retX * 0.5 + toCenterX * 0.6;
          retZ = retZ * 0.5 + toCenterZ * 0.6;
        }

        const retLen = Math.hypot(retX, retZ) || 1;
        retX /= retLen;
        retZ /= retLen;

        // Controlled, steady backpedaling / retreat (not crazy sprint)
        this.cpuRig.applyFootwork(retX * 0.60, retZ * 0.60, false, delta);

        // Smart evasion: single slide dodge away if player rushes in aggressively
        if (dist < 4.2 && this.dodgeCooldown <= 0 && this.cpuRig.animator && !this.cpuRig.animator.isActing()) {
          this.dodgeCooldown = 3.5; // strict cooldown so it never spams dodges
          this.cpuRig.animator.playAction('slide', 0.45);
          if (this.audio) this.audio.playWhiff();
        }

        // Once at comfortable safe distance (> 9.5m) OR retreat duration completes -> Enter GAP!
        if (dist >= 9.8 || this.stateTimer <= 0) {
          this.state = 'TACTICAL_GAP';
          this.stateTimer = this.getGapDuration();
          this.circleDir = Math.random() > 0.5 ? 1 : -1;
        }
        break;
      }

      // ------------------------------------------------------------------
      // STEP 6: RECOVER BALANCE (Knockdown recovery)
      // ------------------------------------------------------------------
      case 'RECOVER_BALANCE': {
        if (!this.cpuRig.isKnockedDown) {
          // Immediately upon standing up, back up to safe distance to reset neutral!
          this.state = 'RETREAT_TO_SAFETY';
          this.stateTimer = this.getRetreatDuration();
          this.circleDir = Math.random() > 0.5 ? 1 : -1;
        }
        break;
      }
    }
  }

  /**
   * Selects next attack randomly based on stage aggression and range
   */
  selectNextAttack(dist) {
    const aggr = this.aggression || 0.7;
    const roll = Math.random();

    // Check special ability charge
    if (this.cpuRig.isSpecialReady && !this.cpuRig.isExecutingSpecial && roll < 0.50 * aggr) {
      this.chosenAttack = 'special';
      this.state = 'APPROACH_ATTACK';
      this.approachTimer = 2.0;
      return;
    }

    // Roll between Bite (primary fast attack) and Heavy (power attack)
    if (roll < 0.65) {
      this.chosenAttack = 'bite';
    } else {
      this.chosenAttack = 'heavy';
    }

    this.state = 'APPROACH_ATTACK';
    this.approachTimer = 2.0; // Failsafe timeout to prevent infinite chasing
  }
}
