import * as THREE from 'three';

/**
 * Realistic Multi-Joint Active Physics Ragdoll System for Dinosaurs
 * 
 * Provides:
 * - Dynamic hit whiplash compliance on every strike (head, neck, jaw, tail spring reaction)
 * - Full physical tumbling for knockdowns and death with momentum, angular spin, ground bounces
 * - Natural sprawling limb kinematics on the arena surface
 * - Smooth, authentic stand-up recovery with leg-plant and upright righting
 */
export class DinosaurRagdoll {
  constructor(joints, type = 'trex') {
    this.j = joints;
    this.type = type;

    this.isActive = false;
    this.isDead = false;
    this.settleTime = 0;
    this.recoveryTimer = 0;
    this.recoveryDuration = 0.55;
    this.isRecovering = false;

    // Whiplash secondary physics state (used during non-knockdown hits)
    this.whiplashIntensity = 0;
    this.whiplashDir = new THREE.Vector3();
    this.whiplashTimer = 0;

    // Physical state for joints: Root, Torso, Neck, Head, Jaw, LeftLeg, RightLeg, Tail1, Tail2
    this.nodes = {
      root: { pos: new THREE.Vector3(), rot: new THREE.Euler(), vel: new THREE.Vector3(), angVel: new THREE.Vector3() },
      torso: { pos: new THREE.Vector3(0, 3.0, 0), rot: new THREE.Euler(), vel: new THREE.Vector3(), angVel: new THREE.Vector3() },
      neck: { rot: new THREE.Euler(), angVel: new THREE.Vector3() },
      head: { pos: new THREE.Vector3(0, 0.2, 1.0), rot: new THREE.Euler(), vel: new THREE.Vector3(), angVel: new THREE.Vector3() },
      jaw: { rot: new THREE.Euler(), angVel: new THREE.Vector3() },
      leftLeg: { rot: new THREE.Euler(), angVel: new THREE.Vector3() },
      rightLeg: { rot: new THREE.Euler(), angVel: new THREE.Vector3() },
      tail1: { rot: new THREE.Euler(), angVel: new THREE.Vector3() },
      tail2: { rot: new THREE.Euler(), angVel: new THREE.Vector3() }
    };

    // Stored pose for smooth blend-in and blend-out
    this.savedPose = {};
  }

  /**
   * Applies energetic physical whiplash compliance on non-knockdown hits
   * Head snaps back, neck curves, tail springs with secondary physics
   */
  applyHitWhiplash(impactDir, force = 10) {
    if (this.isActive) return;
    const dir = impactDir ? impactDir.clone().normalize() : new THREE.Vector3(0, 0, -1);
    this.whiplashIntensity = Math.min(1.8, Math.max(0.4, force * 0.08));
    this.whiplashDir.copy(dir);
    this.whiplashTimer = 0.32;

    this.nodes.head.angVel.set(-dir.z * 12 * this.whiplashIntensity, -dir.x * 8, (Math.random() - 0.5) * 6);
    this.nodes.neck.angVel.set(-dir.z * 8 * this.whiplashIntensity, 0, (Math.random() - 0.5) * 4);
    this.nodes.jaw.angVel.set(10.0 * this.whiplashIntensity, 0, 0);
    this.nodes.tail1.angVel.set(0, (Math.random() - 0.5) * 16 * this.whiplashIntensity, 0);
    this.nodes.tail2.angVel.set(0, (Math.random() - 0.5) * 22 * this.whiplashIntensity, 0);
  }

