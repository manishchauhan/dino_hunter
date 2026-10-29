import * as THREE from 'three';

const QUADRUPED_TYPES = new Set([
  'triceratops',
  'ankylosaurus',
  'stegosaurus',
  'brachiosaurus',
  'pachyrhinosaurus',
  'styracosaurus',
  'kentrosaurus'
]);

export class DinosaurAnimator {
  constructor(joints, onFootstep = null, dinoType = 'trex') {
    this.j = joints;
    this.onFootstep = onFootstep;
    this.dinoType = dinoType;
    this.isQuadruped = QUADRUPED_TYPES.has(dinoType);

    this.walkCycle = 0;
    this.lastFootstepPhase = 0;
    this.state = 'idle';
    this.actionTimer = 0;
    this.actionDuration = 0;
    this.activeAttackData = null;
    this.attackFootstepTriggered = false;
    this.attackFootstepPhase = 0;

    // Cache initial base resting positions of joints
    this.basePositions = {};
    ['torso', 'leftLeg', 'rightLeg', 'frontLegL', 'frontLegR', 'head', 'neck', 'tail1', 'tail2'].forEach((k) => {
      if (this.j[k]) {
        this.basePositions[k] = this.j[k].position.clone();
      }
    });
  }

  playAction(actionName, duration = 0.6, attackData = null) {
    if (this.state === 'dead') return;
    this.state = actionName;
    this.actionTimer = 0;
    this.actionDuration = duration;
    this.activeAttackData = attackData;
    this.attackFootstepTriggered = false;
    this.attackFootstepPhase = 0;
  }

  setState(newState = 'idle') {
    if (this.state === 'dead') return;
    this.state = newState;
    this.actionTimer = 0;
    this.actionDuration = 0;
  }

  isActing() {
    return (
      this.state.startsWith('attack') ||
      this.state === 'roar' ||
      this.state === 'hit' ||
      this.state === 'slide' ||
      this.state === 'jump' ||
      this.state === 'block' ||
      this.state === 'special_breath' ||
      this.state === 'titan_stomp'
    );
  }

  update(delta, isMoving = false, horizSpeed = 0, isJumping = false, isGrounded = true) {
    if (this.state === 'dead') return;

    if (this.isActing()) {
      this.actionTimer += delta;
      const progress = Math.min(1, this.actionTimer / this.actionDuration);

      if (this.state === 'attack_close' || this.state === 'attack1') {
        this.animateAttackClose(progress, horizSpeed, isMoving);
      } else if (this.state === 'attack_mid') {
        this.animateAttackMid(progress, horizSpeed, isMoving);
      } else if (this.state === 'attack_long') {
        this.animateAttackLong(progress, horizSpeed, isMoving);
      } else if (this.state === 'attack2') {
        this.animateAttackSpecial(progress, horizSpeed, isMoving);
      } else if (this.state === 'special_breath') {
        this.animateSpecialBreath(progress);
      } else if (this.state === 'titan_stomp') {
        this.animateTitanStomp(progress);
      } else if (this.state === 'roar') {
        this.animateRoar(progress);
      } else if (this.state === 'hit') {
        this.animateHit(progress);
      } else if (this.state === 'slide') {
        this.animateSlide(progress);
      } else if (this.state === 'jump') {
        this.animateJump(progress, isGrounded);
      } else if (this.state === 'block') {
        this.animateBlock(progress);
      }

      if (progress >= 1 && this.state !== 'block') {
        this.resetPose();
        this.state = 'idle';
        this.activeAttackData = null;
      }
      return;
    }

    if (isJumping || !isGrounded) {
      this.animateInAir(delta);
    } else if (isMoving && horizSpeed > 0.25) {
      this.state = 'walk';
      this.animateWalk(delta, horizSpeed);
    } else {
      this.state = 'idle';
      this.animateIdle(delta);
    }
  }

