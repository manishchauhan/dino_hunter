import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  ARENA_RADIUS,
  DINO_STATS,
  DINO_TYPES,
  COLLISION_GROUPS,
  MIN_DINO_SEPARATION,
  DISTANCE_ATTACKS,
  SLIDE_STAMINA_COST,
  JUMP_STAMINA_COST
} from '../constants.js';
import { TRexModel } from './TRexModel.js';
import { TriceratopsModel } from './TriceratopsModel.js';
import { SpinosaurusModel } from './SpinosaurusModel.js';
import { AnkylosaurusModel } from './AnkylosaurusModel.js';
import { ModularDinosaurModel } from './ModularDinosaurModel.js';
import { DinosaurAnimator } from './DinosaurAnimator.js';
import { DinosaurRagdoll } from '../physics/DinosaurRagdoll.js';

export class BaseDinosaur {
  constructor(type, physicsWorld, scene, audio, particles, isPlayer = false) {
    this.type = type;
    this.stats = { ...DINO_STATS[type] };
    this.physicsWorld = physicsWorld;
    this.scene = scene;
    this.audio = audio;
    this.particles = particles;
    this.isPlayer = isPlayer;

    this.health = this.stats.maxHealth;
    this.stamina = this.stats.maxStamina;
    this.isDead = false;
    this.isKnockedDown = false;
    this.knockdownTimer = 0;
    this.stunTimer = 0;
    this.attackCooldownTimer = 0;
    this.specialCooldownTimer = 0;
    this.currentRotation = 0;

    // Evasion & Defensive State
    this.isInvulnerable = false;
    this.slideTimer = 0;
    this.isBlocking = false;
    this.currentAttackData = null;
    this.knockbackVelocity = new THREE.Vector3(0, 0, 0);
    this.targetDino = null;

    this.buildModel();
    this.buildPhysicsBody();

    this.ragdoll = new DinosaurRagdoll(this.joints, this.type);

    this.animator = new DinosaurAnimator(this.joints, () => {
      this.audio.playFootstep();
      this.particles.spawnFootstepDust(this.getPosition());
    }, this.type);
  }

  buildModel() {
    const { mesh, joints } = ModularDinosaurModel.build(this.type, this.stats.color);
    this.mesh = mesh;
    this.mesh.rotation.order = 'YXZ';
    joints.root = mesh;
    this.joints = joints;
    this.scene.add(this.mesh);
  }

  buildPhysicsBody() {
    this.body = new CANNON.Body({
      mass: this.stats.mass,
      material: this.physicsWorld.dinoMaterial,
      fixedRotation: true,
      linearDamping: 0.15,
      angularDamping: 0.99
    });
    this.body.addShape(new CANNON.Box(new CANNON.Vec3(1.3, 1.8, 1.9)), new CANNON.Vec3(0, 0, 0));
    this.body.addShape(new CANNON.Sphere(1.2), new CANNON.Vec3(0, 0.4, 2.3));
    this.body.addShape(new CANNON.Sphere(1.05), new CANNON.Vec3(0, 0, -2.3));
    this.body.collisionFilterGroup = COLLISION_GROUPS.DINOSAUR;
    this.body.collisionFilterMask = COLLISION_GROUPS.ARENA | COLLISION_GROUPS.DINOSAUR;
    this.physicsWorld.world.addBody(this.body);
  }

  setPosition(x, z, rotationY = 0) {
    this.body.position.set(x, 1.8, z);
    this.body.velocity.set(0, 0, 0);
    this.knockbackVelocity.set(0, 0, 0);
    this.currentRotation = rotationY;
    this.body.quaternion.setFromEuler(0, rotationY, 0);
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = rotationY;
  }

  getPosition() {
    return this.mesh.position;
  }

  getRotation() {
    return this.currentRotation;
  }

  isGrounded() {
    return this.body.position.y <= 1.86;
  }

  applyDirectionalMovement(dirX, dirZ, isSprinting, delta) {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.slideTimer > 0 || this.knockbackVelocity.length() > 3.0) return;
    const len = Math.hypot(dirX, dirZ);
    const isAttacking = this.animator.state.startsWith('attack');

