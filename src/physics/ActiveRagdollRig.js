import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ARENA_RADIUS, DINO_TYPES, DINO_STATS, DISTANCE_ATTACKS, DINO_SPECIAL_ABILITIES } from '../constants.js';
import { ModularDinosaurModel } from '../entities/ModularDinosaurModel.js';
import { DinosaurAnimator } from '../entities/DinosaurAnimator.js';
import { DinosaurRagdoll } from './DinosaurRagdoll.js';

/**
 * Universal Active Ragdoll Dinosaur Rig for Three.js & cannon-es
 * 
 * Features:
 * - High-Fidelity 3D Dinosaur Models from ModularDinosaurModel for all 22 species
 * - Upright Grounded Character Physics: Stands proudly, never collapses through the floor
 * - Fully Controllable Locomotion: Crisp, responsive WASD/Arrow steering with natural traction
 * - Elastic Mouse-Drag Head Aiming & Snapping Jaws with tension tether
 * - Dynamic Tail Whip with 180° rotational sweep
 * - Multi-Joint Physics Ragdoll: Tumbles realistically across arena dirt on heavy knockdowns
 * - Automatic Stand-Up Recovery: Righting system smoothly gets back on feet after tumbles
 * - Rebalanced Stamina: Hits never drain stamina, rapid 35/sec regeneration
 * - Strict Mutual Collision & Overlap Prevention: Dinosaurs never clip inside each other
 */
export class ActiveRagdollRig {
  constructor(arg1, arg2, arg3 = {}) {
    let physicsWorld, scene, options;
    if (typeof arg1 === 'string') {
      options = { ...arg2, dinoType: arg1 };
      physicsWorld = options.physicsWorld;
      scene = options.scene;
    } else {
      physicsWorld = arg1;
      scene = arg2;
      options = arg3;
    }

    this.physicsWorld = physicsWorld;
    this.world = physicsWorld?.world || physicsWorld;
    this.scene = scene;

    this.isPlayer = !!options.isPlayer;
    this.dinoType = options.dinoType || DINO_TYPES.TREX;
    this.stats = { ...(DINO_STATS[this.dinoType] || DINO_STATS[DINO_TYPES.TREX]) };

    this.options = {
      color: options.color || this.stats.color || 0x485834,
      accentColor: options.accentColor || this.stats.accentColor || 0xc87d32,
      startPosition: options.startPosition || new THREE.Vector3(0, 1.8, 0),
      startRotation: options.startRotation !== undefined ? options.startRotation : 0,
      dinoType: this.dinoType,
      isPlayer: this.isPlayer,
      ...options
    };

    // Boss Scaling & Stat Modifiers
    this.isBoss = !!options.isBoss;
    if (this.isBoss) {
      const hpMult = options.hpMultiplier || 1.65;
      this.stats.maxHealth = Math.round((this.stats.maxHealth || 1000) * hpMult);
      this.stats.biteDamage = Math.round((this.stats.biteDamage || 85) * 1.35);
      this.stats.specialDamage = Math.round((this.stats.specialDamage || 130) * 1.4);
    }

    // Combat Stats & State
    this.health = this.stats.maxHealth || 700;
    this.stamina = this.stats.maxStamina || 100;
    this.isDead = false;
    this.isKnockedDown = false;
    this.knockdownTimer = 0;
    this.stunTimer = 0;
    this.currentRotation = this.options.startRotation;
    this.facingTarget = new THREE.Vector3(
      this.options.startPosition.x + Math.sin(this.currentRotation) * 6,
      1.8,
      this.options.startPosition.z + Math.cos(this.currentRotation) * 6
    );

    // Special Ability System (7-second charge time)
    this.ability = DINO_SPECIAL_ABILITIES[this.dinoType] || {
      id: 'fire_breath',
      name: 'INFERNO BREATH',
      icon: '🔥',
      chargeTime: 7.0,
      desc: 'Unleashes a roaring continuous stream of incinerating dragon fire!'
    };
    this.specialCharge = 0; // 0 to 100
    this.specialChargeTime = this.ability.chargeTime || 7.0;
    this.isSpecialReady = false;
    this.isExecutingSpecial = false;
    this.specialTimer = 0;

    // Status Effects (Freeze, Burn, Titan)
    this.isFrozen = false;
    this.frozenTimer = 0;
    this.isBurning = false;
    this.burningTimer = 0;
    this.burningTickTimer = 0;
    this.isTitan = false;
    this.titanTimer = 0;

    // Evasion & Defensive State
    this.isBlocking = false;
    this.isInvulnerable = false;
    this.isExecutingStrike = false;
    this.strikeDealtDamage = false;
    this.slideTimer = 0;
    this.hitImmunityTimer = 0;
    this.knockbackVelocity = new THREE.Vector3(0, 0, 0);

    // Grab & Thrash State
    this.grabbedBody = null;
    this.grabConstraint = null;
    this.grabTimer = 0;
    this.isPreparingGrab = false;

    // Active Ragdoll Mouse-Drag State
    this.isBeingDragged = false;
    this.dragTargetPos = null;
    this.currentStrain = 0;


    // External System Hooks
    this.audio = options.audio || null;
    this.particles = options.particles || null;
    this.renderer = options.renderer || null;
    this.ui = options.ui || null;

    // 1. Build High-Fidelity 3D Visual Mesh
    this.group = new THREE.Group();
    if (this.isBoss) {
      this.group.scale.setScalar(1.35); // 1.35x Titan scale for Final Boss!
    }
    this.scene.add(this.group);
    this.buildVisualModel();

    // 2. Build Multi-Body Cannon.js Physics Rig
    this.bodies = {};
    this.constraints = [];
    this.buildPhysicsBodies();

    // 3. Multi-Joint Physical Ragdoll System
    this.ragdoll = new DinosaurRagdoll(this.joints, this.dinoType);

    // 4. Procedural Combat Animator
    this.animator = new DinosaurAnimator(this.joints, () => {
      if (this.audio) this.audio.playFootstep();
      if (this.particles) this.particles.spawnFootstepDust(this.getPosition());
    }, this.dinoType);

    // Initial position & orientation
    this.resetPose(this.options.startPosition.x, this.options.startPosition.z, this.options.startRotation);
  }

  buildVisualModel() {
    const { mesh, joints } = ModularDinosaurModel.build(this.dinoType, this.options.color);
    this.mesh = mesh;
    this.mesh.rotation.order = 'YXZ';
    joints.root = mesh;
    this.joints = joints;
    this.group.add(this.mesh);
  }

