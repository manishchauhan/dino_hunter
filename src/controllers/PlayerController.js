import * as THREE from 'three';

export class PlayerController {
  constructor(dinosaur, targetDino = null, camera = null, particles = null, onCameraSwitch = null) {
    this.dino = dinosaur;
    this.target = targetDino;
    this.camera = camera;
    this.particles = particles;
    this.onCameraSwitch = onCameraSwitch;

    this.keys = {};
    this.virtualSprint = false;
    this.targetDest = null;
    this.isPointerDown = false;

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.groundHit = new THREE.Vector3();
    this.mouseNDC = new THREE.Vector2();
    this.camDir = new THREE.Vector3();

    this.setupListeners();
  }

  setDinosaur(dino, target = null) {
    this.dino = dino;
    if (target) this.target = target;
    this.targetDest = null;
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => { this.isPointerDown = false; });

    window.addEventListener('contextmenu', (e) => {
      if (!this.isUIElement(e.target)) {
        e.preventDefault();
        // Right click activates quick slide dodge!
        this.triggerSlide();
      }
    });
  }

  isUIElement(el) {
    return !!el.closest('#combat-hud, #controls-bar, #quick-options, #action-buttons-hud, .overlay');
  }

  updateGroundRay(e) {
    if (!this.camera) return false;
    this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    return !!this.raycaster.ray.intersectPlane(this.groundPlane, this.groundHit);
  }

  onPointerDown(e) {
    if (this.isUIElement(e.target) || !this.updateGroundRay(e)) return;
    this.isPointerDown = true;

    // Check if clicked directly on/near opponent to trigger distance auto-attack
    if (this.target && !this.target.isDead) {
      const oppPos = this.target.getPosition();
      const distToOpp = Math.hypot(this.groundHit.x - oppPos.x, this.groundHit.z - oppPos.z);
      if (distToOpp < 5.0) {
        const myDist = this.dino.getPosition().distanceTo(oppPos);
        if (myDist < 16.0) {
          this.triggerAttack1();
          return;
        }
      }
    }

    // Set destination and pivot to move
    this.targetDest = { x: this.groundHit.x, z: this.groundHit.z };
    const pPos = this.dino.getPosition();
    const dx = this.groundHit.x - pPos.x;
    const dz = this.groundHit.z - pPos.z;
    if (Math.hypot(dx, dz) > 0.4) {
      this.dino.currentRotation = Math.atan2(dx, dz);
      this.dino.mesh.rotation.y = this.dino.currentRotation;
      if (this.particles) this.particles.spawnFootstepDust(pPos);
    }
    if (this.particles) this.particles.spawnMoveMarker(this.groundHit);
  }

  onPointerMove(e) {
    if (this.isUIElement(e.target) || !this.updateGroundRay(e)) return;
    if (this.isPointerDown) {
      this.targetDest = { x: this.groundHit.x, z: this.groundHit.z };
    } else if (this.dino && !this.targetDest) {
      const pPos = this.dino.getPosition();
      const angle = Math.atan2(this.groundHit.x - pPos.x, this.groundHit.z - pPos.z);
      let diff = angle - this.dino.currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 0.05) {
        this.dino.currentRotation += Math.sign(diff) * Math.min(Math.abs(diff), 0.15);
        this.dino.mesh.rotation.y = this.dino.currentRotation;
      }
    }
  }

  onKeyDown(e) {
    const k = e.key ? e.key.toLowerCase() : '';
    const code = e.code || '';
    this.keys[code] = true;
    this.keys[k] = true;

    if (code === 'Space' || k === ' ') {
      e.preventDefault();
      this.triggerAttack1();
    } else if (code === 'KeyF' || k === 'f' || code === 'Enter' || k === 'enter') {
      e.preventDefault();
      this.triggerAttack2();
    } else if (code === 'KeyC' || k === 'c' || code === 'KeyV' || k === 'v') {
      e.preventDefault();
      this.triggerSlide();
    } else if (code === 'KeyJ' || k === 'j') {
      e.preventDefault();
      this.triggerJump();
    } else if (code === 'KeyG' || k === 'g') {
      e.preventDefault();
      this.setBlock(true);
    } else if (code === 'KeyR' || k === 'r') {
      e.preventDefault();
      this.triggerRoar();
    } else if (code === 'KeyX' || k === 'x') {
      e.preventDefault();
      if (this.onCameraSwitch) this.onCameraSwitch();
    }
  }

  onKeyUp(e) {
    const k = e.key ? e.key.toLowerCase() : '';
    const code = e.code || '';
    this.keys[code] = false;
    this.keys[k] = false;

    if (code === 'KeyG' || k === 'g') {
      this.setBlock(false);
    }
  }

  /**
   * Primary Strike: automatically selects maneuver based on distance to enemy!
   */
  triggerAttack1() {
    this.targetDest = null;
    const isSprinting = this.virtualSprint || !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['shift']);
    if (this.dino) this.dino.triggerContextualAttack(this.target, isSprinting);
  }

  triggerAttack2() {
    this.targetDest = null;
    if (this.dino) this.dino.triggerAttack2(this.target);
  }

  triggerSlide() {
    if (this.dino) this.dino.triggerSlide();
  }

  triggerJump() {
    if (this.dino) this.dino.triggerJump();
  }

  setBlock(active) {
    if (this.dino) this.dino.setBlocking(active);
  }

  triggerRoar() {
    if (this.dino) this.dino.triggerRoar();
  }

  setVirtualSprint(val) {
    this.virtualSprint = val;
  }

  update(delta) {
    if (!this.dino || this.dino.isDead) return;
    const isSprinting = this.virtualSprint || !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['shift']);

    // Mouse / Touch Click & Drag to Move
    if (this.targetDest) {
      const pPos = this.dino.getPosition();
      const dx = this.targetDest.x - pPos.x;
      const dz = this.targetDest.z - pPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.8) {
        const sprint = isSprinting || dist > 4.5;
        this.dino.applyDirectionalMovement(dx / dist, dz / dist, sprint, delta);
        return;
      } else {
        if (!this.isPointerDown) {
          this.targetDest = null;
          this.dino.applyDirectionalMovement(0, 0, false, delta);
        }
      }
    }

    // Keyboard Movement: WASD / Arrow Keys
    let forward = 0;
    let right = 0;
    if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['w']) forward += 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['s']) forward -= 1;
    if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['a']) right -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['d']) right += 1;

    let moveX = right;
    let moveZ = -forward;
    if (this.camera && (forward !== 0 || right !== 0)) {
      this.targetDest = null;
      this.camera.getWorldDirection(this.camDir);
      this.camDir.y = 0;
      this.camDir.normalize();
      moveX = forward * this.camDir.x + right * (-this.camDir.z);
      moveZ = forward * this.camDir.z + right * this.camDir.x;
    }

    this.dino.applyDirectionalMovement(moveX, moveZ, isSprinting, delta);
  }
}
