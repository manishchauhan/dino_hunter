import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Mouse Raycaster & Kinematic Physics Constraint Controller
 * 
 * Provides game-like cursor-driven physics manipulation:
 * - Controlled Head Drag & Lunge: Capped at 900N with max distance clamping to prevent jerking too fast.
 * - Right-Click Swipe / Fast Touch Swipe: Controlled angular momentum for tail whipping.
 * - Hybrid Directional WASD Footwork: Moves cleanly in facing direction with velocity-driven propulsion.
 * - Visual 3D Tension Line: Catenary curve with strain color feedback and ground target reticle.
 * - Mobile Touch Parity: Pointer events and on-screen controls for seamless mobile play.
 */
export class PhysicsMouseController {
  constructor(canvas, camera, scene, physicsWorld, ragdollRig, options = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.world = physicsWorld.world;
    this.ragdoll = ragdollRig;
    this.opponentRig = options.opponentRig || null;

    this.options = {
      dragForceLimit: 900,     // Controlled, muscular pull without flying
      tailWhipThreshold: 80,   // pixels/second for swipe
      maxDragDistance: 3.2,    // Maximum pull anchor distance
      ...options
    };

    // State
    this.isDraggingHead = false;
    this.isRightClickDown = false;
    this.dragConstraint = null;
    this.mouseCoords = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.6);
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.targetPoint3D = new THREE.Vector3();
    this.lastPointerPos = { x: 0, y: 0, time: performance.now() };
    this.swipeVelocity = { x: 0, z: 0 };
    this.currentStrain = 0;
    this.touchMode = 'head';
    this.isCombatLocked = false;

    // Keyboard Keys
    this.keys = {};

    // 1. Kinematic Mouse Anchor Body in Cannon.js
    this.mouseBody = new CANNON.Body({
      type: CANNON.Body.KINEMATIC,
      mass: 0,
      collisionFilterMask: 0
    });
    this.mouseBody.position.set(0, 2.65, 0);
    this.world.addBody(this.mouseBody);

    // 2. Visual 3D Tension Tether Line
    this.initVisualTether();

    // 3. Ground Target Reticle
    this.initTargetReticle();