  /**
   * High-Performance Kinematic Locomotion (Walk, Run, Sprint)
   * Stride frequency strictly scales with ground speed to eliminate all sliding / moonwalking.
   */
  animateWalk(delta, horizSpeed) {
    // Dynamic stride rate tightly matches physical velocity:
    // Scales smoothly from deliberate walk (~3.6 rad/s) to full sprint (~26.0 rad/s)
    const strideRate = Math.max(3.6, Math.min(26.0, 2.0 + horizSpeed * 1.18));
    this.walkCycle += delta * strideRate;

    const isRunning = horizSpeed > 5.5;
    const sin = Math.sin(this.walkCycle);
    const cos = Math.cos(this.walkCycle);

    // Stride phase for footstep audio & dust puff impacts
    const phase = Math.floor(this.walkCycle / Math.PI);
    if (phase !== this.lastFootstepPhase) {
      this.lastFootstepPhase = phase;
      if (this.onFootstep) this.onFootstep();
    }

    // Dynamic swing amplitude scales from 26° (walk) to 58° (full sprint)
    const swing = Math.min(1.05, 0.44 + Math.min(horizSpeed, 22) * 0.028);

    if (this.j.root) {
      this.j.root.rotation.z = 0;
      this.j.root.rotation.x = 0;
    }

    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : (this.isQuadruped ? 2.7 : 3.0);
    const bLeftLegY = this.basePositions.leftLeg ? this.basePositions.leftLeg.y : 2.9;
    const bRightLegY = this.basePositions.rightLeg ? this.basePositions.rightLeg.y : 2.9;

    if (!this.isQuadruped) {
      // ===== BIPEDAL GAIT (T-Rex, Spinosaurus, Raptors, Carnotaurus, etc.) =====
      // 1. Thigh / Leg Rotation
      if (this.j.leftLeg) this.j.leftLeg.rotation.x = sin * swing;
      if (this.j.rightLeg) this.j.rightLeg.rotation.x = -sin * swing;

      // 2. High-Knee Elevation during recovery swing prevents foot from penetrating ground
      const liftL = Math.max(0, -sin) * (isRunning ? 0.38 : 0.22);
      const liftR = Math.max(0, sin) * (isRunning ? 0.38 : 0.22);
      if (this.j.leftLeg) this.j.leftLeg.position.y = bLeftLegY + liftL;
      if (this.j.rightLeg) this.j.rightLeg.position.y = bRightLegY + liftR;

      // 3. Torso Forward Lean, Vertical Bobbing & Lateral Hip Sway
      const forwardLean = -0.06 - Math.min(horizSpeed, 25) * 0.009;
      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY + Math.abs(cos) * 0.18 - (isRunning ? 0.22 : 0.08);
        this.j.torso.rotation.x = forwardLean;
        this.j.torso.rotation.z = cos * (isRunning ? 0.065 : 0.035);
        this.j.torso.rotation.y = sin * 0.035;

        // Cartoon Squash & Stretch on footsteps
        const bouncePhase = Math.abs(sin);
        const cartoonSquash = (bouncePhase - 0.5) * (isRunning ? 0.08 : 0.045);
        this.j.torso.scale.set(
          1 - cartoonSquash * 0.45,
          1 + cartoonSquash,
          1 - cartoonSquash * 0.45
        );
      }

      // 4. Forelimbs / Arms counter-swing
      if (this.j.armL) this.j.armL.rotation.x = -sin * (isRunning ? 0.75 : 0.42);
      if (this.j.armR) this.j.armR.rotation.x = sin * (isRunning ? 0.75 : 0.42);

      // 5. Head and Neck track forward into sprint with lively breathing snarl
      if (this.j.neck) this.j.neck.rotation.x = -forwardLean * 0.65;
      if (this.j.head) {
        this.j.head.rotation.x = -forwardLean * 0.45 + Math.sin(this.walkCycle * 2) * 0.08;
        this.j.head.rotation.z = -cos * 0.06;
        const cartoonHeadSquash = (Math.abs(sin) - 0.5) * (isRunning ? 0.07 : 0.04);
        this.j.head.scale.set(
          1 + cartoonHeadSquash * 0.3,
          1 - cartoonHeadSquash * 0.45,
          1 + cartoonHeadSquash * 0.3
        );
      }
      // Expressive snarl & tooth display during movement
      if (this.j.jaw) {
        this.j.jaw.rotation.x = Math.max(0.06, Math.sin(this.walkCycle * 2) * 0.24 + (isRunning ? 0.24 : 0.08));
      }

      // 6. Muscular S-Curve Tail sway with authentic whip wave inertia lag
      if (this.j.tail1) {
        this.j.tail1.rotation.y = -cos * (isRunning ? 0.82 : 0.52);
        this.j.tail1.rotation.x = 0.06 + Math.min(horizSpeed, 20) * 0.008;
      }
      if (this.j.tail2) {
        this.j.tail2.rotation.y = -Math.cos(this.walkCycle - 1.1) * (isRunning ? 1.15 : 0.78);
        this.j.tail2.rotation.x = -0.04 + Math.sin(this.walkCycle * 2 - 0.5) * 0.06;
      }
    } else {
      // ===== QUADRUPEDAL GAIT (Triceratops, Ankylosaurus, Stegosaurus, etc.) =====
      // Diagonal trotting gait: (FL + RR) swing together, alternating with (FR + RL)
      if (this.j.frontLegL) this.j.frontLegL.rotation.x = sin * swing;
      if (this.j.rightLeg) this.j.rightLeg.rotation.x = sin * swing * 0.95;
      if (this.j.frontLegR) this.j.frontLegR.rotation.x = -sin * swing;
      if (this.j.leftLeg) this.j.leftLeg.rotation.x = -sin * swing * 0.95;

      // Diagonal Foot Elevation
      const bFL = this.basePositions.frontLegL ? this.basePositions.frontLegL.y : 2.2;
      const bFR = this.basePositions.frontLegR ? this.basePositions.frontLegR.y : 2.2;
      if (this.j.frontLegL) this.j.frontLegL.position.y = bFL + Math.max(0, -sin) * 0.28;
      if (this.j.rightLeg) this.j.rightLeg.position.y = bRightLegY + Math.max(0, -sin) * 0.28;
      if (this.j.frontLegR) this.j.frontLegR.position.y = bFR + Math.max(0, sin) * 0.28;
      if (this.j.leftLeg) this.j.leftLeg.position.y = bLeftLegY + Math.max(0, sin) * 0.28;

      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY + Math.abs(cos) * 0.12 - (isRunning ? 0.18 : 0.06);
        this.j.torso.rotation.x = -0.04 - Math.min(horizSpeed, 20) * 0.005;
        this.j.torso.rotation.z = cos * (isRunning ? 0.05 : 0.025);

        // Cartoon Squash & Stretch on quadruped foot plants
        const bounceQ = Math.abs(sin);
        const cartoonSquashQ = (bounceQ - 0.5) * (isRunning ? 0.065 : 0.035);
        this.j.torso.scale.set(
          1 - cartoonSquashQ * 0.4,
          1 + cartoonSquashQ,
          1 - cartoonSquashQ * 0.4
        );
      }

