import * as THREE from 'three';
import { DinoTextureGenerator } from '../graphics/DinoTextureGenerator.js';

export class DinosaurMeshBuilder {
  /**
   * High-detail organic dinosaur skin material with procedural scale textures & bump relief
   */
  static createSkinMaterial(type = 'trex', colorHex = 0x485834, accentHex = 0xc87d32, isUnderbelly = false, roughness = 0.65, metalness = 0.1) {
    const skinTex = DinoTextureGenerator.getSkinTexture(type, colorHex, accentHex, isUnderbelly);
    const bumpTex = DinoTextureGenerator.getBumpMap();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: skinTex,
      bumpMap: bumpTex,
      bumpScale: 0.035,
      roughness: isUnderbelly ? roughness + 0.1 : roughness,
      metalness,
      flatShading: false
    });
    mat.userData = { origEmissiveHex: 0x000000 };
    return mat;
  }

  /**
   * Weathered bone and keratin material for horns, beak, teeth, claws, and clubs
   */
  static createBoneMaterial(isHorn = false) {
    const boneTex = DinoTextureGenerator.getBoneTexture();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: boneTex,
      roughness: isHorn ? 0.45 : 0.4,
      metalness: 0.12,
      flatShading: false
    });
    mat.userData = { origEmissiveHex: 0x000000 };
    return mat;
  }

  /**
   * Fierce predatory reptilian eye with slit pupil and amber/orange iris
   */
  static createEyeMesh(irisColorHex = 0xff9900) {
    const eyeGroup = new THREE.Group();

    // Eyeball
    const scleraGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const scleraMat = new THREE.MeshStandardMaterial({
      color: irisColorHex,
      roughness: 0.15,
      metalness: 0.1,
      emissive: irisColorHex,
      emissiveIntensity: 0.25
    });
    scleraMat.userData = { origEmissiveHex: irisColorHex };
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);

    // Vertical slit pupil
    const pupilGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.z = 0.11;
    pupil.rotation.x = Math.PI / 2;

    // Fleshy eyelid / brow ridge surround
    const lidGeo = new THREE.TorusGeometry(0.24, 0.06, 8, 16, Math.PI);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x241d17, roughness: 0.8 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.z = 0.05;
    lid.rotation.z = Math.PI;

    eyeGroup.add(sclera, pupil, lid);
    return eyeGroup;
  }

  /**
   * Serrated, curved fangs for ferocious biting snaps
   */
  static createTeethRow(count = 6, length = 0.28) {
    const teethGroup = new THREE.Group();
    const toothMat = this.createBoneMaterial();

    for (let i = 0; i < count; i++) {
      const toothGeo = new THREE.ConeGeometry(0.065, length * (0.8 + Math.sin(i / count * Math.PI) * 0.35), 6);
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.set(0, 0, (i - count / 2) * 0.26);
      tooth.rotation.z = (Math.random() - 0.5) * 0.1;
      tooth.castShadow = true;
      teethGroup.add(tooth);
    }
    return teethGroup;
  }

  /**
   * Curved razor talon/claw
   */
  static createClaw(size = 0.35) {
    const geo = new THREE.ConeGeometry(size * 0.28, size, 6);
    const mat = this.createBoneMaterial(true);
    const claw = new THREE.Mesh(geo, mat);
    claw.rotation.x = Math.PI / 2 - 0.3;
    claw.castShadow = true;
    return claw;
  }

  /**
   * Dorsal spine ridges along neck, back and tail
   */
  static createSpineRidge(count = 8, startSize = 0.45, plateColorHex = 0x2d2218) {
    const ridgeGroup = new THREE.Group();
    const plateMat = new THREE.MeshStandardMaterial({
      color: plateColorHex,
      roughness: 0.7,
      metalness: 0.15,
      flatShading: false
    });
    plateMat.userData = { origEmissiveHex: 0x000000 };

    for (let i = 0; i < count; i++) {
      const scale = (1 - (i / count) * 0.55) * startSize;
      const plateGeo = new THREE.ConeGeometry(scale * 0.8, scale * 2.2, 5);
      plateGeo.scale(0.5, 1.0, 1.2);
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, scale * 0.9, -i * 0.65);
      plate.rotation.x = -0.25;
      plate.castShadow = true;
      ridgeGroup.add(plate);
    }
    return ridgeGroup;
  }
}
