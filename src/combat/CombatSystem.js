import * as THREE from 'three';

export class CombatSystem {
  constructor(renderer, audio, particles, ui) {
    this.renderer = renderer;
    this.audio = audio;
    this.particles = particles;
    this.ui = ui;

    this.hitRegistered = { p1: false, p2: false };
    this.whiffRegistered = { p1: false, p2: false };
    this.telegraphed = { p1: false, p2: false };
  }

  update(dino1, dino2) {
    if (!dino1 || !dino2) return;

    // Strict physics separation: prevent bodies walking over each other even if dead or knocked down
    dino1.resolveOverlap(dino2);

    if (dino1.isDead || dino2.isDead) return;

    this.checkAttacks(dino1, dino2, 'p1');
    this.checkAttacks(dino2, dino1, 'p2');
    this.checkRoarStun(dino1, dino2);
    this.checkRoarStun(dino2, dino1);

    if (dino1.isKnockedDown && Math.hypot(dino1.body.velocity.x, dino1.body.velocity.z) > 2) {
      this.particles.spawnSlidingDust(dino1.getPosition());
    }
    if (dino2.isKnockedDown && Math.hypot(dino2.body.velocity.x, dino2.body.velocity.z) > 2) {
      this.particles.spawnSlidingDust(dino2.getPosition());
    }
  }

  checkAttacks(attacker, defender, tag) {
    const animState = attacker.animator.state;
    const isAttacking = animState.startsWith('attack');
    const progress = attacker.animator.actionDuration > 0
      ? attacker.animator.actionTimer / attacker.animator.actionDuration
      : 0;

    if (isAttacking) {
      const atkData = attacker.currentAttackData || {
        name: animState === 'attack2' ? attacker.stats.specialName : 'BITE STRIKE',
        damage: animState === 'attack2' ? attacker.stats.specialDamage : attacker.stats.biteDamage,
        range: animState === 'attack2' ? attacker.stats.attackRange * 1.35 : attacker.stats.attackRange,
        windup: 0.25,
        active: 0.2,
        knockback: 14,
        knockdown: animState === 'attack2'
      };

      const range = atkData.range || attacker.stats.attackRange;

      // Telegraph ground indicator during windup
      if (progress < 0.35 && !this.telegraphed[tag]) {
        this.particles.spawnAttackTelegraph(
          attacker.getPosition(),
          attacker.getRotation(),
          range,
          animState === 'attack2' || animState === 'attack_long',
          attacker.stats.accentColor
        );
        this.telegraphed[tag] = true;

        // Defensive cue: Tell user to dodge or block when opponent winds up
        if (tag === 'p2' && defender.isPlayer) {
          const dist = attacker.getPosition().distanceTo(defender.getPosition());
          if (dist <= range + 2) {
            this.ui.showActionBanner('⚠️ ENEMY STRIKE! [C] SLIDE or [G] BLOCK!');
          }
        }
      }

      // Strike Window: damage lands in the active strike phase
      const startStrike = 0.42;
      const endStrike = 0.75;

      if (progress >= startStrike && progress <= endStrike) {
        if (!this.hitRegistered[tag]) {
          if (this.testHitRange(attacker, defender, range)) {
            this.executeHit(attacker, defender, atkData, tag);
            this.hitRegistered[tag] = true;
          }
        }
      } else if (progress > endStrike && !this.hitRegistered[tag] && !this.whiffRegistered[tag]) {
        // Defender successfully escaped / evaded the strike!
        this.audio.playWhiff();
        if (tag === 'p2') {
          this.ui.showActionBanner('YOU SAVED YOURSELF! (EVADED)');
        } else {
          this.ui.showActionBanner('ATTACK WHIFFED!');
        }
        this.whiffRegistered[tag] = true;
      }
    } else {
      this.hitRegistered[tag] = false;
      this.whiffRegistered[tag] = false;
      this.telegraphed[tag] = false;
    }
  }

  testHitRange(attacker, defender, maxRange) {
    const aPos = attacker.getPosition();
    const dPos = defender.getPosition();

    const dx = dPos.x - aPos.x;
    const dz = dPos.z - aPos.z;
    const dist = Math.hypot(dx, dz);

    if (dist > maxRange) return false;

    // Height check: if defender jumped high in air, ground sweeps miss!
    if (defender.body.position.y > 3.4 && attacker.body.position.y <= 2.2) {
      return false; // Jumped over the attack!
    }

    const facingAngle = attacker.getRotation();
    const toTargetAngle = Math.atan2(dx, dz);
    let diff = Math.abs(toTargetAngle - facingAngle);
    while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

    return diff < 1.6;
  }

  executeHit(attacker, defender, atkData, tag) {
    const baseDmg = atkData.damage || 80;
    const isCrit = Math.random() < 0.28;
    const rawDamage = Math.round(baseDmg * (isCrit ? 1.45 : (0.95 + Math.random() * 0.15)));

    const aPos = attacker.getPosition();
    const dPos = defender.getPosition();
    const diff = new THREE.Vector3(dPos.x - aPos.x, 0, dPos.z - aPos.z).normalize();
    const hitPoint = new THREE.Vector3(
      aPos.x * 0.35 + dPos.x * 0.65,
      1.8,
      aPos.z * 0.35 + dPos.z * 0.65
    );

    // Apply hit through defender's defensive systems (evasion i-frames, block reduction, knockdown)
    const result = defender.takeDamage(
      rawDamage,
      diff,
      atkData.knockback || 14
    );

    if (result.result === 'evaded') {
      this.audio.playWhiff();
      this.ui.showActionBanner(tag === 'p1' ? 'OPPONENT EVADED!' : 'PERFECT SLIDE DODGE!');
      return;
    }

    if (result.result === 'blocked') {
      this.ui.showActionBanner(tag === 'p1' ? 'OPPONENT BLOCKED!' : 'SHIELD GUARD! (-75%)');
      this.ui.showDamageNumber(hitPoint, result.damage, false);
      attacker.body.velocity.x *= -0.3; // Rebound
      attacker.body.velocity.z *= -0.3;
      return;
    }

    // Normal successful hit
    attacker.body.velocity.x *= 0.2;
    attacker.body.velocity.z *= 0.2;

    const shouldKnockdown =
      atkData.knockdown ||
      atkData.isSpecial ||
      isCrit ||
      Math.random() < 0.35;

    if (shouldKnockdown && !defender.isDead) {
      const kdForce = atkData.knockback ? atkData.knockback * 1.4 : (isCrit ? 22 : 16);
      const kdDuration = atkData.isSpecial ? 1.5 : 1.25;
      defender.knockdown(diff, kdForce, kdDuration);
      this.particles.spawnFootstepDust(dPos);
    }

    this.audio.playHeavyHit(isCrit);
    this.particles.spawnHitParticles(hitPoint, isCrit);
    this.renderer.triggerScreenShake(atkData.isSpecial ? 0.8 : (isCrit ? 0.5 : 0.35));

    this.ui.showDamageNumber(hitPoint, result.damage, isCrit);
    this.ui.showActionBanner(`${attacker.stats.name}: ${atkData.name}!`);
  }

  checkRoarStun(roaringDino, opponent) {
    if (roaringDino.animator.state === 'roar' && roaringDino.animator.actionTimer < 0.1) {
      const dist = roaringDino.getPosition().distanceTo(opponent.getPosition());
      if (dist < 12) {
        opponent.stunTimer = Math.max(opponent.stunTimer, 0.75);
        this.ui.showActionBanner('PRIMAL ROAR! STUNNED!');
        this.renderer.triggerScreenShake(0.5);
      }
    }
  }
}
