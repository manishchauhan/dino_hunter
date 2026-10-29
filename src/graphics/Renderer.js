import * as THREE from 'three';

export class GraphicsRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x132418);
    this.scene.fog = new THREE.FogExp2(0x172b1e, 0.0085);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Fighting Camera: Dynamic distance and dramatic 3/4 console angle
    this.cameraMode = 'clash'; // 'clash' (Dynamic Fighter Cam) | 'chase' | 'cinematic'
    this.cameraTarget = new THREE.Vector3(0, 1.8, 0);
    this.shakeIntensity = 0;
    this.shakeOffset = new THREE.Vector3();

    this.orbitYaw = 0;
    this.orbitPitch = 0.78; // Comfortable isometric 3D arena view
    this.orbitDistance = 30.0; // Wide, comfortable view showing both full dinosaurs & arena
    this.userZoomOffset = 0; // Manual player zoom adjustment via wheel/touch
    this.punchZoom = 0;

    // Hit-Stop & Slow-Motion Timers
    this.hitStopTimer = 0;
    this.slowMoTimer = 0;
    this.slowMoFactor = 1.0;

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('wheel', (e) => {
      this.userZoomOffset = Math.max(-10, Math.min(20, this.userZoomOffset + Math.sign(e.deltaY) * 2.5));
    }, { passive: true });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  triggerScreenShake(intensity = 0.5) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  addCameraShake(intensity = 0.5) {
    this.triggerScreenShake(intensity);
  }

  triggerPunchZoom(amount = 2.5) {
    this.punchZoom = Math.max(this.punchZoom, amount);
  }

  freezeFrame(durationMs = 80) {
    this.hitStopTimer = durationMs / 1000;
  }

  isHitStopped() {
    return this.hitStopTimer > 0;
  }

  triggerSlowMotion(durationSeconds = 1.6, factor = 0.22) {
    this.slowMoTimer = durationSeconds;
    this.slowMoFactor = factor;
  }

  getEffectiveDelta(rawDelta) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= rawDelta;
      return 0.0001; // Frozen on impact frame
    }

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDelta;
      return rawDelta * this.slowMoFactor;
    }

    return rawDelta;
  }

  cycleCameraMode() {
    const modes = ['clash', 'chase', 'cinematic'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[nextIdx];
    return this.cameraMode;
  }

  updateCamera(playerDino, opponentDino, delta) {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 3.5);
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity * 1.6,
        (Math.random() - 0.5) * this.shakeIntensity * 1.2,
        (Math.random() - 0.5) * this.shakeIntensity * 1.6
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // Recover punch zoom
    if (this.punchZoom > 0) {
      this.punchZoom = Math.max(0, this.punchZoom - delta * 12.0);
    }

    if (!playerDino) {
      this.camera.position.set(0, 20, 20);
      this.camera.lookAt(0, 1.5, 0);
      return;
    }

    const pPos = playerDino.getPosition();
    const pRot = playerDino.getRotation();

    if (this.cameraMode === 'clash') {
      // Dynamic Fighting Camera: Smoothly frames both gladiators with cinematic height
      const oppPos = opponentDino ? opponentDino.getPosition() : pPos;
      const fighterDist = Math.hypot(pPos.x - oppPos.x, pPos.z - oppPos.z);

      // Wide, comfortable view keeping both full dinosaurs, tails, and arena in clear view
      const targetDist = Math.max(22.0, Math.min(45.0, 24.0 + fighterDist * 0.55 + this.userZoomOffset));
      this.orbitDistance = THREE.MathUtils.lerp(this.orbitDistance, targetDist, delta * 2.5);

      const midPoint = new THREE.Vector3(
        (pPos.x * 0.5 + oppPos.x * 0.5),
        1.6,
        (pPos.z * 0.5 + oppPos.z * 0.5)
      );

      // Target point shifted downward so dinosaurs appear safely elevated in upper 68% of viewport
      const lookTarget = new THREE.Vector3(
        (pPos.x * 0.5 + oppPos.x * 0.5),
        -3.2, // lowered look-target pushes 3D characters up into upper viewport
        (pPos.z * 0.5 + oppPos.z * 0.5)
      );

      const horizDist = this.orbitDistance * Math.cos(this.orbitPitch);
      const vertDist = this.orbitDistance * Math.sin(this.orbitPitch);

      const camX = midPoint.x + Math.sin(this.orbitYaw) * horizDist;
      const camZ = midPoint.z + Math.cos(this.orbitYaw) * horizDist;
      const camY = midPoint.y + vertDist + 3.8;

      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), delta * 5.0);
      this.cameraTarget.lerp(lookTarget, delta * 6.5);
      this.camera.lookAt(this.cameraTarget);

    } else if (this.cameraMode === 'chase') {
      const totalYaw = pRot + this.orbitYaw;
      const dist = 14 - this.punchZoom;
      const height = 5.5;
      const idealPos = new THREE.Vector3(
        pPos.x - Math.sin(totalYaw) * dist,
        pPos.y + height,
        pPos.z - Math.cos(totalYaw) * dist
      );
      this.camera.position.lerp(idealPos, delta * 5.0);
      this.cameraTarget.lerp(new THREE.Vector3(pPos.x, pPos.y + 1.8, pPos.z), delta * 6.0);
      this.camera.lookAt(this.cameraTarget);

    } else if (this.cameraMode === 'cinematic') {
      const oppPos = opponentDino ? opponentDino.getPosition() : pPos;
      const mid = new THREE.Vector3((pPos.x + oppPos.x) / 2, 2.2, (pPos.z + oppPos.z) / 2);
      const angle = this.orbitYaw + delta * 0.25;
      this.orbitYaw = angle;
      this.camera.position.lerp(new THREE.Vector3(mid.x + Math.sin(angle) * 17, 7, mid.z + Math.cos(angle) * 17), delta * 4.0);
      this.camera.lookAt(mid);
    }

    this.camera.position.add(this.shakeOffset);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