      if (this.j.head) {
        this.j.head.rotation.x = 0.05 + Math.sin(this.walkCycle * 2) * 0.07;
        this.j.head.rotation.z = -cos * 0.04;
        const cartoonHeadQ = (Math.abs(sin) - 0.5) * (isRunning ? 0.05 : 0.03);
        this.j.head.scale.set(
          1 + cartoonHeadQ * 0.25,
          1 - cartoonHeadQ * 0.35,
          1 + cartoonHeadQ * 0.25
        );
      }
      if (this.j.jaw) {
        this.j.jaw.rotation.x = Math.max(0.04, Math.sin(this.walkCycle * 2) * 0.16);
      }
      if (this.j.tail1) this.j.tail1.rotation.y = -cos * 0.62;
      if (this.j.tail2) this.j.tail2.rotation.y = -Math.cos(this.walkCycle - 1.1) * 0.88;
    }
  }

  animateIdle(delta) {
    this.walkCycle += delta * 2.0;
    const sin = Math.sin(this.walkCycle);
    const cos = Math.cos(this.walkCycle);
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : (this.isQuadruped ? 2.7 : 3.0);

    if (this.j.root) { this.j.root.rotation.z = 0; this.j.root.rotation.x = 0; }
    if (this.j.torso) {
      this.j.torso.position.y = bTorsoY + sin * 0.06;
      this.j.torso.position.z = this.basePositions.torso ? this.basePositions.torso.z : 0;
      this.j.torso.rotation.set(0, 0, 0);
      // Gentle cartoon breathing chest expansion
      this.j.torso.scale.set(1 - sin * 0.02, 1 + sin * 0.035, 1 - sin * 0.02);
    }
    if (this.j.neck) this.j.neck.rotation.set(0, 0, 0);

    // Natural predatory head motion (curious tilt, looking around, breathing nod)
    if (this.j.head) {
      this.j.head.rotation.set(
        sin * 0.08,
        Math.cos(this.walkCycle * 0.5) * 0.14,
        Math.sin(this.walkCycle * 0.7) * 0.08
      );
      this.j.head.scale.set(1 + sin * 0.015, 1 - sin * 0.02, 1 + sin * 0.015);
      if (this.basePositions.head) this.j.head.position.copy(this.basePositions.head);
    }

    // Natural jaw breathing part
    if (this.j.jaw) {
      this.j.jaw.rotation.x = Math.max(0, Math.sin(this.walkCycle * 1.5) * 0.16);
    }

    // Large graceful figure-8 tail sweep with natural wave propagation
    if (this.j.tail1) {
      this.j.tail1.rotation.set(Math.cos(this.walkCycle * 2) * 0.08, Math.sin(this.walkCycle) * 0.42, 0);
    }
    if (this.j.tail2) {
      this.j.tail2.rotation.set(Math.cos(this.walkCycle * 2 - 0.8) * 0.12, Math.sin(this.walkCycle - 0.95) * 0.65, 0);
    }

    ['leftLeg', 'rightLeg', 'frontLegL', 'frontLegR', 'armL', 'armR'].forEach((k) => {
      if (this.j[k]) {
        this.j[k].rotation.set(0, 0, 0);
        if (this.basePositions[k]) this.j[k].position.copy(this.basePositions[k]);
      }
    });
  }

  animateInAir(delta) {
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;
    if (this.j.torso) {
      this.j.torso.position.y = bTorsoY + 0.35;
      this.j.torso.rotation.x = -0.18;
    }
    if (this.j.leftLeg) this.j.leftLeg.rotation.set(-0.45, 0, 0.2);
    if (this.j.rightLeg) this.j.rightLeg.rotation.set(-0.45, 0, -0.2);
    if (this.j.frontLegL) this.j.frontLegL.rotation.set(0.35, 0, 0.1);
    if (this.j.frontLegR) this.j.frontLegR.rotation.set(0.35, 0, -0.1);
    if (this.j.tail1) this.j.tail1.rotation.x = 0.25;
  }

  animateSlide(p) {
    const t = Math.sin(p * Math.PI);
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;
    if (this.j.torso) {
      this.j.torso.position.y = bTorsoY - t * 1.25;
      this.j.torso.rotation.z = t * 0.45;
      this.j.torso.rotation.x = -t * 0.32;
    }
    if (this.j.head) {
      this.j.head.position.y = (this.basePositions.head ? this.basePositions.head.y : 0.2) - t * 0.6;
      this.j.head.rotation.x = t * 0.3;
    }
    if (this.j.leftLeg) this.j.leftLeg.rotation.set(t * 0.85, 0, t * 0.6);
    if (this.j.rightLeg) this.j.rightLeg.rotation.set(-t * 0.55, 0, -t * 0.4);
    if (this.j.tail1) this.j.tail1.rotation.y = -t * 0.8;
  }

  animateJump(p, isGrounded) {
    const t = Math.sin(p * Math.PI);
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;
    if (this.j.torso) {
      this.j.torso.position.y = bTorsoY + t * 0.85;
      this.j.torso.rotation.x = -t * 0.25;
    }
    if (this.j.leftLeg) this.j.leftLeg.rotation.x = -t * 0.7;
    if (this.j.rightLeg) this.j.rightLeg.rotation.x = -t * 0.7;
    if (this.j.head) this.j.head.rotation.x = t * 0.2;
  }

  animateBlock(p) {
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;
    if (this.j.torso) {
      this.j.torso.position.y = bTorsoY - 0.4;
      this.j.torso.rotation.x = 0.22;
    }
    if (this.j.head) {
      this.j.head.position.y = (this.basePositions.head ? this.basePositions.head.y : 0.2) - 0.3;
      this.j.head.rotation.x = 0.35;
    }
    // Wide braced defensive leg stance
    if (this.j.leftLeg) this.j.leftLeg.rotation.set(0.25, 0, 0.2);
    if (this.j.rightLeg) this.j.rightLeg.rotation.set(0.25, 0, -0.2);
    if (this.j.frontLegL) this.j.frontLegL.rotation.set(-0.2, 0, 0.15);
    if (this.j.frontLegR) this.j.frontLegR.rotation.set(-0.2, 0, -0.15);
    if (this.j.armL) this.j.armL.rotation.set(0.65, 0, -0.4);
    if (this.j.armR) this.j.armR.rotation.set(0.65, 0, 0.4);
  }

  /**
   * PRIMARY / CLOSE ATTACK WITH ACTIVE FEET MOVEMENT
   * Features dynamic stepping footwork: Windup coiling -> Explosive lunge drive -> Ground slam plant -> Stance recovery.
   */
  animateAttackClose(p, horizSpeed = 0, isMoving = false) {
    const isWindup = p < 0.35;
    const isStrike = p >= 0.35 && p <= 0.68;
    const isRecovery = p > 0.68;
    const t = isWindup ? p / 0.35 : isStrike ? (p - 0.35) / 0.33 : (p - 0.68) / 0.32;

    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : (this.isQuadruped ? 2.7 : 3.0);
    const bLeftLegY = this.basePositions.leftLeg ? this.basePositions.leftLeg.y : 2.9;
    const bRightLegY = this.basePositions.rightLeg ? this.basePositions.rightLeg.y : 2.9;

    // Trigger footstep impact exactly when lead foot stomps on strike
    if (isStrike && !this.attackFootstepTriggered) {
      this.attackFootstepTriggered = true;
      if (this.onFootstep) this.onFootstep();
    }

    // ===== DYNAMIC FEET MOVEMENT FOR ALL DINOSAURS =====
    if (!this.isQuadruped) {
      if (isMoving && horizSpeed > 1.8) {
        // High-speed running bite: Feet vigorously stride through the lunge
        const combatStep = Math.sin(p * Math.PI * 3);
        if (this.j.leftLeg) {
          this.j.leftLeg.rotation.x = combatStep * 0.88;
          this.j.leftLeg.position.y = bLeftLegY + Math.max(0, -combatStep) * 0.36;
        }
        if (this.j.rightLeg) {
          this.j.rightLeg.rotation.x = -combatStep * 0.88;
          this.j.rightLeg.position.y = bRightLegY + Math.max(0, combatStep) * 0.36;
        }
      } else {
        // Stationary or stalking lunge: Windup brace -> Explosive stride & stomp -> Recovery
        if (isWindup) {
          // Stance coils down, lead leg steps forward, rear leg plants firmly
          if (this.j.leftLeg) {
            this.j.leftLeg.rotation.x = t * 0.42;
            this.j.leftLeg.position.y = bLeftLegY - t * 0.08;
          }
          if (this.j.rightLeg) {
            this.j.rightLeg.rotation.x = -t * 0.45;
            this.j.rightLeg.position.y = bRightLegY;
          }
          if (this.j.torso) {
            this.j.torso.position.y = bTorsoY - t * 0.35;
            this.j.torso.position.z = (this.basePositions.torso ? this.basePositions.torso.z : 0) - t * 0.35;
          }
        } else if (isStrike) {
          // Explosive forward thrust: Rear leg extends with full drive (-0.95 rad),
          // lead foot lifts and SLAMS down forward (+0.85 rad)
          if (this.j.leftLeg) {
            this.j.leftLeg.rotation.x = 0.42 + t * 0.46;
            this.j.leftLeg.position.y = bLeftLegY + Math.sin(t * Math.PI) * 0.35;
          }
          if (this.j.rightLeg) {
            this.j.rightLeg.rotation.x = -0.45 - t * 0.50; // Full leg propulsion extension
            this.j.rightLeg.position.y = bRightLegY;
          }
          if (this.j.torso) {
            this.j.torso.position.y = bTorsoY - 0.35 + t * 0.22;
            this.j.torso.position.z = (this.basePositions.torso ? this.basePositions.torso.z : 0) + t * 1.35;
          }
        } else {
          // Recovery: Lead knee flexes, rear leg steps forward under center of gravity
          if (this.j.leftLeg) {
            this.j.leftLeg.rotation.x = 0.88 * (1 - t);
            this.j.leftLeg.position.y = bLeftLegY;
          }
          if (this.j.rightLeg) {
            this.j.rightLeg.rotation.x = -0.95 * (1 - t);
            this.j.rightLeg.position.y = bRightLegY;
          }
          if (this.j.torso) {
            this.j.torso.position.y = bTorsoY - 0.13 + t * 0.13;
            this.j.torso.position.z = (this.basePositions.torso ? this.basePositions.torso.z : 0) + 1.35 * (1 - t);
          }
        }
      }
    } else {
      // Quadruped attack footwork (Triceratops, Ankylosaurus)
      if (isWindup) {
        if (this.j.frontLegL) this.j.frontLegL.rotation.x = -t * 0.35;
        if (this.j.frontLegR) this.j.frontLegR.rotation.x = -t * 0.35;
        if (this.j.leftLeg) this.j.leftLeg.rotation.x = t * 0.32;
        if (this.j.rightLeg) this.j.rightLeg.rotation.x = t * 0.32;
      } else if (isStrike) {
        if (this.j.frontLegL) this.j.frontLegL.rotation.x = -0.35 + t * 0.85;
        if (this.j.frontLegR) this.j.frontLegR.rotation.x = -0.35 + t * 0.85;
        if (this.j.leftLeg) this.j.leftLeg.rotation.x = 0.32 - t * 0.75;
        if (this.j.rightLeg) this.j.rightLeg.rotation.x = 0.32 - t * 0.75;
      } else {
        if (this.j.frontLegL) this.j.frontLegL.rotation.x = 0.5 * (1 - t);
        if (this.j.frontLegR) this.j.frontLegR.rotation.x = 0.5 * (1 - t);
        if (this.j.leftLeg) this.j.leftLeg.rotation.x = -0.43 * (1 - t);
        if (this.j.rightLeg) this.j.rightLeg.rotation.x = -0.43 * (1 - t);
      }
    }

    // ===== UPPER BODY COMBAT ACTIONS (Bite, Gore, Claw, Ram) =====
    if (this.dinoType === 'trex' || this.dinoType === 'allosaurus' || this.dinoType === 'carnotaurus' || this.dinoType === 'giganotosaurus') {
      // Ferocious Apex Jaw Snap
      if (isWindup) {
        if (this.j.head) { this.j.head.position.z = 1.0 - t * 0.7; this.j.head.rotation.x = -t * 0.45; }
        if (this.j.jaw) this.j.jaw.rotation.x = t * 1.35;
        if (this.j.neck) this.j.neck.rotation.x = t * 0.25;
        if (this.j.tail1) this.j.tail1.rotation.y = -t * 0.35;
      } else if (isStrike) {
        if (this.j.head) { this.j.head.position.z = 0.3 + t * 1.9; this.j.head.rotation.x = 0.28 * (1 - t); }
        if (this.j.jaw) this.j.jaw.rotation.x = Math.max(0, 1.35 * (1 - t * 2.4));
        if (this.j.neck) this.j.neck.rotation.x = -0.32 * t;
      } else {
        if (this.j.head) this.j.head.position.z = 2.2 - t * 1.2;
        if (this.j.jaw) this.j.jaw.rotation.x = 0;
        if (this.j.neck) this.j.neck.rotation.x = 0;
      }
    } else if (this.dinoType === 'triceratops' || this.dinoType === 'styracosaurus' || this.dinoType === 'pachyrhinosaurus') {
      // Violent Upward Horn Gore & Lift
      if (isWindup) {
        if (this.j.head) { this.j.head.position.y = -t * 0.9; this.j.head.rotation.x = t * 0.65; }
      } else if (isStrike) {
        if (this.j.head) {
          this.j.head.position.set(0, -0.9 + t * 2.6, 1.0 + t * 1.4);
          this.j.head.rotation.x = 0.65 - t * 1.5;
        }
      } else {
        if (this.j.head) {
          this.j.head.position.set(0, 0.2 + (1 - t) * 0.8, 1.0);
          this.j.head.rotation.x = (1 - t) * -0.85;
        }
      }
    } else if (this.dinoType === 'spinosaurus' || this.dinoType === 'baryonyx' || this.dinoType === 'suchomimus') {
      // Croc Vise Clamp & Twin Hook Claw Slash
      if (isWindup) {
        if (this.j.armL) this.j.armL.rotation.set(-t * 1.4, 0, -0.6);
        if (this.j.armR) this.j.armR.rotation.set(-t * 1.4, 0, 0.6);
        if (this.j.head) { this.j.head.position.z = 1.0 - t * 0.6; this.j.head.rotation.x = -t * 0.3; }
        if (this.j.jaw) this.j.jaw.rotation.x = t * 1.2;
      } else if (isStrike) {
        if (this.j.armL) this.j.armL.rotation.set(-1.4 + t * 2.8, 0, 0.4);
        if (this.j.armR) this.j.armR.rotation.set(-1.4 + t * 2.8, 0, -0.4);
        if (this.j.head) this.j.head.position.z = 0.4 + t * 2.0;
        if (this.j.jaw) this.j.jaw.rotation.x = Math.max(0, 1.2 * (1 - t * 2.5));
      } else {
        if (this.j.armL) this.j.armL.rotation.set(0, 0, 0);
        if (this.j.armR) this.j.armR.rotation.set(0, 0, 0);
        if (this.j.head) this.j.head.position.z = 1.0;
        if (this.j.jaw) this.j.jaw.rotation.x = 0;
      }
    } else {
      // General Armored Shoulder / Body Slam
      if (isWindup) {
        if (this.j.head) this.j.head.position.z = 1.0 - t * 0.5;
        if (this.j.jaw) this.j.jaw.rotation.x = t * 0.9;
      } else if (isStrike) {
        if (this.j.head) this.j.head.position.z = 0.5 + t * 1.6;
        if (this.j.jaw) this.j.jaw.rotation.x = Math.max(0, 0.9 * (1 - t * 2.2));
      } else {
        if (this.j.head) this.j.head.position.z = 1.0;
        if (this.j.jaw) this.j.jaw.rotation.x = 0;
      }
    }
  }

  /**
   * MID ATTACK WITH CHARGING DOUBLE-STOMP FOOTWORK
   */
  animateAttackMid(p, horizSpeed = 0, isMoving = false) {
    const isWindup = p < 0.40;
    const isStrike = p >= 0.40 && p <= 0.72;
    const t = isWindup ? p / 0.40 : isStrike ? (p - 0.40) / 0.32 : (p - 0.72) / 0.28;

    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : (this.isQuadruped ? 2.7 : 3.0);
    const bLeftLegY = this.basePositions.leftLeg ? this.basePositions.leftLeg.y : 2.9;
    const bRightLegY = this.basePositions.rightLeg ? this.basePositions.rightLeg.y : 2.9;

    // Double Stomp Cadence
    if (p >= 0.35 && this.attackFootstepPhase === 0) {
      this.attackFootstepPhase = 1;
      if (this.onFootstep) this.onFootstep();
    } else if (p >= 0.62 && this.attackFootstepPhase === 1) {
      this.attackFootstepPhase = 2;
      if (this.onFootstep) this.onFootstep();
    }

    // Heavy Charging Stepping Footwork
    if (!this.isQuadruped) {
      if (isWindup) {
        // Step 1: Left leg strides forward
        if (this.j.leftLeg) {
          this.j.leftLeg.rotation.x = t * 0.75;
          this.j.leftLeg.position.y = bLeftLegY + Math.sin(t * Math.PI) * 0.35;
        }
        if (this.j.rightLeg) this.j.rightLeg.rotation.x = -t * 0.45;
        if (this.j.torso) this.j.torso.position.z = t * 0.8;
      } else if (isStrike) {
        // Step 2: Right leg drives through and slams down
        if (this.j.leftLeg) this.j.leftLeg.rotation.x = 0.75 - t * 1.35;
        if (this.j.rightLeg) {
          this.j.rightLeg.rotation.x = -0.45 + t * 1.45;
          this.j.rightLeg.position.y = bRightLegY + Math.sin(t * Math.PI) * 0.40;
        }
        if (this.j.torso) this.j.torso.position.z = 0.8 + t * 1.8;
      } else {
        // Recovery
        if (this.j.leftLeg) this.j.leftLeg.rotation.x = -0.6 * (1 - t);
        if (this.j.rightLeg) {
          this.j.rightLeg.rotation.x = 1.0 * (1 - t);
          this.j.rightLeg.position.y = bRightLegY;
        }
        if (this.j.torso) this.j.torso.position.z = 2.6 * (1 - t);
      }
    } else {
      // Quadruped Horn Battering Ram footwork
      const gallop = Math.sin(p * Math.PI * 4);
      if (this.j.frontLegL) this.j.frontLegL.rotation.x = gallop * 0.6;
      if (this.j.frontLegR) this.j.frontLegR.rotation.x = -gallop * 0.6;
      if (this.j.leftLeg) this.j.leftLeg.rotation.x = -gallop * 0.55;
      if (this.j.rightLeg) this.j.rightLeg.rotation.x = gallop * 0.55;
      if (this.j.torso) this.j.torso.position.z = Math.sin(p * Math.PI) * 2.2;
    }

    // Torso / Head Collision impact
    if (this.dinoType === 'trex') {
      if (isWindup) {
        if (this.j.torso) { this.j.torso.rotation.z = -t * 0.45; this.j.torso.position.x = -t * 0.7; }
      } else if (isStrike) {
        if (this.j.torso) { this.j.torso.rotation.z = -0.45 + t * 0.95; this.j.torso.position.x = -0.7 + t * 1.8; }
      } else {
        if (this.j.torso) { this.j.torso.rotation.z = 0.50 * (1 - t); this.j.torso.position.x = 1.1 * (1 - t); }
      }
    } else if (this.dinoType === 'triceratops') {
      if (this.j.head) {
        this.j.head.rotation.x = 0.45;
        this.j.head.position.z = 1.0 + Math.sin(p * Math.PI) * 1.8;
      }
    }
  }

  /**
   * LONG ATTACK: Apex Leaping Pounce or Locomotive Horn Charge
   */
  animateAttackLong(p, horizSpeed = 0, isMoving = false) {
    const isWindup = p < 0.38;
    const isStrike = p >= 0.38 && p <= 0.75;
    const t = isWindup ? p / 0.38 : isStrike ? (p - 0.38) / 0.37 : (p - 0.75) / 0.25;

    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;
    const bLeftLegY = this.basePositions.leftLeg ? this.basePositions.leftLeg.y : 2.9;
    const bRightLegY = this.basePositions.rightLeg ? this.basePositions.rightLeg.y : 2.9;

    if (!this.isQuadruped) {
      // Apex Leaping Pounce: Deep crouch spring -> Mid-air propulsion -> Heavy dual-foot landing
      if (isWindup) {
        if (this.j.torso) { this.j.torso.position.y = bTorsoY - t * 0.9; this.j.torso.rotation.x = t * 0.35; }
        if (this.j.head) this.j.head.position.z = 1.0 - t * 0.8;
        if (this.j.jaw) this.j.jaw.rotation.x = t * 1.25;
        if (this.j.leftLeg) { this.j.leftLeg.rotation.x = -t * 0.55; this.j.leftLeg.position.y = bLeftLegY - t * 0.25; }
        if (this.j.rightLeg) { this.j.rightLeg.rotation.x = -t * 0.55; this.j.rightLeg.position.y = bRightLegY - t * 0.25; }
      } else if (isStrike) {
        const jumpArc = Math.sin(t * Math.PI);
        if (this.j.torso) {
          this.j.torso.position.y = bTorsoY - 0.9 + jumpArc * 2.2;
          this.j.torso.position.z = t * 3.6;
        }
        // Legs extend powerfully behind during mid-air leap
        if (this.j.leftLeg) this.j.leftLeg.rotation.x = -0.55 - t * 0.45;
        if (this.j.rightLeg) this.j.rightLeg.rotation.x = -0.55 - t * 0.45;
        if (this.j.head) { this.j.head.position.z = 0.2 + t * 2.4; this.j.head.rotation.x = -0.3; }
        if (this.j.jaw) this.j.jaw.rotation.x = Math.max(0, 1.25 * (1 - t * 2.5));

        if (t > 0.85 && !this.attackFootstepTriggered) {
          this.attackFootstepTriggered = true;
          if (this.onFootstep) this.onFootstep();
        }
      } else {
        // Heavy landing impact
        if (this.j.torso) {
          this.j.torso.position.y = bTorsoY;
          this.j.torso.position.z = 3.6 * (1 - t);
        }
        if (this.j.leftLeg) { this.j.leftLeg.rotation.x = 0; this.j.leftLeg.position.y = bLeftLegY; }
        if (this.j.rightLeg) { this.j.rightLeg.rotation.x = 0; this.j.rightLeg.position.y = bRightLegY; }
        if (this.j.head) this.j.head.position.z = 1.0;
      }
    } else {
      // Quadruped Locomotive Galloping Charge
      const gallopRate = Math.sin(p * Math.PI * 6);
      if (this.j.frontLegL) this.j.frontLegL.rotation.x = gallopRate * 0.75;
      if (this.j.frontLegR) this.j.frontLegR.rotation.x = -gallopRate * 0.75;
      if (this.j.leftLeg) this.j.leftLeg.rotation.x = -gallopRate * 0.7;
      if (this.j.rightLeg) this.j.rightLeg.rotation.x = gallopRate * 0.7;
      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY + Math.abs(gallopRate) * 0.35;
        this.j.torso.position.z = (p < 0.75 ? p / 0.75 : 1 - (p - 0.75) / 0.25) * 4.0;
      }
      if (this.j.head) {
        this.j.head.rotation.x = 0.45;
        this.j.head.position.z = 1.0 + Math.sin(p * Math.PI) * 1.6;
      }
      const gPhase = Math.floor(p * 6);
      if (gPhase !== this.attackFootstepPhase) {
        this.attackFootstepPhase = gPhase;
        if (this.onFootstep) this.onFootstep();
      }
    }
  }

  /**
   * SPECIAL HEAVY ATTACK: Rotational Tail Whip with Pivoting Footwork
   */
  animateAttackSpecial(p, horizSpeed = 0, isMoving = false) {
    const isWindup = p < 0.30;
    const isStrike = p >= 0.30 && p <= 0.70;
    const t = isWindup ? p / 0.30 : isStrike ? (p - 0.30) / 0.40 : (p - 0.70) / 0.30;

    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;
    const bRightLegY = this.basePositions.rightLeg ? this.basePositions.rightLeg.y : 2.9;

    // Rotational Footwork: Pivot foot digs in, trailing foot sweeps in arc
    if (isWindup) {
      if (this.j.leftLeg) { this.j.leftLeg.rotation.y = t * 0.65; this.j.leftLeg.rotation.x = t * 0.3; }
      if (this.j.rightLeg) { this.j.rightLeg.rotation.y = -t * 0.45; this.j.rightLeg.rotation.x = -t * 0.4; }
      if (this.j.torso) { this.j.torso.rotation.y = -t * 0.8; }
      if (this.j.tail1) { this.j.tail1.rotation.y = t * 0.9; }
    } else if (isStrike) {
      // Violent 180° hip & tail sweep
      if (this.j.leftLeg) this.j.leftLeg.rotation.y = 0.65 - t * 1.5;
      if (this.j.rightLeg) {
        this.j.rightLeg.rotation.x = -0.4 + Math.sin(t * Math.PI) * 0.85;
        this.j.rightLeg.position.y = bRightLegY + Math.sin(t * Math.PI) * 0.38;
      }
      if (this.j.torso) this.j.torso.rotation.y = -0.8 + t * 2.2;
      if (this.j.tail1) this.j.tail1.rotation.y = 0.9 - t * 2.8;
      if (this.j.tail2) this.j.tail2.rotation.y = 1.2 - t * 3.4;

      if (t > 0.5 && !this.attackFootstepTriggered) {
        this.attackFootstepTriggered = true;
        if (this.onFootstep) this.onFootstep();
      }
    } else {
      // Stance recovery
      if (this.j.leftLeg) this.j.leftLeg.rotation.set(0, 0, 0);
      if (this.j.rightLeg) {
        this.j.rightLeg.rotation.set(0, 0, 0);
        this.j.rightLeg.position.y = bRightLegY;
      }
      if (this.j.torso) this.j.torso.rotation.y = 1.4 * (1 - t);
      if (this.j.tail1) this.j.tail1.rotation.y = -1.9 * (1 - t);
      if (this.j.tail2) this.j.tail2.rotation.y = -2.2 * (1 - t);
    }
  }

  animateRoar(p) {
    const rear = Math.sin(p * Math.PI);
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;

    // Lead foot stomps forward and plants
    if (this.j.leftLeg) this.j.leftLeg.rotation.x = rear * 0.45;
    if (this.j.rightLeg) this.j.rightLeg.rotation.x = -rear * 0.35;
    if (this.j.torso) {
      this.j.torso.position.y = bTorsoY + rear * 0.45;
      this.j.torso.rotation.x = -rear * 0.35;
    }
    if (this.j.neck) this.j.neck.rotation.x = -rear * 0.65;
    if (this.j.head) {
      this.j.head.rotation.x = -rear * 0.85;
      this.j.head.position.y = (this.basePositions.head ? this.basePositions.head.y : 0.2) + rear * 0.7;
    }
    if (this.j.jaw) this.j.jaw.rotation.x = rear * 1.15;
  }

  animateHit(p) {
    const recoil = Math.sin(p * Math.PI);
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;

    // Dramatic full-body stagger & whiplash
    if (this.j.torso) {
      this.j.torso.position.y = bTorsoY - recoil * 0.35;
      this.j.torso.rotation.x = -recoil * 0.55;
      this.j.torso.rotation.z = recoil * 0.35;
    }
    if (this.j.neck) {
      this.j.neck.rotation.x = -recoil * 0.65;
    }
    if (this.j.head) {
      this.j.head.rotation.x = -recoil * 0.95;
      this.j.head.rotation.y = -recoil * 0.45;
      this.j.head.position.y = (this.basePositions.head ? this.basePositions.head.y : 0.2) + recoil * 0.45;
    }
    // Visceral open mouth gasp on impact
    if (this.j.jaw) {
      this.j.jaw.rotation.x = Math.max(0, recoil * 1.35);
    }
    // Violent counter-balance tail lashing
    if (this.j.tail1) this.j.tail1.rotation.y = recoil * 0.85;
    if (this.j.tail2) this.j.tail2.rotation.y = recoil * 1.25;

    // Stumbling feet shudder
    if (this.j.leftLeg) this.j.leftLeg.rotation.x = -recoil * 0.45;
    if (this.j.rightLeg) this.j.rightLeg.rotation.x = recoil * 0.45;
  }

  animateSpecialBreath(p) {
    const isWindup = p < 0.25;
    const isBlast = p >= 0.25 && p <= 0.80;
    const t = isWindup ? p / 0.25 : isBlast ? (p - 0.25) / 0.55 : (p - 0.80) / 0.20;
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;

    if (isWindup) {
      // Deep inhalation: chest expands, neck pulls back, jaw gapes open
      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY + t * 0.35;
        this.j.torso.rotation.x = -t * 0.35;
        this.j.torso.scale.set(1 + t * 0.15, 1 + t * 0.2, 1 + t * 0.15);
      }
      if (this.j.neck) this.j.neck.rotation.x = -t * 0.55;
      if (this.j.head) {
        this.j.head.rotation.x = -t * 0.75;
        this.j.head.position.y = (this.basePositions.head ? this.basePositions.head.y : 0.2) + t * 0.5;
      }
      if (this.j.jaw) this.j.jaw.rotation.x = t * 1.45;
    } else if (isBlast) {
      // Roaring sustained elemental exhalation: mouth wide open, chest vibrating
      const tremor = Math.sin(p * Math.PI * 24) * 0.04;
      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY + 0.15 + tremor;
        this.j.torso.rotation.x = -0.15 + tremor;
      }
      if (this.j.neck) this.j.neck.rotation.x = -0.35;
      if (this.j.head) {
        this.j.head.rotation.x = 0.15 + tremor;
        this.j.head.position.z = (this.basePositions.head ? this.basePositions.head.z : 1.0) + 0.6;
      }
      if (this.j.jaw) this.j.jaw.rotation.x = 1.45;
      if (this.j.tail1) this.j.tail1.rotation.y = Math.sin(p * Math.PI * 4) * 0.45;
    } else {
      // Return to stance
      if (this.j.jaw) this.j.jaw.rotation.x = 1.45 * (1 - t);
      if (this.j.head) this.j.head.position.z = (this.basePositions.head ? this.basePositions.head.z : 1.0) + 0.6 * (1 - t);
    }
  }

  animateTitanStomp(p) {
    const isRear = p < 0.45;
    const isSlam = p >= 0.45 && p <= 0.75;
    const t = isRear ? p / 0.45 : isSlam ? (p - 0.45) / 0.30 : (p - 0.75) / 0.25;
    const bTorsoY = this.basePositions.torso ? this.basePositions.torso.y : 3.0;

    if (isRear) {
      // Rears up to massive height
      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY + t * 1.6;
        this.j.torso.rotation.x = -t * 0.65;
      }
      if (this.j.head) this.j.head.rotation.x = -t * 0.55;
      if (this.j.frontLegL) this.j.frontLegL.rotation.x = -t * 0.85;
      if (this.j.frontLegR) this.j.frontLegR.rotation.x = -t * 0.85;
      if (this.j.leftLeg) this.j.leftLeg.rotation.x = t * 0.35;
      if (this.j.rightLeg) this.j.rightLeg.rotation.x = t * 0.35;
      if (this.j.tail1) this.j.tail1.rotation.x = -t * 0.45;
    } else if (isSlam) {
      // Earth-shattering slam down
      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY + 1.6 - t * 2.2;
        this.j.torso.rotation.x = -0.65 + t * 0.85;
      }
      if (this.j.frontLegL) this.j.frontLegL.rotation.x = -0.85 + t * 1.2;
      if (this.j.frontLegR) this.j.frontLegR.rotation.x = -0.85 + t * 1.2;
      if (this.j.head) this.j.head.rotation.x = 0.45;
      if (this.j.jaw) this.j.jaw.rotation.x = Math.sin(t * Math.PI) * 1.2;
    } else {
      // Ground recovery
      if (this.j.torso) {
        this.j.torso.position.y = bTorsoY - 0.6 * (1 - t);
        this.j.torso.rotation.x = 0.2 * (1 - t);
      }
      if (this.j.jaw) this.j.jaw.rotation.x = 0;
    }
  }

  resetPose() {
    if (this.j.root) this.j.root.rotation.set(0, 0, 0);
    ['torso', 'neck', 'head', 'jaw', 'tail1', 'tail2', 'leftLeg', 'rightLeg', 'frontLegL', 'frontLegR', 'armL', 'armR'].forEach((k) => {
      if (this.j[k]) {
        this.j[k].rotation.set(0, 0, 0);
        this.j[k].scale.set(1, 1, 1);
        if (this.basePositions[k]) {
          this.j[k].position.copy(this.basePositions[k]);
        }
      }
    });
  }
}