    if (len > 0.05 && !isAttacking) {
      const targetAngle = Math.atan2(dirX, dirZ);
      let diff = targetAngle - this.currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.currentRotation += Math.sign(diff) * Math.min(Math.abs(diff), this.stats.turnSpeed * 3.8 * delta);
      this.mesh.rotation.y = this.currentRotation;

      let speed = isSprinting ? this.stats.sprintSpeed : this.stats.speed;
      if (this.isBlocking) speed *= 0.35; // Slow crawl while guarding

      if (isSprinting && !this.isBlocking && this.stamina > 5) {
        this.stamina = Math.max(0, this.stamina - 12 * delta);
      }
      this.body.velocity.x = Math.sin(this.currentRotation) * speed;
      this.body.velocity.z = Math.cos(this.currentRotation) * speed;
    } else if (isAttacking && this.currentAttackData) {
      const lunge = this.currentAttackData.lungeSpeed || this.stats.attackLungeSpeed;
      this.body.velocity.x = Math.sin(this.currentRotation) * lunge;
      this.body.velocity.z = Math.cos(this.currentRotation) * lunge;
    } else {
      // Natural grounded traction: Multi-ton dinosaur plants feet firmly
      this.body.velocity.x *= 0.42;
      this.body.velocity.z *= 0.42;
      if (Math.hypot(this.body.velocity.x, this.body.velocity.z) < 0.2) {
        this.body.velocity.x = 0;
        this.body.velocity.z = 0;
      }
    }
  }

  /**
   * Pro Combat Movement: Moves along (moveDirX, moveDirZ) while keeping head/body aimed at desiredFaceAngle
   * Enables master-tier circle strafing, backpedaling, sidesteps, and precision lunges!
   */
  applyCombatMovement(moveDirX, moveDirZ, desiredFaceAngle, isSprinting, delta) {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.slideTimer > 0 || this.knockbackVelocity.length() > 3.0) return;

    if (desiredFaceAngle !== null && desiredFaceAngle !== undefined) {
      let diff = desiredFaceAngle - this.currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.currentRotation += Math.sign(diff) * Math.min(Math.abs(diff), this.stats.turnSpeed * 5.2 * delta);
      this.mesh.rotation.y = this.currentRotation;
    }

    const isAttacking = this.animator.state.startsWith('attack');
    if (isAttacking && this.currentAttackData) {
      const lunge = this.currentAttackData.lungeSpeed || this.stats.attackLungeSpeed;
      this.body.velocity.x = Math.sin(this.currentRotation) * lunge;
      this.body.velocity.z = Math.cos(this.currentRotation) * lunge;
      return;
    }

    const moveLen = Math.hypot(moveDirX, moveDirZ);
    if (moveLen > 0.05) {
      const normX = moveDirX / moveLen;
      const normZ = moveDirZ / moveLen;

      let speed = isSprinting ? this.stats.sprintSpeed : this.stats.speed;
      if (this.isBlocking) speed *= 0.35;

      if (isSprinting && !this.isBlocking && this.stamina > 5) {
        this.stamina = Math.max(0, this.stamina - 12 * delta);
      }

      this.body.velocity.x = normX * speed;
      this.body.velocity.z = normZ * speed;
    } else {
      // Natural traction on prehistoric dirt floor
      this.body.velocity.x *= 0.42;
      this.body.velocity.z *= 0.42;
      if (Math.hypot(this.body.velocity.x, this.body.velocity.z) < 0.2) {
        this.body.velocity.x = 0;
        this.body.velocity.z = 0;
      }
    }
  }

  applyMovement(forwardInput, turnInput, isSprinting, delta) {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.slideTimer > 0 || this.knockbackVelocity.length() > 3.0) return;
    if (turnInput !== 0) {
      this.currentRotation += turnInput * this.stats.turnSpeed * delta;
      this.mesh.rotation.y = this.currentRotation;
    }
    const isAttacking = this.animator.state.startsWith('attack');
    if (forwardInput !== 0 || isAttacking) {
      let speed = isAttacking
        ? (this.currentAttackData ? this.currentAttackData.lungeSpeed : this.stats.attackLungeSpeed)
        : this.stats.speed;

      if (!isAttacking && isSprinting && !this.isBlocking && this.stamina > 5) {
        speed = this.stats.sprintSpeed;
        this.stamina = Math.max(0, this.stamina - 10 * delta);
      }
      if (this.isBlocking) speed *= 0.35;

      const force = isAttacking ? speed : speed * forwardInput;
      this.body.velocity.x = Math.sin(this.currentRotation) * force;
      this.body.velocity.z = Math.cos(this.currentRotation) * force;
    } else {
      this.body.velocity.x *= 0.42;
      this.body.velocity.z *= 0.42;
      if (Math.hypot(this.body.velocity.x, this.body.velocity.z) < 0.2) {
        this.body.velocity.x = 0;
        this.body.velocity.z = 0;
      }
    }
  }

  /**
   * Strict Physical Collision & Body Separation Solver
   * Prevents dinosaurs from walking inside each other or stepping on fallen carcasses.
   * If one is dead or knocked down, it behaves like an immovable solid physical boulder.
   */
  resolveOverlap(otherDino) {
    if (!otherDino) return;
    const isThisGroundedCarcass = this.isDead || this.isKnockedDown;
    const isOtherGroundedCarcass = otherDino.isDead || otherDino.isKnockedDown;

    const dx = this.body.position.x - otherDino.body.position.x;
    const dz = this.body.position.z - otherDino.body.position.z;
    const dist = Math.hypot(dx, dz);

    const minSep = Math.max(MIN_DINO_SEPARATION, 4.8);
    if (dist < minSep) {
      const overlap = minSep - (dist > 0.001 ? dist : 0.001);
      const nx = dist > 0.001 ? dx / dist : Math.sin(this.currentRotation);
      const nz = dist > 0.001 ? dz / dist : Math.cos(this.currentRotation);

      if (isThisGroundedCarcass && !isOtherGroundedCarcass) {
        // This is down/dead on floor: other standing dinosaur is physically pushed out
        otherDino.body.position.x -= nx * overlap;
        otherDino.body.position.z -= nz * overlap;
      } else if (!isThisGroundedCarcass && isOtherGroundedCarcass) {
        // Other is down/dead on floor: this standing dinosaur is physically pushed out
        this.body.position.x += nx * overlap;
        this.body.position.z += nz * overlap;
      } else {
        // Both standing or both down: equal mutual separation
        this.body.position.x += nx * overlap * 0.52;
        this.body.position.z += nz * overlap * 0.52;
        otherDino.body.position.x -= nx * overlap * 0.52;
        otherDino.body.position.z -= nz * overlap * 0.52;
      }

      // Completely cancel velocities directed into each other
      const dot =
        (this.body.velocity.x - otherDino.body.velocity.x) * nx +
        (this.body.velocity.z - otherDino.body.velocity.z) * nz;
      if (dot < 0) {
        if (!isThisGroundedCarcass) {
          this.body.velocity.x -= dot * nx * 0.65;
          this.body.velocity.z -= dot * nz * 0.65;
        }
        if (!isOtherGroundedCarcass) {
          otherDino.body.velocity.x += dot * nx * 0.65;
          otherDino.body.velocity.z += dot * nz * 0.65;
        }
      }
    }
  }

  setTarget(targetDino) {
    this.targetDino = targetDino;
  }

  alignToTarget(targetDino, rate = 0.55) {
    if (!targetDino) return;
    const dx = targetDino.getPosition().x - this.getPosition().x;
    const dz = targetDino.getPosition().z - this.getPosition().z;
    if (Math.hypot(dx, dz) < 24) {
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - this.currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.currentRotation += Math.sign(diff) * Math.min(Math.abs(diff), Math.abs(diff) * rate);
      this.mesh.rotation.y = this.currentRotation;
    }
  }

  /**
   * Distance-Based Contextual Attack (bite, push, horn gore, pounce, etc.)
   */
  triggerContextualAttack(targetDino = null, forceBigAttack = false) {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.attackCooldownTimer > 0) return null;

    let dist = 3.5;
    if (targetDino) {
      const p1 = this.getPosition();
      const p2 = targetDino.getPosition();
      dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      this.alignToTarget(targetDino);
    }

    const attacks = DISTANCE_ATTACKS[this.type] || DISTANCE_ATTACKS[DINO_TYPES.TREX];
    let selected = attacks.close;
    let animName = 'attack_close';
    let duration = 0.52;

    if (forceBigAttack || dist > 8.5) {
      selected = attacks.long;
      animName = 'attack_long';
      duration = selected.windup + selected.active + selected.recovery;
    } else if (dist <= 4.5) {
      selected = attacks.close;
      animName = 'attack_close';
      duration = selected.windup + selected.active + selected.recovery;
    } else {
      selected = attacks.mid;
      animName = 'attack_mid';
      duration = selected.windup + selected.active + selected.recovery;
    }

    if (this.stamina < selected.staminaCost) {
      // Fallback to close if not enough stamina
      selected = attacks.close;
      animName = 'attack_close';
      duration = 0.5;
    } else {
      this.stamina -= selected.staminaCost;
    }

    this.currentAttackData = selected;
    this.attackCooldownTimer = this.stats.attackCooldown;
    this.animator.playAction(animName, duration, selected);

    if (selected.type === 'bite') this.audio.playBite();
    else if (selected.type === 'horn' || selected.type === 'charge') this.audio.playHeavyHit(false);
    else this.audio.playWhiff();

    return selected;
  }

  // Compatible aliases
  triggerAttack1(targetDino = null) {
    return this.triggerContextualAttack(targetDino);
  }

  triggerAttack2(targetDino = null) {
    if (
      this.isDead ||
      this.stunTimer > 0 ||
      this.isKnockedDown ||
      this.specialCooldownTimer > 0 ||
      this.stamina < this.stats.specialStaminaCost
    ) {
      return false;
    }
    this.alignToTarget(targetDino);
    this.stamina -= this.stats.specialStaminaCost;
    this.specialCooldownTimer = this.stats.specialCooldown;

    const specialData = {
      name: this.stats.specialName,
      damage: this.stats.specialDamage,
      range: this.stats.attackRange * 1.35,
      isSpecial: true,
      lungeSpeed: this.stats.specialLunge || 15
    };
    this.currentAttackData = specialData;
    this.animator.playAction('attack2', 0.8, specialData);
    this.audio.playHeavyHit(true);
    return specialData;
  }

  /**
   * Evasive Ground Slide (I-Frames dodge under attacks)
   */
  triggerSlide() {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.slideTimer > 0 || this.stamina < SLIDE_STAMINA_COST) {
      return false;
    }
    this.stamina -= SLIDE_STAMINA_COST;
    this.slideTimer = 0.45;
    this.isInvulnerable = true;

    // Strong kinetic burst slide
    const slideSpeed = this.stats.sprintSpeed * 1.25;
    this.body.velocity.x = Math.sin(this.currentRotation) * slideSpeed;
    this.body.velocity.z = Math.cos(this.currentRotation) * slideSpeed;

    this.animator.playAction('slide', 0.45);
    this.audio.playWhiff();
    this.particles.spawnSlidingDust(this.getPosition());
    return true;
  }

  /**
   * Jump / Leap into air
   */
  triggerJump() {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || !this.isGrounded() || this.stamina < JUMP_STAMINA_COST) {
      return false;
    }
    this.stamina -= JUMP_STAMINA_COST;
    this.body.velocity.y = 12.5; // Jump vertical impulse
    this.animator.playAction('jump', 0.65);
    this.audio.playFootstep();
    this.particles.spawnFootstepDust(this.getPosition());
    return true;
  }

  /**
   * Defensive Shield Guard / Block
   */
  setBlocking(blockActive) {
    if (this.isDead || this.isKnockedDown) {
      this.isBlocking = false;
      return;
    }
    this.isBlocking = blockActive;
    if (blockActive) {
      this.animator.playAction('block', 999);
    } else if (this.animator.state === 'block') {
      this.animator.resetPose();
      this.animator.state = 'idle';
    }
  }

  triggerRoar() {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.stamina < this.stats.roarStaminaCost) return false;
    this.stamina -= this.stats.roarStaminaCost;
    this.animator.playAction('roar', 0.85);
    this.audio.playRoar(this.type === DINO_TYPES.TREX || this.type === DINO_TYPES.SPINOSAURUS);
    this.particles.spawnRoarShockwave(this.getPosition(), this.stats.accentColor);
    return true;
  }

  takeDamage(amount, knockbackDir = null, knockbackForce = 10) {
    if (this.isDead) return { result: 'dead', damage: 0 };

    // Invulnerability frames during slide dodge
    if (this.isInvulnerable) {
      this.particles.spawnSlidingDust(this.getPosition());
      return { result: 'evaded', damage: 0 };
    }

    // Defensive Guard absorbs 75% damage and negates knockdown
    if (this.isBlocking) {
      const blockedAmount = Math.round(amount * 0.25);
      this.health = Math.max(0, this.health - blockedAmount);
      this.stamina = Math.max(0, this.stamina - 15);
      this.audio.playHeavyHit(false);
      this.particles.spawnHitParticles(this.getPosition(), false);
      if (this.health <= 0) this.die();
      return { result: 'blocked', damage: blockedAmount };
    }

    // Normal hit with authentic impact displacement
    this.health = Math.max(0, this.health - amount);
    this.stunTimer = 0.30;
    if (!this.isKnockedDown) this.animator.playAction('hit', 0.28);

    if (knockbackDir) {
      // Natural heavy impact stagger displacement (skidding 1.2 - 2.2 meters on dirt)
      const pushSpeed = Math.min(Math.max(knockbackForce, 6) * 0.85, 11.0);
      this.knockbackVelocity.set(knockbackDir.x * pushSpeed, 0, knockbackDir.z * pushSpeed);
      this.body.velocity.x = this.knockbackVelocity.x;
      this.body.velocity.z = this.knockbackVelocity.z;
      this.body.velocity.y = Math.min(this.body.velocity.y + 0.8, 1.4);
      this.particles.spawnSlidingDust(this.getPosition());
    }

    if (this.health <= 0) this.die();
    return { result: 'hit', damage: amount };
  }

  knockdown(knockbackDir, force = 22, duration = 1.35) {
    if (this.isDead || this.isBlocking || this.isInvulnerable) return;
    this.isKnockedDown = true;
    this.knockdownTimer = duration;

    // Natural heavyweight knockdown tumble displacement (skidding 2.5 - 3.8 meters)
    const kdSpeed = Math.min(Math.max(force, 12) * 0.95, 14.5);
    if (knockbackDir) {
      this.knockbackVelocity.set(knockbackDir.x * kdSpeed, 0, knockbackDir.z * kdSpeed);
      this.body.velocity.x = this.knockbackVelocity.x;
      this.body.velocity.z = this.knockbackVelocity.z;
      this.body.velocity.y = 2.2;
      this.particles.spawnSlidingDust(this.getPosition());
    }

    // Activate authentic physics ragdoll!
    this.ragdoll.activate(knockbackDir, force, false);
  }

  die() {
    this.isDead = true;
    this.health = 0;
    this.ragdoll.activate(null, 16, true);
    this.audio.playCrowdCheer();
  }

  update(delta) {
    // 1. Strict Arena Floor Protection: Hard constraint prevents penetrating below floor
    if (this.body.position.y < 1.8) {
      this.body.position.y = 1.8;
      if (this.body.velocity.y < 0) this.body.velocity.y = 0;
    }

    // 2. Colosseum Perimeter Wall Bounce & Clamping
    const distFromCenter = Math.hypot(this.body.position.x, this.body.position.z);
    if (distFromCenter > ARENA_RADIUS - 2.5) {
      const angle = Math.atan2(this.body.position.x, this.body.position.z);
      this.body.position.x = Math.sin(angle) * (ARENA_RADIUS - 2.5);
      this.body.position.z = Math.cos(angle) * (ARENA_RADIUS - 2.5);
      this.body.velocity.x *= -0.35;
      this.body.velocity.z *= -0.35;
      this.knockbackVelocity.multiplyScalar(0.2);
      this.audio.playHeavyHit(false);
      this.particles.spawnHitParticles(this.getPosition(), false);
    }

    // 3. Sustained Kinetic Slide Simulation (natural soil ground friction)
    if (this.knockbackVelocity.lengthSq() > 0.01) {
      this.body.velocity.x = THREE.MathUtils.lerp(this.body.velocity.x, this.knockbackVelocity.x, 0.65);
      this.body.velocity.z = THREE.MathUtils.lerp(this.body.velocity.z, this.knockbackVelocity.z, 0.65);
      const frictionFactor = Math.pow(this.isKnockedDown ? 0.04 : 0.015, delta);
      this.knockbackVelocity.multiplyScalar(frictionFactor);

      if (this.knockbackVelocity.length() > 2.0) {
        this.particles.spawnSlidingDust(this.getPosition());
      }
      if (this.knockbackVelocity.length() < 0.25) {
        this.knockbackVelocity.set(0, 0, 0);
      }
    }

    // 4. Mesh Position & Floor Resting Elevation during Ragdoll / Knockdown / Death
    let floorLift = 0;
    if (this.ragdoll.isActive) {
      const roll = Math.abs(this.ragdoll.nodes.root.rot.z);
      const pitch = Math.abs(this.ragdoll.nodes.root.rot.x);
      // Lift mesh origin so fallen dinosaur side rests cleanly on the floor surface
      floorLift = Math.sin(Math.min(Math.PI / 2, roll)) * 1.45 + Math.sin(Math.min(Math.PI / 2, pitch)) * 0.4;
    }

    this.mesh.position.x = this.body.position.x;
    this.mesh.position.y = Math.max(0, this.body.position.y - 1.8) + floorLift;
    this.mesh.position.z = this.body.position.z;
    this.mesh.rotation.y = this.currentRotation;
    this.body.quaternion.setFromEuler(0, this.currentRotation, 0);

    // Smooth dynamic tracking during attack windup so strikes connect cleanly
    const isAttacking = this.animator.state.startsWith('attack');
    if (isAttacking && this.animator.actionDuration > 0 && this.targetDino && !this.targetDino.isDead) {
      const p = this.animator.actionTimer / this.animator.actionDuration;
      if (p < 0.42) {
        this.alignToTarget(this.targetDino, 0.45);
      }
    }

    // Evasion & slide timing
    if (this.slideTimer > 0) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Ragdoll simulation update
    if (this.ragdoll.isActive) {
      this.ragdoll.update(delta, this.body.position);
      if (this.knockdownTimer > 0) {
        this.knockdownTimer -= delta;
        if (this.knockdownTimer <= 0 && !this.isDead) {
          this.ragdoll.startRecovery(0.55);
          this.isKnockedDown = false;
        }
      }
    } else {
      if (this.knockdownTimer > 0) {
        this.knockdownTimer -= delta;
        if (this.knockdownTimer <= 0) this.isKnockedDown = false;
      }
    }

    if (this.stunTimer > 0) this.stunTimer -= delta;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= delta;
    if (this.specialCooldownTimer > 0) this.specialCooldownTimer -= delta;

    // Stamina regeneration
    if (this.stamina < this.stats.maxStamina && !this.isBlocking) {
      this.stamina = Math.min(this.stats.maxStamina, this.stamina + 28 * delta);
    }

    const horizSpeed = Math.hypot(this.body.velocity.x, this.body.velocity.z);
    const isMoving = horizSpeed > 0.4 && !this.isKnockedDown && this.knockbackVelocity.length() < 3.0;
    const isJumping = !this.isGrounded();

    if (!this.ragdoll.isActive) {
      this.animator.update(delta, isMoving, horizSpeed, isJumping, this.isGrounded());
    }
  }
}
