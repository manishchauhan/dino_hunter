import * as THREE from 'three';
import { ARENA_RADIUS, ARENA_WALL_HEIGHT } from '../constants.js';

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.brazierPositions = [];
    this.themeTextures = {};
    this.currentTheme = 'jungle';

    // 5 Distinct 3D Biome Environment Groups
    this.jungleEnvGroup = new THREE.Group();
    this.volcanicEnvGroup = new THREE.Group();
    this.glacialEnvGroup = new THREE.Group();
    this.canyonEnvGroup = new THREE.Group();
    this.shadowEnvGroup = new THREE.Group();

    this.initThemeTextures();
    this.createFloor();
    this.createColosseumWalls();
    this.createMonolithicPillars();
    this.createBraziers();
    this.createPerimeterSpikes();

    // Build the 5 completely distinct 3D environments
    this.createJungleEnvironment();
    this.createVolcanicEnvironment();
    this.createGlacialEnvironment();
    this.createCanyonEnvironment();
    this.createShadowEnvironment();

    this.group.add(this.jungleEnvGroup);
    this.group.add(this.volcanicEnvGroup);
    this.group.add(this.glacialEnvGroup);
    this.group.add(this.canyonEnvGroup);
    this.group.add(this.shadowEnvGroup);

    this.scene.add(this.group);
    this.setTheme('jungle');
  }

  initThemeTextures() {
    this.themeTextures.jungle = this.generateJungleTexture();
    this.themeTextures.volcanic = this.generateVolcanicTexture();
    this.themeTextures.canyon = this.generateCanyonTexture();
    this.themeTextures.glacial = this.generateGlacialTexture();
    this.themeTextures.shadow = this.generateShadowTexture();
  }

  generateJungleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 512);
    grad.addColorStop(0, '#2b472a');
    grad.addColorStop(0.35, '#223c21');
    grad.addColorStop(0.70, '#1c321b');
    grad.addColorStop(0.92, '#182717');
    grad.addColorStop(1.0, '#111c11');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 48; i++) {
      const rx = 140 + Math.random() * 744;
      const ry = 140 + Math.random() * 744;
      const rw = 40 + Math.random() * 95;
      const rh = 30 + Math.random() * 75;
      const earthGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rw);
      earthGrad.addColorStop(0, 'rgba(62, 46, 30, 0.6)');
      earthGrad.addColorStop(0.65, 'rgba(46, 34, 22, 0.38)');
      earthGrad.addColorStop(1, 'rgba(32, 52, 28, 0)');
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(75, 115, 65, 0.35)';
    ctx.lineWidth = 8;
    [120, 240, 360, 470].forEach((rad) => {
      ctx.beginPath();
      ctx.arc(512, 512, rad, 0, Math.PI * 2);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  generateVolcanicTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Charred volcanic basalt & black obsidian rock base
    const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 512);
    grad.addColorStop(0, '#2d1414');
    grad.addColorStop(0.35, '#220e0e');
    grad.addColorStop(0.70, '#190a0a');
    grad.addColorStop(1.0, '#0d0505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Glowing subterranean lava veins & cracks
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ff4400';
    for (let c = 0; c < 36; c++) {
      let cx = 100 + Math.random() * 824;
      let cy = 100 + Math.random() * 824;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const segments = 6 + Math.floor(Math.random() * 8);
      for (let s = 0; s < segments; s++) {
        cx += (Math.random() - 0.5) * 80;
        cy += (Math.random() - 0.5) * 80;
        ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(255, 69, 0, 0.85)' : 'rgba(255, 165, 0, 0.95)';
      ctx.lineWidth = 3 + Math.random() * 4;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Glowing magma arena rings
    ctx.strokeStyle = 'rgba(255, 80, 0, 0.45)';
    ctx.lineWidth = 7;
    [120, 240, 360, 470].forEach((rad) => {
      ctx.beginPath();
      ctx.arc(512, 512, rad, 0, Math.PI * 2);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  generateCanyonTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Sunbaked golden terracotta & sandstone canyon dust
    const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 512);
    grad.addColorStop(0, '#754528');
    grad.addColorStop(0.35, '#5e341c');
    grad.addColorStop(0.70, '#4a2814');
    grad.addColorStop(1.0, '#331a0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Desert dust & cracked dry clay
    for (let i = 0; i < 40; i++) {
      const rx = 120 + Math.random() * 784;
      const ry = 120 + Math.random() * 784;
      const rw = 40 + Math.random() * 80;
      const rh = 30 + Math.random() * 60;
      const dustGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rw);
      dustGrad.addColorStop(0, 'rgba(180, 120, 70, 0.5)');
      dustGrad.addColorStop(1, 'rgba(100, 60, 30, 0)');
      ctx.fillStyle = dustGrad;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Carved golden sandstone rings
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.38)';
    ctx.lineWidth = 8;
    [120, 240, 360, 470].forEach((rad) => {
      ctx.beginPath();
      ctx.arc(512, 512, rad, 0, Math.PI * 2);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  generateGlacialTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep frozen cobalt slate & permafrost base
    const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 512);
    grad.addColorStop(0, '#1c2e42');
    grad.addColorStop(0.35, '#142233');
    grad.addColorStop(0.70, '#0e1824');
    grad.addColorStop(1.0, '#080d14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Crystalline ice veins & frost fissures
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#00f0ff';
    for (let c = 0; c < 30; c++) {
      let cx = 100 + Math.random() * 824;
      let cy = 100 + Math.random() * 824;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const segments = 5 + Math.floor(Math.random() * 7);
      for (let s = 0; s < segments; s++) {
        cx += (Math.random() - 0.5) * 90;
        cy += (Math.random() - 0.5) * 90;
        ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(0, 240, 255, 0.85)' : 'rgba(200, 245, 255, 0.9)';
      ctx.lineWidth = 2.5 + Math.random() * 3.5;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Glowing cyan runic rings
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.45)';
    ctx.lineWidth = 7;
    [120, 240, 360, 470].forEach((rad) => {
      ctx.beginPath();
      ctx.arc(512, 512, rad, 0, Math.PI * 2);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  generateShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep cosmic void & dark obsidian stone
    const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 512);
    grad.addColorStop(0, '#240e38');
    grad.addColorStop(0.35, '#190829');
    grad.addColorStop(0.70, '#10041c');
    grad.addColorStop(1.0, '#06010b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Ethereal violet arcane runes and cosmic rift cracks
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#c084fc';
    for (let c = 0; c < 34; c++) {
      let cx = 100 + Math.random() * 824;
      let cy = 100 + Math.random() * 824;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const segments = 5 + Math.floor(Math.random() * 7);
      for (let s = 0; s < segments; s++) {
        cx += (Math.random() - 0.5) * 85;
        cy += (Math.random() - 0.5) * 85;
        ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(192, 132, 252, 0.9)' : 'rgba(232, 121, 249, 0.95)';
      ctx.lineWidth = 2.5 + Math.random() * 3.5;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Glowing violet void arena rings & runic markers
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.lineWidth = 8;
    [120, 240, 360, 470].forEach((rad) => {
      ctx.beginPath();
      ctx.arc(512, 512, rad, 0, Math.PI * 2);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }


  createFloor() {
    const floorGeo = new THREE.CircleGeometry(ARENA_RADIUS, 64);
    this.floorMat = new THREE.MeshStandardMaterial({
      map: this.themeTextures.jungle,
      roughness: 0.88,
      metalness: 0.05
    });

    this.floor = new THREE.Mesh(floorGeo, this.floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.group.add(this.floor);
  }

  createColosseumWalls() {
    const wallSegments = 32;
    const r = ARENA_RADIUS;
    this.stoneMat = new THREE.MeshStandardMaterial({
      color: 0x364032, // Overgrown ancient mossy stone
      roughness: 0.9,
      metalness: 0.15
    });

    // Outer tiered spectator stands
    const wallGeo = new THREE.CylinderGeometry(
      r + 6,
      r,
      ARENA_WALL_HEIGHT,
      wallSegments,
      1,
      true
    );
    const wallMesh = new THREE.Mesh(wallGeo, this.stoneMat);
    wallMesh.position.y = ARENA_WALL_HEIGHT / 2;
    wallMesh.receiveShadow = true;
    wallMesh.castShadow = true;
    this.group.add(wallMesh);

    // Upper rim tier
    const tierGeo = new THREE.TorusGeometry(r + 3, 1.4, 8, wallSegments);
    const tierMesh = new THREE.Mesh(tierGeo, this.stoneMat);
    tierMesh.position.y = ARENA_WALL_HEIGHT;
    tierMesh.rotation.x = Math.PI / 2;
    this.group.add(tierMesh);
  }

  createMonolithicPillars() {
    const pillarCount = 12;
    const r = ARENA_RADIUS - 1.2;
    this.pillarMat = new THREE.MeshStandardMaterial({
      color: 0x2e382b,
      roughness: 0.8,
      metalness: 0.2
    });
    this.vineMat = new THREE.MeshStandardMaterial({
      color: 0x295228,
      roughness: 0.7,
      metalness: 0.05
    });

    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const pillar = new THREE.Group();
      pillar.position.set(x, 0, z);

      // Main column
      const colGeo = new THREE.CylinderGeometry(1.2, 1.5, ARENA_WALL_HEIGHT + 2, 8);
      const colMesh = new THREE.Mesh(colGeo, this.pillarMat);
      colMesh.position.y = (ARENA_WALL_HEIGHT + 2) / 2;
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      pillar.add(colMesh);

      // Gold carved trim bands
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0x8a7238,
        roughness: 0.45,
        metalness: 0.75
      });
      const bandGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.4, 8);
      const band1 = new THREE.Mesh(bandGeo, bandMat);
      band1.position.y = 2.5;
      const band2 = new THREE.Mesh(bandGeo, bandMat);
      band2.position.y = 6.5;
      pillar.add(band1, band2);

      // Overgrown creeping jungle vines wrapping around column
      const vineGeo = new THREE.TorusGeometry(1.35, 0.12, 6, 12);
      for (let v = 0; v < 3; v++) {
        const vine = new THREE.Mesh(vineGeo, this.vineMat);
        vine.position.y = 1.8 + v * 2.2;
        vine.rotation.x = Math.PI / 2 + 0.2 * (v % 2 === 0 ? 1 : -1);
        vine.castShadow = true;
        pillar.add(vine);
      }

      this.group.add(pillar);
    }
  }

  createJungleEnvironment() {
    // 1. Prehistoric Giant Trees (Ancient Araucaria / Jurassic Conifers)
    const treeCount = 14;
    const r = ARENA_RADIUS + 3.8;
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9, metalness: 0.05 });
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x1f4724, roughness: 0.65, flatShading: true });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x27592d, roughness: 0.65, flatShading: true });

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const dist = r + (Math.random() - 0.5) * 2.5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const treeHeight = 15 + Math.random() * 7;
      const trunkGeo = new THREE.CylinderGeometry(0.8, 1.4, treeHeight, 8);
      const trunk = new THREE.Mesh(trunkGeo, barkMat);
      trunk.position.y = treeHeight / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      const tiers = 5;
      for (let t = 0; t < tiers; t++) {
        const tierY = treeHeight * (0.45 + (t / tiers) * 0.55);
        const radius = (tiers - t + 1) * 1.35;
        const foliageGeo = new THREE.ConeGeometry(radius, 3.8, 8);
        const foliage = new THREE.Mesh(foliageGeo, t % 2 === 0 ? leafMat1 : leafMat2);
        foliage.position.y = tierY;
        foliage.castShadow = true;
        tree.add(foliage);
      }
      this.jungleEnvGroup.add(tree);
    }

    // 2. Cycads and Fern Palms
    const cycadCount = 18;
    const cycadR = ARENA_RADIUS - 2.8;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x423223, roughness: 0.85 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x387333, roughness: 0.6, side: THREE.DoubleSide });

    for (let i = 0; i < cycadCount; i++) {
      const angle = (i / cycadCount) * Math.PI * 2 + 0.15;
      const x = Math.cos(angle) * cycadR;
      const z = Math.sin(angle) * cycadR;

      const cycad = new THREE.Group();
      cycad.position.set(x, 0, z);

      const trunkH = 2.8 + Math.random() * 2.2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.65, trunkH, 7), trunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      cycad.add(trunk);

      for (let f = 0; f < 10; f++) {
        const frondAngle = (f / 10) * Math.PI * 2;
        const frondGeo = new THREE.ConeGeometry(0.55, 3.2, 5);
        frondGeo.scale(0.3, 1.0, 1.2);
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.position.set(0, trunkH, 0);
        frond.rotation.y = frondAngle;
        frond.rotation.x = Math.PI / 2.8;
        frond.castShadow = true;
        cycad.add(frond);
      }
      this.jungleEnvGroup.add(cycad);
    }

    // 3. 3D Grass Tufts & Mossy Boulders
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x42823a, roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 18;
      const tuft = new THREE.Group();
      tuft.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      const bladeGeo = new THREE.PlaneGeometry(1.2, 0.9);
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(bladeGeo, grassMat);
        blade.position.y = 0.45;
        blade.rotation.y = (b / 3) * Math.PI;
        tuft.add(blade);
      }
      this.jungleEnvGroup.add(tuft);
    }

    const mossRockMat = new THREE.MeshStandardMaterial({ color: 0x3b3d36, roughness: 0.9 });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + 0.35;
      const rPos = ARENA_RADIUS - 3.2;
      const s = 1.3 + Math.random() * 1.2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), mossRockMat);
      rock.position.set(Math.cos(angle) * rPos, s * 0.65, Math.sin(angle) * rPos);
      rock.castShadow = true;
      this.jungleEnvGroup.add(rock);
    }

    // 4. Inner Visible Primeval Totems & Shrines (r=18.5m - directly visible in camera FOV)
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * 18.5;
      const z = Math.sin(angle) * 18.5;
      const totem = new THREE.Group();
      totem.position.set(x, 0, z);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.1, 4.0, 6), mossRockMat);
      base.position.y = 2.0;
      base.castShadow = true;
      totem.add(base);

      const orb = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), orbMat);
      orb.position.y = 4.8;
      totem.add(orb);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.5, 7), leafMat1);
      cap.position.y = 7.4;
      cap.castShadow = true;
      totem.add(cap);

      this.jungleEnvGroup.add(totem);
    }
  }

  createVolcanicEnvironment() {
    const spireCount = 16;
    const r = ARENA_RADIUS + 3.5;
    const basaltMat = new THREE.MeshStandardMaterial({ color: 0x140d0d, roughness: 0.92, metalness: 0.25 });
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });

    // 1. Jagged Obsidian Basalt Rock Spires
    for (let i = 0; i < spireCount; i++) {
      const angle = (i / spireCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const spire = new THREE.Group();
      spire.position.set(x, 0, z);

      const h = 14 + Math.random() * 9;
      const spireGeo = new THREE.ConeGeometry(2.2, h, 6);
      spireGeo.scale(0.8 + Math.random() * 0.4, 1.0, 1.0);
      const mesh = new THREE.Mesh(spireGeo, basaltMat);
      mesh.position.y = h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      spire.add(mesh);

      // Glowing Magma Fissure Ring
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.4, 6), lavaMat);
      band.position.y = h * 0.35;
      spire.add(band);

      this.volcanicEnvGroup.add(spire);
    }

    // 2. Glowing Molten Lava Ground Vent Pools
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + 0.4;
      const ventR = ARENA_RADIUS - 3.0;
      const vent = new THREE.Mesh(new THREE.CircleGeometry(2.0, 16), lavaMat);
      vent.rotation.x = -Math.PI / 2;
      vent.position.set(Math.cos(angle) * ventR, 0.05, Math.sin(angle) * ventR);
      this.volcanicEnvGroup.add(vent);
    }

    // 3. Volcanic Charred Boulders
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + 0.2;
      const rPos = ARENA_RADIUS - 2.5;
      const s = 1.4 + Math.random() * 1.5;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), basaltMat);
      rock.position.set(Math.cos(angle) * rPos, s * 0.6, Math.sin(angle) * rPos);
      rock.castShadow = true;
      this.volcanicEnvGroup.add(rock);
    }

    // 4. Inner Visible Magma Spires (r=18.5m - directly visible in camera FOV)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * 18.5;
      const z = Math.sin(angle) * 18.5;
      const spire = new THREE.Group();
      spire.position.set(x, 0, z);

      const base = new THREE.Mesh(new THREE.ConeGeometry(2.0, 9.0, 6), basaltMat);
      base.position.y = 4.5;
      base.castShadow = true;
      spire.add(base);

      const magmaRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.4, 8, 12), lavaMat);
      magmaRing.rotation.x = Math.PI / 2;
      magmaRing.position.y = 3.8;
      spire.add(magmaRing);

      const tip = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), lavaMat);
      tip.position.y = 9.8;
      spire.add(tip);

      this.volcanicEnvGroup.add(spire);
    }
  }

  createGlacialEnvironment() {
    const glacierCount = 16;
    const r = ARENA_RADIUS + 3.5;
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0x90e0ef,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.88
    });
    const frostMat = new THREE.MeshStandardMaterial({ color: 0x243b55, roughness: 0.85 });

    // 1. Giant Translucent Glacial Ice Pillars
    for (let i = 0; i < glacierCount; i++) {
      const angle = (i / glacierCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const glacier = new THREE.Group();
      glacier.position.set(x, 0, z);

      const h = 15 + Math.random() * 10;
      const iceGeo = new THREE.CylinderGeometry(1.2, 2.5, h, 6);
      const mesh = new THREE.Mesh(iceGeo, iceMat);
      mesh.position.y = h / 2;
      mesh.castShadow = true;
      glacier.add(mesh);

      // Crystalline frost top point
      const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.5, 6), iceMat);
      tip.position.y = h + 1.7;
      glacier.add(tip);

      this.glacialEnvGroup.add(glacier);
    }

    // 2. Perimeter Crystalline Ice Spikes
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + 0.1;
      const rPos = ARENA_RADIUS - 2.6;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.65, 4.2, 5), iceMat);
      spike.position.set(Math.cos(angle) * rPos, 2.1, Math.sin(angle) * rPos);
      spike.rotation.x = 0.25;
      spike.rotation.y = -angle;
      this.glacialEnvGroup.add(spike);
    }

    // 3. Cobalt Permafrost Boulders
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + 0.3;
      const rPos = ARENA_RADIUS - 3.2;
      const s = 1.3 + Math.random() * 1.3;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), frostMat);
      rock.position.set(Math.cos(angle) * rPos, s * 0.65, Math.sin(angle) * rPos);
      this.glacialEnvGroup.add(rock);
    }

    // 4. Inner Visible Frost Shards (r=18.5m - directly visible in camera FOV)
    const glowIceMat = new THREE.MeshBasicMaterial({ color: 0xa0f0ff });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * 18.5;
      const z = Math.sin(angle) * 18.5;
      const pillar = new THREE.Group();
      pillar.position.set(x, 0, z);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.9, 8.5, 6), iceMat);
      shaft.position.y = 4.25;
      shaft.castShadow = true;
      pillar.add(shaft);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.2, 6), iceMat);
      crown.position.y = 9.8;
      crown.castShadow = true;
      pillar.add(crown);

      const glowOrb = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 0), glowIceMat);
      glowOrb.position.y = 4.5;
      pillar.add(glowOrb);

      this.glacialEnvGroup.add(pillar);
    }
  }

  createCanyonEnvironment() {
    const hoodooCount = 14;
    const r = ARENA_RADIUS + 3.5;
    const sandstoneMat1 = new THREE.MeshStandardMaterial({ color: 0x9c482b, roughness: 0.88 });
    const sandstoneMat2 = new THREE.MeshStandardMaterial({ color: 0xb56338, roughness: 0.88 });

    // 1. Red Sandstone Hoodoos & Monoliths
    for (let i = 0; i < hoodooCount; i++) {
      const angle = (i / hoodooCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const hoodoo = new THREE.Group();
      hoodoo.position.set(x, 0, z);

      const h = 15 + Math.random() * 8;
      const mesh1 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.0, h * 0.6, 8), sandstoneMat1);
      mesh1.position.y = (h * 0.6) / 2;
      mesh1.castShadow = true;
      hoodoo.add(mesh1);

      const mesh2 = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.0, h * 0.4, 8), sandstoneMat2);
      mesh2.position.y = h * 0.6 + (h * 0.4) / 2;
      mesh2.castShadow = true;
      hoodoo.add(mesh2);

      this.canyonEnvGroup.add(hoodoo);
    }

    // 2. Towering Canyon Rock Arches bridging perimeter gaps
    const archMat = new THREE.MeshStandardMaterial({ color: 0x8a3c20, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const arch = new THREE.Mesh(new THREE.TorusGeometry(5.5, 1.4, 8, 12, Math.PI), archMat);
      arch.position.set(Math.cos(angle) * (ARENA_RADIUS + 1.0), 3.0, Math.sin(angle) * (ARENA_RADIUS + 1.0));
      arch.rotation.y = angle + Math.PI / 2;
      arch.castShadow = true;
      this.canyonEnvGroup.add(arch);
    }

    // 3. Sunbaked Desert Terracotta Boulders
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + 0.25;
      const rPos = ARENA_RADIUS - 2.8;
      const s = 1.3 + Math.random() * 1.4;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), sandstoneMat1);
      rock.position.set(Math.cos(angle) * rPos, s * 0.65, Math.sin(angle) * rPos);
      this.canyonEnvGroup.add(rock);
    }

    // 4. Inner Visible Canyon Monuments (r=18.5m - directly visible in camera FOV)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * 18.5;
      const z = Math.sin(angle) * 18.5;
      const hoodoo = new THREE.Group();
      hoodoo.position.set(x, 0, z);
      const m1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.0, 9.0, 8), sandstoneMat1);
      m1.position.y = 4.5;
      m1.castShadow = true;
      hoodoo.add(m1);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.0, 8), sandstoneMat2);
      cap.position.y = 10.5;
      cap.castShadow = true;
      hoodoo.add(cap);
      this.canyonEnvGroup.add(hoodoo);
    }
  }

  createShadowEnvironment() {
    const r = ARENA_RADIUS + 3.5;
    const voidMat = new THREE.MeshStandardMaterial({
      color: 0x120822,
      roughness: 0.85,
      metalness: 0.4
    });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      transmission: 0.75,
      transparent: true,
      opacity: 0.88,
      roughness: 0.15,
      metalness: 0.2
    });

    // 1. Perimeter Void Spikes & Obelisks
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const spire = new THREE.Group();
      spire.position.set(x, 0, z);

      const h = 15 + Math.random() * 8;
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(1.8, h, 5), voidMat);
      mesh.position.y = h / 2;
      mesh.castShadow = true;
      spire.add(mesh);

      const runeBand = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.4, 5), runeMat);
      runeBand.position.y = h * 0.4;
      spire.add(runeBand);

      this.shadowEnvGroup.add(spire);
    }

    // 2. Inner Visible Floating Dark Matter Void Crystals (r=18.5m - directly visible in camera)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * 18.5;
      const z = Math.sin(angle) * 18.5;

      const crystalGroup = new THREE.Group();
      crystalGroup.position.set(x, 3.8, z);

      const crystalGeo = new THREE.OctahedronGeometry(1.7, 0);
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      crystalMesh.castShadow = true;
      crystalGroup.add(crystalMesh);

      const basePillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 3.2, 6), voidMat);
      basePillar.position.y = -2.2;
      basePillar.castShadow = true;
      crystalGroup.add(basePillar);

      this.shadowEnvGroup.add(crystalGroup);
    }

    // 3. Inner Violet Arcane Ground Sigils
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.3;
      const sigil = new THREE.Mesh(new THREE.CircleGeometry(1.8, 16), runeMat);
      sigil.rotation.x = -Math.PI / 2;
      sigil.position.set(Math.cos(angle) * 15.0, 0.04, Math.sin(angle) * 15.0);
      this.shadowEnvGroup.add(sigil);
    }
  }

  createBraziers() {
    const count = 8;
    const r = ARENA_RADIUS - 1.5;
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a18,
      metalness: 0.9,
      roughness: 0.3
    });
    this.coalMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const brazier = new THREE.Group();
      brazier.position.set(x, 3.2, z);

      const bowlGeo = new THREE.CylinderGeometry(1.1, 0.4, 0.8, 12);
      const bowl = new THREE.Mesh(bowlGeo, metalMat);
      bowl.castShadow = true;
      brazier.add(bowl);

      const coalsGeo = new THREE.CylinderGeometry(0.9, 0.7, 0.2, 12);
      const coals = new THREE.Mesh(coalsGeo, this.coalMat);
      coals.position.y = 0.35;
      brazier.add(coals);

      this.group.add(brazier);
      this.brazierPositions.push(new THREE.Vector3(x, 3.7, z));
    }
  }

  createPerimeterSpikes() {
    const spikeCount = 36;
    const r = ARENA_RADIUS - 0.5;
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x2b221d,
      roughness: 0.6,
      metalness: 0.7
    });

    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const spikeGeo = new THREE.ConeGeometry(0.25, 2.8, 6);
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(x, 1.4, z);
      spike.rotation.y = -angle;
      spike.rotation.z = 0.15;
      spike.castShadow = true;
      this.group.add(spike);
    }
  }

  getThemeForDino(dinoType, lastThemeId = null) {
    const VOLCANIC_DINOS = new Set(['trex', 'carnotaurus', 'ceratosaurus', 'giganotosaurus']);
    const GLACIAL_DINOS = new Set(['spinosaurus', 'dilophosaurus', 'allosaurus', 'suchomimus']);
    const CANYON_DINOS = new Set(['triceratops', 'ankylosaurus', 'stegosaurus', 'pachyrhinosaurus', 'styracosaurus', 'kentrosaurus']);
    const JUNGLE_DINOS = new Set(['brachiosaurus', 'parasaurolophus', 'iguanodon', 'baryonyx']);
    const SHADOW_DINOS = new Set(['velociraptor', 'deinonychus', 'therizinosaurus', 'pachycephalosaurus']);

    const ALL_THEMES = [
      { id: 'volcanic', name: 'VOLCANIC CALDERA', subtitle: 'Lava fissures, scorched basalt, and smoldering ash', icon: '🌋', accentColor: '#ff4400' },
      { id: 'glacial', name: 'FROSTBOUND COLOSSEUM', subtitle: 'Reflective arctic ice, crystalline pillars, and swirling blizzard', icon: '❄️', accentColor: '#00f0ff' },
      { id: 'canyon', name: 'ANCIENT CANYON QUARRY', subtitle: 'Sunbaked sandstone cliffs and dry clay dust', icon: '🏜️', accentColor: '#e67e22' },
      { id: 'jungle', name: 'PRIMEVAL JUNGLE RUINS', subtitle: 'Lush emerald moss, dense araucarias, and river mists', icon: '🌴', accentColor: '#2ecc71' },
      { id: 'shadow', name: 'SHADOW VOID ABYSS', subtitle: 'Midnight obsidian stone, pulsing violet arcane rifts, and dark matter', icon: '🌑', accentColor: '#a855f7' }
    ];

    let chosen = ALL_THEMES[0];
    if (VOLCANIC_DINOS.has(dinoType)) chosen = ALL_THEMES[0];
    else if (GLACIAL_DINOS.has(dinoType)) chosen = ALL_THEMES[1];
    else if (CANYON_DINOS.has(dinoType)) chosen = ALL_THEMES[2];
    else if (JUNGLE_DINOS.has(dinoType)) chosen = ALL_THEMES[3];
    else if (SHADOW_DINOS.has(dinoType)) chosen = ALL_THEMES[4];

    // Guarantee round diversity: if consecutive round has same theme, advance to next theme!
    if (lastThemeId && chosen.id === lastThemeId) {
      const idx = ALL_THEMES.findIndex((t) => t.id === lastThemeId);
      chosen = ALL_THEMES[(idx + 1) % ALL_THEMES.length];
    }

    return chosen;
  }

  setTheme(themeId) {
    if (!this.themeTextures[themeId]) themeId = 'jungle';
    this.currentTheme = themeId;

    if (this.floorMat) {
      this.floorMat.map = this.themeTextures[themeId];
      this.floorMat.needsUpdate = true;
    }

    // Toggle 5 3D Environment Sets
    if (this.jungleEnvGroup) this.jungleEnvGroup.visible = (themeId === 'jungle');
    if (this.volcanicEnvGroup) this.volcanicEnvGroup.visible = (themeId === 'volcanic');
    if (this.glacialEnvGroup) this.glacialEnvGroup.visible = (themeId === 'glacial');
    if (this.canyonEnvGroup) this.canyonEnvGroup.visible = (themeId === 'canyon');
    if (this.shadowEnvGroup) this.shadowEnvGroup.visible = (themeId === 'shadow');

    if (themeId === 'volcanic') {
      if (this.stoneMat) this.stoneMat.color.setHex(0x191212);
      if (this.pillarMat) this.pillarMat.color.setHex(0x2b1410);
      if (this.vineMat) this.vineMat.color.setHex(0x3a1008);
      this.setCoalsColor(0xff2200);
      if (this.scene) {
        this.scene.background = new THREE.Color(0x1a0606);
        this.scene.fog = new THREE.FogExp2(0x220505, 0.016);
      }
    } else if (themeId === 'canyon') {
      if (this.stoneMat) this.stoneMat.color.setHex(0x5c3922);
      if (this.pillarMat) this.pillarMat.color.setHex(0x4a2b16);
      if (this.vineMat) this.vineMat.color.setHex(0x6e522b);
      this.setCoalsColor(0xff8c1a);
      if (this.scene) {
        this.scene.background = new THREE.Color(0x362012);
        this.scene.fog = new THREE.FogExp2(0x3e2616, 0.015);
      }
    } else if (themeId === 'glacial') {
      if (this.stoneMat) this.stoneMat.color.setHex(0x192e42);
      if (this.pillarMat) this.pillarMat.color.setHex(0x122436);
      if (this.vineMat) this.vineMat.color.setHex(0x284f6b);
      this.setCoalsColor(0x00d4ff);
      if (this.scene) {
        this.scene.background = new THREE.Color(0x0a1422);
        this.scene.fog = new THREE.FogExp2(0x101c2e, 0.015);
      }
    } else if (themeId === 'shadow') {
      if (this.stoneMat) this.stoneMat.color.setHex(0x190d29);
      if (this.pillarMat) this.pillarMat.color.setHex(0x23103b);
      if (this.vineMat) this.vineMat.color.setHex(0x5e168c);
      this.setCoalsColor(0xa855f7);
      if (this.scene) {
        this.scene.background = new THREE.Color(0x0e0517);
        this.scene.fog = new THREE.FogExp2(0x150824, 0.016);
      }
    } else {
      // jungle
      if (this.stoneMat) this.stoneMat.color.setHex(0x364032);
      if (this.pillarMat) this.pillarMat.color.setHex(0x2e382b);
      if (this.vineMat) this.vineMat.color.setHex(0x295228);
      this.setCoalsColor(0xff4500);
      if (this.scene) {
        this.scene.background = new THREE.Color(0x0b1a0e);
        this.scene.fog = new THREE.FogExp2(0x112415, 0.014);
      }
    }
  }

  setCoalsColor(hex) {
    if (this.coalMat) this.coalMat.color.setHex(hex);
  }

  setThemeForDino(dinoType, lastThemeId = null) {
    const theme = this.getThemeForDino(dinoType, lastThemeId);
    this.setTheme(theme.id);
    return theme;
  }
}

