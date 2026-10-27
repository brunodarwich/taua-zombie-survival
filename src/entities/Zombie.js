import * as THREE from 'three';
import { ASSETS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';
import { sounds } from '../audio.js';

export class Zombie {
  constructor(scene, position, waveMultiplier = 1) {
    this.scene = scene;
    this.hp = 60 * waveMultiplier;
    this.maxHp = this.hp;
    this.speed = (5 + Math.random() * 2.5) * Math.min(1.6, 1 + (waveMultiplier - 1) * 0.1);
    this.damage = 15;
    this.attackCooldown = 0.8;
    this.lastAttack = 0;
    this.dead = false;

    this.position = position.clone();
    this.scale = 2.3;

    const texture = textureCache.load(ASSETS.zombie);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.sprite.position.y = this.scale * 0.48;

    const shadowGeo = new THREE.CircleGeometry(0.7, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
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

    // Efeito de impacto
    this.sprite.material.color.setRGB(1, 0.2, 0.2);
    setTimeout(() => {
      if (this.sprite.material) {
        this.sprite.material.color.setRGB(1, 1, 1);
      }
    }, 90);

    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      sounds.playZombieDie();
      return true;
    }
    return false;
  }

  update(delta, player, survivors, currentTime) {
    if (this.dead) return;

    // Achar o alvo mais próximo (jogador ou sobrevivente sem resgate)
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

    // Perseguir alvo
    const dir = new THREE.Vector3().subVectors(target.position, this.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist > 1.2) {
      dir.normalize();
      this.position.addScaledVector(dir, this.speed * delta);
      this.group.position.copy(this.position);

      // Animação de mancar do zumbi
      this.sprite.position.y = (this.scale * 0.48) + Math.abs(Math.sin(Date.now() * 0.008)) * 0.15;

      if (dir.x < -0.1) {
        this.sprite.scale.x = -Math.abs(this.scale);
      } else if (dir.x > 0.1) {
        this.sprite.scale.x = Math.abs(this.scale);
      }
    } else {
      // Atacar alvo se estiver próximo
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
    this.scene.remove(this.group);
  }
}
