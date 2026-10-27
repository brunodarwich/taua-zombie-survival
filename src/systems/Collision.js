import { Pickup } from '../entities/Pickup.js';

export class CollisionSystem {
  constructor(scene, particleSystem, damageTextManager) {
    this.scene = scene;
    this.particles = particleSystem;
    this.damageText = damageTextManager;
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
        if (distSq < 3.2) { // Raio ajustado para escalas maiores
          // Dano com chance de acerto crítico
          const isCrit = Math.random() < 0.25;
          const finalDamage = isCrit ? bullet.damage * 1.5 : bullet.damage;

          // 1. Gerar FX de Faíscas/Impacto
          if (this.particles) {
            this.particles.spawnHitSparks(bullet.position, bullet.color, 14);
          }

          // 2. Gerar Número de Dano Flutuante estilo Paper Mario
          if (this.damageText) {
            this.damageText.spawnDamage(zombie.position, finalDamage, isCrit);
          }

          const killed = zombie.takeDamage(finalDamage);
          bullet.destroy();
          bullets.splice(bIndex, 1);

          if (killed) {
            player.score += 100;
            // Explosão de eliminação
            if (this.particles) {
              this.particles.spawnBurst(zombie.position, 0xff0044, 24);
            }

            // Chance de drop de equipamento (20%)
            if (Math.random() < 0.22) {
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
        if (dist < 3.8) {
          survivor.rescue();
          player.rescuedCount++;
          player.score += 350;

          if (this.particles) {
            this.particles.spawnBurst(survivor.position, 0x00ff88, 25);
          }
        }
      }
    }

    // 3. Jogador vs Equipamentos (Evolução)
    for (let pIndex = spawner.pickups.length - 1; pIndex >= 0; pIndex--) {
      const pickup = spawner.pickups[pIndex];
      if (pickup.dead) continue;

      const dist = player.position.distanceTo(pickup.position);
      if (dist < 3.0) {
        pickup.destroy();
        spawner.pickups.splice(pIndex, 1);
        player.upgrade();
        player.score += 250;

        if (this.particles) {
          this.particles.spawnBurst(player.position, 0x00f0ff, 30);
        }
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