    // 4. Setup Input Listeners
    this.setupListeners();
  }

  setOpponent(opponentRig) {
    this.opponentRig = opponentRig;
  }

  initVisualTether() {
    const numPoints = 20;
    const positions = new Float32Array(numPoints * 3);
    const colors = new Float32Array(numPoints * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.tetherMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.tetherLine = new THREE.Line(geo, this.tetherMaterial);
    this.tetherLine.visible = false;
    this.scene.add(this.tetherLine);
  }

  initTargetReticle() {
    this.reticleGroup = new THREE.Group();

    const ringGeo = new THREE.RingGeometry(0.85, 1.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.reticleRing = new THREE.Mesh(ringGeo, ringMat);
    this.reticleRing.rotation.x = -Math.PI / 2;
    this.reticleGroup.add(this.reticleRing);

    const coreGeo = new THREE.CircleGeometry(0.35, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = -Math.PI / 2;
    this.reticleGroup.add(core);

    this.reticleGroup.visible = false;
    this.scene.add(this.reticleGroup);
  }

  setupListeners() {
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));

    // Keyboard Hybrid Controls
    window.addEventListener('keydown', (e) => {
      if (this.isCombatLocked) return;
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerPrimaryAttack();
      } else if (e.code === 'KeyF' || e.code === 'Enter') {
        e.preventDefault();
        this.triggerTailWhip();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        this.triggerSlideDodge();
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        this.ragdoll?.triggerJump();
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        if (this.ragdoll) {
          this.ragdoll.isBlocking = !this.ragdoll.isBlocking;
          if (this.ragdoll.isBlocking) {
            this.ragdoll.animator?.playAction('block', 999);
          } else {
            this.ragdoll.animator?.resetPose();
            this.ragdoll.animator.state = 'idle';
          }
        }
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        this.triggerSpecialAbility();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.ragdoll?.triggerRoar(this.opponentRig);
      } else if (e.code === 'KeyQ') {
        this.ragdoll?.triggerRoar(this.opponentRig);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  triggerPrimaryAttack() {
    if (this.isCombatLocked || !this.ragdoll || this.ragdoll.isDead || this.ragdoll.isKnockedDown) return;
    this.ragdoll.executeStrike('bite', this.opponentRig);
  }

  triggerTailWhip() {
    if (this.isCombatLocked || !this.ragdoll || this.ragdoll.isDead || this.ragdoll.isKnockedDown) return;
    this.ragdoll.executeStrike('heavy', this.opponentRig);
  }

  triggerSlideDodge() {
    if (this.isCombatLocked || !this.ragdoll || this.ragdoll.isDead || this.ragdoll.isKnockedDown || this.ragdoll.stamina < 10) return;
    this.ragdoll.stamina -= 10;
    this.ragdoll.slideTimer = 0.45;
    this.ragdoll.isInvulnerable = true;

    const rot = this.ragdoll.getRotation();
    const speed = (this.ragdoll.stats.sprintSpeed || 8.5) * 1.35;
    this.ragdoll.bodies.pelvis.velocity.x = Math.sin(rot) * speed;
    this.ragdoll.bodies.pelvis.velocity.z = Math.cos(rot) * speed;

    this.ragdoll.animator?.playAction('slide', 0.45);
    if (this.ragdoll.audio) this.ragdoll.audio.playWhiff();
    if (this.ragdoll.particles) this.ragdoll.particles.spawnSlidingDust(this.ragdoll.getPosition());
  }

  triggerSpecialAbility() {
    if (this.isCombatLocked || !this.ragdoll || this.ragdoll.isDead || this.ragdoll.isKnockedDown) return;
    if (this.ragdoll.specialCharge < 100) {
      if (this.ragdoll.ui) {
        this.ragdoll.ui.showActionBanner(`⚡ ${this.ragdoll.ability.name} CHARGING... [${Math.floor(this.ragdoll.specialCharge)}%]`);
      }
      return;
    }
    this.ragdoll.triggerSpecialAbility(this.opponentRig);
  }

  updateRaycastIntersection(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseCoords.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseCoords.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseCoords, this.camera);
    const hit = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(this.dragPlane, hit)) {
      this.targetPoint3D.copy(hit);
      return true;
    }
    return false;
  }

  onPointerDown(e) {
    if (this.isCombatLocked) return;
    this.updateRaycastIntersection(e.clientX, e.clientY);
    this.lastPointerPos = { x: e.clientX, y: e.clientY, time: performance.now() };

    if (e.button === 2 || this.touchMode === 'tail') {
      this.isRightClickDown = true;
      return;
    }

    if (e.button === 0 || e.pointerType === 'touch') {
      this.attachHeadDragConstraint();
    }
  }

  attachHeadDragConstraint() {
    if (!this.ragdoll || this.ragdoll.isDead) return;
    const headBody = this.ragdoll.bodies.head;
    if (!headBody) return;

    this.updateClampedMouseAnchor();
    this.detachHeadDragConstraint();

    this.dragConstraint = new CANNON.PointToPointConstraint(
      headBody,
      new CANNON.Vec3(0, 0, 0.6),
      this.mouseBody,
      new CANNON.Vec3(0, 0, 0),
      this.options.dragForceLimit
    );
    this.world.addConstraint(this.dragConstraint);

    this.isDraggingHead = true;
    this.tetherLine.visible = true;
    this.reticleGroup.visible = true;

    // Jaw slightly drops open during drag
    const jaw = this.ragdoll.bodies.jaw;
    if (jaw) jaw.applyImpulse(new CANNON.Vec3(0, -35, 0), jaw.position);
  }

  detachHeadDragConstraint() {
    if (this.dragConstraint) {
      try {
        this.world.removeConstraint(this.dragConstraint);
      } catch (e) {}
      this.dragConstraint = null;
    }
    this.isDraggingHead = false;
    this.tetherLine.visible = false;
    this.reticleGroup.visible = false;
    this.currentStrain = 0;
    if (this.ragdoll) {
      this.ragdoll.releaseActiveDrag();
    }

    // Jaw snaps shut with kinetic clamping impulse on release
    if (this.ragdoll && !this.ragdoll.isDead) {
      const jaw = this.ragdoll.bodies.jaw;
      if (jaw) {
        jaw.applyImpulse(new CANNON.Vec3(0, 75, 0), jaw.position);
      }
      this.ragdoll.isPreparingGrab = true;
      setTimeout(() => {
        if (this.ragdoll) this.ragdoll.isPreparingGrab = false;
      }, 350);
    }
  }

  updateClampedMouseAnchor() {
    const headBody = this.ragdoll.bodies.head;
    if (!headBody) return;

    const headPos = headBody.position;
    const rawDx = this.targetPoint3D.x - headPos.x;
    const rawDz = this.targetPoint3D.z - headPos.z;
    const dist = Math.hypot(rawDx, rawDz);
    const maxRadius = this.options.maxDragDistance;

    let anchorX = this.targetPoint3D.x;
    let anchorZ = this.targetPoint3D.z;

    if (dist > maxRadius) {
      const scale = maxRadius / dist;
      anchorX = headPos.x + rawDx * scale;
      anchorZ = headPos.z + rawDz * scale;
    }

    this.mouseBody.position.set(anchorX, this.targetPoint3D.y, anchorZ);
  }

  onPointerMove(e) {
    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastPointerPos.time) / 1000);
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;

    this.updateRaycastIntersection(e.clientX, e.clientY);

    if (this.ragdoll && !this.ragdoll.isDead) {
      this.ragdoll.setFacingTarget(this.targetPoint3D);
    }

    if (this.isDraggingHead) {
      this.updateClampedMouseAnchor();
    }

    // Right-Click Swipe detection for Tail Whip
    if (this.isRightClickDown && this.ragdoll && !this.ragdoll.isDead) {
      const swipeSpeed = Math.hypot(dx, dy) / dt;
      if (swipeSpeed > this.options.tailWhipThreshold) {
        const worldDir = new THREE.Vector3(dx, 0, dy).normalize();
        this.ragdoll.applyTailWhip(worldDir, Math.min(1.4, swipeSpeed / 450));
      }
    }

    this.lastPointerPos = { x: e.clientX, y: e.clientY, time: now };
  }

  onPointerUp(e) {
    if (e.button === 2 || this.isRightClickDown) {
      this.isRightClickDown = false;
    }

    if (this.isDraggingHead) {
      this.detachHeadDragConstraint();
    }
  }

  update(delta) {
    if (!this.ragdoll || this.ragdoll.isDead) return;

    if (this.isCombatLocked) {
      if (this.tetherLine) this.tetherLine.visible = false;
      if (this.reticleGroup) this.reticleGroup.visible = false;
      this.currentStrain = 0;
      // Keep firm upright stance during countdown
      this.ragdoll.applyFootwork(0, 0, false, delta);
      return;
    }

    // Camera-Relative Directional Locomotion (Intuitive AAA Third-Person Controls)
    let inputForward = 0;
    let inputRight = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputForward -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputRight -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputRight += 1;

    let worldMoveX = 0;
    let worldMoveZ = 0;

    if (inputForward !== 0 || inputRight !== 0) {
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      camDir.y = 0;
      const camLen = Math.hypot(camDir.x, camDir.z);
      if (camLen > 0.001) {
        camDir.x /= camLen;
        camDir.z /= camLen;
      } else {
        camDir.set(0, 0, -1);
      }

      // Camera right vector in horizontal plane
      const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);

      worldMoveX = camDir.x * inputForward + camRight.x * inputRight;
      worldMoveZ = camDir.z * inputForward + camRight.z * inputRight;

      const len = Math.hypot(worldMoveX, worldMoveZ);
      if (len > 0.001) {
        worldMoveX /= len;
        worldMoveZ /= len;
      }
    }

    // Mouse drag forward assist: pulling mouse forward guides dinosaur dynamically
    if (this.isDraggingHead) {
      const headPos = this.ragdoll.getHeadPosition();
      const pdx = this.mouseBody.position.x - headPos.x;
      const pdz = this.mouseBody.position.z - headPos.z;
      const pDist = Math.hypot(pdx, pdz);
      if (pDist > 0.8) {
        worldMoveX += (pdx / pDist) * 1.0;
        worldMoveZ += (pdz / pDist) * 1.0;
      }
    }

    // Continuously apply footwork so stopping traction firmly stops dinosaur without sliding
    const isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    this.ragdoll.applyFootwork(worldMoveX, worldMoveZ, isSprinting, delta);

    const headBody = this.ragdoll.bodies.head;
    if (!headBody) return;

    // Visual Tension Line & Reticle
    if (this.isDraggingHead) {
      const headPos = headBody.position;
      const targetPos = this.mouseBody.position;

      const dist = Math.hypot(targetPos.x - headPos.x, targetPos.y - headPos.y, targetPos.z - headPos.z);
      this.currentStrain = dist;
      if (this.ragdoll) {
        this.ragdoll.setActiveDrag(this.mouseBody.position, this.currentStrain);
      }

      const color = new THREE.Color();
      if (dist < 1.0) {
        color.setHSL(0.5, 1.0, 0.55); // Cyan
      } else if (dist < 2.5) {
        const t = (dist - 1.0) / 1.5;
        color.setHSL(0.5 - t * 0.38, 1.0, 0.5); // Cyan -> Gold
      } else {
        const pulse = Math.sin(performance.now() * 0.015) * 0.15;
        color.setHSL(0.98, 1.0, 0.5 + pulse); // Flashing Crimson
      }

      const positions = this.tetherLine.geometry.attributes.position.array;
      const colors = this.tetherLine.geometry.attributes.color.array;
      const numPoints = positions.length / 3;

      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const sag = Math.sin(t * Math.PI) * Math.min(0.4, dist * 0.12);

        positions[i * 3] = THREE.MathUtils.lerp(headPos.x, targetPos.x, t);
        positions[i * 3 + 1] = THREE.MathUtils.lerp(headPos.y, targetPos.y, t) - sag;
        positions[i * 3 + 2] = THREE.MathUtils.lerp(headPos.z, targetPos.z, t);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      this.tetherLine.geometry.attributes.position.needsUpdate = true;
      this.tetherLine.geometry.attributes.color.needsUpdate = true;

      this.reticleGroup.position.set(targetPos.x, 0.05, targetPos.z);
      this.reticleRing.rotation.z += delta * 3.5;
      this.reticleRing.scale.setScalar(1.0 + Math.sin(performance.now() * 0.008) * 0.12);
      this.reticleRing.material.color.copy(color);
    }
  }

  setTouchMode(mode) {
    this.touchMode = mode;
  }
}
