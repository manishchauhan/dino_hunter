import { ARENA_RADIUS, AI_CONFIG } from '../constants.js';

/**
 * Apex Master Tactical Decision Tree AI for Dinosaurs
 * Features:
 * - Locked Target Gaze: Always aims directly at opponent during combat maneuvers
 * - Circle-Strafing & Flank Hunting: Stalks around the opponent to find blind angles
 * - Spacing for Big Attacks: Backdashes to 10-13m, squares up, and launches thunderous charges/pounces
 * - Feints & Baiting: Darts forward to provoke an attack, backsteps to cause whiff, then counters
 * - Precision Guard: Blocks strikes with Shield Guard (-75%) or sidesteps charges cleanly
 * - Pacing & Fair Play: Grants 1.4 - 2.2s opening window so user can initiate moves
 */
export class AIController {
  constructor(dinosaur, targetDino) {
    this.dino = dinosaur;
    this.target = targetDino;

    // Tactical states:
    // 'USER_CHANCE_OPENING' | 'STALK_FLANK' | 'FEINT_DART' | 'FEINT_RETREAT'
    // 'DEFEND_BLOCK' | 'DEFEND_SIDESTEP' | 'PUNISH_WHIFF'
    // 'CREATE_SPACE' | 'BIG_ATTACK_LAUNCH' | 'TACTICAL_RETREAT' | 'AVOID_WALL'
    this.state = 'USER_CHANCE_OPENING';
    this.circleDir = Math.random() > 0.5 ? 1 : -1;
    this.decisionTimer = 0;
    this.userChanceTimer = 1.8;
    this.feintTimer = 0;
    this.sidestepTimer = 0;
    this.intendedBigAttack = 'long';
  }

  setDinosaur(dino, target) {
    this.dino = dino;
    this.target = target;
    this.state = 'USER_CHANCE_OPENING';
    this.userChanceTimer = 1.8;
  }

  update(delta) {
    if (!this.dino || this.dino.isDead || !this.target || this.target.isDead) {
      if (this.dino && this.dino.isBlocking) this.dino.setBlocking(false);
      return;
    }

    const selfPos = this.dino.getPosition();
    const targetPos = this.target.getPosition();
    const dx = targetPos.x - selfPos.x;
    const dz = targetPos.z - selfPos.z;
    const dist = Math.hypot(dx, dz);

    const toPlayerAngle = Math.atan2(dx, dz);
    const toPlayerX = dist > 0.001 ? dx / dist : 0;
    const toPlayerZ = dist > 0.001 ? dz / dist : 1;
    // Perpendicular vector for strafing/flanking
    const sideX = -toPlayerZ;
    const sideZ = toPlayerX;

    // Perception of Player State
    const pAnim = this.target.animator;
    const isPlayerAttacking = pAnim && pAnim.state.startsWith('attack') && pAnim.actionDuration > 0;
    const pProgress = isPlayerAttacking ? pAnim.actionTimer / pAnim.actionDuration : 0;
    const isPlayerWindingUp = isPlayerAttacking && pProgress < 0.45;
    const isPlayerWhiffing = isPlayerAttacking && pProgress > 0.70 && !this.target.isKnockedDown;

    // 1. REFLEX DEFENSE: React to incoming player strike
    if (isPlayerWindingUp && dist < 12.0) {
      if (this.state !== 'DEFEND_BLOCK' && this.state !== 'DEFEND_SIDESTEP') {
        if (dist <= 5.8) {
          // Close Range: Block with Shield Guard or Slide Dodge
          if (this.dino.stamina >= 15 && Math.random() < AI_CONFIG.blockChance) {
            this.state = 'DEFEND_BLOCK';
            this.dino.setBlocking(true);
          } else if (this.dino.stamina >= 20 && Math.random() < AI_CONFIG.slideDodgeChance) {
            this.dino.triggerSlide();
            this.state = 'DEFEND_SIDESTEP';
            this.sidestepTimer = 0.55;
          } else {
            // Sidestep dodge
            this.state = 'DEFEND_SIDESTEP';
            this.sidestepTimer = 0.65;
          }
        } else {
          // Mid / Long Range (e.g. charging horns or leap): Sidestep out of attack corridor!
          if (Math.random() < AI_CONFIG.evadeRunChance) {
            this.state = 'DEFEND_SIDESTEP';
            this.sidestepTimer = 0.75;
          } else {
            this.state = 'DEFEND_BLOCK';
            this.dino.setBlocking(true);
          }
        }
      }
    } else {
      // Release block when attack finishes
      if (this.state === 'DEFEND_BLOCK' && !isPlayerWindingUp) {
        this.dino.setBlocking(false);
        this.state = 'STALK_FLANK';
        this.userChanceTimer = 1.0;
      }
    }

    // 2. WHIFF PUNISH: Strike player while stuck in attack recovery
    if (isPlayerWhiffing && dist < 11.0 && this.state !== 'DEFEND_BLOCK' && this.state !== 'DEFEND_SIDESTEP') {
      if (this.dino.attackCooldownTimer <= 0 && this.dino.stamina > 20 && Math.random() < AI_CONFIG.whiffPunishChance) {
        this.state = 'PUNISH_WHIFF';
      }
    }

    // 3. KNOCKDOWN COURTESY: Respect fallen opponent, step back
    if (this.target.isKnockedDown) {
      if (this.state !== 'CREATE_SPACE' && this.state !== 'STALK_FLANK') {
        this.state = 'STALK_FLANK';
      }
    }

    // 4. TIMERS
    if (this.userChanceTimer > 0) {
      this.userChanceTimer -= delta;
      if (this.state !== 'DEFEND_BLOCK' && this.state !== 'DEFEND_SIDESTEP') {
        this.state = 'USER_CHANCE_OPENING';
      }
    }

    if (this.sidestepTimer > 0) {
      this.sidestepTimer -= delta;
      if (this.sidestepTimer <= 0 && this.state === 'DEFEND_SIDESTEP') {
        this.state = 'STALK_FLANK';
      }
    }

    if (this.feintTimer > 0) {
      this.feintTimer -= delta;
      if (this.feintTimer <= 0) {
        if (this.state === 'FEINT_DART') {
          this.state = 'FEINT_RETREAT';
          this.feintTimer = 0.45;
        } else if (this.state === 'FEINT_RETREAT') {
          this.state = 'STALK_FLANK';
        }
      }
    }

    // 5. DECISION TREE EVALUATION
    this.decisionTimer -= delta;
    if (this.decisionTimer <= 0 && this.sidestepTimer <= 0 && this.feintTimer <= 0 && this.state !== 'DEFEND_BLOCK') {
      this.evaluateDecisionTree(dist, selfPos);
      this.decisionTimer = 0.4 + Math.random() * 0.35;
    }

    // 6. EXECUTE COMBAT BEHAVIOR
    this.executeCombatMovement(dist, toPlayerX, toPlayerZ, sideX, sideZ, toPlayerAngle, selfPos, delta);
  }

