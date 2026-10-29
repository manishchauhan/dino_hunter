import * as THREE from 'three';
import { DinosaurMeshBuilder } from './DinosaurMeshBuilder.js';
import { DinoTextureGenerator } from '../graphics/DinoTextureGenerator.js';
import { DINO_TYPES, DINO_STATS } from '../constants.js';
import { TRexModel } from './TRexModel.js';
import { TriceratopsModel } from './TriceratopsModel.js';
import { SpinosaurusModel } from './SpinosaurusModel.js';
import { AnkylosaurusModel } from './AnkylosaurusModel.js';

/**
 * Universal AAA Dinosaur Model Factory
 * Procedurally constructs anatomically authentic 3D models for all 22 dinosaur species
 * including theropods, spinosaurids, ceratopsians, stegosaurids, ankylosaurids,
 * raptors, dome-heads, hadrosaurs, scythe reapers, and sauropods.
 */
export class ModularDinosaurModel {
  static build(type, colorHex = null) {
    // Retain legacy dedicated models if exact match, or use modular generator
    if (type === DINO_TYPES.TREX) return TRexModel.build(colorHex || DINO_STATS[type]?.color);
    if (type === DINO_TYPES.TRICERATOPS) return TriceratopsModel.build(colorHex || DINO_STATS[type]?.color);
    if (type === DINO_TYPES.SPINOSAURUS) return SpinosaurusModel.build(colorHex || DINO_STATS[type]?.color);
    if (type === DINO_TYPES.ANKYLOSAURUS) return AnkylosaurusModel.build(colorHex || DINO_STATS[type]?.color);

    const stats = DINO_STATS[type] || DINO_STATS[DINO_TYPES.TREX];
    const skinColor = colorHex || stats.color;
    const accentColor = stats.accentColor;
    const archetype = stats.archetype || 'apex_theropod';

    const root = new THREE.Group();
    const skinMat = DinosaurMeshBuilder.createSkinMaterial(type, skinColor, accentColor, false, 0.65, 0.1);
    const underbellyMat = DinosaurMeshBuilder.createSkinMaterial(type, 0xbca88a, 0x8f7860, true, 0.72, 0.05);
    const boneMat = DinosaurMeshBuilder.createBoneMaterial(true);

    const joints = {};
    const isQuadruped = ['ceratopsian', 'ankylosaurid', 'stegosaurid', 'sauropod'].includes(archetype);

    // 1. Torso
    const torso = new THREE.Group();
    torso.position.set(0, isQuadruped ? 2.8 : 3.2, 0);
    root.add(torso);
    joints.torso = torso;

    let chestRadius = isQuadruped ? 1.6 : 1.35;
    let chestLength = isQuadruped ? 4.2 : 3.8;
    if (archetype === 'sauropod') { chestRadius = 2.4; chestLength = 5.5; }
    if (archetype === 'dromaeosaur') { chestRadius = 0.95; chestLength = 2.6; }
    if (archetype === 'scythe_reaper') { chestRadius = 1.7; chestLength = 3.6; }

    const chestGeo = new THREE.CylinderGeometry(chestRadius * 0.9, chestRadius, chestLength, 14);
    chestGeo.scale(0.88, 1.0, 1.25);
    const chestMesh = new THREE.Mesh(chestGeo, skinMat);
    chestMesh.rotation.x = Math.PI / 2 + (isQuadruped ? 0 : 0.12);
    chestMesh.castShadow = true;
    torso.add(chestMesh);

    // Pale muscular chest underbelly plate
    const bellyGeo = new THREE.CylinderGeometry(chestRadius * 0.85, chestRadius * 0.95, chestLength * 0.9, 12, 1, false, 0, Math.PI);
    bellyGeo.scale(0.85, 1.0, 1.2);
    const bellyMesh = new THREE.Mesh(bellyGeo, underbellyMat);
    bellyMesh.rotation.x = Math.PI / 2 + (isQuadruped ? 0 : 0.12);
    bellyMesh.rotation.z = Math.PI;
    bellyMesh.position.y = -chestRadius * 0.28;
    bellyMesh.castShadow = true;
    torso.add(bellyMesh);

    // 2. Neck
    const neck = new THREE.Group();
    let neckLen = isQuadruped ? 2.0 : 2.2;
    let neckY = 0.85;
    let neckZ = chestLength * 0.45;
    if (archetype === 'sauropod') { neckLen = 5.8; neckY = 1.8; }
    if (archetype === 'scythe_reaper') { neckLen = 3.6; neckY = 1.2; }
    neck.position.set(0, neckY, neckZ);
    torso.add(neck);
    joints.neck = neck;

    const neckRadius = isQuadruped ? 1.0 : 0.8;
    const neckGeo = new THREE.CylinderGeometry(neckRadius * 0.8, neckRadius * 1.1, neckLen, 12);
    neckGeo.scale(0.82, 1.0, 1.15);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, neckLen * 0.35, neckLen * 0.35);
    neckMesh.rotation.x = archetype === 'sauropod' ? -0.75 : -0.45;
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // 3. Head & Jaws
    const head = new THREE.Group();
    head.position.set(0, neckLen * 0.7, neckLen * 0.7);
    neck.add(head);
    joints.head = head;

