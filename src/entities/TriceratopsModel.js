import * as THREE from 'three';
import { DinosaurMeshBuilder } from './DinosaurMeshBuilder.js';

export class TriceratopsModel {
  static build(skinColor = 0x6e5843) {
    const root = new THREE.Group();
    const skinMat = DinosaurMeshBuilder.createSkinMaterial('triceratops', skinColor, 0x3d2d20, false, 0.75, 0.08);
    const frillMat = DinosaurMeshBuilder.createSkinMaterial('triceratops', 0x8a6238, 0x4d321c, false, 0.65, 0.12);
    const hornMat = DinosaurMeshBuilder.createBoneMaterial(true);

    // 1. Massive Barrel Body / Torso
    const torso = new THREE.Group();
    torso.position.set(0, 2.7, 0);
    root.add(torso);

    const bodyGeo = new THREE.CylinderGeometry(1.5, 1.35, 4.2, 14);
    bodyGeo.scale(1.0, 0.95, 1.25);
    const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.castShadow = true;
    torso.add(bodyMesh);

    // Muscular shoulder hump
    const humpGeo = new THREE.SphereGeometry(1.25, 10, 10);
    humpGeo.scale(0.9, 0.8, 1.1);
    const hump = new THREE.Mesh(humpGeo, skinMat);
    hump.position.set(0, 0.65, 0.8);
    hump.castShadow = true;
    torso.add(hump);

    // 2. Thick Neck Joint
    const neck = new THREE.Group();
    neck.position.set(0, 0.35, 1.9);
    torso.add(neck);

    const neckGeo = new THREE.CylinderGeometry(1.1, 1.3, 1.8, 12);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0.2, 0.6);
    neckMesh.rotation.x = -0.25;
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // 3. Head Joint (Skull, Frill & Horns)
    const head = new THREE.Group();
    head.position.set(0, 0.2, 0.9);
    neck.add(head);

    // Iconic Scalloped Cervical Frill Shield
    const frillGroup = new THREE.Group();
    frillGroup.position.set(0, 1.45, -0.45);
    frillGroup.rotation.x = 0.55;
    head.add(frillGroup);

    const frillGeo = new THREE.CylinderGeometry(2.3, 1.7, 0.35, 14);
    frillGeo.scale(1.15, 0.9, 0.45);
    const frill = new THREE.Mesh(frillGeo, frillMat);
    frill.castShadow = true;
    frillGroup.add(frill);

