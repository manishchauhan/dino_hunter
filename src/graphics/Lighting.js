import * as THREE from 'three';
import { ARENA_RADIUS } from '../constants.js';

export class ArenaLighting {
  constructor(scene) {
    this.scene = scene;
    this.torchLights = [];

    this.setupSunAndAmbient();
    this.setupTorchLights();
  }

  setupSunAndAmbient() {
    // Warm Prehistoric Sun
    this.sun = new THREE.DirectionalLight(0xffecd0, 2.4);
    this.sun.position.set(28, 45, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 5;
    this.sun.shadow.camera.far = 120;

    const d = ARENA_RADIUS + 8;
    this.sun.shadow.camera.left = -d;
    this.sun.shadow.camera.right = d;
    this.sun.shadow.camera.top = d;
    this.sun.shadow.camera.bottom = -d;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun);

    // Warm atmospheric jungle ambient
    this.ambient = new THREE.AmbientLight(0x223828, 1.35);
    this.scene.add(this.ambient);

    // Hemisphere Light (Sky golden canopy vs Ground jungle green)
    this.hemi = new THREE.HemisphereLight(0xffbe76, 0x182b1c, 0.95);
    this.scene.add(this.hemi);

    // AAA Rim Lighting: Crisp golden sun edge highlight to make dinosaur bodies pop
    this.rimLight = new THREE.DirectionalLight(0xffdfa0, 1.6);
    this.rimLight.position.set(-25, 32, -25);
    this.scene.add(this.rimLight);

    // Cool verdant forest bounce
    this.bounceLight = new THREE.DirectionalLight(0x2a5c3a, 0.7);
    this.bounceLight.position.set(0, -10, 0);
    this.scene.add(this.bounceLight);
  }

  setupTorchLights() {
    const torchCount = 8;
    const r = ARENA_RADIUS - 1.5;

    for (let i = 0; i < torchCount; i++) {
      const angle = (i / torchCount) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const torchLight = new THREE.PointLight(0xff6e1a, 2.5, 18, 1.8);
      torchLight.position.set(x, 4.2, z);
      this.scene.add(torchLight);

      this.torchLights.push({
        light: torchLight,
        baseIntensity: 2.5,
        speed: 8 + Math.random() * 6,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  setTheme(themeId) {
    if (themeId === 'volcanic') {
      if (this.sun) { this.sun.color.setHex(0xff4411); this.sun.intensity = 2.5; }
      if (this.ambient) { this.ambient.color.setHex(0x381510); this.ambient.intensity = 1.4; }
      if (this.hemi) { this.hemi.color.setHex(0xff3300); this.hemi.groundColor.setHex(0x190805); this.hemi.intensity = 1.1; }
      if (this.rimLight) { this.rimLight.color.setHex(0xff7722); this.rimLight.intensity = 2.0; }
      if (this.bounceLight) { this.bounceLight.color.setHex(0x881100); this.bounceLight.intensity = 0.8; }
      this.torchLights.forEach((item) => item.light.color.setHex(0xff2a00));
    } else if (themeId === 'canyon') {
      if (this.sun) { this.sun.color.setHex(0xffe0a8); this.sun.intensity = 2.6; }
      if (this.ambient) { this.ambient.color.setHex(0x402b17); this.ambient.intensity = 1.3; }
      if (this.hemi) { this.hemi.color.setHex(0xffd285); this.hemi.groundColor.setHex(0x2d170a); this.hemi.intensity = 1.0; }
      if (this.rimLight) { this.rimLight.color.setHex(0xffb84d); this.rimLight.intensity = 1.8; }
      if (this.bounceLight) { this.bounceLight.color.setHex(0x6a3812); this.bounceLight.intensity = 0.7; }
      this.torchLights.forEach((item) => item.light.color.setHex(0xff8818));
    } else if (themeId === 'glacial') {
      if (this.sun) { this.sun.color.setHex(0xd8f0ff); this.sun.intensity = 2.5; }
      if (this.ambient) { this.ambient.color.setHex(0x14253a); this.ambient.intensity = 1.45; }
      if (this.hemi) { this.hemi.color.setHex(0x99ddff); this.hemi.groundColor.setHex(0x0c1726); this.hemi.intensity = 1.0; }
      if (this.rimLight) { this.rimLight.color.setHex(0x00f0ff); this.rimLight.intensity = 2.2; }
      if (this.bounceLight) { this.bounceLight.color.setHex(0x0088cc); this.bounceLight.intensity = 0.85; }
      this.torchLights.forEach((item) => item.light.color.setHex(0x00d4ff));
    } else if (themeId === 'shadow') {
      if (this.sun) { this.sun.color.setHex(0xd8b4fe); this.sun.intensity = 2.4; }
      if (this.ambient) { this.ambient.color.setHex(0x1e0b36); this.ambient.intensity = 1.4; }
      if (this.hemi) { this.hemi.color.setHex(0xa855f7); this.hemi.groundColor.setHex(0x120524); this.hemi.intensity = 1.1; }
      if (this.rimLight) { this.rimLight.color.setHex(0xe879f9); this.rimLight.intensity = 2.2; }
      if (this.bounceLight) { this.bounceLight.color.setHex(0x7e22ce); this.bounceLight.intensity = 0.8; }
      this.torchLights.forEach((item) => item.light.color.setHex(0xc084fc));
    } else {
      // jungle
      if (this.sun) { this.sun.color.setHex(0xffecd0); this.sun.intensity = 2.4; }
      if (this.ambient) { this.ambient.color.setHex(0x223828); this.ambient.intensity = 1.35; }
      if (this.hemi) { this.hemi.color.setHex(0xffbe76); this.hemi.groundColor.setHex(0x182b1c); this.hemi.intensity = 0.95; }
      if (this.rimLight) { this.rimLight.color.setHex(0xffdfa0); this.rimLight.intensity = 1.6; }
      if (this.bounceLight) { this.bounceLight.color.setHex(0x2a5c3a); this.bounceLight.intensity = 0.7; }
      this.torchLights.forEach((item) => item.light.color.setHex(0xff6e1a));
    }
  }

  update(time) {
    // Torch fire flicker effect
    for (let i = 0; i < this.torchLights.length; i++) {
      const item = this.torchLights[i];
      const noise =
        Math.sin(time * item.speed + item.phase) * 0.3 +
        Math.cos(time * item.speed * 2.1) * 0.2;
      item.light.intensity = item.baseIntensity + noise;
    }
  }
}