    // Skull geometry custom per archetype
    let skullLength = 2.6;
    let skullWidth = 0.85;
    let skullHeight = 0.85;

    if (archetype === 'dromaeosaur') { skullLength = 1.6; skullWidth = 0.55; skullHeight = 0.55; }
    if (type === 'giganotosaurus') { skullLength = 3.2; skullWidth = 0.95; skullHeight = 0.95; }
    if (type === 'carnotaurus') { skullLength = 1.9; skullWidth = 0.95; skullHeight = 1.1; } // Deep bulldog head
    if (['baryonyx', 'suchomimus'].includes(type)) { skullLength = 3.0; skullWidth = 0.65; skullHeight = 0.65; } // Croc snout
    if (archetype === 'sauropod') { skullLength = 1.8; skullWidth = 1.0; skullHeight = 0.9; }

    const skullGeo = new THREE.CylinderGeometry(skullWidth * 0.8, skullWidth, skullLength, 12);
    skullGeo.scale(0.85, 0.75, 1.3);
    const skull = new THREE.Mesh(skullGeo, skinMat);
    skull.position.set(0, 0.25, skullLength * 0.4);
    skull.rotation.x = Math.PI / 2 - 0.05;
    skull.castShadow = true;
    head.add(skull);

    // Eyes
    const eyeL = DinosaurMeshBuilder.createEyeMesh(accentColor);
    eyeL.position.set(skullWidth * 0.85, 0.38, skullLength * 0.25);
    eyeL.rotation.y = 0.2;
    const eyeR = DinosaurMeshBuilder.createEyeMesh(accentColor);
    eyeR.position.set(-skullWidth * 0.85, 0.38, skullLength * 0.25);
    eyeR.rotation.y = Math.PI - 0.2;
    head.add(eyeL, eyeR);

    // Teeth
    const teethCount = archetype === 'dromaeosaur' ? 5 : 7;
    const teethL = DinosaurMeshBuilder.createTeethRow(teethCount, 0.3);
    teethL.position.set(skullWidth * 0.75, -0.2, skullLength * 0.45);
    teethL.rotation.x = Math.PI;
    const teethR = DinosaurMeshBuilder.createTeethRow(teethCount, 0.3);
    teethR.position.set(-skullWidth * 0.75, -0.2, skullLength * 0.45);
    teethR.rotation.x = Math.PI;
    head.add(teethL, teethR);

