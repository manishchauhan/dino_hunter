import * as THREE from 'three';
import { DinosaurMeshBuilder } from './DinosaurMeshBuilder.js';

export class TRexModel {
  static build(skinColor = 0x485834) {
    const root = new THREE.Group();
    const skinMat = DinosaurMeshBuilder.createSkinMaterial('trex', skinColor, 0x223518, false, 0.65, 0.1);
    const underbellyMat = DinosaurMeshBuilder.createSkinMaterial('trex', 0xb89f78, 0x8a7250, true, 0.75, 0.05);

    // 1. Sculpted Barrel Torso / Ribcage
    const torso = new THREE.Group();
    torso.position.set(0, 3.2, 0);
    root.add(torso);

    // Main ribcage mesh (tapered cylinder for muscular curve)
    const chestGeo = new THREE.CylinderGeometry(1.35, 1.15, 3.8, 14);
    chestGeo.scale(0.85, 1.0, 1.25);
    const chestMesh = new THREE.Mesh(chestGeo, skinMat);
    chestMesh.rotation.x = Math.PI / 2 + 0.12;
    chestMesh.castShadow = true;
    torso.add(chestMesh);

    // Pale muscular chest underbelly plate
    const bellyGeo = new THREE.CylinderGeometry(1.2, 0.95, 3.4, 12, 1, false, 0, Math.PI);
    bellyGeo.scale(0.82, 1.0, 1.2);
    const bellyMesh = new THREE.Mesh(bellyGeo, underbellyMat);
    bellyMesh.rotation.x = Math.PI / 2 + 0.12;
    bellyMesh.rotation.z = Math.PI;
    bellyMesh.position.y = -0.35;
    bellyMesh.castShadow = true;
    torso.add(bellyMesh);

    // Spine crest ridges along dorsal spine
    const ridges = DinosaurMeshBuilder.createSpineRidge(8, 0.42, 0x232018);
    ridges.position.set(0, 1.25, 1.1);
    torso.add(ridges);

    // 2. Muscular Neck Joint
    const neck = new THREE.Group();
    neck.position.set(0, 0.85, 1.8);
    torso.add(neck);

    const neckGeo = new THREE.CylinderGeometry(0.85, 1.1, 2.2, 12);
    neckGeo.scale(0.8, 1.0, 1.15);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0.7, 0.8);
    neckMesh.rotation.x = -0.45;
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // 3. Head Joint (Skull & Jaws)
    const head = new THREE.Group();
    head.position.set(0, 1.4, 1.7);
    neck.add(head);

    // Massive Predatory Upper Skull
    const skullGeo = new THREE.CylinderGeometry(0.8, 0.95, 2.8, 12);
    skullGeo.scale(0.85, 0.75, 1.3);
    const skull = new THREE.Mesh(skullGeo, skinMat);
    skull.position.set(0, 0.3, 1.0);
    skull.rotation.x = Math.PI / 2 - 0.05;
    skull.castShadow = true;
    head.add(skull);

    // Brow Hornlets / Crests above eyes
    const browGeo = new THREE.ConeGeometry(0.2, 0.7, 6);
    browGeo.scale(0.6, 1.0, 1.2);
    const browMat = DinosaurMeshBuilder.createBoneMaterial(true);
    const browL = new THREE.Mesh(browGeo, browMat);
    browL.position.set(0.65, 0.65, 0.6);
    browL.rotation.set(-0.4, 0.2, -0.2);
    const browR = new THREE.Mesh(browGeo, browMat);
    browR.position.set(-0.65, 0.65, 0.6);
    browR.rotation.set(-0.4, -0.2, 0.2);
    head.add(browL, browR);

    // Eyes with amber iris & slit pupils
    const eyeL = DinosaurMeshBuilder.createEyeMesh(0xff9900);
    eyeL.position.set(0.72, 0.45, 0.65);
    eyeL.rotation.y = 0.2;
    const eyeR = DinosaurMeshBuilder.createEyeMesh(0xff9900);
    eyeR.position.set(-0.72, 0.45, 0.65);
    eyeR.rotation.y = Math.PI - 0.2;
    head.add(eyeL, eyeR);

    // Upper Teeth Rows
    const upperTeethL = DinosaurMeshBuilder.createTeethRow(6, 0.35);
    upperTeethL.position.set(0.62, -0.25, 1.2);
    upperTeethL.rotation.x = Math.PI;
    const upperTeethR = DinosaurMeshBuilder.createTeethRow(6, 0.35);
    upperTeethR.position.set(-0.62, -0.25, 1.2);
    upperTeethR.rotation.x = Math.PI;
    head.add(upperTeethL, upperTeethR);

