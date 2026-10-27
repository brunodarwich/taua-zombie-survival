import { Pickup } from '../entities/Pickup.js';

export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
  }

  checkAll(player, bullets, spawner) {
    // 1. Projéteis vs Zumbis
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
      const bullet = bullets[bIndex];
      if (bullet.dead) continue;

      for (let zIndex = spawner.zombies.length - 1; zIndex >= 0; zIndex--) {
        const zombie = spawner.zombies[zIndex];
        if (zombie.dead) continue;

        const distSq = bullet.position.distanceToSquared(zombie.position);
        if (distSq < 2.0) { // Raio de colisão
          const killed = zombie.takeDamage(bullet.damage);
          bullet.destroy();
          bullets.splice(bIndex, 1);

          if (killed) {
            player.score += 100;
            // Chance de drop de equipamento ao matar zumbi (15%)
            if (Math.random() < 0.18) {
              const drop = new Pickup(this.scene, zombie.position);
              spawner.pickups.push(drop);
            }
            zombie.destroy();
            spawner.zombies.splice(zIndex, 1);
          }
          break;
        }
      }
    }

    // 2. Jogador vs Sobreviventes (Resgate)
    for (const survivor of spawner.survivors) {
      if (!survivor.rescued && !survivor.dead) {
        const dist = player.position.distanceTo(survivor.position);
        if (dist < 2.8) {
          survivor.rescue();
          player.rescuedCount++;
          player.score += 350;
        }
      }
    }

    // 3. Jogador vs Equipamentos (Evolução)
    for (let pIndex = spawner.pickups.length - 1; pIndex >= 0; pIndex--) {
      const pickup = spawner.pickups[pIndex];
      if (pickup.dead) continue;

      const dist = player.position.distanceTo(pickup.position);
      if (dist < 2.2) {
        pickup.destroy();
        spawner.pickups.splice(pIndex, 1);
        player.upgrade();
        player.score += 250;
      }
    }

    // 4. Limpeza de Sobreviventes Mortos
    for (let sIndex = spawner.survivors.length - 1; sIndex >= 0; sIndex--) {
      const survivor = spawner.survivors[sIndex];
      if (survivor.dead) {
        survivor.destroy();
        spawner.survivors.splice(sIndex, 1);
      }
    }
  }
}