  buildPhysicsBodies() {
    const start = this.options.startPosition;
    const filterGroup = this.isPlayer ? 2 : 4;
    const filterMask = 1 | (this.isPlayer ? 4 : 2);

    // 1. Pelvis (Root Grounded Character Body)
    // High mass and fixed rotation on pitch/roll guarantees automatic upright standing
    this.bodies.pelvis = new CANNON.Body({
      mass: 850,
      material: this.physicsWorld.dinoMaterial,
      fixedRotation: true,
      linearDamping: 0.15,
      angularDamping: 0.99,
      position: new CANNON.Vec3(start.x, 1.8, start.z)
    });
    // Main collision shape
    this.bodies.pelvis.addShape(new CANNON.Box(new CANNON.Vec3(1.3, 1.7, 1.8)), new CANNON.Vec3(0, 0, 0));
    this.bodies.pelvis.collisionFilterGroup = filterGroup;
    this.bodies.pelvis.collisionFilterMask = filterMask;
    this.bodies.pelvis.dinoRig = this;
    this.bodies.pelvis.limbName = 'pelvis';
    this.bodies.pelvis.isPlayer = this.isPlayer;
    this.world.addBody(this.bodies.pelvis);

    // 2. Torso Body
    this.bodies.torso = new CANNON.Body({
      mass: 120,
      material: this.physicsWorld.dinoMaterial,
      position: new CANNON.Vec3(start.x, 2.2, start.z + 0.8),
      linearDamping: 0.5,
      angularDamping: 0.8
    });
    this.bodies.torso.addShape(new CANNON.Box(new CANNON.Vec3(1.1, 1.1, 1.4)));
    this.bodies.torso.collisionFilterGroup = filterGroup;
    this.bodies.torso.collisionFilterMask = filterMask;
    this.bodies.torso.dinoRig = this;
    this.bodies.torso.limbName = 'torso';
    this.world.addBody(this.bodies.torso);

    // 3. Head Body (Kinematic & Interactive for Mouse Drag & Bite Attacks)
    this.bodies.head = new CANNON.Body({
      mass: 65,
      material: this.physicsWorld.dinoMaterial,
      position: new CANNON.Vec3(start.x, 2.6, start.z + 2.5),
      linearDamping: 0.45,
      angularDamping: 0.75
    });
    this.bodies.head.addShape(new CANNON.Box(new CANNON.Vec3(0.75, 0.65, 1.1)));
    this.bodies.head.collisionFilterGroup = filterGroup;
    this.bodies.head.collisionFilterMask = filterMask;
    this.bodies.head.dinoRig = this;
    this.bodies.head.limbName = 'head';
    this.world.addBody(this.bodies.head);

    // 4. Jaw Body
    this.bodies.jaw = new CANNON.Body({
      mass: 25,
      material: this.physicsWorld.dinoMaterial,
      position: new CANNON.Vec3(start.x, 2.1, start.z + 2.6),
      linearDamping: 0.4,
      angularDamping: 0.6
    });
    this.bodies.jaw.addShape(new CANNON.Box(new CANNON.Vec3(0.65, 0.25, 0.9)));
    this.bodies.jaw.collisionFilterGroup = filterGroup;
    this.bodies.jaw.collisionFilterMask = filterMask;
    this.bodies.jaw.dinoRig = this;
    this.bodies.jaw.limbName = 'jaw';
    this.world.addBody(this.bodies.jaw);

    // 5. Tail Segments (tail1, tail2, tail3)
    this.bodies.tail1 = new CANNON.Body({
      mass: 45,
      position: new CANNON.Vec3(start.x, 1.8, start.z - 1.5),
      linearDamping: 0.4,
      angularDamping: 0.6
    });
    this.bodies.tail1.addShape(new CANNON.Box(new CANNON.Vec3(0.6, 0.5, 0.9)));
    this.bodies.tail1.collisionFilterGroup = filterGroup;
    this.bodies.tail1.collisionFilterMask = filterMask;
    this.bodies.tail1.dinoRig = this;
    this.bodies.tail1.limbName = 'tail1';
    this.world.addBody(this.bodies.tail1);

    this.bodies.tail2 = new CANNON.Body({
      mass: 35,
      position: new CANNON.Vec3(start.x, 1.7, start.z - 2.8),
      linearDamping: 0.4,
      angularDamping: 0.6
    });
    this.bodies.tail2.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.4, 0.9)));
    this.bodies.tail2.collisionFilterGroup = filterGroup;
    this.bodies.tail2.collisionFilterMask = filterMask;
    this.bodies.tail2.dinoRig = this;
    this.bodies.tail2.limbName = 'tail2';
    this.world.addBody(this.bodies.tail2);

    this.bodies.tail3 = new CANNON.Body({
      mass: 30,
      position: new CANNON.Vec3(start.x, 1.6, start.z - 4.2),
      linearDamping: 0.4,
      angularDamping: 0.6
    });
    this.bodies.tail3.addShape(new CANNON.Box(new CANNON.Vec3(0.4, 0.35, 1.0)));
    this.bodies.tail3.collisionFilterGroup = filterGroup;
    this.bodies.tail3.collisionFilterMask = filterMask;
    this.bodies.tail3.dinoRig = this;
    this.bodies.tail3.limbName = 'tail3';
    this.world.addBody(this.bodies.tail3);
  }

  resetPose(x = 0, z = 0, rotY = 0) {
    this.isDead = false;
    this.isKnockedDown = false;
    this.knockdownTimer = 0;
    this.currentRotation = rotY;
    this.targetRotation = rotY;

    // Reset material flash states so dino textures are always pristine
    this.group.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive) {
        if (child.material.userData?.flashTimeout) {
          clearTimeout(child.material.userData.flashTimeout);
          child.material.userData.flashTimeout = null;
        }
        if (child.material.userData?.origEmissiveHex !== undefined) {
          child.material.emissive.setHex(child.material.userData.origEmissiveHex);
        } else {
          child.material.emissive.setHex(0x000000);
        }
      }
    });

    const pelvis = this.bodies.pelvis;
    if (pelvis) {
      pelvis.position.set(x, 1.8, z);
      pelvis.velocity.set(0, 0, 0);
      pelvis.angularVelocity.set(0, 0, 0);
      pelvis.quaternion.setFromEuler(0, rotY, 0);
    }
    this.knockbackVelocity.set(0, 0, 0);

    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.set(0, rotY, 0);

    if (this.ragdoll && this.ragdoll.isActive) {
      this.ragdoll.isActive = false;
      this.ragdoll.isRecovering = false;
    }

    if (this.animator) {
      this.animator.resetPose();
      this.animator.state = 'idle';
    }

    this.syncSubBodies();
  }

  setActiveDrag(targetPos, strain = 0) {
    if (this.isDead || this.isKnockedDown) return;
    this.isBeingDragged = true;
    this.dragTargetPos = targetPos ? targetPos.clone() : null;
    this.currentStrain = strain;
  }

  releaseActiveDrag(force = 1.0) {
    if (this.isBeingDragged && !this.isDead && !this.isKnockedDown) {
      this.isBeingDragged = false;
      this.dragTargetPos = null;
      if (this.animator && this.animator.state === 'idle') {
        this.animator.playAction('attack_close', 0.45);
      }
      if (this.audio) this.audio.playBite();
      if (this.particles) this.particles.spawnSlidingDust(this.getPosition());
    }
    this.isBeingDragged = false;
    this.dragTargetPos = null;
    this.currentStrain = 0;
  }

  applyDragPose() {
    if (!this.dragTargetPos || !this.joints) return;
    const pPos = this.getPosition();
    const fX = Math.sin(this.currentRotation);
    const fZ = Math.cos(this.currentRotation);
    const rX = Math.cos(this.currentRotation);
    const rZ = -Math.sin(this.currentRotation);

    const worldDx = this.dragTargetPos.x - (pPos.x + fX * 2.2);
    const worldDz = this.dragTargetPos.z - (pPos.z + fZ * 2.2);
    const worldDy = this.dragTargetPos.y - 2.6;

    const localForward = worldDx * fX + worldDz * fZ;
    const localRight = worldDx * rX + worldDz * rZ;

    // Flex neck toward target
    if (this.joints.neck) {
      this.joints.neck.rotation.y = THREE.MathUtils.clamp(-localRight * 0.22, -0.65, 0.65);
      this.joints.neck.rotation.x = THREE.MathUtils.clamp(worldDy * 0.18, -0.4, 0.4);
    }

    // Extend and aim head
    if (this.joints.head) {
      const stretch = Math.min(1.4, Math.max(0, localForward * 0.35));
      this.joints.head.position.z = 1.0 + stretch;
      this.joints.head.position.y = THREE.MathUtils.clamp(worldDy * 0.35, -0.4, 0.6);
      this.joints.head.rotation.y = THREE.MathUtils.clamp(-localRight * 0.32, -0.7, 0.7);
      this.joints.head.rotation.x = THREE.MathUtils.clamp(-worldDy * 0.25, -0.45, 0.45);
    }

    // Part jaw open proportional to strain
    if (this.joints.jaw) {
      this.joints.jaw.rotation.x = THREE.MathUtils.clamp(this.currentStrain * 0.42, 0.15, 1.25);
    }

    // Lean torso slightly into pull
    if (this.joints.torso) {
      this.joints.torso.rotation.x = THREE.MathUtils.clamp(localForward * 0.05, -0.15, 0.2);
      this.joints.torso.rotation.z = THREE.MathUtils.clamp(localRight * 0.06, -0.18, 0.18);
    }
  }

  syncSubBodies() {
    const fX = Math.sin(this.currentRotation);
    const fZ = Math.cos(this.currentRotation);
    const pPos = this.bodies.pelvis.position;

    if (this.ragdoll && this.ragdoll.isActive) {
      if (this.bodies.torso) this.bodies.torso.position.set(pPos.x, 0.7, pPos.z);
      if (this.bodies.head) this.bodies.head.position.set(pPos.x + fX * 1.5, 0.5, pPos.z + fZ * 1.5);
      if (this.bodies.jaw) this.bodies.jaw.position.set(pPos.x + fX * 1.6, 0.3, pPos.z + fZ * 1.6);
      return;
    }

    // Torso
    if (this.bodies.torso) {
      this.bodies.torso.position.set(pPos.x + fX * 0.8, pPos.y + 0.4, pPos.z + fZ * 0.8);
      this.bodies.torso.quaternion.setFromEuler(0, this.currentRotation, 0);
    }

    // Head (dynamically stretches if being dragged)
    if (this.bodies.head) {
      const hDist = 2.5 + (this.isBeingDragged ? Math.min(1.2, this.currentStrain * 0.3) : 0);
      this.bodies.head.position.set(pPos.x + fX * hDist, pPos.y + 0.8, pPos.z + fZ * hDist);
      this.bodies.head.quaternion.setFromEuler(0, this.currentRotation, 0);
    }

    // Jaw
    if (this.bodies.jaw) {
      this.bodies.jaw.position.set(pPos.x + fX * 2.6, pPos.y + 0.3, pPos.z + fZ * 2.6);
      this.bodies.jaw.quaternion.setFromEuler(0, this.currentRotation, 0);
    }

    // Tail segments
    if (this.bodies.tail1) {
      this.bodies.tail1.position.set(pPos.x - fX * 1.5, pPos.y, pPos.z - fZ * 1.5);
      this.bodies.tail1.quaternion.setFromEuler(0, this.currentRotation, 0);
    }
    if (this.bodies.tail2) {
      this.bodies.tail2.position.set(pPos.x - fX * 2.8, pPos.y - 0.1, pPos.z - fZ * 2.8);
      this.bodies.tail2.quaternion.setFromEuler(0, this.currentRotation, 0);
    }
    if (this.bodies.tail3) {
      this.bodies.tail3.position.set(pPos.x - fX * 4.2, pPos.y - 0.2, pPos.z - fZ * 4.2);
      this.bodies.tail3.quaternion.setFromEuler(0, this.currentRotation, 0);
    }
  }

  getPosition() {
    return this.mesh.position;
  }

  getHeadPosition() {
    if (this.bodies.head) {
      return new THREE.Vector3(
        this.bodies.head.position.x,
        this.bodies.head.position.y,
        this.bodies.head.position.z
      );
    }
    return this.mesh.position.clone().add(new THREE.Vector3(0, 2.5, 2.0));
  }

  getRotation() {
    return this.currentRotation;
  }

  isGrounded() {
    return this.bodies.pelvis.position.y <= 1.86;
  }

  setFacingTarget(targetPos) {
    if (!targetPos) return;
    this.facingTarget.copy(targetPos);
    const pPos = this.getPosition();
    const dx = targetPos.x - pPos.x;
    const dz = targetPos.z - pPos.z;
    if (Math.hypot(dx, dz) > 0.3) {
      this.targetRotation = Math.atan2(dx, dz);
    }
  }

  /**
   * Crisp, controllable locomotion
   * - Velocity-driven footwork with smooth acceleration
   * - Capped turning rate prevents dizzy spinning
   * - Firm ground traction on stop (no ice skating)
   */
  applyFootwork(dirX, dirZ, isSprinting, delta) {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.slideTimer > 0 || this.knockbackVelocity.length() > 3.0) return;

    const len = Math.hypot(dirX, dirZ);
    const isAttacking = this.animator.state.startsWith('attack');

    if (len > 0.05 && !isAttacking) {
      const moveAngle = Math.atan2(dirX, dirZ);
      let diff = moveAngle - this.currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      // Controlled, agile turning rate (weighty and natural, no dizzy spinning)
      const baseTurn = Math.min(4.0, this.stats.turnSpeed || 3.8);
      const turnBoost = Math.abs(diff) > 1.4 ? 1.35 : 1.0;
      const turnRate = baseTurn * turnBoost;
      this.currentRotation += Math.sign(diff) * Math.min(Math.abs(diff), turnRate * delta);
      this.mesh.rotation.y = this.currentRotation;

      if (this.bodies.pelvis && !this.ragdoll.isActive) {
        this.bodies.pelvis.quaternion.setFromEuler(0, this.currentRotation, 0);
      }

      // AAA Dinosaur body banking into curves
      if (this.joints?.torso) {
        const bankAngle = -Math.sign(diff) * Math.min(0.12, Math.abs(diff) * 0.16);
        this.joints.torso.rotation.z = THREE.MathUtils.lerp(this.joints.torso.rotation.z, bankAngle, 0.2);
      }

      // Pro AAA Locomotion: speed scales with input magnitude (len) and capped to readable fighting game velocities
      const inputMag = Math.min(1.0, Math.max(0.0, len));
      const maxWalkSpeed = Math.min(9.5, this.stats.speed ? this.stats.speed * 0.62 : 8.5);
      const maxSprintSpeed = Math.min(14.0, this.stats.sprintSpeed ? this.stats.sprintSpeed * 0.55 : 12.0);
      let speed = (isSprinting ? maxSprintSpeed : maxWalkSpeed) * inputMag;
      if (this.isBlocking) speed *= 0.35;

      if (isSprinting && !this.isBlocking && this.stamina > 5) {
        this.stamina = Math.max(0, this.stamina - 10 * delta);
      }

      // Directional drive: only drive forward when facing within ~75° of destination vector
      // Prevents inadvertently charging into opponent when trying to run away / retreat!
      const align = Math.cos(diff);
      if (align > 0.25) {
        this.bodies.pelvis.velocity.x = Math.sin(this.currentRotation) * speed * align;
        this.bodies.pelvis.velocity.z = Math.cos(this.currentRotation) * speed * align;
      } else {
        const friction = Math.pow(0.001, delta);
        this.bodies.pelvis.velocity.x *= friction;
        this.bodies.pelvis.velocity.z *= friction;
      }
    } else if (isAttacking) {
      // Dynamic lunge velocity peaks during strike window (25-65%) and plants on recovery
      const p = this.animator.actionDuration > 0 ? (this.animator.actionTimer / this.animator.actionDuration) : 0;
      if (p >= 0.25 && p <= 0.65) {
        const lunge = this.stats.attackLungeSpeed || 16.5;
        this.bodies.pelvis.velocity.x = Math.sin(this.currentRotation) * lunge;
        this.bodies.pelvis.velocity.z = Math.cos(this.currentRotation) * lunge;
      } else {
        const friction = Math.pow(0.001, delta);
        this.bodies.pelvis.velocity.x *= friction;
        this.bodies.pelvis.velocity.z *= friction;
      }
    } else {
      // Return torso banking upright
      if (this.joints?.torso && !this.isBeingDragged) {
        this.joints.torso.rotation.z = THREE.MathUtils.lerp(this.joints.torso.rotation.z, 0, 0.1);
      }
      // Firm ground traction on stop: decelerates smoothly to a dead stop without sliding
      const friction = Math.pow(0.001, delta);
      this.bodies.pelvis.velocity.x *= friction;
      this.bodies.pelvis.velocity.z *= friction;
      if (Math.hypot(this.bodies.pelvis.velocity.x, this.bodies.pelvis.velocity.z) < 0.15) {
        this.bodies.pelvis.velocity.x = 0;
        this.bodies.pelvis.velocity.z = 0;
      }
    }
  }

  applyTailWhip(dir, power = 1.0) {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.stamina < 10) return;
    this.stamina -= 10;

    // Fast 180° whip animation with rotational footwork
    this.animator.playAction('attack2', 0.65);
    if (this.audio) this.audio.playTailHit();
    if (this.particles) this.particles.spawnSlidingDust(this.getPosition());

    // Kinetic tail impulse
    const tailBody = this.bodies.tail3;
    if (tailBody && dir) {
      tailBody.applyImpulse(new CANNON.Vec3(dir.x * 320 * power, 40, dir.z * 320 * power), tailBody.position);
    }
  }

  triggerJump() {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || !this.isGrounded() || this.stamina < 10) return false;
    this.stamina -= 10;
    this.bodies.pelvis.velocity.y = 12.0;
    this.animator.playAction('jump', 0.65);
    if (this.audio) this.audio.playJump();
    if (this.particles) this.particles.spawnFootstepDust(this.getPosition());
    return true;
  }

  triggerRoar(opponent = null) {
    if (this.isDead || this.stunTimer > 0 || this.isKnockedDown || this.stamina < 15) return false;
    this.stamina -= 15;
    this.animator.playAction('roar', 0.85);
    if (this.audio) this.audio.playRoar(this.dinoType === DINO_TYPES.TREX || this.dinoType === DINO_TYPES.SPINOSAURUS);
    if (this.particles) this.particles.spawnRoarShockwave(this.getPosition(), this.stats.accentColor);

    if (opponent && !opponent.isDead) {
      const oppPos = opponent.getPosition();
      const myPos = this.getPosition();
      const dx = oppPos.x - myPos.x;
      const dz = oppPos.z - myPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 9.5 && dist > 0.1) {
        const push = (9.5 - dist) * 1.8;
        const isKnockdown = dist < 5.0; // Close roar knocks opponent down!
        opponent.takeDamage(20, null, new THREE.Vector3(dx / dist, 0.2, dz / dist), push, isKnockdown);
      }
    }
    return true;
  }

  biteGrab(targetBody) {
    if (!targetBody || this.grabConstraint) return;
    this.grabbedBody = targetBody;
    this.grabTimer = 1.8;
    this.grabConstraint = new CANNON.PointToPointConstraint(
      this.bodies.head,
      new CANNON.Vec3(0, 0, 1.0),
      targetBody,
      new CANNON.Vec3(0, 0, 0),
      1400
    );
    this.world.addConstraint(this.grabConstraint);
  }

  releaseBiteGrab(force = 1.0) {
    if (this.grabConstraint) {
      try {
        this.world.removeConstraint(this.grabConstraint);
      } catch (e) {}
      this.grabConstraint = null;
    }
    if (this.grabbedBody) {
      const fX = Math.sin(this.currentRotation);
      const fZ = Math.cos(this.currentRotation);
      this.grabbedBody.applyImpulse(new CANNON.Vec3(fX * 420 * force, 150, fZ * 420 * force), this.grabbedBody.position);
      this.grabbedBody = null;
    }
    this.grabTimer = 0;
  }

  freeze(duration = 2.5) {
    if (this.isDead || this.isInvulnerable) return;
    this.isFrozen = true;
    this.frozenTimer = duration;
    this.bodies.pelvis.velocity.set(0, 0, 0);
    this.group.traverse((c) => {
      if (c.isMesh && c.material && c.material.emissive) {
        c.material.emissive.setHex(0x00f0ff);
      }
    });
    if (this.ui) {
      this.ui.showActionBanner(this.isPlayer ? '🥶 FROZEN SOLID IN GLACIAL ICE!' : '❄️ ENEMY FROZEN SOLID!');
    }
    if (this.audio) this.audio.playHeavyHit(false);
  }

  unfreeze() {
    this.isFrozen = false;
    this.frozenTimer = 0;
    this.group.traverse((c) => {
      if (c.isMesh && c.material && c.material.emissive) {
        c.material.emissive.setHex(0x000000);
      }
    });
    if (this.particles) {
      this.particles.spawnIceShatter(this.getPosition(), 32);
    }
    if (this.audio) this.audio.playBiteHit();
  }

  ignite(duration = 3.0) {
    if (this.isDead) return;
    this.isBurning = true;
    this.burningTimer = duration;
    this.burningTickTimer = 0.5;
    this.flashDamage();
  }

  growToTitan(duration = 3.5) {
    if (this.isDead) return;
    this.isTitan = true;
    this.titanTimer = duration;
    if (this.particles) {
      this.particles.spawnRoarShockwave(this.getPosition(), 0xffd700);
    }
  }

  triggerSpecialAbility(opponentRig = null) {
    if (this.specialCharge < 100 || this.isDead || this.isKnockedDown || this.isFrozen || this.isExecutingSpecial) {
      return false;
    }

    this.specialCharge = 0;
    this.isSpecialReady = false;
    this.isExecutingSpecial = true;
    this.specialTimer = 1.4;

    const myPos = this.getPosition();
    let dir = new THREE.Vector3(Math.sin(this.currentRotation), 0, Math.cos(this.currentRotation));
    let dist = 999;
    if (opponentRig && !opponentRig.isDead) {
      const oppPos = opponentRig.getPosition();
      const dx = oppPos.x - myPos.x;
      const dz = oppPos.z - myPos.z;
      dist = Math.hypot(dx, dz);
      if (dist > 0.1) {
        dir.set(dx / dist, 0.25, dz / dist);
      }
    }

    if (this.ui) {
      this.ui.showActionBanner(this.isPlayer ? `💥 UNLEASHED ${this.ability.name}!` : `⚠️ DANGER! ENEMY UNLEASHED ${this.ability.name}!`);
    }

    const abilityId = this.ability.id;

    if (abilityId === 'fire_breath') {
      // 1. T-REX / APEX INFERNO BREATH
      this.animator?.playAction('special_breath', 1.4);
      if (this.audio) this.audio.playRoar(true);

      const fireDuration = 1200; // ms
      const startTime = performance.now();
      const interval = setInterval(() => {
        if (!this.group || this.isDead) {
          clearInterval(interval);
          return;
        }
        const elapsed = performance.now() - startTime;
        if (elapsed > fireDuration) {
          clearInterval(interval);
        } else {
          const hPos = this.getHeadPosition();
          const curDir = new THREE.Vector3(Math.sin(this.currentRotation), 0.1, Math.cos(this.currentRotation));
          if (this.particles) this.particles.spawnFireBreath(hPos, curDir, 16);
          if (this.renderer) this.renderer.triggerScreenShake(0.12);
        }
      }, 70);

      if (opponentRig && !opponentRig.isDead && dist < 14.0) {
        setTimeout(() => {
          if (!opponentRig || opponentRig.isDead) return;
          opponentRig.takeDamage(125, null, dir, 22, true, 'charge');
          opponentRig.ignite(3.0);
          if (this.particles) this.particles.spawnHitSparks(opponentRig.getPosition(), 0xff4400);
        }, 420);
      }

    } else if (abilityId === 'ice_breath') {
      // 2. SPINOSAURUS / GLACIAL ICE BREATH
      this.animator?.playAction('special_breath', 1.4);
      if (this.audio) this.audio.playRoar(false);

      const frostDuration = 1100;
      const startTime = performance.now();
      const interval = setInterval(() => {
        if (!this.group || this.isDead) {
          clearInterval(interval);
          return;
        }
        const elapsed = performance.now() - startTime;
        if (elapsed > frostDuration) {
          clearInterval(interval);
        } else {
          const hPos = this.getHeadPosition();
          const curDir = new THREE.Vector3(Math.sin(this.currentRotation), 0.08, Math.cos(this.currentRotation));
          if (this.particles) this.particles.spawnFrostBreath(hPos, curDir, 16);
        }
      }, 70);

      if (opponentRig && !opponentRig.isDead && dist < 14.0) {
        setTimeout(() => {
          if (!opponentRig || opponentRig.isDead) return;
          opponentRig.takeDamage(95, null, dir, 12, false, 'default');
          opponentRig.freeze(2.5);
          if (this.particles) this.particles.spawnIcePrism(opponentRig.getPosition(), 2.5);
        }, 400);
      }

    } else if (abilityId === 'shadow_clones') {
      // 3. VELOCIRAPTOR SHADOW CLONES
      this.animator?.playAction('roar', 0.8);
      if (this.audio) this.audio.playBite();
      if (this.particles) {
        this.particles.spawnShadowClones(this.getPosition(), dir, 2);
      }

      if (opponentRig && !opponentRig.isDead) {
        setTimeout(() => {
          if (!opponentRig || opponentRig.isDead) return;
          opponentRig.takeDamage(135, null, dir, 20, true, 'tail_club');
          if (this.renderer) this.renderer.triggerScreenShake(0.65);
        }, 480);
      }

    } else if (abilityId === 'titan_growth') {
      // 4. TITAN GROWTH & COLOSSAL STOMP
      this.growToTitan(3.5);
      this.animator?.playAction('titan_stomp', 1.3);
      if (this.audio) this.audio.playRoar(true);

      setTimeout(() => {
        if (this.particles) this.particles.spawnTitanShockwave(this.getPosition());
        if (this.renderer) this.renderer.triggerScreenShake(0.95);
        if (this.audio) this.audio.playHeavyHit(true);

        if (opponentRig && !opponentRig.isDead && dist < 16.0) {
          opponentRig.takeDamage(160, null, dir, 26, true, 'horn_lift');
        }
      }, 550);

    } else if (abilityId === 'shadow_attack') {
      // 5. SHADOW WARP & AMBUSH
      if (this.particles) this.particles.spawnVoidSmoke(this.getPosition(), 18);
      if (this.audio) this.audio.playWhiff();

      if (opponentRig && !opponentRig.isDead) {
        setTimeout(() => {
          if (!opponentRig || opponentRig.isDead) return;
          const oppPos = opponentRig.getPosition();
          const oppRot = opponentRig.getRotation();
          // Teleport behind opponent
          const behindX = oppPos.x - Math.sin(oppRot) * 3.5;
          const behindZ = oppPos.z - Math.cos(oppRot) * 3.5;
          this.bodies.pelvis.position.set(behindX, 1.8, behindZ);
          this.currentRotation = oppRot;
          this.mesh.rotation.y = oppRot;
          if (this.particles) this.particles.spawnVoidSmoke(this.getPosition(), 22);

          this.animator?.playAction('attack_long', 0.55);
          if (this.audio) this.audio.playBite();
          opponentRig.takeDamage(140, null, new THREE.Vector3(Math.sin(oppRot), 0.3, Math.cos(oppRot)), 22, true, 'pounce_tackle');
          if (this.renderer) this.renderer.triggerScreenShake(0.7);
        }, 280);
      }

    } else if (abilityId === 'earth_spikes') {
      // 6. TECTONIC EARTH SPIKES
      this.isInvulnerable = true;
      this.animator?.playAction('attack_long', 0.7);
      if (this.audio) this.audio.playJump();

      if (opponentRig && !opponentRig.isDead) {
        if (this.particles) this.particles.spawnEarthSpikes(myPos, opponentRig.getPosition(), 7);
        setTimeout(() => {
          this.isInvulnerable = false;
          if (!opponentRig || opponentRig.isDead) return;
          opponentRig.takeDamage(145, null, dir, 24, true, 'horn_lift');
          if (this.renderer) this.renderer.triggerScreenShake(0.85);
        }, 500);
      } else {
        setTimeout(() => { this.isInvulnerable = false; }, 600);
      }

    } else {
      // 7. METEOR SKULL SLAM
      this.animator?.playAction('attack_long', 0.65);
      if (this.audio) this.audio.playRoar(false);

      if (opponentRig && !opponentRig.isDead) {
        setTimeout(() => {
          if (!opponentRig || opponentRig.isDead) return;
          if (this.particles) this.particles.spawnMeteorImpact(opponentRig.getPosition());
          if (this.renderer) this.renderer.triggerScreenShake(0.9);
          opponentRig.takeDamage(155, null, dir, 25, true, 'charge');
        }, 360);
      }
    }

    setTimeout(() => {
      this.isExecutingSpecial = false;
    }, 1400);

    return true;
  }

  /**
   * Real Visceral Predatory Strike (Light or Heavy)
   * Drives the dinosaur's entire body forward with authentic muscular lunge momentum,
   * strikes through the target zone, triggers hit-stop freeze frames, camera punch-in,
   * and creates bloody impact bursts!
   */
  executeStrike(attackType = 'bite', targetRig = null) {
    if (this.isDead || this.isKnockedDown) return;

    this.isExecutingStrike = true;
    this.strikeDealtDamage = false;

    const rot = this.getRotation();
    const fwd = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)).normalize();
    const isHeavy = attackType === 'heavy' || attackType === 'tail';

    // 1. Explosive Muscular Forward Lunge Impulse
    const lungeSpeed = isHeavy ? 13.5 : 10.5;
    if (this.bodies.pelvis) {
      this.bodies.pelvis.velocity.x = fwd.x * lungeSpeed;
      this.bodies.pelvis.velocity.z = fwd.z * lungeSpeed;
    }
    if (this.bodies.head) {
      this.bodies.head.applyForce(new CANNON.Vec3(fwd.x * 650, -40, fwd.z * 650), this.bodies.head.position);
    }

    // 2. Dust Blast kick under the feet & 3D Slash Arc in the air
    if (this.particles) {
      this.particles.spawnLungeDust(this.getPosition(), fwd);
      this.particles.spawnSlashArc(this.getHeadPosition(), fwd, isHeavy, isHeavy ? 0xffaa00 : 0xff3322);
    }

    // 3. Audio & Animation
    if (isHeavy) {
      this.animator?.playAction('attack2', 0.65);
      if (this.audio) this.audio.playHeavyHit(true);
    } else {
      this.animator?.playAction('attack_close', 0.45);
      if (this.audio) this.audio.playBite();
    }

    // 4. Climax Strike Frame Check
    const strikeDelay = isHeavy ? 260 : 160;
    setTimeout(() => {
      if (this.isDead || !targetRig || targetRig.isDead) return;

      const pPos = this.getPosition();
      const oppPos = targetRig.getPosition();
      const dist = Math.hypot(oppPos.x - pPos.x, oppPos.z - pPos.z);
      const maxReach = isHeavy ? 6.5 : 5.2;

      if (dist <= maxReach && !this.strikeDealtDamage) {
        this.strikeDealtDamage = true;

        // Calculate dynamic damage
        let baseDmg = isHeavy ? (this.stats.specialDamage || 130) * 0.75 : (this.stats.biteDamage || 85) * 0.72;
        if (this.isBoss) baseDmg *= 1.35;
        const isCrit = Math.random() < 0.25;
        const finalDmg = Math.round(baseDmg * (isCrit ? 1.4 : 1.0));

        const hitDir = new THREE.Vector3(oppPos.x - pPos.x, isHeavy ? 0.45 : 0.25, oppPos.z - pPos.z).normalize();
        const contactPoint = targetRig.getHeadPosition();

        // Target takes damage with violent physical flinch
        targetRig.takeDamage(finalDmg, contactPoint, hitDir, isHeavy ? 22 : 12, isHeavy || isCrit, isHeavy ? 'tail_club' : 'crush_down');

        // VISCERAL IMPACT JUICE:
        if (this.renderer) {
          this.renderer.freezeFrame(isHeavy ? 110 : 80); // Hit stop freeze frame!
          this.renderer.triggerPunchZoom(isHeavy ? 3.5 : 2.2); // Camera punch!
          this.renderer.triggerScreenShake(isHeavy ? 0.85 : 0.5);
        }
        if (this.audio) {
          this.audio.playImpactCrunch(isHeavy);
        }
        if (this.particles) {
          this.particles.spawnBloodSplatter(contactPoint, hitDir);
          this.particles.spawnHitSparks(contactPoint, isHeavy ? 0xffea00 : this.stats.accentColor, isCrit);
          if (isHeavy) {
            this.particles.spawnImpactRing(contactPoint, 3.2, 0xff5500);
          }
        }
        if (this.ui) {
          this.ui.showDamageNumber(contactPoint, finalDmg, isCrit);
          const atkName = isHeavy ? (this.stats.specialName || 'HEAVY STRIKE') : 'CRUSHING BITE';
          this.ui.showActionBanner(this.isPlayer ? `💥 ${atkName}! [${finalDmg} DMG]` : `⚠️ ENEMY ${atkName}!`);
        }
      } else if (!this.strikeDealtDamage) {
        // Whiff sound
        if (this.audio) this.audio.playWhiff();
      }
    }, strikeDelay);

    // Strike recovery cooldown
    setTimeout(() => {
      this.isExecutingStrike = false;
      this.strikeDealtDamage = false;
    }, isHeavy ? 650 : 450);
  }

  isAttacking() {
    return (
      (this.animator && this.animator.state.startsWith('attack')) ||
      this.isExecutingStrike ||
      this.isExecutingSpecial ||
      false
    );
  }

  setDuelPosition(pos, rotY = 0) {
    this.duelHomePos = pos.clone();
    this.duelHomeRot = rotY;
    this.currentRotation = rotY;
    this.targetRotation = rotY;

    // Reset ragdoll state completely so dinosaur stands back up proudly!
    if (this.ragdoll) {
      this.ragdoll.reset();
    }
    this.isKnockedDown = false;
    this.knockdownTimer = 0;
    this.stunTimer = 0;
    this.isDead = false;

    const standY = this.stats.archetype === 'sauropod' ? 3.4 : (this.stats.archetype === 'ceratopsian' ? 2.5 : 2.2);

    if (this.bodies.pelvis) {
      this.bodies.pelvis.position.set(pos.x, standY, pos.z);
      this.bodies.pelvis.velocity.set(0, 0, 0);
      this.bodies.pelvis.angularVelocity.set(0, 0, 0);
      this.bodies.pelvis.quaternion.setFromEuler(0, rotY, 0);
    }
    if (this.group) {
      this.group.position.set(0, 0, 0);
      this.group.rotation.set(0, 0, 0);
    }
    if (this.mesh) {
      this.mesh.position.set(pos.x, 0, pos.z);
      this.mesh.rotation.set(0, rotY, 0);
    }

    if (this.animator) {
      this.animator.state = 'idle';
      this.animator.actionTimer = 0;
      this.animator.actionDuration = 0;
      this.animator.walkCycle = 0;
    }
  }

  returnToDuelHome() {
    if (!this.duelHomePos) return;
    this.setDuelPosition(this.duelHomePos, this.duelHomeRot || 0);
  }

  executeDuelAttack(attackType = 'run_hit', targetRig = null, damage = 100, onComplete = null) {
    if (this.isDead || !targetRig || targetRig.isDead) {
      onComplete?.();
      return;
    }

    this.isExecutingStrike = true;
    const pPos = this.getPosition();
    const oppPos = targetRig.getPosition();
    const dir = new THREE.Vector3().subVectors(oppPos, pPos).normalize();
    const hitPoint = targetRig.getHeadPosition ? targetRig.getHeadPosition() : oppPos;

    if (attackType === 'run_hit') {
      // 1. RUN & HIT: Gallop forward across the duel gap, slam opponent, and return
      this.animator?.playAction('attack2', 0.85);
      if (this.audio) this.audio.playRoar(true);

      if (this.bodies.pelvis) {
        this.bodies.pelvis.velocity.set(dir.x * 16.5, 0, dir.z * 16.5);
      }
      if (this.particles) {
        this.particles.spawnLungeDust(pPos, dir);
        this.particles.spawnSlashArc(this.getHeadPosition(), dir, true, 0xffaa00);
      }

      setTimeout(() => {
        if (this.isDead || !targetRig || targetRig.isDead) return;

        targetRig.takeDamage(damage, hitPoint, dir, 22, true, 'charge');

        if (this.renderer) {
          this.renderer.freezeFrame(110);
          this.renderer.triggerPunchZoom(3.2);
          this.renderer.triggerScreenShake(0.8);
        }
        if (this.audio) this.audio.playImpactCrunch(true);
        if (this.particles) {
          this.particles.spawnBloodSplatter(hitPoint, dir);
          this.particles.spawnHitSparks(hitPoint, 0xffaa00, true);
          this.particles.spawnImpactRing(hitPoint, 3.5, 0xff4400);
        }
        if (this.ui) {
          this.ui.showDamageNumber(hitPoint, damage, true);
        }
      }, 340);

      // Return to post
      setTimeout(() => {
        this.returnToDuelHome();
      }, 750);

      setTimeout(() => {
        this.isExecutingStrike = false;
        this.returnToDuelHome();
        onComplete?.();
      }, 1250);

    } else if (attackType === 'fire') {
      // 2. FIREBALL / INFERNO ATTACK
      this.animator?.playAction('special_breath', 1.4);
      if (this.audio) this.audio.playFireAttack();

      const startTime = performance.now();
      const fireInterval = setInterval(() => {
        if (this.isDead || performance.now() - startTime > 900) {
          clearInterval(fireInterval);
          return;
        }
        const hPos = this.getHeadPosition();
        if (this.particles) this.particles.spawnFireBreath(hPos, dir, 18);
        if (this.renderer) this.renderer.triggerScreenShake(0.1);
      }, 70);

      setTimeout(() => {
        if (this.isDead || !targetRig || targetRig.isDead) return;
        targetRig.takeDamage(damage, hitPoint, dir, 16, true, 'charge');
        targetRig.ignite(3.0);

        if (this.renderer) {
          this.renderer.freezeFrame(90);
          this.renderer.triggerPunchZoom(2.8);
          this.renderer.triggerScreenShake(0.75);
        }
        if (this.particles) {
          this.particles.spawnHitSparks(hitPoint, 0xff4400, true);
          this.particles.spawnImpactRing(hitPoint, 3.2, 0xff2200);
        }
        if (this.ui) {
          this.ui.showDamageNumber(hitPoint, damage, true);
        }
      }, 400);

      setTimeout(() => {
        this.isExecutingStrike = false;
        this.returnToDuelHome();
        onComplete?.();
      }, 1200);

    } else if (attackType === 'ice') {
      // 3. ICE ATTACK / FROST NOVA
      this.animator?.playAction('special_breath', 1.4);
      if (this.audio) {
        this.audio.playFreezeSound();
      }

      const startTime = performance.now();
      const iceInterval = setInterval(() => {
        if (this.isDead || performance.now() - startTime > 850) {
          clearInterval(iceInterval);
          return;
        }
        const hPos = this.getHeadPosition();
        if (this.particles) this.particles.spawnFrostBreath(hPos, dir, 18);
      }, 70);

      setTimeout(() => {
        if (this.isDead || !targetRig || targetRig.isDead) return;
        targetRig.takeDamage(damage, hitPoint, dir, 12, false, 'default');
        targetRig.freeze(2.5);

        if (this.renderer) {
          this.renderer.freezeFrame(100);
          this.renderer.triggerPunchZoom(2.6);
        }
        if (this.audio) this.audio.playIceShatter();
        if (this.particles) {
          this.particles.spawnIcePrism(hitPoint, 2.8);
          this.particles.spawnHitSparks(hitPoint, 0x00ccff, false);
        }
        if (this.ui) {
          this.ui.showDamageNumber(hitPoint, damage, false);
        }
      }, 420);

      setTimeout(() => {
        this.isExecutingStrike = false;
        this.returnToDuelHome();
        onComplete?.();
      }, 1200);

    } else if (attackType === 'laser') {
      // 4. LASER / PRIMAL PLASMA BEAM
      this.animator?.playAction('roar', 1.2);
      if (this.audio) this.audio.playLaserAttack();

      setTimeout(() => {
        if (this.isDead || !targetRig || targetRig.isDead) return;
        const hPos = this.getHeadPosition();
        if (this.particles) {
          this.particles.spawnLaserBeam(hPos, hitPoint, 0x00ffff);
        }

        targetRig.takeDamage(damage, hitPoint, dir, 25, true, 'tail_club');

        if (this.renderer) {
          this.renderer.freezeFrame(120);
          this.renderer.triggerPunchZoom(3.4);
          this.renderer.triggerScreenShake(0.9);
        }
        if (this.audio) this.audio.playImpactCrunch(true);
        if (this.ui) {
          this.ui.showDamageNumber(hitPoint, damage, true);
        }
      }, 240);

      setTimeout(() => {
        this.isExecutingStrike = false;
        this.returnToDuelHome();
        onComplete?.();
      }, 1150);

    } else if (attackType === 'water' || attackType === 'tidal') {
      // 5. TIDAL TSUNAMI / WATER CANNON ATTACK
      this.animator?.playAction('roar', 1.3);
      if (this.audio && this.audio.playWaterAttack) this.audio.playWaterAttack();

      const hPos = this.getHeadPosition();
      if (this.particles && this.particles.spawnWaterBlast) {
        this.particles.spawnWaterBlast(hPos, hitPoint, 36);
        this.particles.spawnImpactRing(hitPoint, 4.0, 0x00d4ff);
      }

      setTimeout(() => {
        if (this.isDead || !targetRig || targetRig.isDead) return;
        targetRig.takeDamage(damage, hitPoint, dir, 20, true, 'charge');

        if (this.renderer) {
          this.renderer.freezeFrame(100);
          this.renderer.triggerPunchZoom(3.0);
          this.renderer.triggerScreenShake(0.85);
        }
        if (this.audio) this.audio.playImpactCrunch(true);
        if (this.ui) {
          this.ui.showDamageNumber(hitPoint, damage, true);
        }
      }, 320);

      setTimeout(() => {
        this.isExecutingStrike = false;
        this.returnToDuelHome();
        onComplete?.();
      }, 1200);

    } else {
      // 6. WIND / SONIC SHOCKWAVE ATTACK
      this.animator?.playAction('attack_long', 1.2);
      if (this.audio) this.audio.playWindAttack();

      const hPos = this.getHeadPosition();
      if (this.particles) {
        this.particles.spawnWindVortex(hPos, dir, 32);
      }

      setTimeout(() => {
        if (this.isDead || !targetRig || targetRig.isDead) return;
        targetRig.takeDamage(damage, hitPoint, dir, 18, true, 'pounce_tackle');

        if (this.renderer) {
          this.renderer.freezeFrame(90);
          this.renderer.triggerPunchZoom(2.8);
          this.renderer.triggerScreenShake(0.7);
        }
        if (this.audio) this.audio.playImpactCrunch(false);
        if (this.particles) {
          this.particles.spawnImpactRing(hitPoint, 3.8, 0x99ddff);
        }
        if (this.ui) {
          this.ui.showDamageNumber(hitPoint, damage, false);
        }
      }, 350);

      setTimeout(() => {
        this.isExecutingStrike = false;
        this.returnToDuelHome();
        onComplete?.();
      }, 1200);
    }
  }

  /**
   * Rebalanced Combat Damage Logic:
   * - Integrated Dinosaur Defense Mitigation (reduces damage by 30-50% based on armor/scales)
   * - Hit immunity frame (prevents multi-hit melting in a single millisecond)
   * - Distinct natural physics ragdoll knockdowns based on fallType
   */
  takeDamage(amount, contactPoint = null, knockbackDir = null, knockbackForce = 10, forceKnockdown = false, fallType = 'default') {
    if (this.isDead) return { result: 'dead', damage: 0 };

    if (this.isInvulnerable) {
      if (this.particles) this.particles.spawnSlidingDust(this.getPosition());
      return { result: 'evaded', damage: 0 };
    }

    // Brief hit immunity frame prevents multiple simultaneous collision overlaps
    if (this.hitImmunityTimer > 0) {
      return { result: 'immune', damage: 0 };
    }

    // Natural defense stat mitigation
    const defense = this.stats.defense || 65;
    const defMitigation = 100 / (100 + defense * 0.95);
    const mitigatedAmount = Math.max(12, Math.round(amount * defMitigation));

    if (this.isBlocking) {
      const blockedAmount = Math.max(4, Math.round(mitigatedAmount * 0.22));
      this.health = Math.max(0, this.health - blockedAmount);
      this.stamina = Math.max(0, this.stamina - 4);
      this.hitImmunityTimer = 0.25;
      if (this.audio) this.audio.playHeavyHit(false);
      if (this.particles) this.particles.spawnHitSparks(this.getPosition(), 0xffffff);
      if (this.health <= 0) this.die(fallType);
      return { result: 'blocked', damage: blockedAmount };
    }

    // Normal Mitigated Damage
    this.health = Math.max(0, this.health - mitigatedAmount);
    this.hitImmunityTimer = 0.20;
    this.stunTimer = 0.22;

    // Flash meshes crimson on hit
    this.flashDamage();

    // Knockback
    if (knockbackDir) {
      const speed = Math.min(Math.max(knockbackForce, 5) * 0.85, 12.0);
      this.knockbackVelocity.set(knockbackDir.x * speed, 0, knockbackDir.z * speed);
      this.bodies.pelvis.velocity.x = this.knockbackVelocity.x;
      this.bodies.pelvis.velocity.z = this.knockbackVelocity.z;
      if (this.particles) this.particles.spawnSlidingDust(this.getPosition());
    }

    // Active Ragdoll Knockdown Check
    if (knockbackForce > 7.5 || mitigatedAmount >= 36 || forceKnockdown) {
      this.triggerKnockdown(1.4, knockbackDir, knockbackForce, fallType);
    } else {
      this.animator.playAction('hit', 0.36);
      if (this.ragdoll) {
        this.ragdoll.applyHitWhiplash(knockbackDir, knockbackForce);
      }
    }


    if (this.health <= 0) {
      this.die(fallType);
    }

    return { result: 'hit', damage: mitigatedAmount };
  }

  triggerKnockdown(duration = 1.4, knockbackDir = null, force = 20, fallType = 'default') {
    if (this.isDead || this.isBlocking || this.isInvulnerable) return;
    this.isKnockedDown = true;
    this.knockdownTimer = duration;

    // Multi-joint physical ragdoll tumbling with natural fall dynamics
    this.ragdoll.activate(knockbackDir, force, false, fallType);

    if (this.particles) this.particles.spawnSlidingDust(this.getPosition());
    if (this.renderer) this.renderer.addCameraShake(0.45);
  }

  die(fallType = 'default') {
    this.isDead = true;
    this.health = 0;
    this.ragdoll.activate(null, 18, true, fallType);
    if (this.audio) this.audio.playCrowdCheer();
  }

  flashDamage() {
    this.group.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive) {
        const mat = child.material;
        if (!mat.userData) mat.userData = {};
        if (mat.userData.origEmissiveHex === undefined) {
          mat.userData.origEmissiveHex = mat.emissive.getHex();
        }
        if (mat.userData.flashTimeout) {
          clearTimeout(mat.userData.flashTimeout);
        }
        // Frame 1: Bright white-hot impact spark (45ms)
        mat.emissive.setHex(0xffffff);
        mat.userData.flashTimeout = setTimeout(() => {
          if (mat && mat.emissive) {
            // Frame 2: Deep impact crimson burn (85ms)
            mat.emissive.setHex(0xb91c1c);
            mat.userData.flashTimeout = setTimeout(() => {
              if (mat && mat.emissive && mat.userData.origEmissiveHex !== undefined) {
                mat.emissive.setHex(mat.userData.origEmissiveHex);
                mat.userData.flashTimeout = null;
              }
            }, 85);
          }
        }, 45);
      }
    });
  }

  /**
   * Mutual Overlap Prevention:
   * Keeps the 2 dinosaurs cleanly separated so bodies NEVER clip through each other!
   */
  resolveOverlap(otherRig) {
    if (!otherRig || !otherRig.bodies.pelvis) return;
    const p1 = this.bodies.pelvis.position;
    const p2 = otherRig.bodies.pelvis.position;

    const dx = p1.x - p2.x;
    const dz = p1.z - p2.z;
    const dist = Math.hypot(dx, dz);
    const minSep = 4.2;

    if (dist < minSep) {
      const overlap = minSep - (dist > 0.001 ? dist : 0.001);
      const nx = dist > 0.001 ? dx / dist : Math.sin(this.currentRotation);
      const nz = dist > 0.001 ? dz / dist : Math.cos(this.currentRotation);

      if (this.isDead || this.isKnockedDown) {
        otherRig.bodies.pelvis.position.x -= nx * overlap;
        otherRig.bodies.pelvis.position.z -= nz * overlap;
      } else if (otherRig.isDead || otherRig.isKnockedDown) {
        this.bodies.pelvis.position.x += nx * overlap;
        this.bodies.pelvis.position.z += nz * overlap;
      } else {
        this.bodies.pelvis.position.x += nx * overlap * 0.5;
        this.bodies.pelvis.position.z += nz * overlap * 0.5;
        otherRig.bodies.pelvis.position.x -= nx * overlap * 0.5;
        otherRig.bodies.pelvis.position.z -= nz * overlap * 0.5;
      }

      // Cancel velocities directing into each other
      const relVx = this.bodies.pelvis.velocity.x - otherRig.bodies.pelvis.velocity.x;
      const relVz = this.bodies.pelvis.velocity.z - otherRig.bodies.pelvis.velocity.z;
      const dot = relVx * nx + relVz * nz;
      if (dot < 0) {
        this.bodies.pelvis.velocity.x -= dot * nx * 0.55;
        this.bodies.pelvis.velocity.z -= dot * nz * 0.55;
        otherRig.bodies.pelvis.velocity.x += dot * nx * 0.55;
        otherRig.bodies.pelvis.velocity.z += dot * nz * 0.55;
      }
    }
  }

  /**
   * Main Balancing & Physics Update
   * - Floor ground protection: Hard constraint prevents sinking
   * - Arena perimeter clamping: Bounces off colosseum walls
   * - Automatic stand-up: Gets up smoothly after ragdoll knockdowns
   * - Rapid stamina regeneration (35/sec)
   */
  updateBalancing(delta) {
    const pelvis = this.bodies.pelvis;
    if (!pelvis) return;

    // 1. Strict Arena Floor Protection: Hard constraint prevents penetrating below floor
    if (pelvis.position.y < 1.8) {
      pelvis.position.y = 1.8;
      if (pelvis.velocity.y < 0) pelvis.velocity.y = 0;
    }

    // Special Meter Charging (0 to 100% over 7 seconds)
    if (!this.isDead && !this.isExecutingSpecial && this.specialCharge < 100) {
      this.specialCharge = Math.min(100, this.specialCharge + (100 / this.specialChargeTime) * delta);
      if (this.specialCharge >= 100) {
        this.isSpecialReady = true;
      }
    }

    // Boss Magma Aura Embers
    if (this.isBoss && !this.isDead && Math.random() < 0.35) {
      if (this.particles) this.particles.spawnBossAura(this.getPosition());
    }

    // Status: Frozen Solid in Ice
    if (this.isFrozen) {
      this.frozenTimer -= delta;
      pelvis.velocity.set(0, 0, 0);
      if (this.frozenTimer <= 0) {
        this.unfreeze();
      }
      return;
    }

    // Status: Burning Tick Damage
    if (this.isBurning) {
      this.burningTimer -= delta;
      this.burningTickTimer -= delta;
      if (this.burningTickTimer <= 0) {
        this.burningTickTimer = 0.5;
        this.health = Math.max(0, this.health - 14);
        this.flashDamage();
        if (this.particles) this.particles.spawnBurningAura(this.getPosition(), 6);
        if (this.health <= 0) this.die();
      }
      if (this.burningTimer <= 0) {
        this.isBurning = false;
      }
    }

    // Status: Titan Scale Transformation
    if (this.isTitan) {
      this.titanTimer -= delta;
      const targetS = this.titanTimer > 0.4 ? 1.85 : 1.0;
      const curS = this.mesh.scale.x;
      const newS = THREE.MathUtils.lerp(curS, targetS, delta * 6);
      this.mesh.scale.set(newS, newS, newS);
      if (this.titanTimer <= 0) {
        this.isTitan = false;
        this.mesh.scale.set(1, 1, 1);
      }
    }


    // 2. Colosseum Perimeter Wall Clamping
    const distFromCenter = Math.hypot(pelvis.position.x, pelvis.position.z);
    const maxRadius = ARENA_RADIUS - 2.5;
    if (distFromCenter > maxRadius) {
      const angle = Math.atan2(pelvis.position.x, pelvis.position.z);
      pelvis.position.x = Math.sin(angle) * maxRadius;
      pelvis.position.z = Math.cos(angle) * maxRadius;
      pelvis.velocity.x *= -0.35;
      pelvis.velocity.z *= -0.35;
      this.knockbackVelocity.multiplyScalar(0.2);
      if (this.particles) this.particles.spawnHitSparks(this.getPosition(), 0xffffff);
      if (this.audio) this.audio.playHeavyHit(false);
    }

    // 3. Sustained Kinetic Slide Friction
    if (this.knockbackVelocity.lengthSq() > 0.01) {
      pelvis.velocity.x = THREE.MathUtils.lerp(pelvis.velocity.x, this.knockbackVelocity.x, 0.65);
      pelvis.velocity.z = THREE.MathUtils.lerp(pelvis.velocity.z, this.knockbackVelocity.z, 0.65);
      const frictionFactor = Math.pow(this.isKnockedDown ? 0.04 : 0.015, delta);
      this.knockbackVelocity.multiplyScalar(frictionFactor);
      if (this.knockbackVelocity.length() < 0.2) this.knockbackVelocity.set(0, 0, 0);
    }

    // 4. Automatic Stand-Up Recovery from Knockdown
    if (this.isKnockedDown) {
      this.knockdownTimer -= delta;
      if (this.knockdownTimer <= 0 && !this.isDead) {
        this.ragdoll.startRecovery(0.55);
        this.isKnockedDown = false;
        if (this.ui && this.isPlayer) {
          this.ui.showActionBanner('AUTOMATIC STAND UP!');
        }
      }
    }

    // 5. Ragdoll Joint Simulation (updates active tumbling or hit whiplash)
    if (this.ragdoll) {
      this.ragdoll.update(delta, pelvis.position);
    }

    // 6. Rapid Stamina Regeneration (35 / sec)
    if (this.stamina < this.stats.maxStamina && !this.isBlocking) {
      this.stamina = Math.min(this.stats.maxStamina, this.stamina + 35 * delta);
    }

    if (this.stunTimer > 0) this.stunTimer -= delta;
    if (this.hitImmunityTimer > 0) this.hitImmunityTimer -= delta;
    if (this.slideTimer > 0) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) this.isInvulnerable = false;
    }

    // 7. Update Procedural Animation
    const horizSpeed = Math.hypot(pelvis.velocity.x, pelvis.velocity.z);
    const isMoving = horizSpeed > 0.25 && !this.isKnockedDown && this.knockbackVelocity.length() < 3.0;
    const isJumping = !this.isGrounded();

    if (!this.ragdoll.isActive) {
      this.animator.update(delta, isMoving, horizSpeed, isJumping, this.isGrounded());
    }
  }

  syncMeshes() {
    const pelvis = this.bodies.pelvis;
    if (!pelvis) return;

    // Elevation during ragdoll knockdown
    let floorLift = 0;
    if (this.ragdoll && this.ragdoll.isActive) {
      const roll = Math.abs(this.ragdoll.nodes.root.rot.z);
      const pitch = Math.abs(this.ragdoll.nodes.root.rot.x);
      floorLift = Math.sin(Math.min(Math.PI / 2, roll)) * 1.35 + Math.sin(Math.min(Math.PI / 2, pitch)) * 0.4;
    }

    // Sync Root 3D Mesh
    this.mesh.position.x = pelvis.position.x;
    this.mesh.position.y = Math.max(0, pelvis.position.y - 1.8) + floorLift;
    this.mesh.position.z = pelvis.position.z;
    this.mesh.rotation.y = this.currentRotation;

    // Active Mouse Drag compliance on visual joints
    if (this.isBeingDragged && this.dragTargetPos && !this.isDead && !this.isKnockedDown) {
      this.applyDragPose();
    }

    // Sync sub-bodies to current dinosaur joint positions
    this.syncSubBodies();
  }

  destroy() {
    try {
      this.releaseBiteGrab();
      this.group.traverse((child) => {
        if (child.isMesh && child.material) {
          if (child.material.userData?.flashTimeout) {
            clearTimeout(child.material.userData.flashTimeout);
          }
          if (child.material.userData?.origEmissiveHex !== undefined && child.material.emissive) {
            child.material.emissive.setHex(child.material.userData.origEmissiveHex);
          }
        }
      });
      if (this.mesh) this.group.remove(this.mesh);
      this.scene.remove(this.group);
      for (const name in this.bodies) {
        this.world.removeBody(this.bodies[name]);
      }
    } catch (e) {}
  }

  dispose() {
    this.destroy();
  }
}