    // 4. Hinged Lower Jaw
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.3, 0.3);
    head.add(jaw);

    const jawGeo = new THREE.CylinderGeometry(0.7, 0.85, 2.7, 10);
    jawGeo.scale(0.75, 0.45, 1.2);
    const jawMesh = new THREE.Mesh(jawGeo, underbellyMat);
    jawMesh.position.set(0, -0.15, 1.15);
    jawMesh.rotation.x = Math.PI / 2;
    jawMesh.castShadow = true;
    jaw.add(jawMesh);

    // Lower Teeth
    const lowerTeethL = DinosaurMeshBuilder.createTeethRow(6, 0.28);
    lowerTeethL.position.set(0.5, 0.1, 1.15);
    const lowerTeethR = DinosaurMeshBuilder.createTeethRow(6, 0.28);
    lowerTeethR.position.set(-0.5, 0.1, 1.15);
    jaw.add(lowerTeethL, lowerTeethR);

    // 5. Powerful Bipedal Legs (Hips, Thighs, Calves, Foot with Claws)
    const leftLeg = this.createLeg(skinMat, 1.35);
    const rightLeg = this.createLeg(skinMat, -1.35);
    root.add(leftLeg, rightLeg);

    // 6. Segmented Flexible Tail Joints
    const tail1 = new THREE.Group();
    tail1.position.set(0, 0.45, -1.9);
    torso.add(tail1);

    const tail1Geo = new THREE.CylinderGeometry(0.85, 1.2, 3.2, 10);
    tail1Geo.scale(0.75, 1.0, 1.1);
    const tail1Mesh = new THREE.Mesh(tail1Geo, skinMat);
    tail1Mesh.position.set(0, -0.1, -1.4);
    tail1Mesh.rotation.x = -Math.PI / 2 + 0.15;
    tail1Mesh.castShadow = true;
    tail1.add(tail1Mesh);

    const tail2 = new THREE.Group();
    tail2.position.set(0, -0.1, -2.8);
    tail1.add(tail2);

    const tail2Geo = new THREE.CylinderGeometry(0.4, 0.85, 3.5, 10);
    tail2Geo.scale(0.65, 0.95, 1.0);
    const tail2Mesh = new THREE.Mesh(tail2Geo, skinMat);
    tail2Mesh.position.set(0, -0.05, -1.6);
    tail2Mesh.rotation.x = -Math.PI / 2 + 0.1;
    tail2Mesh.castShadow = true;
    tail2.add(tail2Mesh);

    // 7. Small Apex Arms with Razor Claws
    const armL = this.createArm(skinMat, 1.15);
    const armR = this.createArm(skinMat, -1.15);
    torso.add(armL, armR);

    return {
      mesh: root,
      joints: {
        torso,
        neck,
        head,
        jaw,
        leftLeg,
        rightLeg,
        tail1,
        tail2,
        armL,
        armR
      }
    };
  }

  static createLeg(skinMat, xOffset) {
    const hip = new THREE.Group();
    hip.position.set(xOffset, 2.9, -0.3);

    // Bulging muscular thigh
    const thighGeo = new THREE.CylinderGeometry(0.75, 0.6, 2.2, 10);
    thighGeo.scale(0.85, 1.0, 1.3);
    const thigh = new THREE.Mesh(thighGeo, skinMat);
    thigh.position.set(0, -0.7, 0.15);
    thigh.rotation.x = 0.25;
    thigh.castShadow = true;
    hip.add(thigh);

    // Muscular knee & shin
    const shinGeo = new THREE.CylinderGeometry(0.45, 0.35, 2.0, 10);
    shinGeo.scale(0.85, 1.0, 1.15);
    const shin = new THREE.Mesh(shinGeo, skinMat);
    shin.position.set(0, -2.0, -0.1);
    shin.rotation.x = -0.22;
    shin.castShadow = true;
    hip.add(shin);

    // 3-Toed predatory foot
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -2.85, 0.35);
    hip.add(footGroup);

    const footBaseGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.4, 8);
    footBaseGeo.scale(0.9, 0.35, 1.2);
    const footBase = new THREE.Mesh(footBaseGeo, skinMat);
    footBase.rotation.x = Math.PI / 2;
    footBase.castShadow = true;
    footGroup.add(footBase);

    // Sharp talons
    [-0.32, 0, 0.32].forEach((x) => {
      const claw = DinosaurMeshBuilder.createClaw(0.45);
      claw.position.set(x, -0.05, 0.75);
      footGroup.add(claw);
    });

    return hip;
  }

  static createArm(skinMat, xOffset) {
    const arm = new THREE.Group();
    arm.position.set(xOffset, 0.35, 1.3);

    const bicepGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.8, 8);
    const bicep = new THREE.Mesh(bicepGeo, skinMat);
    bicep.position.set(0, -0.3, 0.25);
    bicep.rotation.x = -0.55;
    bicep.castShadow = true;
    arm.add(bicep);

    // Dual claws
    [-0.08, 0.08].forEach((x) => {
      const claw = DinosaurMeshBuilder.createClaw(0.22);
      claw.position.set(x, -0.65, 0.55);
      arm.add(claw);
    });

    return arm;
  }
}
