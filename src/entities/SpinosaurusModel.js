import * as THREE from 'three';
import { DinosaurMeshBuilder } from './DinosaurMeshBuilder.js';
import { DinoTextureGenerator } from '../graphics/DinoTextureGenerator.js';

export class SpinosaurusModel {
  static build(skinColor = 0x3d5a55) {
    const root = new THREE.Group();
    const skinMat = DinosaurMeshBuilder.createSkinMaterial('spinosaurus', skinColor, 0x1f3530, false, 0.6, 0.12);
    const underbellyMat = DinosaurMeshBuilder.createSkinMaterial('spinosaurus', 0x8a9985, 0x5a6855, true, 0.7, 0.05);

    // Sail material with procedural warning veining
    const sailTex = DinoTextureGenerator.getSailTexture(0xba5533);
    const sailMat = new THREE.MeshStandardMaterial({
      map: sailTex,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // 1. Hydrodynamic Elongated Torso
    const torso = new THREE.Group();
    torso.position.set(0, 3.2, 0);
    root.add(torso);

    const torsoGeo = new THREE.CylinderGeometry(1.25, 1.1, 4.6, 14);
    torsoGeo.scale(0.85, 1.0, 1.25);
    const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
    torsoMesh.rotation.x = Math.PI / 2 + 0.05;
    torsoMesh.castShadow = true;
    torso.add(torsoMesh);

    // Pale counter-shaded river belly
    const bellyGeo = new THREE.CylinderGeometry(1.1, 0.95, 4.2, 12, 1, false, 0, Math.PI);
    bellyGeo.scale(0.8, 1.0, 1.2);
    const bellyMesh = new THREE.Mesh(bellyGeo, underbellyMat);
    bellyMesh.position.y = -0.3;
    bellyMesh.rotation.x = Math.PI / 2 + 0.05;
    bellyMesh.rotation.z = Math.PI;
    torso.add(bellyMesh);

    // 2. Iconic Massive Neural Spine Crest (The Dorsal Sail)
    const sailGeo = new THREE.CylinderGeometry(0.08, 0.15, 3.2, 16, 1, false, 0, Math.PI);
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(0, 2.5, -0.2);
    sail.rotation.z = Math.PI / 2;
    sail.rotation.y = Math.PI / 2;
    sail.scale.set(1.65, 0.15, 2.3);
    sail.castShadow = true;
    torso.add(sail);

    // Structural Neural Spines supporting the sail
    for (let i = -4; i <= 4; i++) {
      const height = 3.2 - Math.abs(i) * 0.35;
      const spineGeo = new THREE.CylinderGeometry(0.06, 0.09, height, 6);
      const spine = new THREE.Mesh(spineGeo, skinMat);
      spine.position.set(0, height / 2 + 1.1, i * 0.5);
      spine.castShadow = true;
      torso.add(spine);
    }

    // 3. Crocodilian S-Curved Neck Joint
    const neck = new THREE.Group();
    neck.position.set(0, 0.65, 2.1);
    torso.add(neck);

    const neckGeo = new THREE.CylinderGeometry(0.75, 1.0, 2.3, 12);
    neckGeo.scale(0.8, 1.0, 1.1);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0.45, 0.9);
    neckMesh.rotation.x = -0.32;
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // 4. Narrow Crocodilian Head & Snout
    const head = new THREE.Group();
    head.position.set(0, 0.95, 1.85);
    neck.add(head);

    // Long Tapered Snout
    const snoutGeo = new THREE.CylinderGeometry(0.55, 0.75, 3.4, 12);
    snoutGeo.scale(0.85, 0.6, 1.3);
    const snout = new THREE.Mesh(snoutGeo, skinMat);
    snout.position.set(0, 0.12, 1.4);
    snout.rotation.x = Math.PI / 2;
    snout.castShadow = true;
    head.add(snout);

    // Crest between eyes
    const crestGeo = new THREE.ConeGeometry(0.12, 0.9, 5);
    crestGeo.scale(0.5, 1.0, 2.0);
    const crest = new THREE.Mesh(crestGeo, DinosaurMeshBuilder.createBoneMaterial(true));
    crest.position.set(0, 0.45, 0.6);
    crest.rotation.x = -0.3;
    head.add(crest);

    // Crocodilian Amber Eyes
    const eyeL = DinosaurMeshBuilder.createEyeMesh(0xffcc11);
    eyeL.position.set(0.62, 0.38, 0.45);
    eyeL.rotation.y = 0.25;
    const eyeR = DinosaurMeshBuilder.createEyeMesh(0xffcc11);
    eyeR.position.set(-0.62, 0.38, 0.45);
    eyeR.rotation.y = Math.PI - 0.25;
    head.add(eyeL, eyeR);

    // Upper Needle Teeth
    const teethL = DinosaurMeshBuilder.createTeethRow(8, 0.26);
    teethL.position.set(0.48, -0.22, 1.4);
    teethL.rotation.x = Math.PI;
    const teethR = DinosaurMeshBuilder.createTeethRow(8, 0.26);
    teethR.position.set(-0.48, -0.22, 1.4);
    teethR.rotation.x = Math.PI;
    head.add(teethL, teethR);

    // 5. Lower Snapping Jaw
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.3, 0.2);
    head.add(jaw);

    const jawGeo = new THREE.CylinderGeometry(0.48, 0.65, 3.3, 10);
    jawGeo.scale(0.8, 0.4, 1.25);
    const jawMesh = new THREE.Mesh(jawGeo, underbellyMat);
    jawMesh.position.set(0, -0.12, 1.4);
    jawMesh.rotation.x = Math.PI / 2;
    jawMesh.castShadow = true;
    jaw.add(jawMesh);

    // Lower Needle Teeth
    const lowerTeeth = DinosaurMeshBuilder.createTeethRow(7, 0.24);
    lowerTeeth.position.set(0, 0.1, 1.4);
    jaw.add(lowerTeeth);

    // 6. Powerful Hind Legs
    const leftLeg = this.createLeg(skinMat, 1.3);
    const rightLeg = this.createLeg(skinMat, -1.3);
    root.add(leftLeg, rightLeg);

    // 7. Muscular Slashing Arms with Giant Hook Claws
    const armL = this.createSlashingArm(skinMat, 1.2);
    const armR = this.createSlashingArm(skinMat, -1.2);
    torso.add(armL, armR);

    // 8. Paddle Fin Tail (Adapted for aquatic swimming & lethal tail slaps)
    const tail1 = new THREE.Group();
    tail1.position.set(0, 0.35, -2.15);
    torso.add(tail1);

    const tail1Geo = new THREE.CylinderGeometry(0.75, 1.1, 3.2, 10);
    tail1Geo.scale(0.65, 1.2, 1.0);
    const tail1Mesh = new THREE.Mesh(tail1Geo, skinMat);
    tail1Mesh.position.set(0, -0.1, -1.4);
    tail1Mesh.rotation.x = -Math.PI / 2 + 0.1;
    tail1Mesh.castShadow = true;
    tail1.add(tail1Mesh);

    const tail2 = new THREE.Group();
    tail2.position.set(0, -0.05, -2.8);
    tail1.add(tail2);

    const tail2Geo = new THREE.CylinderGeometry(0.35, 0.75, 3.5, 10);
    tail2Geo.scale(0.5, 1.3, 1.0);
    const tail2Mesh = new THREE.Mesh(tail2Geo, skinMat);
    tail2Mesh.position.set(0, -0.05, -1.6);
    tail2Mesh.rotation.x = -Math.PI / 2 + 0.08;
    tail2Mesh.castShadow = true;
    tail2.add(tail2Mesh);

    // Top fin along tail
    const finGeo = new THREE.BoxGeometry(0.08, 0.65, 3.0);
    const fin = new THREE.Mesh(finGeo, sailMat);
    fin.position.set(0, 0.45, -1.4);
    tail1.add(fin);

    return {
      mesh: root,
      joints: { torso, neck, head, jaw, leftLeg, rightLeg, armL, armR, tail1, tail2 }
    };
  }

