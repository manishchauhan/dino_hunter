import * as CANNON from 'cannon-es';
import { ARENA_RADIUS } from '../constants.js';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -16, 0)
    });
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 20;

    this.groundMaterial = new CANNON.Material('ground');
    this.dinoMaterial = new CANNON.Material('dino');

    const dinoGroundContact = new CANNON.ContactMaterial(
      this.groundMaterial,
      this.dinoMaterial,
      {
        friction: 0.18,
        restitution: 0.04
      }
    );
    this.world.addContactMaterial(dinoGroundContact);

    const dinoDinoContact = new CANNON.ContactMaterial(
      this.dinoMaterial,
      this.dinoMaterial,
      {
        friction: 0.25,
        restitution: 0.2
      }
    );
    this.world.addContactMaterial(dinoDinoContact);

    this.createGround();
    this.createArenaBoundary();
  }

  createGround() {
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      material: this.groundMaterial
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
  }

  createArenaBoundary() {
    const segments = 24;
    const r = ARENA_RADIUS;
    const height = 10;
    const segmentWidth = (2 * Math.PI * r) / segments;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const wallShape = new CANNON.Box(
        new CANNON.Vec3(segmentWidth / 2 + 0.3, height / 2, 1)
      );
      const wallBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: wallShape,
        material: this.groundMaterial,
        position: new CANNON.Vec3(x, height / 2, z)
      });
      wallBody.quaternion.setFromEuler(0, -angle + Math.PI / 2, 0);
      this.world.addBody(wallBody);
    }
  }

  step(delta) {
    const maxSubSteps = 5;
    const fixedTimeStep = 1 / 60;
    this.world.step(fixedTimeStep, Math.min(delta, 0.1), maxSubSteps);
  }
}