    // Spiked scallops along frill rim (Epoccipitals)
    for (let i = -5; i <= 5; i++) {
      const angle = (i / 6) * (Math.PI * 0.45);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 5), hornMat);
      spike.position.set(Math.sin(angle) * 2.35, Math.cos(angle) * 1.85, 0);
      spike.rotation.z = -angle;
      frillGroup.add(spike);
    }

    // Heavy Tapered Skull Base
    const skullGeo = new THREE.CylinderGeometry(0.9, 1.15, 2.3, 10);
    skullGeo.scale(0.9, 0.8, 1.15);
    const skull = new THREE.Mesh(skullGeo, skinMat);
    skull.position.set(0, 0.1, 0.8);
    skull.rotation.x = Math.PI / 2 + 0.1;
    skull.castShadow = true;
    head.add(skull);

    // Sharp Keratin Beak
    const beakGeo = new THREE.ConeGeometry(0.65, 1.3, 8);
    beakGeo.scale(0.85, 1.0, 1.2);
    const beak = new THREE.Mesh(beakGeo, hornMat);
    beak.position.set(0, -0.35, 2.15);
    beak.rotation.x = Math.PI / 2 + 0.35;
    beak.castShadow = true;
    head.add(beak);

    // Long Deadly Brow Horns
    const browHornL = this.createCurvedHorn(hornMat, 2.4, 0.22);
    browHornL.position.set(0.72, 1.05, 1.05);
    browHornL.rotation.set(0.62, 0.14, -0.05);
    const browHornR = this.createCurvedHorn(hornMat, 2.4, 0.22);
    browHornR.position.set(-0.72, 1.05, 1.05);
    browHornR.rotation.set(0.62, -0.14, 0.05);
    head.add(browHornL, browHornR);

    // Nose Horn
    const noseHorn = this.createCurvedHorn(hornMat, 1.1, 0.18);
    noseHorn.position.set(0, 0.65, 1.8);
    noseHorn.rotation.x = 0.35;
    head.add(noseHorn);

    // Reptilian Amber Eyes
    const eyeL = DinosaurMeshBuilder.createEyeMesh(0xffaa22);
    eyeL.position.set(0.95, 0.5, 0.65);
    eyeL.rotation.y = 0.3;
    const eyeR = DinosaurMeshBuilder.createEyeMesh(0xffaa22);
    eyeR.position.set(-0.95, 0.5, 0.65);
    eyeR.rotation.y = Math.PI - 0.3;
    head.add(eyeL, eyeR);

    // Lower Jaw
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.5, 0.6);
    head.add(jaw);

    // 4. Sturdy Quadruped Columnar Legs
    const frontLegL = this.createColumnLeg(skinMat, 1.45, 1.15, 2.2);
    const frontLegR = this.createColumnLeg(skinMat, -1.45, 1.15, 2.2);
    const legBackL = this.createColumnLeg(skinMat, 1.45, -1.35, 2.4);
    const legBackR = this.createColumnLeg(skinMat, -1.45, -1.35, 2.4);
    root.add(frontLegL, frontLegR, legBackL, legBackR);

    // 5. Segmented Tail
    const tail1 = new THREE.Group();
    tail1.position.set(0, 0.15, -2.05);
    torso.add(tail1);

    const tail1Geo = new THREE.CylinderGeometry(0.85, 1.15, 2.4, 10);
    const tail1Mesh = new THREE.Mesh(tail1Geo, skinMat);
    tail1Mesh.position.set(0, -0.15, -1.1);
    tail1Mesh.rotation.x = -Math.PI / 2 + 0.1;
    tail1Mesh.castShadow = true;
    tail1.add(tail1Mesh);

    const tail2 = new THREE.Group();
    tail2.position.set(0, 0, -2.1);
    tail1.add(tail2);

    const tail2Geo = new THREE.CylinderGeometry(0.4, 0.85, 2.6, 10);
    const tail2Mesh = new THREE.Mesh(tail2Geo, skinMat);
    tail2Mesh.position.set(0, -0.1, -1.2);
    tail2Mesh.rotation.x = -Math.PI / 2 + 0.08;
    tail2Mesh.castShadow = true;
    tail2.add(tail2Mesh);

    return {
      mesh: root,
      joints: {
        torso,
        neck,
        head,
        jaw,
        leftLeg: legBackL,
        rightLeg: legBackR,
        frontLegL,
        frontLegR,
        tail1,
        tail2
      }
    };
  }

  static createCurvedHorn(hornMat, length, radius) {
    const geo = new THREE.ConeGeometry(radius, length, 8);
    const horn = new THREE.Mesh(geo, hornMat);
    horn.castShadow = true;
    return horn;
  }

  static createColumnLeg(skinMat, x, z, height) {
    const hip = new THREE.Group();
    hip.position.set(x, height, z);

    // Tapered muscular pillar leg
    const legGeo = new THREE.CylinderGeometry(0.55, 0.65, height, 10);
    const legMesh = new THREE.Mesh(legGeo, skinMat);
    legMesh.position.y = -height / 2;
    legMesh.castShadow = true;
    hip.add(legMesh);

    // Broad hoof foot with keratin toe claws
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -height + 0.18, 0.12);
    hip.add(footGroup);

    const footMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.35, 10), skinMat);
    footMesh.castShadow = true;
    footGroup.add(footMesh);

    // 3 Hoof claws
    [-0.32, 0, 0.32].forEach((cx) => {
      const nail = DinosaurMeshBuilder.createClaw(0.28);
      nail.position.set(cx, -0.05, 0.45);
      footGroup.add(nail);
    });

    return hip;
  }
}