  static createLeg(skinMat, xOffset) {
    const hip = new THREE.Group();
    hip.position.set(xOffset, 2.9, -0.4);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.55, 2.1, 10), skinMat);
    thigh.position.set(0, -0.7, 0.12);
    thigh.rotation.x = 0.2;
    thigh.castShadow = true;
    hip.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 2.0, 10), skinMat);
    shin.position.set(0, -1.95, -0.1);
    shin.rotation.x = -0.2;
    shin.castShadow = true;
    hip.add(shin);

    const footGroup = new THREE.Group();
    footGroup.position.set(0, -2.8, 0.3);
    hip.add(footGroup);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.3, 8), skinMat);
    foot.rotation.x = Math.PI / 2;
    foot.scale.set(0.85, 0.32, 1.2);
    foot.castShadow = true;
    footGroup.add(foot);

    [-0.28, 0, 0.28].forEach((x) => {
      const claw = DinosaurMeshBuilder.createClaw(0.42);
      claw.position.set(x, -0.05, 0.65);
      footGroup.add(claw);
    });

    return hip;
  }

  static createSlashingArm(skinMat, xOffset) {
    const arm = new THREE.Group();
    arm.position.set(xOffset, 0.2, 1.4);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 1.5, 8), skinMat);
    forearm.position.set(0, -0.65, 0.4);
    forearm.rotation.x = -0.45;
    forearm.castShadow = true;
    arm.add(forearm);

    // Giant curved predator sickle claw on thumb
    const giantClaw = DinosaurMeshBuilder.createClaw(0.65);
    giantClaw.position.set(Math.sign(xOffset) * 0.15, -1.35, 0.85);
    arm.add(giantClaw);

    // Secondary claws
    const sideClaw = DinosaurMeshBuilder.createClaw(0.4);
    sideClaw.position.set(-Math.sign(xOffset) * 0.1, -1.25, 0.8);
    arm.add(sideClaw);

    return arm;
  }
}