  evaluateDecisionTree(dist, selfPos) {
    const hpRatio = this.dino.health / this.dino.stats.maxHealth;
    const stamRatio = this.dino.stamina / this.dino.stats.maxStamina;
    const distFromCenter = Math.hypot(selfPos.x, selfPos.z);

    // Arena boundary avoidance
    if (distFromCenter > ARENA_RADIUS - 6) {
      this.state = 'AVOID_WALL';
      return;
    }

    // Low HP / Stamina survival retreat
    if (hpRatio < 0.22 || stamRatio < 0.18) {
      this.state = 'TACTICAL_RETREAT';
      return;
    }

    // User opportunity window: give user initiative
    if (this.userChanceTimer > 0) {
      this.state = 'USER_CHANCE_OPENING';
      return;
    }

    // Space creation for big attack
    if (this.state === 'CREATE_SPACE') {
      if (dist >= AI_CONFIG.spacingDistanceMin) {
        this.state = 'BIG_ATTACK_LAUNCH';
      }
      return;
    }

    const isSpecialReady =
      this.dino.specialCooldownTimer <= 0 && this.dino.stamina >= this.dino.stats.specialStaminaCost;

    // PRO TACTIC: "Use space for big attack"
    // Intentionally creates distance to prepare long-range leaps, charges or heavy specials
    const wantsBigAttack =
      (isSpecialReady || Math.random() < AI_CONFIG.createSpaceChance) &&
      this.dino.stamina > 30;

    if (wantsBigAttack) {
      if (dist < AI_CONFIG.spacingDistanceMin) {
        this.state = 'CREATE_SPACE';
        this.intendedBigAttack = isSpecialReady ? 'special' : 'long';
        return;
      } else if (dist <= AI_CONFIG.spacingDistanceMax + 2) {
        this.state = 'BIG_ATTACK_LAUNCH';
        return;
      }
    }

    // Tactical Feint Baiting (15% chance when at mid range 5-8m)
    if (dist >= 5.0 && dist <= 8.5 && Math.random() < 0.25 && this.dino.stamina > 25) {
      this.state = 'FEINT_DART';
      this.feintTimer = 0.28;
      return;
    }

    // Close Combat (dist <= 4.5m)
    if (dist <= 4.5) {
      const r = Math.random();
      if (r < 0.55) {
        // Strike with clean close bite/horn gore/slash
        this.dino.triggerContextualAttack(this.target);
        this.userChanceTimer = AI_CONFIG.userOpeningDurationMin + Math.random() * 0.5;
        this.state = 'USER_CHANCE_OPENING';
      } else if (r < 0.85) {
        this.state = 'STALK_FLANK';
        if (Math.random() < 0.4) this.circleDir *= -1;
      } else {
        if (this.dino.stamina > 20) {
          this.state = 'DEFEND_BLOCK';
          this.dino.setBlocking(true);
        }
      }
      return;
    }

    // Default neutral: Circle strafe & flank
    this.state = 'STALK_FLANK';
    if (Math.random() < 0.3) this.circleDir *= -1;
  }

