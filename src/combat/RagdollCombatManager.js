import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Ragdoll Combat Manager
 * 
 * Manages full physical interactions, collision detection, impact forces,
 * bite grabbing & thrashing, and knockdown impulses between the two active ragdolls.
 */
export class RagdollCombatManager {
  constructor(physicsWorld, audio, particles, ui, renderer) {
    this.physicsWorld = physicsWorld;
    this.world = physicsWorld.world;
    this.audio = audio;
    this.particles = particles;
    this.ui = ui;
    this.renderer = renderer;

    this.playerRig = null;
    this.cpuRig = null;
    this.lastHitTimes = new Map();
    this.minHitInterval = 0.32; // seconds between registered impacts on same pair

    this.setupCollisionListener();
  }

  setFighters(playerRig, cpuRig) {
    this.playerRig = playerRig;
    this.cpuRig = cpuRig;
  }

  setupCollisionListener() {
    this.world.addEventListener('beginContact', (event) => {
      this.handleContact(event);
    });
  }

  handleContact(event) {
    if (!this.playerRig || !this.cpuRig) return;
    if (this.playerRig.isDead || this.cpuRig.isDead) return;

    const bA = event.bodyA;
    const bB = event.bodyB;
    if (!bA || !bB) return;

    const rigA = bA.dinoRig;
    const rigB = bB.dinoRig;

    // Must be a collision between TWO DIFFERENT dinosaur rigs
    if (!rigA || !rigB || rigA === rigB) return;

    const now = performance.now() / 1000;

    // Relative speed between colliding bodies
    const relVel = new CANNON.Vec3();
    bA.velocity.vsub(bB.velocity, relVel);
    const speed = relVel.length();

    // Check if one body is an attacking weapon limb
    let attackerRig = null;
    let defenderRig = null;
    let attackLimb = null;
    let defendLimb = null;
    let attackBody = null;
    let defendBody = null;

    const isStrikingLimb = (name) => name === 'head' || name === 'jaw' || name === 'tail3' || name === 'tail2';

    if (isStrikingLimb(bA.limbName) && speed > 3.0) {
      attackerRig = rigA;
      defenderRig = rigB;
      attackLimb = bA.limbName;
      defendLimb = bB.limbName;
      attackBody = bA;
      defendBody = bB;
    } else if (isStrikingLimb(bB.limbName) && speed > 3.0) {
      attackerRig = rigB;
      defenderRig = rigA;
      attackLimb = bB.limbName;
      defendLimb = bA.limbName;
      attackBody = bB;
      defendBody = bA;
    } else if (speed > 7.5) {
      // High-speed body collision / tackle
      const speedA = bA.velocity.length();
      const speedB = bB.velocity.length();
      attackerRig = speedA > speedB ? rigA : rigB;
      defenderRig = attackerRig === rigA ? rigB : rigA;
      attackLimb = attackerRig === rigA ? bA.limbName : bB.limbName;
      defendLimb = attackerRig === rigA ? bB.limbName : bA.limbName;
      attackBody = attackerRig === rigA ? bA : bB;
      defendBody = attackerRig === rigA ? bB : bA;
    }

    if (!attackerRig || !defenderRig) return;

    // PRO AAA COMBAT RULE:
    // Passive body brushes, turning, and walking DO NOT deal combat damage!
    // A collision only deals damage if the attacker is in an active attack state (or high speed charge tackle)
    const attackerIsAttacking = (attackerRig.isAttacking && attackerRig.isAttacking()) ||
                                attackerRig.isExecutingStrike ||
                                attackerRig.isExecutingSpecial;
    const isHeavyTackle = speed > 7.5;

    if (!attackerIsAttacking && !isHeavyTackle) {
      return; // Passive collision: let physics push them apart without dealing damage
    }

    // Rate-limit damage per dinosaur attacker/defender pair (0.75s cooldown prevents multi-limb melting in 1 strike)
    const rigKey = `${attackerRig.isPlayer ? 'player' : 'cpu'}_strikes_${defenderRig.isPlayer ? 'player' : 'cpu'}`;
    const lastHit = this.lastHitTimes.get(rigKey) || 0;
    if (now - lastHit < 0.75) return;

    // Prevent double damage if executeStrike already scored this hit
    if (attackerRig.strikeDealtDamage) return;
    attackerRig.strikeDealtDamage = true;

    this.lastHitTimes.set(rigKey, now);

    // Calculate dynamic physical damage based on impact velocity
    let baseDmg = 50;
    let attackName = 'KINETIC IMPACT';
    let knockbackForce = Math.min(22, speed * 2.3);

    if (attackLimb === 'head' || attackLimb === 'jaw') {
      baseDmg = attackerRig.stats.biteDamage || 85;
      attackName = 'CRUSHING BITE';
    } else if (attackLimb === 'tail3' || attackLimb === 'tail2') {
      baseDmg = attackerRig.stats.tailDamage || 110;
      attackName = 'TAIL WHIP';
      knockbackForce *= 1.35;
    } else {
      baseDmg = attackerRig.stats.pushDamage || 75;
      attackName = 'BODY SLAM';
    }

    const isCrit = Math.random() < 0.22;
    // Rebalanced kinetic damage: standard hits 24-42 dmg, crits/heavy lunges 55-75 dmg
    const finalDamage = Math.max(16, Math.min(78, Math.round(baseDmg * 0.42 * (1 + Math.min(10, speed) * 0.08) * (isCrit ? 1.35 : 1.0))));

    // Contact point estimation in 3D
    const contactPoint = new THREE.Vector3(
      (bA.position.x + bB.position.x) * 0.5,
      (bA.position.y + bB.position.y) * 0.5,
      (bA.position.z + bB.position.z) * 0.5
    );

    // Knockback direction: away from attacker center of mass
    const attPos = attackerRig.getPosition();
    const defPos = defenderRig.getPosition();
    const kbDir = new THREE.Vector3(defPos.x - attPos.x, 0.35, defPos.z - attPos.z).normalize();

    // Determine physical fall dynamics based on attacker archetype and striking limb
    let fallType = 'default';
    if (attackerRig.stats.archetype === 'ceratopsian' && (attackLimb === 'head' || attackLimb === 'jaw')) {
      fallType = 'horn_lift';
      kbDir.y = 0.72;
    } else if (attackLimb === 'tail3' || attackLimb === 'tail2' || attackerRig.stats.archetype === 'stegosaurid' || attackerRig.stats.archetype === 'ankylosaurid') {
      fallType = 'tail_club';
      kbDir.y = 0.12;
    } else if (attackerRig.stats.archetype === 'apex_theropod' && (attackLimb === 'head' || attackLimb === 'jaw')) {
      fallType = 'crush_down';
      kbDir.y = -0.35;
    } else if (attackerRig.stats.archetype === 'dromaeosaur' || speed > 8.0) {
      fallType = 'pounce_tackle';
    } else if (attackerRig.stats.archetype === 'sauropod') {
      fallType = 'seismic_stomp';
    }

    // Inflict damage through ragdoll system with natural physics fall
    const isKnockdown = (attackLimb === 'tail3' || attackLimb === 'tail2') || speed > 5.5 || isCrit;
    defenderRig.takeDamage(finalDamage, contactPoint, kbDir, knockbackForce, isKnockdown, fallType);

    // Audio effects
    if (this.audio) {
      this.audio.playImpactCrunch(isKnockdown);
      if (attackLimb === 'tail3' || attackLimb === 'tail2') {
        this.audio.playTailHit();
      }
    }

    // Particle bursts
    if (this.particles) {
      this.particles.spawnHitSparks(contactPoint, isCrit ? 0xffea00 : attackerRig.stats.accentColor, isCrit);
      this.particles.spawnBloodSplatter(contactPoint, kbDir);
      this.particles.spawnFootstepDust(contactPoint);
      if (isKnockdown) {
        this.particles.spawnImpactRing(contactPoint, 3.2, 0xff5500);
      }
    }

    // Camera punch-in, hit stop & screen shake
    if (this.renderer) {
      this.renderer.freezeFrame(isKnockdown ? 100 : 70);
      this.renderer.triggerPunchZoom(isKnockdown ? 3.0 : 1.8);
      this.renderer.addCameraShake(Math.min(0.85, knockbackForce * 0.055));
    }

    // Floating UI Damage Numbers & Action Banner
    if (this.ui) {
      this.ui.showDamageNumber(contactPoint, finalDamage, isCrit);
      if (attackerRig.isPlayer) {
        this.ui.showActionBanner(`${attackName}! [${finalDamage} DMG]`);
      } else {
        this.ui.showActionBanner(`WARNING! ENEMY ${attackName}!`);
      }
    }

    // Check Bite Grab condition:
    // If attack limb is head/jaw, attacker is not currently grabbing, and defender is within reach
    if ((attackLimb === 'head' || attackLimb === 'jaw') && !attackerRig.grabConstraint) {
      if (attackerRig.isPreparingGrab || Math.random() < 0.4) {
        attackerRig.biteGrab(defendBody || defenderRig.bodies.torso);
        if (this.ui) {
          this.ui.showActionBanner(attackerRig.isPlayer ? '🦷 BITE GRAB! DRAG MOUSE TO THRASH!' : '⚠️ GRABBED BY ENEMY! THRASHING!');
        }
      }
    }
  }

  update(delta) {
    // Check active bite grab timers
    [this.playerRig, this.cpuRig].forEach((rig) => {
      if (rig && rig.grabConstraint) {
        rig.grabTimer -= delta;
        if (rig.grabTimer <= 0) {
          rig.releaseBiteGrab();
        }
      }
    });
  }
}
