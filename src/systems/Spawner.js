import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Zombie } from '../entities/Zombie.js';
import { Survivor } from '../entities/Survivor.js';
import { Pickup } from '../entities/Pickup.js';

export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.zombies = [];
    this.survivors = [];
    this.pickups = [];

    this.wave = 1;
    this.zombieSpawnTimer = 0;
    this.zombieInterval = 2.2;
    this.survivorSpawnTimer = 0;
    this.survivorInterval = 12.0;
    this.pickupSpawnTimer = 0;
    this.pickupInterval = 16.0;
  }

  update(delta, player, currentTime) {
    // 1. Spawner de Zumbis
    this.zombieSpawnTimer += delta;
    if (this.zombieSpawnTimer >= this.zombieInterval) {
      this.zombieSpawnTimer = 0;
      this.spawnZombie(player.position);
      // Dificuldade gradual
      this.zombieInterval = Math.max(0.6, 2.2 - (this.wave * 0.12));
    }

    // 2. Spawner de Sobreviventes
    this.survivorSpawnTimer += delta;
    if (this.survivorSpawnTimer >= this.survivorInterval) {
      this.survivorSpawnTimer = 0;
      if (this.survivors.filter(s => !s.rescued && !s.dead).length < 4) {
        this.spawnSurvivor(player.position);
      }
    }

    // 3. Spawner de Equipamentos
    this.pickupSpawnTimer += delta;
    if (this.pickupSpawnTimer >= this.pickupInterval) {
      this.pickupSpawnTimer = 0;
      if (this.pickups.filter(p => !p.dead).length < 3) {
        this.spawnPickup(player.position);
      }
    }
  }

  spawnZombie(playerPosition) {
    // Surge na borda da arena
    const angle = Math.random() * Math.PI * 2;
    const distance = 28 + Math.random() * 10;
    const pos = new THREE.Vector3(
      playerPosition.x + Math.cos(angle) * distance,
      0,
      playerPosition.z + Math.sin(angle) * distance
    );

    const limit = CONFIG.WORLD_SIZE / 2 - 3;
    pos.x = Math.max(-limit, Math.min(limit, pos.x));
    pos.z = Math.max(-limit, Math.min(limit, pos.z));

    const zombie = new Zombie(this.scene, pos, 1 + (this.wave - 1) * 0.2);
    this.zombies.push(zombie);
  }

  spawnSurvivor(playerPosition) {
    // Surge a uma distância média
    const angle = Math.random() * Math.PI * 2;
    const distance = 16 + Math.random() * 12;
    const pos = new THREE.Vector3(
      playerPosition.x + Math.cos(angle) * distance,
      0,
      playerPosition.z + Math.sin(angle) * distance
    );

    const limit = CONFIG.WORLD_SIZE / 2 - 4;
    pos.x = Math.max(-limit, Math.min(limit, pos.x));
    pos.z = Math.max(-limit, Math.min(limit, pos.z));

    const survivor = new Survivor(this.scene, pos);
    this.survivors.push(survivor);
  }

  spawnPickup(playerPosition) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 10 + Math.random() * 15;
    const pos = new THREE.Vector3(
      playerPosition.x + Math.cos(angle) * distance,
      0,
      playerPosition.z + Math.sin(angle) * distance
    );

    const limit = CONFIG.WORLD_SIZE / 2 - 4;
    pos.x = Math.max(-limit, Math.min(limit, pos.x));
    pos.z = Math.max(-limit, Math.min(limit, pos.z));

    const pickup = new Pickup(this.scene, pos);
    this.pickups.push(pickup);
  }
}
