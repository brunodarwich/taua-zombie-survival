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
  constructor(scene, position, waveMultiplier = 1) {
    this.scene = scene;
    this.hp = 80 * waveMultiplier;
    this.maxHp = this.hp;
    this.speed = (5 + Math.random() * 2.2) * Math.min(1.5, 1 + (waveMultiplier - 1) * 0.08);
    this.damage = 15;
    this.attackCooldown = 0.8;
    this.lastAttack = 0;
    this.dead = false;

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
    this.sprite.scale.set(this.scale * 1.25, this.scale * 0.8, 1);
    this.sprite.material.color.setRGB(1, 0.1, 0.1);
    setTimeout(() => {
      if (this.sprite && this.sprite.material) {
        this.sprite.scale.set(this.scale, this.scale, 1);
        this.sprite.material.color.setRGB(1, 1, 1);
      }
    }, 110);

    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      sounds.playZombieDie();
      return true;
    }
    return false;
  }

  update(delta, player, survivors, currentTime) {
    if (this.dead) return;

    let target = player;
    let minDistSq = this.position.distanceToSquared(player.position);

    for (const survivor of survivors) {
      if (!survivor.rescued) {
        const dSq = this.position.distanceToSquared(survivor.position);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          target = survivor;
        }
      }
    }

    const dir = this._dirVector.subVectors(target.position, this.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist > 1.4) {
      dir.normalize();
      this.position.addScaledVector(dir, this.speed * delta);
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
      if (currentTime - this.lastAttack >= this.attackCooldown) {
        this.lastAttack = currentTime;
        if (target === player) {
          player.takeDamage(this.damage);
        } else if (target && typeof target.takeDamage === 'function') {
          target.takeDamage(this.damage);
        }
      }
    }
  }

  destroy() {
    this.dead = true;
    this.scene.remove(this.group);
    if (this.material) {
      this.material.dispose();
    }
  }
}
