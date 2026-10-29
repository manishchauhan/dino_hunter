import * as THREE from 'three';
import { DinosaurMeshBuilder } from './DinosaurMeshBuilder.js';

export class AnkylosaurusModel {
  static build(skinColor = 0x5a4835) {
    const root = new THREE.Group();
    const skinMat = DinosaurMeshBuilder.createSkinMaterial('ankylosaurus', skinColor, 0x2e2016, false, 0.8, 0.08);
    const boneMat = DinosaurMeshBuilder.createBoneMaterial(true);
    const carapaceMat = DinosaurMeshBuilder.createSkinMaterial('ankylosaurus', 0x3d2c20, 0x1f150e, false, 0.7, 0.2);

    // 1. Broad Armored Shell / Carapace
    const torso = new THREE.Group();
    torso.position.set(0, 2.1, 0);
    root.add(torso);

    // Domed living fortress shell
    const shellGeo = new THREE.CylinderGeometry(1.7, 1.85, 4.4, 14);
    shellGeo.scale(1.15, 0.65, 1.25);
    const shellMesh = new THREE.Mesh(shellGeo, skinMat);
    shellMesh.rotation.x = Math.PI / 2;
    shellMesh.castShadow = true;
    torso.add(shellMesh);

    // Raised Carapace Armor Plates (Pyramidal Osteoderms)
    for (let x = -1.25; x <= 1.25; x += 0.8) {
      for (let z = -1.6; z <= 1.6; z += 0.8) {
        const plateGeo = new THREE.ConeGeometry(0.32, 0.55, 5);
        plateGeo.scale(0.85, 1.0, 1.2);
        const plate = new THREE.Mesh(plateGeo, carapaceMat);
        plate.position.set(x, 0.75, z);
        plate.rotation.x = -0.15;
        plate.castShadow = true;
        torso.add(plate);
      }
    }

    // Deadly Lateral Flank Spikes
    for (let z = -1.6; z <= 1.6; z += 0.8) {
      const spikeGeo = new THREE.ConeGeometry(0.22, 1.1, 6);
      const spikeL = new THREE.Mesh(spikeGeo, boneMat);
      spikeL.position.set(1.95, 0.15, z);
      spikeL.rotation.z = -Math.PI / 2.3;
      spikeL.castShadow = true;

      const spikeR = new THREE.Mesh(spikeGeo, boneMat);
      spikeR.position.set(-1.95, 0.15, z);
      spikeR.rotation.z = Math.PI / 2.3;
      spikeR.castShadow = true;

      torso.add(spikeL, spikeR);
    }

    // 2. Short Armored Neck Joint
    const neck = new THREE.Group();
    neck.position.set(0, 0.15, 2.05);
    torso.add(neck);

    const neckGeo = new THREE.CylinderGeometry(0.9, 1.15, 1.4, 10);
    neckGeo.scale(1.1, 0.75, 1.0);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0, 0.55);
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // 3. Broad Triangular Armored Skull
    const head = new THREE.Group();
    head.position.set(0, 0.05, 1.25);
    neck.add(head);

    const skullGeo = new THREE.CylinderGeometry(0.85, 1.1, 2.0, 10);
    skullGeo.scale(1.2, 0.65, 1.1);
    const skull = new THREE.Mesh(skullGeo, skinMat);
    skull.position.set(0, 0, 0.75);
    skull.rotation.x = Math.PI / 2;
    skull.castShadow = true;
    head.add(skull);

    // Pyramidal Cheek & Brow Horns
    [-1, 1].forEach((dir) => {
      const cheekHorn = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.65, 5), boneMat);
      cheekHorn.position.set(dir * 1.15, -0.05, 0.55);
      cheekHorn.rotation.z = -dir * (Math.PI / 2.2);
      head.add(cheekHorn);

