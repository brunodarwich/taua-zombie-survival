import { Pickup } from '../entities/Pickup.js';
import * as THREE from 'three';

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

  handleZombieDeath(zombie, player, spawner) {
    player.score += 100;
    this.particles?.spawnBurst(zombie.position, 0xff0044, 24);
    if (Math.random() < 0.22) {
      const point = this.navigation?.dropPoint ? this.navigation.dropPoint(zombie.position) : zombie.position;
      if (point) {
        const position = zombie.position.clone().set(point.x, 0, point.z);
        spawner.pickups.push(new Pickup(this.scene, position));
      }
    }
    if (typeof zombie.destroy === 'function') {
      zombie.destroy();
    }
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
        if (bullet.hitZombies?.has(zombie)) continue;
        const hit = segmentCircleHit(bullet.previousPosition, bullet.position, zombie.position, 1.65);
        if (hit !== null && hit < nearest) { nearest = hit; targetIndex = zi; }
      }
      if (nearest === Infinity) continue;
      const impact = bullet.previousPosition.clone().lerp(bullet.position, nearest);
      const direction = bullet.direction || bullet.position.clone().sub(bullet.previousPosition).normalize();

      if (targetIndex >= 0) {
        const zombie = spawner.zombies[targetIndex];
        if (bullet.hitZombies) bullet.hitZombies.add(zombie);

        // Visual de impacto específico por arquétipo
        if (bullet.splashRadius > 0) {
          this.particles?.spawnExplosion(impact, bullet.color, bullet.splashRadius);
        } else if (bullet.type === 'piercing') {
          this.particles?.spawnLaserImpact(impact, bullet.color, direction);
        } else if (bullet.type === 'shotgun' || bullet.type === 'void_shotgun' || bullet.type === 'heavy_slug') {
          this.particles?.spawnVoidImpact(impact, bullet.color, direction);
        } else {
          this.particles?.spawnImpact(impact, bullet.color, direction, true);
        }

        // Repulsão (Knockback)
        if (bullet.knockback && bullet.knockback > 0) {
          const pushDir = direction.clone().setY(0).normalize();
          const targetPos = zombie.position.clone().addScaledVector(pushDir, bullet.knockback);
          if (this.navigation?.firstHit(zombie.position, targetPos, true) === null) {
            zombie.position.copy(targetPos);
          } else {
            zombie.position.addScaledVector(pushDir, bullet.knockback * 0.35);
          }
          if (zombie.group) zombie.group.position.copy(zombie.position);
        }

        // Dano Direto
        const critical = Math.random() < 0.25;
        const damage = bullet.damage * (critical ? 1.5 : 1);
        this.damageText?.spawnDamage(zombie.position, damage, critical);
        if (zombie.takeDamage(damage)) {
          this.handleZombieDeath(zombie, player, spawner);
        }

        // Dano em Área (Splash & Clusters)
        if (bullet.splashRadius > 0) {
          for (let zi = 0; zi < spawner.zombies.length; zi++) {
            const otherZombie = spawner.zombies[zi];
            if (otherZombie === zombie || otherZombie.dead) continue;
            const dist = otherZombie.position.distanceTo(impact);
            if (dist <= bullet.splashRadius) {
              const falloff = 1 - (dist / bullet.splashRadius) * 0.4;
              const splashDmg = Math.round(bullet.damage * (bullet.splashDamageRatio ?? 0.7) * falloff);
              this.damageText?.spawnDamage(otherZombie.position, splashDmg, false);
              if (otherZombie.takeDamage(splashDmg)) {
                this.handleZombieDeath(otherZombie, player, spawner);
              }
            }
          }

          if (bullet.clusterCount > 0) {
            for (let c = 0; c < bullet.clusterCount; c++) {
              const angle = (c / bullet.clusterCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
              const offsetDist = 0.8 + Math.random() * (bullet.clusterRadius || 2.2);
              const subPoint = impact.clone().add(new THREE.Vector3(Math.cos(angle) * offsetDist, 0, Math.sin(angle) * offsetDist));
              this.particles?.spawnExplosion(subPoint, 0xff5500, 1.8);
              for (let zi = 0; zi < spawner.zombies.length; zi++) {
                const clusterTarget = spawner.zombies[zi];
                if (clusterTarget.dead) continue;
                if (clusterTarget.position.distanceTo(subPoint) <= 1.8) {
                  const cDmg = bullet.clusterDamage || 45;
                  this.damageText?.spawnDamage(clusterTarget.position, cDmg, false);
                  if (clusterTarget.takeDamage(cDmg)) {
                    this.handleZombieDeath(clusterTarget, player, spawner);
                  }
                }
              }
            }
          }
        }

        // Gerenciamento de Piercing
        if (bullet.pierceCount !== undefined) {
          bullet.pierceCount--;
        }
        if (!bullet.pierceCount || bullet.pierceCount <= 0 || wallHit === nearest) {
          bullet.destroy();
          bullets.splice(bi, 1);
        } else {
          // Continua trajetória adiante do zumbi
          bullet.previousPosition.copy(impact);
          bullet.position.copy(impact).addScaledVector(direction, 0.4);
        }
      } else {
        // Impacto contra obstáculo/parede
        if (bullet.splashRadius > 0) {
          this.particles?.spawnExplosion(impact, bullet.color, bullet.splashRadius);
          for (let zi = 0; zi < spawner.zombies.length; zi++) {
            const wallNearZombie = spawner.zombies[zi];
            if (wallNearZombie.dead) continue;
            const dist = wallNearZombie.position.distanceTo(impact);
            if (dist <= bullet.splashRadius) {
              const splashDmg = Math.round(bullet.damage * (bullet.splashDamageRatio ?? 0.7) * (1 - dist / bullet.splashRadius * 0.4));
              this.damageText?.spawnDamage(wallNearZombie.position, splashDmg, false);
              if (wallNearZombie.takeDamage(splashDmg)) {
                this.handleZombieDeath(wallNearZombie, player, spawner);
              }
            }
          }
        } else {
          this.particles?.spawnImpact(impact, bullet.color, direction, false);
        }
        bullet.destroy();
        bullets.splice(bi, 1);
      }
    }

    // Limpar zumbis eliminados
    for (let zi = spawner.zombies.length - 1; zi >= 0; zi--) {
      if (spawner.zombies[zi].dead) {
        spawner.zombies.splice(zi, 1);
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
