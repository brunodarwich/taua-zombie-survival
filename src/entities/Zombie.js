import * as THREE from 'three';
import { ASSETS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';
import { sounds } from '../audio.js';

// Compartilhamento estático de sombra para todos os zumbis
const sharedShadowGeo = new THREE.CircleGeometry(1.0, 16);
const sharedShadowMat = new THREE.MeshBasicMaterial({
  color: 0x070b14,
  transparent: true,
  opacity: 0.5
});

export class Zombie {
  constructor(scene, position, waveMultiplier = 1, navigation) {
    this.scene = scene;
    this.navigation = navigation;
    this.hp = 80 * waveMultiplier;
    this.maxHp = this.hp;
    this.speed = (5 + Math.random() * 2.2) * Math.min(1.5, 1 + (waveMultiplier - 1) * 0.08);
    this.damage = 15;
    this.attackCooldown = 0.8;
    this.lastAttack = 0;
    this.dead = false;
    this.hitTime = 0;

    this.position = position.clone();
    this.scale = 3.6; // Aumentado significativamente para ser bem visível
    this._dirVector = new THREE.Vector3();

    const texture = textureCache.load(ASSETS.zombie);
    this.material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.sprite.position.y = this.scale * 0.48;

    // Sombra Paper Mario estilizada compartilhada
    this.shadow = new THREE.Mesh(sharedShadowGeo, sharedShadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.05;

    this.group = new THREE.Group();
    this.group.add(this.shadow);
    this.group.add(this.sprite);
    this.group.position.copy(this.position);

    this.scene.add(this.group);
  }

  takeDamage(amount) {
    this.hp -= amount;
    sounds.playZombieHit();

    // Efeito Paper Mario de Squash & Stretch no impacto
    this.hitTime = 0.16;

    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      sounds.playZombieDie();
      return true;
    }
    return false;
  }

  update(delta, player, survivors, currentTime) {
    if (this.dead) return;
    this.hitTime = Math.max(0, this.hitTime - delta);

    let target = this.navigation.inSafeZone(player.position) ? null : player;
    let minDistSq = target ? this.position.distanceToSquared(player.position) : Infinity;

    for (const survivor of survivors) {
      if (!survivor.dead && survivor.state !== 'delivered' && !this.navigation.inSafeZone(survivor.position)) {
        const dSq = this.position.distanceToSquared(survivor.position);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          target = survivor;
        }
      }
    }

    // With nobody exposed, gather outside the entrance without entering the refuge.
    const targetPosition = target ? target.position : { x: 0, y: 0, z: -27 };
    const dir = this._dirVector.set(targetPosition.x - this.position.x, 0, targetPosition.z - this.position.z);
    dir.y = 0;
    const dist = dir.length();

    if (dist > 1.4) {
      dir.normalize();
      this.navigation.follow(this, targetPosition, this.speed * (this.hitTime > 0 ? 0.3 : 1), delta, true, 1.3);
      this.group.position.copy(this.position);

      // Balanço Paper Mario (passo firme)
      const walkCycle = Math.sin(Date.now() * 0.012);
      this.sprite.position.y = (this.scale * 0.48) + Math.abs(walkCycle) * 0.22;
      this.sprite.material.rotation = walkCycle * 0.08;

      if (dir.x < -0.1) {
        this.sprite.scale.x = -Math.abs(this.scale);
      } else if (dir.x > 0.1) {
        this.sprite.scale.x = Math.abs(this.scale);
      }
    } else {
      if (target && this.navigation.firstHit(this.position, target.position) === null && currentTime - this.lastAttack >= this.attackCooldown) {
        this.lastAttack = currentTime;
        if (target === player) {
          player.takeDamage(this.damage);
        } else if (target && typeof target.takeDamage === 'function') {
          target.takeDamage(this.damage);
        }
      }
    }
    const hit = this.hitTime / 0.16;
    const facing = Math.sign(this.sprite.scale.x) || 1;
    this.sprite.scale.set(facing * this.scale * (1 + hit * 0.25), this.scale * (1 - hit * 0.2), 1);
    this.material.color.setRGB(1, 1 - hit * 0.85, 1 - hit * 0.7);
  }

  destroy() {
    this.dead = true;
    this.scene.remove(this.group);
    if (this.material) {
      this.material.dispose();
    }
  }
}