  /**
   * Activates full physics ragdoll tumbling upon knockdown or death
   */
  activate(impulseDir = null, force = 22, isDead = false, fallType = 'default') {
    this.isActive = true;
    this.isDead = isDead;
    this.settleTime = 0;
    this.isRecovering = false;
    this.recoveryTimer = 0;

    for (const key in this.j) {
      if (this.j[key]) {
        this.savedPose[key] = {
          rot: this.j[key].rotation.clone(),
          pos: this.j[key].position.clone()
        };
      }
    }

    const dir = impulseDir ? impulseDir.clone().normalize() : new THREE.Vector3(0, 0, -1);
    const sideSpin = (Math.random() - 0.5) * 14;

    this.nodes.root.rot.set(0, 0, 0);

    // ========================================================
    // NATURAL PHYSICS KNOCKDOWN DYNAMICS PER ATTACK TYPE
    // ========================================================
    if (fallType === 'horn_lift') {
      // 1. HORN GORE & LIFT (Ceratopsians): Explosive upward toss, backflips into the air, crashes on back!
      this.nodes.root.vel.set(dir.x * force * 0.65, Math.max(7.5, force * 0.58), dir.z * force * 0.65);
      this.nodes.root.angVel.set(dir.z * 15.0, (Math.random() - 0.5) * 6, -dir.x * 15.0);
      this.nodes.torso.angVel.set(dir.z * 12.0, 0, -dir.x * 12.0);
      this.nodes.head.angVel.set(dir.z * 18.0, 0, -dir.x * 18.0);
      this.nodes.jaw.angVel.set(16.0, 0, 0);
      this.nodes.leftLeg.angVel.set(14.0, 0, 8.0);
      this.nodes.rightLeg.angVel.set(14.0, 0, -8.0);
      this.nodes.tail1.angVel.set(-10.0, 0, 0);
      this.nodes.tail2.angVel.set(-15.0, 0, 0);

    } else if (fallType === 'leg_sweep' || fallType === 'tail_club') {
      // 2. TAIL CLUB / THAGOMIZER SWEEP: Legs swept out from under, violent 360° horizontal helicopter spin!
      const spinDir = sideSpin >= 0 ? 1 : -1;
      this.nodes.root.rot.set(0, 0, spinDir * 1.15);
      this.nodes.root.vel.set(dir.x * force * 0.9, 1.8, dir.z * force * 0.9);
      this.nodes.root.angVel.set(0, spinDir * 24.0, spinDir * 9.0);
      this.nodes.torso.angVel.set(0, spinDir * 20.0, spinDir * 6.0);
      this.nodes.head.angVel.set(0, spinDir * 28.0, 0);
      this.nodes.jaw.angVel.set(10.0, 0, 0);
      this.nodes.leftLeg.angVel.set(-spinDir * 12.0, spinDir * 16.0, 0);
      this.nodes.rightLeg.angVel.set(spinDir * 12.0, spinDir * 16.0, 0);
      this.nodes.tail1.angVel.set(0, -spinDir * 26.0, 0);
      this.nodes.tail2.angVel.set(0, -spinDir * 32.0, 0);

    } else if (fallType === 'crush_down' || fallType === 'skull_slam') {
      // 3. SKULL AXE / HEAVY JAW CHOMP: Downward crushing force, head slams floor first, face-plant stumble!
      this.nodes.root.rot.set(-0.35, 0, 0);
      this.nodes.root.vel.set(dir.x * force * 0.45, -5.5, dir.z * force * 0.45);
      this.nodes.root.angVel.set(-dir.z * 16.0, 0, dir.x * 16.0);
      this.nodes.torso.angVel.set(-dir.z * 14.0, 0, dir.x * 14.0);
      this.nodes.head.angVel.set(-dir.z * 22.0, 0, dir.x * 22.0);
      this.nodes.jaw.angVel.set(20.0, 0, 0);
      this.nodes.leftLeg.angVel.set(-8.0, 0, 6.0);
      this.nodes.rightLeg.angVel.set(-8.0, 0, -6.0);
      this.nodes.tail1.angVel.set(16.0, 0, 0);
      this.nodes.tail2.angVel.set(22.0, 0, 0);

    } else if (fallType === 'pounce_tackle' || fallType === 'charge') {
      // 4. BULL CHARGE / RAPTOR POUNCE: Blown backward at high velocity, end-over-end rolling tumble!
      this.nodes.root.vel.set(dir.x * force * 1.35, Math.max(3.2, force * 0.25), dir.z * force * 1.35);
      this.nodes.root.angVel.set(dir.z * 11.0, sideSpin * 0.8, -dir.x * 11.0);
      this.nodes.torso.angVel.set((Math.random() - 0.5) * 8, sideSpin * 0.6, (Math.random() - 0.5) * 8);
      this.nodes.head.angVel.set(-dir.z * 18.0, -dir.x * 14.0, 0);
      this.nodes.jaw.angVel.set(14.0, 0, 0);
      this.nodes.leftLeg.angVel.set(dir.z * 12.0, 0, 9.0);
      this.nodes.rightLeg.angVel.set(-dir.z * 12.0, 0, -9.0);
      this.nodes.tail1.angVel.set(0, -sideSpin * 3.0, 0);
      this.nodes.tail2.angVel.set(0, -sideSpin * 4.2, 0);

    } else {
      // 5. DEFAULT KINETIC IMPACT
      this.nodes.root.vel.set(dir.x * force, Math.max(3.8, force * 0.28), dir.z * force);
      this.nodes.root.angVel.set(dir.z * 6.0, sideSpin * 0.5, -dir.x * 7.5);
      this.nodes.torso.angVel.set((Math.random() - 0.5) * 5, sideSpin * 0.4, (Math.random() - 0.5) * 5);
      this.nodes.head.angVel.set(-dir.z * 14, -dir.x * 10, (Math.random() - 0.5) * 8);
      this.nodes.jaw.angVel.set(12.0, 0, 0);
      this.nodes.leftLeg.angVel.set(dir.z * 8, 0, (Math.random() + 0.5) * 8);
      this.nodes.rightLeg.angVel.set(-dir.z * 8, 0, -(Math.random() + 0.5) * 8);
      this.nodes.tail1.angVel.set(0, -sideSpin * 2.2, 0);
      this.nodes.tail2.angVel.set(0, -sideSpin * 3.2, 0);
    }
  }