  executeCombatMovement(dist, toX, toZ, sideX, sideZ, toTargetAngle, selfPos, delta) {
    let moveX = 0;
    let moveZ = 0;
    let sprint = false;
    let faceAngle = toTargetAngle; // Head & body always locked on opponent

    if (this.state === 'DEFEND_BLOCK') {
      // Guard stance: creep slowly while keeping guard locked on enemy
      const forwardFactor = dist > 4.5 ? 0.25 : -0.2;
      moveX = toX * forwardFactor;
      moveZ = toZ * forwardFactor;
      sprint = false;
    } else if (this.state === 'DEFEND_SIDESTEP') {
      // Master Sidestep: lateral dash out of attack line
      moveX = sideX * this.circleDir * 1.3 - toX * 0.4;
      moveZ = sideZ * this.circleDir * 1.3 - toZ * 0.4;
      sprint = true;
    } else if (this.state === 'CREATE_SPACE') {
      // "Use space for big attack": Sprint directly backward facing the player!
      moveX = -toX;
      moveZ = -toZ;
      sprint = true;
      if (dist >= AI_CONFIG.spacingDistanceMin) {
        this.state = 'BIG_ATTACK_LAUNCH';
      }
    } else if (this.state === 'BIG_ATTACK_LAUNCH') {
      // Accelerate forward with laser focus and unleash Big Attack!
      moveX = toX;
      moveZ = toZ;
      sprint = true;
      if (dist <= 14.5) {
        if (this.intendedBigAttack === 'special' && this.dino.specialCooldownTimer <= 0) {
          this.dino.triggerAttack2(this.target);
        } else {
          this.dino.triggerContextualAttack(this.target, true);
        }
        this.userChanceTimer = AI_CONFIG.userOpeningDurationMin + Math.random() * 0.8;
        this.state = 'USER_CHANCE_OPENING';
      }
    } else if (this.state === 'PUNISH_WHIFF') {
      // Dash in and punish missed attack
      moveX = toX;
      moveZ = toZ;
      sprint = dist > 4.5;
      if (dist <= 5.0) {
        this.dino.triggerContextualAttack(this.target);
        this.userChanceTimer = AI_CONFIG.userOpeningDurationMin;
        this.state = 'USER_CHANCE_OPENING';
      }
    } else if (this.state === 'FEINT_DART') {
      // Sudden forward feint to provoke player reaction
      moveX = toX;
      moveZ = toZ;
      sprint = true;
    } else if (this.state === 'FEINT_RETREAT') {
      // Snap backward to let player whiff!
      moveX = -toX;
      moveZ = -toZ;
      sprint = true;
    } else if (this.state === 'USER_CHANCE_OPENING') {
      // Give chance to user! Circle smoothly at safe distance (5.5 - 7.5m), keeping head locked on player
      const radialFactor = dist > 7.0 ? 0.35 : dist < 5.0 ? -0.5 : 0;
      moveX = sideX * this.circleDir * 0.65 + toX * radialFactor;
      moveZ = sideZ * this.circleDir * 0.65 + toZ * radialFactor;
      sprint = false;
    } else if (this.state === 'STALK_FLANK') {
      // Circle strafing & flank hunting: moves around opponent to find opening
      const radialFactor = dist > 7.5 ? 0.5 : dist < 4.5 ? -0.4 : 0.1;
      moveX = sideX * this.circleDir * 0.85 + toX * radialFactor;
      moveZ = sideZ * this.circleDir * 0.85 + toZ * radialFactor;
      sprint = dist > 9.5;
    } else if (this.state === 'TACTICAL_RETREAT') {
      // Disengage to regenerate stamina
      moveX = -toX * 0.9 + sideX * this.circleDir * 0.3;
      moveZ = -toZ * 0.9 + sideZ * this.circleDir * 0.3;
      sprint = true;
    } else if (this.state === 'AVOID_WALL') {
      // Steer back to arena center
      const toCenterX = -selfPos.x;
      const toCenterZ = -selfPos.z;
      const len = Math.hypot(toCenterX, toCenterZ);
      if (len > 0.1) {
        moveX = toCenterX / len;
        moveZ = toCenterZ / len;
      }
      sprint = false;
    }

    this.dino.applyCombatMovement(moveX, moveZ, faceAngle, sprint, delta);
  }
}