      const browHorn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 5), boneMat);
      browHorn.position.set(dir * 0.9, 0.35, 0.65);
      browHorn.rotation.set(-0.2, 0, -dir * 0.4);
      head.add(browHorn);
    });

    // Armored Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.85, 6), boneMat);
    beak.position.set(0, -0.22, 1.85);
    beak.rotation.x = Math.PI / 2 + 0.15;
    beak.castShadow = true;
    head.add(beak);

    // Lower Jaw
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.35, 0.5);
    head.add(jaw);

    // Armored Eyes
    const eyeL = DinosaurMeshBuilder.createEyeMesh(0xdd8822);
    eyeL.position.set(1.05, 0.25, 0.75);
    eyeL.rotation.y = 0.35;
    const eyeR = DinosaurMeshBuilder.createEyeMesh(0xdd8822);
    eyeR.position.set(-1.05, 0.25, 0.75);
    eyeR.rotation.y = Math.PI - 0.35;
    head.add(eyeL, eyeR);

    // 4. Low Center-of-Gravity Sturdy Pillar Legs
    const frontLegL = this.createSturdyLeg(skinMat, 1.65, 1.15, 1.75);
    const frontLegR = this.createSturdyLeg(skinMat, -1.65, 1.15, 1.75);
    const legBackL = this.createSturdyLeg(skinMat, 1.65, -1.25, 1.85);
    const legBackR = this.createSturdyLeg(skinMat, -1.65, -1.25, 1.85);
    root.add(frontLegL, frontLegR, legBackL, legBackR);

    // 5. Heavy Ossified Tail Joint 1
    const tail1 = new THREE.Group();
    tail1.position.set(0, 0.05, -2.05);
    torso.add(tail1);

    const tail1Geo = new THREE.CylinderGeometry(0.65, 1.05, 2.2, 10);
    tail1Geo.scale(0.9, 0.75, 1.1);
    const tail1Mesh = new THREE.Mesh(tail1Geo, skinMat);
    tail1Mesh.position.set(0, 0, -1.0);
    tail1Mesh.rotation.x = -Math.PI / 2;
    tail1Mesh.castShadow = true;
    tail1.add(tail1Mesh);

    // 6. Rigid Distal Tail Joint 2 with Devastating Bone Club
    const tail2 = new THREE.Group();
    tail2.position.set(0, 0, -2.0);
    tail1.add(tail2);

    const tail2Geo = new THREE.CylinderGeometry(0.35, 0.65, 2.5, 10);
    const tail2Mesh = new THREE.Mesh(tail2Geo, skinMat);
    tail2Mesh.position.set(0, 0, -1.15);
    tail2Mesh.rotation.x = -Math.PI / 2;
    tail2Mesh.castShadow = true;
    tail2.add(tail2Mesh);

    // Twin-Lobed Massive Bone Club
    const clubLobeL = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 12), boneMat);
    clubLobeL.scale.set(0.9, 0.75, 1.25);
    clubLobeL.position.set(0.55, 0, -2.4);
    clubLobeL.castShadow = true;

    const clubLobeR = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 12), boneMat);
    clubLobeR.scale.set(0.9, 0.75, 1.25);
    clubLobeR.position.set(-0.55, 0, -2.4);
    clubLobeR.castShadow = true;

    // Center bone knot
    const clubCenter = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 10), boneMat);
    clubCenter.position.set(0, 0, -2.4);
    clubCenter.castShadow = true;

    tail2.add(clubLobeL, clubLobeR, clubCenter);

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

  static createSturdyLeg(skinMat, x, z, height) {
    const hip = new THREE.Group();
    hip.position.set(x, height, z);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, height, 10), skinMat);
    leg.position.y = -height / 2;
    leg.castShadow = true;
    hip.add(leg);

    // Broad armored foot
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -height + 0.15, 0.12);
    hip.add(footGroup);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 0.32, 10), skinMat);
    foot.castShadow = true;
    footGroup.add(foot);

    [-0.3, 0, 0.3].forEach((cx) => {
      const nail = DinosaurMeshBuilder.createClaw(0.3);
      nail.position.set(cx, -0.05, 0.42);
      footGroup.add(nail);
    });

    return hip;
  }
}
