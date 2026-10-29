import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.shockwaves = [];

    this.initBrazierEmbers();
  }

  initBrazierEmbers() {
    const emberCount = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(emberCount * 3);
    const colors = new Float32Array(emberCount * 3);

    for (let i = 0; i < emberCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 8 + 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.05;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.emberMesh = new THREE.Points(geo, mat);
    this.scene.add(this.emberMesh);
  }

  setTheme(themeId) {
    if (!this.emberMesh) return;
    const colors = this.emberMesh.geometry.attributes.color.array;
    const count = colors.length / 3;

    for (let i = 0; i < count; i++) {
      if (themeId === 'volcanic') {
        // Blazing magma embers & golden spark sparks
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.45;
        colors[i * 3 + 2] = 0.02;
      } else if (themeId === 'canyon') {
        // Warm desert clay dust & golden sand sparkles
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.65 + Math.random() * 0.25;
        colors[i * 3 + 2] = 0.25;
      } else if (themeId === 'glacial') {
        // Cold crystalline ice shards & glowing frost flakes
        colors[i * 3] = 0.2 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        colors[i * 3 + 2] = 1.0;
      } else if (themeId === 'shadow') {
        // Cosmic void wisps & neon violet arcane embers
        colors[i * 3] = 0.75 + Math.random() * 0.25;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.3;
        colors[i * 3 + 2] = 1.0;
      } else {
        // Jungle fireflies & bioluminescent spores
        colors[i * 3] = 0.4 + Math.random() * 0.5;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.15;
      }
    }
    this.emberMesh.geometry.attributes.color.needsUpdate = true;
  }

  spawnFireBreath(headPos, forwardDir, count = 28) {
    const dir = forwardDir.clone().normalize();
    for (let i = 0; i < count; i++) {
      const isCore = Math.random() < 0.4;
      const color = isCore ? 0xffcc00 : (Math.random() < 0.5 ? 0xff4400 : 0xff1100);
      const s = 0.35 + Math.random() * 0.45;
      const geo = new THREE.SphereGeometry(s, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        headPos.x + (Math.random() - 0.5) * 0.5,
        headPos.y + (Math.random() - 0.5) * 0.5,
        headPos.z + (Math.random() - 0.5) * 0.5
      );

      const spreadX = (Math.random() - 0.5) * 0.35;
      const spreadY = (Math.random() - 0.5) * 0.25;
      const spreadZ = (Math.random() - 0.5) * 0.35;
      const speed = 14 + Math.random() * 12;

      const vel = new THREE.Vector3(
        (dir.x + spreadX) * speed,
        (dir.y + spreadY) * speed * 0.5 + Math.random() * 2,
        (dir.z + spreadZ) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        life: 0.55 + Math.random() * 0.35,
        maxLife: 0.9,
        scaleSpeed: 1.8
      });
    }
  }

  spawnFrostBreath(headPos, forwardDir, count = 28) {
    const dir = forwardDir.clone().normalize();
    for (let i = 0; i < count; i++) {
      const isCore = Math.random() < 0.5;
      const color = isCore ? 0xffffff : 0x00f0ff;
      const s = 0.3 + Math.random() * 0.35;
      const geo = new THREE.DodecahedronGeometry(s, 0);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        headPos.x + (Math.random() - 0.5) * 0.5,
        headPos.y + (Math.random() - 0.5) * 0.5,
        headPos.z + (Math.random() - 0.5) * 0.5
      );

      const spreadX = (Math.random() - 0.5) * 0.35;
      const spreadY = (Math.random() - 0.5) * 0.2;
      const spreadZ = (Math.random() - 0.5) * 0.35;
      const speed = 15 + Math.random() * 10;

      const vel = new THREE.Vector3(
        (dir.x + spreadX) * speed,
        (dir.y + spreadY) * speed * 0.4 + 1.0,
        (dir.z + spreadZ) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        scaleSpeed: 1.2
      });
    }
  }

  spawnIcePrism(pos, duration = 2.8) {
    const geo = new THREE.BoxGeometry(3.6, 4.4, 4.8);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x80e5ff,
      transmission: 0.7,
      transparent: true,
      opacity: 0.75,
      roughness: 0.15
    });
    const iceBlock = new THREE.Mesh(geo, mat);
    iceBlock.position.set(pos.x, 2.2, pos.z);
    this.scene.add(iceBlock);

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= duration) {
        clearInterval(interval);
        this.scene.remove(iceBlock);
        geo.dispose();
        mat.dispose();
        this.spawnIceShatter(iceBlock.position);
      } else {
        // Vibrating ice as it prepares to shatter
        if (duration - elapsed < 0.6) {
          iceBlock.position.x = pos.x + (Math.random() - 0.5) * 0.15;
          iceBlock.position.z = pos.z + (Math.random() - 0.5) * 0.15;
        }
      }
    }, 40);
  }

  spawnIceShatter(pos, count = 24) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.ConeGeometry(0.3 + Math.random() * 0.3, 0.8 + Math.random() * 0.6, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xccf5ff, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 14
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.6 + Math.random() * 0.4, maxLife: 1.0 });
    }
  }

  spawnVoidSmoke(pos, count = 18) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.6 + Math.random() * 0.5, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.6 ? 0x6600cc : 0x220044,
        transparent: true,
        opacity: 0.85
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 1.8,
        pos.y + Math.random() * 1.5,
        pos.z + (Math.random() - 0.5) * 1.8
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1.5,
        (Math.random() - 0.5) * 5
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.7, maxLife: 0.7 });
    }
  }

  spawnHitParticles(pos, isCrit = false) {
    this.spawnHitSparks(pos, isCrit ? 0xffea00 : 0xff4422, isCrit);
    this.spawnBloodSplatter(pos);
  }

  spawnHitSparks(pos, color = 0xffcc00, isCrit = false) {
    const count = isCrit ? 28 : 16;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const sparkColor = Math.random() < 0.3 ? 0xffffff : color;
      const mat = new THREE.MeshBasicMaterial({
        color: sparkColor,
        transparent: true,
        opacity: 0.95
      });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        pos.x + (Math.random() - 0.5) * 0.3,
        pos.y + (Math.random() - 0.5) * 0.3,
        pos.z + (Math.random() - 0.5) * 0.3
      );

      const speed = isCrit ? (10 + Math.random() * 8) : (6 + Math.random() * 6);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.3) * Math.PI;
      const vel = new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * speed,
        Math.sin(phi) * speed + 3,
        Math.sin(theta) * Math.cos(phi) * speed
      );

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        vel,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        scaleSpeed: 2.0
      });
    }
  }

  spawnBloodSplatter(pos, dir = null) {
    const count = 18;
    const baseDir = dir ? dir.clone().normalize() : new THREE.Vector3((Math.random() - 0.5), 0.5, (Math.random() - 0.5)).normalize();

    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.14;
      const geo = new THREE.SphereGeometry(size, 4, 4);
      const bloodColor = Math.random() < 0.6 ? 0x8a0303 : 0xaa0e0e;
      const mat = new THREE.MeshBasicMaterial({
        color: bloodColor,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.4,
        pos.y + (Math.random() - 0.5) * 0.4,
        pos.z + (Math.random() - 0.5) * 0.4
      );

      const spread = 0.6;
      const speed = 5 + Math.random() * 7;
      const vel = new THREE.Vector3(
        (baseDir.x + (Math.random() - 0.5) * spread) * speed,
        (baseDir.y + (Math.random() * 0.4 + 0.2)) * speed * 0.7,
        (baseDir.z + (Math.random() - 0.5) * spread) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  spawnSlashArc(pos, forwardDir, isHeavy = false, color = 0xff3322) {
    // 3D Crescent Slash Arc that cuts through the strike zone
    const radius = isHeavy ? 2.6 : 1.8;
    const arcAngle = Math.PI * 0.65;
    const curve = new THREE.EllipseCurve(
      0, 0,
      radius, radius,
      -arcAngle * 0.5, arcAngle * 0.5,
      false, 0
    );
    const points = curve.getPoints(24);
    const geo = new THREE.BufferGeometry().setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
      color,
      linewidth: isHeavy ? 5 : 3,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(geo, mat);
    line.position.copy(pos);
    line.position.y += 0.2;

    const angle = Math.atan2(forwardDir.x, forwardDir.z);
    line.rotation.y = angle;
    line.rotation.x = (Math.random() - 0.5) * 0.4;
    line.rotation.z = isHeavy ? 0.35 : -0.25;

    this.scene.add(line);

    // Fade out and expand
    const maxLife = isHeavy ? 0.26 : 0.18;
    let life = maxLife;
    const interval = setInterval(() => {
      life -= 0.03;
      if (life <= 0) {
        clearInterval(interval);
        this.scene.remove(line);
        geo.dispose();
        mat.dispose();
      } else {
        const t = 1 - life / maxLife;
        line.scale.setScalar(1 + t * 0.6);
        mat.opacity = (1 - t * t) * 0.95;
      }
    }, 30);
  }

  spawnImpactRing(pos, maxRadius = 3.5, color = 0xffffff) {
    const geo = new THREE.RingGeometry(0.3, 0.6, 24);
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.08, pos.z);
    this.scene.add(ring);

    this.shockwaves.push({
      mesh: ring,
      life: 0.35,
      maxLife: 0.35,
      maxScale: maxRadius * 2
    });
  }

  spawnLungeDust(pos, forwardDir) {
    // Explosive dust kicking backwards from the feet during explosive forward lunge
    const backward = forwardDir.clone().negate().normalize();
    for (let i = 0; i < 9; i++) {
      const geo = new THREE.SphereGeometry(0.35 + Math.random() * 0.25, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x9c836a,
        transparent: true,
        opacity: 0.6
      });
      const dust = new THREE.Mesh(geo, mat);
      dust.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        0.15,
        pos.z + (Math.random() - 0.5) * 0.8
      );

      const vel = new THREE.Vector3(
        backward.x * (4 + Math.random() * 5) + (Math.random() - 0.5) * 2,
        Math.random() * 2 + 1,
        backward.z * (4 + Math.random() * 5) + (Math.random() - 0.5) * 2
      );

      this.scene.add(dust);
      this.particles.push({
        mesh: dust,
        vel,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7
      });
    }
  }

  spawnBossAura(pos) {
    // Magma flame particles rising around Final Boss
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.SphereGeometry(0.25 + Math.random() * 0.2, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.6 ? 0xff2200 : 0xff7700,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 2.8,
        pos.y + Math.random() * 2.5,
        pos.z + (Math.random() - 0.5) * 2.8
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 4 + 3,
        (Math.random() - 0.5) * 1.5
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  spawnFootstepDust(pos) {
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.SphereGeometry(0.35, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x8a7058,
        transparent: true,
        opacity: 0.5
      });
      const dust = new THREE.Mesh(geo, mat);
      dust.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        0.2,
        pos.z + (Math.random() - 0.5) * 0.8
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.5,
        (Math.random() - 0.5) * 2
      );

      this.scene.add(dust);
      this.particles.push({
        mesh: dust,
        vel,
        life: 0.5,
        maxLife: 0.5,
        scaleSpeed: -0.5
      });
    }
  }

  spawnRoarShockwave(pos, color = 0xffaa33) {
    const ringGeo = new THREE.RingGeometry(0.5, 1.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.4, pos.z);
    this.scene.add(ring);

    this.shockwaves.push({
      mesh: ring,
      scale: 1,
      maxScale: 14,
      life: 0.8,
      maxLife: 0.8
    });
  }

  spawnSlidingDust(pos) {
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.SphereGeometry(0.5, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x9c7a5a, transparent: true, opacity: 0.6 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(pos.x + (Math.random() - 0.5) * 1.5, 0.25, pos.z + (Math.random() - 0.5) * 1.5);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 2 + 1, (Math.random() - 0.5) * 4);
      this.scene.add(m);
      this.particles.push({ mesh: m, vel, life: 0.4, maxLife: 0.4 });
    }
  }

  spawnAttackTelegraph(pos, rotY, range = 5.5, isSpecial = false, colorHex = 0xff3322) {
    const geo = new THREE.RingGeometry(range * 0.4, range, 24, 1, -Math.PI * 0.35, Math.PI * 0.7);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: isSpecial ? 0.8 : 0.6 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.rotation.z = -rotY + Math.PI / 2;
    ring.position.set(pos.x, 0.15, pos.z);
    this.scene.add(ring);
    this.shockwaves.push({ mesh: ring, scale: 1, maxScale: 1.15, life: isSpecial ? 0.55 : 0.35, maxLife: isSpecial ? 0.55 : 0.35 });
  }

  spawnMoveMarker(pos) {
    const geo = new THREE.RingGeometry(0.3, 0.9, 24);
    const mat = new THREE.MeshBasicMaterial({ color: 0xe6b840, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.12, pos.z);
    this.scene.add(ring);
    this.shockwaves.push({ mesh: ring, scale: 0.5, maxScale: 2.2, life: 0.45, maxLife: 0.45 });
  }

  spawnTitanShockwave(pos) {
    // 1. Colossal Expanding Golden Seismic Shockwave Ring
    const geo = new THREE.RingGeometry(0.8, 2.4, 36);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.2, pos.z);
    this.scene.add(ring);
    this.shockwaves.push({ mesh: ring, scale: 1, maxScale: 12.0, life: 0.85, maxLife: 0.85 });

    // 2. Flying Bedrock Earth Chunks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a3c2c, roughness: 0.9 });
    for (let i = 0; i < 28; i++) {
      const s = 0.4 + Math.random() * 0.55;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
      rock.position.set(pos.x + (Math.random() - 0.5) * 2, 0.4, pos.z + (Math.random() - 0.5) * 2);
      const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 12 + Math.random() * 14;
      const vel = new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 12 + 6, Math.sin(angle) * speed);
      this.scene.add(rock);
      this.particles.push({ mesh: rock, vel, life: 0.85 + Math.random() * 0.35, maxLife: 1.2 });
    }

    // 3. Dense Expanding Ground Dust
    this.spawnFootstepDust(pos, 22);
  }

  spawnEarthSpikes(startPos, endPos, count = 6) {
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x5a4838,
      roughness: 0.85,
      metalness: 0.15
    });

    for (let i = 0; i < count; i++) {
      const t = (i + 1) / count;
      const px = THREE.MathUtils.lerp(startPos.x, endPos.x, t) + (Math.random() - 0.5) * 0.8;
      const pz = THREE.MathUtils.lerp(startPos.z, endPos.z, t) + (Math.random() - 0.5) * 0.8;

      setTimeout(() => {
        const h = 2.4 + Math.random() * 2.2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.8 + Math.random() * 0.4, h, 6), spikeMat);
        spike.position.set(px, h / 2, pz);
        spike.rotation.y = Math.random() * Math.PI;
        spike.rotation.z = (Math.random() - 0.5) * 0.25;
        spike.castShadow = true;
        this.scene.add(spike);

        this.spawnFootstepDust(new THREE.Vector3(px, 0.2, pz), 8);

        setTimeout(() => {
          this.scene.remove(spike);
          spike.geometry.dispose();
        }, 1300);
      }, i * 90);
    }
  }

  spawnShadowClones(centerPos, forwardDir, count = 2) {
    const cloneMat = new THREE.MeshStandardMaterial({
      color: 0x3b0764,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.78,
      roughness: 0.3
    });

    for (let i = 0; i < count; i++) {
      const side = i === 0 ? -1 : 1;
      const cloneGroup = new THREE.Group();

      // Stylized raptor silhouette body
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 2.2), cloneMat);
      torso.position.y = 1.6;
      cloneGroup.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 1.4), cloneMat);
      head.position.set(0, 2.0, 1.4);
      cloneGroup.add(head);

      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 5), cloneMat);
      tail.position.set(0, 1.5, -1.8);
      tail.rotation.x = -Math.PI / 2;
      cloneGroup.add(tail);

      // Glowing violet eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf0abfc });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
      eyeL.position.set(0.35, 2.1, 1.8);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
      eyeR.position.set(-0.35, 2.1, 1.8);
      cloneGroup.add(eyeL);
      cloneGroup.add(eyeR);

      // Spawn offset to the flank
      const perpX = -forwardDir.z * side;
      const perpZ = forwardDir.x * side;
      cloneGroup.position.set(centerPos.x + perpX * 3.5, 0, centerPos.z + perpZ * 3.5);

      const angle = Math.atan2(forwardDir.x, forwardDir.z);
      cloneGroup.rotation.y = angle;

      this.scene.add(cloneGroup);
      this.spawnVoidSmoke(cloneGroup.position, 12);

      // Fast curved dash forward and pounce strike
      const startX = cloneGroup.position.x;
      const startZ = cloneGroup.position.z;
      const targetX = centerPos.x + forwardDir.x * 6.5;
      const targetZ = centerPos.z + forwardDir.z * 6.5;
      const startTime = performance.now();
      const dashDuration = 550; // ms

      const dashInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / dashDuration);
        const ease = Math.sin(progress * Math.PI * 0.5);

        cloneGroup.position.x = THREE.MathUtils.lerp(startX, targetX, ease);
        cloneGroup.position.z = THREE.MathUtils.lerp(startZ, targetZ, ease);
        cloneGroup.position.y = Math.sin(progress * Math.PI) * 1.5;

        if (progress >= 1) {
          clearInterval(dashInterval);
          this.spawnVoidSmoke(cloneGroup.position, 16);
          this.spawnHitSparks(cloneGroup.position, 0xc084fc);
          this.scene.remove(cloneGroup);
          cloneGroup.traverse((c) => {
            if (c.geometry) c.geometry.dispose();
          });
        }
      }, 25);
    }
  }

  spawnMeteorImpact(pos) {
    // 1. Double explosive fiery shockwaves
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff3300, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const outerMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });

    const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.8, 2.2, 32), coreMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.set(pos.x, 0.22, pos.z);
    this.scene.add(ring1);
    this.shockwaves.push({ mesh: ring1, scale: 1, maxScale: 8.5, life: 0.6, maxLife: 0.6 });

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.2, 3.0, 32), outerMat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.set(pos.x, 0.26, pos.z);
    this.scene.add(ring2);
    this.shockwaves.push({ mesh: ring2, scale: 1, maxScale: 12.0, life: 0.75, maxLife: 0.75 });

    // 2. High-speed incandescent meteor sparks & debris
    for (let i = 0; i < 32; i++) {
      const geo = new THREE.SphereGeometry(0.25 + Math.random() * 0.35, 6, 6);
      const color = Math.random() < 0.5 ? 0xff4400 : 0xffdd00;
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const spd = 14 + Math.random() * 16;
      const vel = new THREE.Vector3(Math.cos(angle) * spd, Math.random() * 14 + 5, Math.sin(angle) * spd);
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.7 + Math.random() * 0.3, maxLife: 1.0 });
    }
  }

  spawnBurningAura(pos, count = 6) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.2 + Math.random() * 0.25, 5, 5);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.6 ? 0xff4400 : 0xffaa00,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 1.6,
        pos.y + Math.random() * 2.0,
        pos.z + (Math.random() - 0.5) * 1.6
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 6 + 4,
        (Math.random() - 0.5) * 2
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.45, maxLife: 0.45 });
    }
  }

  spawnLaserBeam(startPos, endPos, color = 0x00ffff) {
    const dir = new THREE.Vector3().subVectors(endPos, startPos);
    const dist = dir.length();
    dir.normalize();

    // 1. Core Energy Beam Cylinder
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.25, dist, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);

    // Position midway and orient along vector
    const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    beamMesh.position.copy(midPoint);
    beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    this.scene.add(beamMesh);
    this.particles.push({
      mesh: beamMesh,
      vel: new THREE.Vector3(0, 0, 0),
      life: 0.35,
      maxLife: 0.35,
      noGravity: true
    });

    // 2. Neon Laser Glow Sparks at impact
    for (let i = 0; i < 24; i++) {
      const geo = new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? color : 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(endPos);
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 14;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 8 + 3,
        Math.sin(angle) * speed
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.45, maxLife: 0.45 });
    }
  }

  spawnWindVortex(startPos, dir, count = 28) {
    const forward = dir.clone().normalize();
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.25 + Math.random() * 0.3, 5, 5);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xddeeff,
        transparent: true,
        opacity: 0.75
      });
      const mesh = new THREE.Mesh(geo, mat);
      const offsetDist = Math.random() * 2.0;
      const angle = Math.random() * Math.PI * 2;
      mesh.position.set(
        startPos.x + Math.cos(angle) * offsetDist,
        startPos.y + (Math.random() - 0.5) * 1.5,
        startPos.z + Math.sin(angle) * offsetDist
      );

      const spd = 20 + Math.random() * 15;
      const vel = new THREE.Vector3(
        forward.x * spd + (Math.random() - 0.5) * 6,
        Math.random() * 3 + 1,
        forward.z * spd + (Math.random() - 0.5) * 6
      );

      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.55, maxLife: 0.55, noGravity: true });
    }
  }

  spawnWaterBlast(startPos, endPos, count = 36) {
    const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 5, 5);
      const color = Math.random() < 0.6 ? 0x00bfff : 0x00ffff;
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        startPos.x + (Math.random() - 0.5) * 1.5,
        startPos.y + (Math.random() - 0.5) * 1.2,
        startPos.z + (Math.random() - 0.5) * 1.5
      );
      const spd = 18 + Math.random() * 12;
      const vel = new THREE.Vector3(
        (dir.x + (Math.random() - 0.5) * 0.25) * spd,
        Math.random() * 4 + 2,
        (dir.z + (Math.random() - 0.5) * 0.25) * spd
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.65, maxLife: 0.65 });
    }
  }

  update(delta) {

    // Dynamic embers drift
    if (this.emberMesh) {
      const pos = this.emberMesh.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += delta * 2.5;
        if (pos[i] > 14) pos[i] = 3.5;
      }
      this.emberMesh.geometry.attributes.position.needsUpdate = true;
    }

    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.vel, delta);
      if (!p.noGravity) {
        p.vel.y -= 18 * delta; // Gravity
      }

      const progress = p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.01, progress));
      if (p.mesh.material.transparent) {
        p.mesh.material.opacity = progress;
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= delta;

      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      const t = 1 - sw.life / sw.maxLife;
      const currentScale = 1 + t * sw.maxScale;
      sw.mesh.scale.set(currentScale, currentScale, 1);
      sw.mesh.material.opacity = (1 - t) * 0.85;
    }
  }
}
