import { Pickup } from '../entities/Pickup.js';

// Swept circle hit in the ground plane. Return the first impact along the frame.
export function segmentCircleHit(a, b, center, radius) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const ox = a.x - center.x, oz = a.z - center.z;
  const c = ox * ox + oz * oz - radius * radius;
  if (c <= 0) return 0;
  const length = dx * dx + dz * dz;
  if (length < 1e-9) return null;
  const projection = ox * dx + oz * dz;
  const discriminant = projection * projection - length * c;
  if (discriminant < 0) return null;
  const t = (-projection - Math.sqrt(discriminant)) / length;
  return t >= 0 && t <= 1 ? t : null;
}

export class CollisionSystem {
  constructor(scene, particleSystem, damageTextManager, navigation) {
    this.scene = scene;
    this.particles = particleSystem;
    this.damageText = damageTextManager;
    this.navigation = navigation;
  }

  checkAll(player, bullets, spawner) {
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const bullet = bullets[bi];
      if (bullet.dead) continue;
      const wallHit = this.navigation.firstHit(bullet.previousPosition, bullet.position, false, 0.3);
      let nearest = wallHit ?? Infinity, targetIndex = -1;
      for (let zi = 0; zi < spawner.zombies.length; zi++) {
        const zombie = spawner.zombies[zi];
        if (zombie.dead) continue;
        const hit = segmentCircleHit(bullet.previousPosition, bullet.position, zombie.position, 1.65);
        if (hit !== null && hit < nearest) { nearest = hit; targetIndex = zi; }
      }
      if (nearest === Infinity) continue;
      const impact = bullet.previousPosition.clone().lerp(bullet.position, nearest);
      this.particles?.spawnImpact(impact, bullet.color, bullet.direction, targetIndex >= 0);
      bullet.destroy(); bullets.splice(bi, 1);
      if (targetIndex >= 0) {
        const zombie = spawner.zombies[targetIndex];
        const critical = Math.random() < 0.25;
        const damage = bullet.damage * (critical ? 1.5 : 1);
        this.damageText?.spawnDamage(zombie.position, damage, critical);
        if (zombie.takeDamage(damage)) {
          player.score += 100;
          this.particles?.spawnBurst(zombie.position, 0xff0044, 24);
          if (Math.random() < 0.22) {
            const point = this.navigation.dropPoint(zombie.position);
            if (point) {
              const position = zombie.position.clone().set(point.x, 0, point.z);
              spawner.pickups.push(new Pickup(this.scene, position));
            }
          }
          zombie.destroy(); spawner.zombies.splice(targetIndex, 1);
        }
      }
    }

    for (let i = spawner.pickups.length - 1; i >= 0; i--) {
      const pickup = spawner.pickups[i];
      if (!pickup.dead && player.position.distanceTo(pickup.position) < 3 && this.navigation.firstHit(player.position, pickup.position) === null) {
        pickup.destroy(); spawner.pickups.splice(i, 1);
        player.upgrade(); player.score += 250;
        this.particles?.spawnBurst(player.position, 0x00f0ff, 30);
      }
    }
    for (let i = spawner.survivors.length - 1; i >= 0; i--) {
      if (spawner.survivors[i].dead) {
        spawner.survivors[i].destroy(); spawner.survivors.splice(i, 1);
      }
    }
  }
}