  /**
   * Initiates getting up from the ground once knockdown duration expires
   */
  startRecovery(duration = 0.55) {
    if (this.isDead) return;
    this.isRecovering = true;
    this.recoveryTimer = 0;
    this.recoveryDuration = duration;
  }

  /**
   * Updates physical ragdoll simulation step
   */
  update(delta, currentBodyPos) {
    // 1. Non-knockdown secondary hit whiplash physics
    if (!this.isActive && this.whiplashTimer > 0) {
      this.whiplashTimer -= delta;
      const t = Math.max(0, this.whiplashTimer / 0.32);
      const spring = Math.sin((1 - t) * Math.PI * 4) * Math.exp(-(1 - t) * 5.0) * this.whiplashIntensity;

      if (this.j.neck) {
        this.j.neck.rotation.x += -this.whiplashDir.z * spring * 0.4;
        this.j.neck.rotation.y += -this.whiplashDir.x * spring * 0.4;
      }
      if (this.j.head) {
        this.j.head.rotation.x += -this.whiplashDir.z * spring * 0.6;
        this.j.head.rotation.y += -this.whiplashDir.x * spring * 0.6;
      }
      if (this.j.jaw) {
        this.j.jaw.rotation.x = Math.max(0, this.j.jaw.rotation.x + spring * 0.5);
      }
      if (this.j.tail1) {
        this.j.tail1.rotation.y += spring * 0.8;
      }
      if (this.j.tail2) {
        this.j.tail2.rotation.y += spring * 1.2;
      }
      return;
    }

    if (!this.isActive) return;

    // 2. Stand-up recovery blend
    if (this.isRecovering) {
      this.recoveryTimer += delta;
      const t = Math.min(1, this.recoveryTimer / this.recoveryDuration);
      const ease = 1 - Math.pow(1 - t, 3); // Cubic ease out

      // Smoothly blend root roll & pitch back to upright 0
      if (this.j.root) {
        this.j.root.rotation.z = THREE.MathUtils.lerp(this.nodes.root.rot.z, 0, ease);
        this.j.root.rotation.x = THREE.MathUtils.lerp(this.nodes.root.rot.x, 0, ease);
      }

      // Blend limbs back to neutral standing
      ['neck', 'head', 'jaw', 'leftLeg', 'rightLeg', 'frontLegL', 'frontLegR', 'tail1', 'tail2'].forEach((k) => {
        if (this.j[k] && this.nodes[k]) {
          this.j[k].rotation.x = THREE.MathUtils.lerp(this.nodes[k].rot.x, 0, ease);
          this.j[k].rotation.y = THREE.MathUtils.lerp(this.nodes[k].rot.y, 0, ease);
          this.j[k].rotation.z = THREE.MathUtils.lerp(this.nodes[k].rot.z, 0, ease);
        }
      });

      if (this.j.head && this.nodes.head.pos) {
        this.j.head.position.lerp(new THREE.Vector3(0, 0.2, 1.0), ease);
      }

      if (t >= 1) {
        this.isActive = false;
        this.isRecovering = false;
      }
      return;
    }

    // 3. Active tumbling ragdoll simulation
    this.settleTime += delta;
    const gravity = -32;
    const groundY = 0;
    const groundFriction = 0.82;
    const angularDamping = 0.88;

    // Root tumbling physics
    const root = this.nodes.root;
    root.vel.y += gravity * delta;
    root.pos.addScaledVector(root.vel, delta);

    root.rot.x += root.angVel.x * delta;
    root.rot.y += root.angVel.y * delta;
    root.rot.z += root.angVel.z * delta;
    root.angVel.multiplyScalar(angularDamping);

    // Torso ground bounce & settle limits
    if (root.pos.y <= groundY) {
      root.pos.y = groundY;
      if (root.vel.y < -1.5) {
        root.vel.y = -root.vel.y * 0.28;
      } else {
        root.vel.y = 0;
      }
      root.vel.x *= groundFriction;
      root.vel.z *= groundFriction;
      root.angVel.multiplyScalar(0.75);
    }

    // Lie flat on side/back on the dirt (approx 85 - 90 degrees roll)
    const targetRoll = Math.sign(root.rot.z || 1) * 1.52;
    root.rot.z = THREE.MathUtils.lerp(root.rot.z, targetRoll, Math.min(1, delta * 5.5));
    root.rot.x = THREE.MathUtils.clamp(root.rot.x, -0.4, 0.4);

    if (this.j.root) {
      this.j.root.rotation.z = root.rot.z;
      this.j.root.rotation.x = root.rot.x;
    }

    // Head & Neck physical whiplash
    const head = this.nodes.head;
    head.rot.x += head.angVel.x * delta;
    head.rot.y += head.angVel.y * delta;
    head.rot.z += head.angVel.z * delta;
    head.angVel.multiplyScalar(0.85);

    head.rot.x = THREE.MathUtils.clamp(head.rot.x, -0.9, 0.6);
    head.rot.y = THREE.MathUtils.clamp(head.rot.y, -0.7, 0.7);
    head.rot.z = THREE.MathUtils.clamp(head.rot.z, -0.8, 0.8);

    if (this.j.head) {
      this.j.head.rotation.set(head.rot.x, head.rot.y, head.rot.z);
      this.j.head.position.set(0, 0.2, 1.0);
    }

    // Hinged Jaw slumping open
    const jaw = this.nodes.jaw;
    jaw.rot.x = THREE.MathUtils.lerp(jaw.rot.x, 0.75, delta * 5);
    if (this.j.jaw) this.j.jaw.rotation.x = jaw.rot.x;

    // Limbs sprawling naturally on top of floor surface
    const legL = this.nodes.leftLeg;
    const legR = this.nodes.rightLeg;
    const isRollingRight = (root.rot.z || 0) >= 0;

    if (isRollingRight) {
      legL.rot.z = THREE.MathUtils.lerp(legL.rot.z, -0.35, delta * 5);
      legL.rot.x = THREE.MathUtils.lerp(legL.rot.x, 0.2, delta * 4);
      legR.rot.z = THREE.MathUtils.lerp(legR.rot.z, 0.15, delta * 5);
      legR.rot.x = THREE.MathUtils.lerp(legR.rot.x, -0.1, delta * 4);
    } else {
      legL.rot.z = THREE.MathUtils.lerp(legL.rot.z, -0.15, delta * 5);
      legL.rot.x = THREE.MathUtils.lerp(legL.rot.x, -0.1, delta * 4);
      legR.rot.z = THREE.MathUtils.lerp(legR.rot.z, 0.35, delta * 5);
      legR.rot.x = THREE.MathUtils.lerp(legR.rot.x, 0.2, delta * 4);
    }

    if (this.j.leftLeg) this.j.leftLeg.rotation.set(legL.rot.x, 0, legL.rot.z);
    if (this.j.rightLeg) this.j.rightLeg.rotation.set(legR.rot.x, 0, legR.rot.z);
    if (this.j.frontLegL) this.j.frontLegL.rotation.set(0.1, 0, isRollingRight ? -0.2 : 0.2);
    if (this.j.frontLegR) this.j.frontLegR.rotation.set(-0.1, 0, isRollingRight ? -0.2 : 0.2);

    // Tail segments whip along momentum and coil on floor
    const tail1 = this.nodes.tail1;
    const tail2 = this.nodes.tail2;
    tail1.rot.y += tail1.angVel.y * delta;
    tail2.rot.y += tail2.angVel.y * delta;
    tail1.angVel.multiplyScalar(0.9);
    tail2.angVel.multiplyScalar(0.88);

    tail1.rot.y = THREE.MathUtils.clamp(tail1.rot.y, -1.2, 1.2);
    tail2.rot.y = THREE.MathUtils.clamp(tail2.rot.y, -1.8, 1.8);

    if (this.j.tail1) this.j.tail1.rotation.set(-0.15, tail1.rot.y, 0);
    if (this.j.tail2) this.j.tail2.rotation.set(-0.1, tail2.rot.y, 0);
  }

  /**
   * Fully resets ragdoll physics and restores upright neutral stance
   */
  reset() {
    this.isActive = false;
    this.isDead = false;
    this.settleTime = 0;
    this.isRecovering = false;
    this.recoveryTimer = 0;
    this.whiplashIntensity = 0;
    this.whiplashTimer = 0;

    for (const key in this.nodes) {
      const n = this.nodes[key];
      if (n.pos) n.pos.set(0, 0, 0);
      if (n.rot) n.rot.set(0, 0, 0);
      if (n.vel) n.vel.set(0, 0, 0);
      if (n.angVel) n.angVel.set(0, 0, 0);
    }

    // Reset joint rotations
    for (const key in this.j) {
      if (this.j[key]) {
        this.j[key].rotation.set(0, 0, 0);
      }
    }
    if (this.j.root) {
      this.j.root.position.set(0, 0, 0);
      this.j.root.rotation.set(0, 0, 0);
    }
  }

  deactivate() {
    this.reset();
  }
}