    // Hinged Lower Jaw
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.25, 0.2);
    head.add(jaw);
    joints.jaw = jaw;

    const jawGeo = new THREE.CylinderGeometry(skullWidth * 0.7, skullWidth * 0.85, skullLength * 0.95, 10);
    jawGeo.scale(0.75, 0.45, 1.2);
    const jawMesh = new THREE.Mesh(jawGeo, underbellyMat);
    jawMesh.position.set(0, -0.12, skullLength * 0.42);
    jawMesh.rotation.x = Math.PI / 2;
    jawMesh.castShadow = true;
    jaw.add(jawMesh);

    // ARCHETYPE & SPECIES SPECIFIC HEAD ACCENTS:
    if (type === 'carnotaurus') {
      // 2 sharp bull horns projecting laterally above eyes
      const hornGeo = new THREE.ConeGeometry(0.24, 0.9, 8);
      const hornL = new THREE.Mesh(hornGeo, boneMat);
      hornL.position.set(0.75, 0.8, 0.3);
      hornL.rotation.set(-0.3, 0.4, -0.6);
      const hornR = new THREE.Mesh(hornGeo, boneMat);
      hornR.position.set(-0.75, 0.8, 0.3);
      hornR.rotation.set(-0.3, -0.4, 0.6);
      head.add(hornL, hornR);
    } else if (type === 'ceratosaurus') {
      // Prominent nasal blade horn + brow crests
      const noseHornGeo = new THREE.ConeGeometry(0.22, 0.95, 6);
      noseHornGeo.scale(0.5, 1.0, 1.4);
      const noseHorn = new THREE.Mesh(noseHornGeo, boneMat);
      noseHorn.position.set(0, 0.85, skullLength * 0.65);
      noseHorn.rotation.x = -0.3;
      head.add(noseHorn);
    } else if (type === 'allosaurus') {
      // Lacrimal eye crests
      [-0.6, 0.6].forEach((x) => {
        const crest = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 6), boneMat);
        crest.position.set(x, 0.65, 0.4);
        crest.rotation.x = -0.4;
        head.add(crest);
      });
    } else if (type === 'dilophosaurus') {
      // Iconic dual parallel thin semi-circular bony crests along skull
      [-0.32, 0.32].forEach((x) => {
        const crestGeo = new THREE.CylinderGeometry(0.04, 0.04, skullLength * 0.8, 8);
        crestGeo.scale(1.0, 1.0, 1.8);
        const crest = new THREE.Mesh(crestGeo, DinosaurMeshBuilder.createSkinMaterial(type, accentColor, 0xff3300));
        crest.position.set(x, 0.85, skullLength * 0.4);
        crest.rotation.x = Math.PI / 2;
        head.add(crest);
      });
    } else if (type === 'pachycephalosaurus') {
      // 9-inch solid bone cranium dome
      const domeGeo = new THREE.SphereGeometry(0.9, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const domeMat = DinosaurMeshBuilder.createBoneMaterial(true);
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(0, 0.5, 0.5);
      dome.scale.set(0.95, 1.1, 1.2);
      dome.castShadow = true;
      head.add(dome);
      // Studded perimeter bone tubercles
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const node = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), boneMat);
        node.position.set(Math.cos(ang) * 0.9, 0.35, Math.sin(ang) * 0.8 + 0.5);
        node.rotation.x = Math.PI / 2;
        head.add(node);
      }
    } else if (type === 'parasaurolophus') {
      // Long backward curved tubular acoustic resonance crest
      const crestGeo = new THREE.CylinderGeometry(0.28, 0.38, 3.4, 10);
      crestGeo.scale(0.7, 1.0, 1.2);
      const crestMat = DinosaurMeshBuilder.createSkinMaterial(type, accentColor, 0x111111);
      const crest = new THREE.Mesh(crestGeo, crestMat);
      crest.position.set(0, 1.1, -1.0);
      crest.rotation.x = 0.95; // sweeping backwards
      crest.castShadow = true;
      head.add(crest);
    } else if (type === 'styracosaurus') {
      // Giant nasal spike + 6 radiating crown spikes on frill
      const frillMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.1, 0.35, 12), skinMat);
      frillMesh.position.set(0, 0.9, -0.2);
      frillMesh.rotation.x = -0.55;
      head.add(frillMesh);
      // Giant nose horn
      const bigHorn = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.2, 8), boneMat);
      bigHorn.position.set(0, 1.3, skullLength * 0.65);
      bigHorn.rotation.x = -0.35;
      bigHorn.castShadow = true;
      head.add(bigHorn);
      // 6 radiating frill spikes
      for (let i = 0; i < 6; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.3, 6), boneMat);
        const ang = (i / 5 - 0.5) * 1.6;
        sp.position.set(Math.sin(ang) * 1.5, 1.4 + Math.cos(ang) * 0.4, -0.6);
        sp.rotation.z = -ang;
        sp.rotation.x = -0.6;
        sp.castShadow = true;
        head.add(sp);
      }
    } else if (type === 'pachyrhinosaurus') {
      // Massive nasal boss battering ram pad
      const bossGeo = new THREE.BoxGeometry(0.9, 0.65, 1.4);
      const boss = new THREE.Mesh(bossGeo, boneMat);
      boss.position.set(0, 0.7, skullLength * 0.55);
      boss.castShadow = true;
      head.add(boss);
    }

    // 4. Tail (Multi-segment)
    const tail1 = new THREE.Group();
    tail1.position.set(0, isQuadruped ? 0.3 : 0.45, -chestLength * 0.5);
    torso.add(tail1);
    joints.tail1 = tail1;

    let tail1Len = isQuadruped ? 3.2 : 3.5;
    if (archetype === 'sauropod') tail1Len = 5.2;
    const tail1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.2, tail1Len, 10), skinMat);
    tail1Mesh.position.set(0, -0.1, -tail1Len * 0.45);
    tail1Mesh.rotation.x = -Math.PI / 2 + 0.15;
    tail1Mesh.castShadow = true;
    tail1.add(tail1Mesh);

    const tail2 = new THREE.Group();
    tail2.position.set(0, -0.1, -tail1Len * 0.9);
    tail1.add(tail2);
    joints.tail2 = tail2;

    const tail2Len = tail1Len * 1.1;
    const tail2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.85, tail2Len, 10), skinMat);
    tail2Mesh.position.set(0, -0.05, -tail2Len * 0.45);
    tail2Mesh.rotation.x = -Math.PI / 2 + 0.1;
    tail2Mesh.castShadow = true;
    tail2.add(tail2Mesh);

    // TAIL WEAPONS:
    if (type === 'stegosaurus') {
      // Alternating double row of pentagonal dermal plates along back
      for (let i = 0; i < 9; i++) {
        const plateGeo = new THREE.ConeGeometry(0.7, 1.6, 5);
        plateGeo.scale(0.2, 1.0, 1.4);
        const plMat = DinosaurMeshBuilder.createSkinMaterial(type, accentColor, 0xd47232);
        const pl = new THREE.Mesh(plateGeo, plMat);
        const side = i % 2 === 0 ? 0.45 : -0.45;
        pl.position.set(side, 1.6, 1.2 - i * 0.65);
        pl.castShadow = true;
        torso.add(pl);
      }
      // 4-spike Thagomizer on tail tip
      [-0.6, 0.6].forEach((x) => {
        const sp1 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.5, 6), boneMat);
        sp1.position.set(x * 1.4, 0.1, -tail2Len * 0.6);
        sp1.rotation.set(0, 0, x > 0 ? -1.1 : 1.1);
        const sp2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.5, 6), boneMat);
        sp2.position.set(x * 1.4, 0.1, -tail2Len * 0.85);
        sp2.rotation.set(0, 0, x > 0 ? -1.1 : 1.1);
        tail2.add(sp1, sp2);
      });
    } else if (type === 'kentrosaurus') {
      // Enormous lateral shoulder spikes
      [-1.4, 1.4].forEach((x) => {
        const shp = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.2, 6), boneMat);
        shp.position.set(x, 0.5, 0.8);
        shp.rotation.set(0, 0, x > 0 ? -1.3 : 1.3);
        shp.castShadow = true;
        torso.add(shp);
      });
      // Tail thagomizer
      [-0.6, 0.6].forEach((x) => {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.6, 6), boneMat);
        sp.position.set(x * 1.3, 0.1, -tail2Len * 0.7);
        sp.rotation.set(0, 0, x > 0 ? -1.2 : 1.2);
        tail2.add(sp);
      });
    }

    // 5. Forelimbs / Arms
    if (isQuadruped) {
      // Sturdy quadrupedal column front legs
      const frontLegHeight = archetype === 'sauropod' ? 4.2 : 2.5;
      const fLegL = this.createPillarLeg(skinMat, chestRadius * 0.95, chestLength * 0.35, frontLegHeight);
      const fLegR = this.createPillarLeg(skinMat, -chestRadius * 0.95, chestLength * 0.35, frontLegHeight);
      root.add(fLegL, fLegR);
      joints.frontLegL = fLegL;
      joints.frontLegR = fLegR;
    } else {
      // Biped arms
      const armL = this.createBipedArm(skinMat, boneMat, type, chestRadius * 0.85);
      const armR = this.createBipedArm(skinMat, boneMat, type, -chestRadius * 0.85);
      torso.add(armL, armR);
      joints.armL = armL;
      joints.armR = armR;
    }

    // 6. Hind Legs (Left & Right)
    const legHeight = archetype === 'sauropod' ? 4.0 : (isQuadruped ? 2.6 : 3.0);
    if (isQuadruped) {
      const bLegL = this.createPillarLeg(skinMat, chestRadius * 0.95, -chestLength * 0.35, legHeight);
      const bLegR = this.createPillarLeg(skinMat, -chestRadius * 0.95, -chestLength * 0.35, legHeight);
      root.add(bLegL, bLegR);
      joints.leftLeg = bLegL;
      joints.rightLeg = bLegR;
    } else {
      const bipedLegL = this.createBipedLeg(skinMat, boneMat, type, chestRadius * 0.95);
      const bipedLegR = this.createBipedLeg(skinMat, boneMat, type, -chestRadius * 0.95);
      root.add(bipedLegL, bipedLegR);
      joints.leftLeg = bipedLegL;
      joints.rightLeg = bipedLegR;
    }

    return {
      mesh: root,
      joints
    };
  }

  static createBipedArm(skinMat, boneMat, type, xOffset) {
    const arm = new THREE.Group();
    arm.position.set(xOffset, 0.35, 1.3);

    let armLen = 0.8;
    let bicepRadius = 0.18;
    if (['allosaurus', 'baryonyx', 'suchomimus'].includes(type)) { armLen = 1.4; bicepRadius = 0.24; }
    if (type === 'carnotaurus') { armLen = 0.35; bicepRadius = 0.12; } // tiny vestigial arms
    if (type === 'therizinosaurus') { armLen = 2.4; bicepRadius = 0.32; } // colossal scythe arms

    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(bicepRadius * 0.8, bicepRadius, armLen, 8), skinMat);
    bicep.position.set(0, -armLen * 0.4, armLen * 0.3);
    bicep.rotation.x = -0.55;
    bicep.castShadow = true;
    arm.add(bicep);

    if (type === 'therizinosaurus') {
      // 3 giant 1.2m curved scythe claws
      [-0.18, 0, 0.18].forEach((cx) => {
        const scythe = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.8, 6), boneMat);
        scythe.position.set(cx, -armLen * 0.95, armLen * 0.7);
        scythe.rotation.x = Math.PI / 2 - 0.2;
        scythe.castShadow = true;
        arm.add(scythe);
      });
    } else if (type === 'iguanodon') {
      // Conical thumb dagger spike projecting sideways
      const thumb = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.85, 6), boneMat);
      thumb.position.set(Math.sign(xOffset) * 0.3, -armLen * 0.8, 0.4);
      thumb.rotation.z = Math.sign(xOffset) * 1.2;
      arm.add(thumb);
    } else if (['baryonyx', 'suchomimus'].includes(type)) {
      // Curved heavy hook claw
      const hook = DinosaurMeshBuilder.createClaw(0.65);
      hook.position.set(0, -armLen * 0.8, 0.5);
      arm.add(hook);
    } else if (type !== 'carnotaurus') {
      [-0.08, 0.08].forEach((cx) => {
        const claw = DinosaurMeshBuilder.createClaw(0.28);
        claw.position.set(cx, -armLen * 0.8, 0.45);
        arm.add(claw);
      });
    }

    return arm;
  }

  static createBipedLeg(skinMat, boneMat, type, xOffset) {
    const hip = new THREE.Group();
    hip.position.set(xOffset, 2.9, -0.3);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 2.2, 10), skinMat);
    thigh.scale.set(0.85, 1.0, 1.3);
    thigh.position.set(0, -0.7, 0.15);
    thigh.rotation.x = 0.25;
    thigh.castShadow = true;
    hip.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 2.0, 10), skinMat);
    shin.scale.set(0.85, 1.0, 1.15);
    shin.position.set(0, -2.0, -0.1);
    shin.rotation.x = -0.22;
    shin.castShadow = true;
    hip.add(shin);

    const footGroup = new THREE.Group();
    footGroup.position.set(0, -2.85, 0.35);
    hip.add(footGroup);

    const footBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 8), skinMat);
    footBase.scale.set(0.9, 0.35, 1.2);
    footBase.rotation.x = Math.PI / 2;
    footBase.castShadow = true;
    footGroup.add(footBase);

    // Raptor sickle killing claws on inner digit
    if (['velociraptor', 'deinonychus'].includes(type)) {
      const sickleClaw = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.85, 6), boneMat);
      sickleClaw.position.set(-Math.sign(xOffset) * 0.28, 0.25, 0.65);
      sickleClaw.rotation.x = -0.7; // raised lethal sickle claw
      footGroup.add(sickleClaw);
    }

    [-0.32, 0, 0.32].forEach((cx) => {
      const claw = DinosaurMeshBuilder.createClaw(0.42);
      claw.position.set(cx, -0.05, 0.75);
      footGroup.add(claw);
    });

    return hip;
  }

  static createPillarLeg(skinMat, x, z, height) {
    const hip = new THREE.Group();
    hip.position.set(x, height, z);

    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, height, 10), skinMat);
    legMesh.position.y = -height / 2;
    legMesh.castShadow = true;
    hip.add(legMesh);

    const footGroup = new THREE.Group();
    footGroup.position.set(0, -height + 0.18, 0.12);
    hip.add(footGroup);

    const footMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.78, 0.35, 10), skinMat);
    footMesh.castShadow = true;
    footGroup.add(footMesh);

    [-0.32, 0, 0.32].forEach((cx) => {
      const nail = DinosaurMeshBuilder.createClaw(0.28);
      nail.position.set(cx, -0.05, 0.45);
      footGroup.add(nail);
    });

    return hip;
  }
}
