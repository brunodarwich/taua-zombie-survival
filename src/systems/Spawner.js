import * as THREE from 'three';
import { Zombie } from '../entities/Zombie.js';
import { Survivor } from '../entities/Survivor.js';
import { Pickup } from '../entities/Pickup.js';

export class Spawner {
  constructor(scene, navigation) {
    this.scene = scene;
    this.navigation = navigation;
    this.zombies = [];
    this.survivors = [];
    this.pickups = [];
    this.wave = 1;
    this.zombieSpawnTimer = 0;
    this.zombieInterval = 2.2;
    this.survivorSpawnTimer = 0;
    this.survivorInterval = 12;
    this.pickupSpawnTimer = 0;
    this.pickupInterval = 16;
    this.maxZombies = 45;
  }

  update(delta, player) {
    this.zombieSpawnTimer += delta;
    if (this.zombieSpawnTimer >= this.zombieInterval) {
      this.zombieSpawnTimer = 0;
      if (this.zombies.length < this.maxZombies) this.spawnZombie(player.position);
      this.zombieInterval = Math.max(0.6, 2.2 - this.wave * 0.12);
    }
    this.survivorSpawnTimer += delta;
    if (this.survivorSpawnTimer >= this.survivorInterval) {
      this.survivorSpawnTimer = 0;
      if (this.survivors.length < 8 && this.survivors.filter(s => s.state === 'waiting').length < 4) this.spawnSurvivor(player.position);
    }
    this.pickupSpawnTimer += delta;
    if (this.pickupSpawnTimer >= this.pickupInterval) {
      this.pickupSpawnTimer = 0;
      if (this.pickups.length < 3) this.spawnPickup(player.position);
    }
  }

  position(center, min, max, zombie = false) {
    const p = this.navigation.spawnPoint(center, min, max, zombie);
    return p ? new THREE.Vector3(p.x, 0, p.z) : null;
  }
  spawnZombie(center) {
    if (this.zombies.length >= this.maxZombies) return;
    const p = this.position(center, 28, 38, true);
    if (p) this.zombies.push(new Zombie(this.scene, p, 1 + (this.wave - 1) * 0.2, this.navigation));
  }
  spawnSurvivor(center) {
    const p = this.position(center, 16, 28);
    if (p) this.survivors.push(new Survivor(this.scene, p, this.navigation));
  }
  spawnPickup(center) {
    const p = this.position(center, 10, 25);
    if (p) this.pickups.push(new Pickup(this.scene, p));
  }
}
