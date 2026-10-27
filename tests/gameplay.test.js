import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createNavigation, RESCUE_POINT } from '../src/world.js';
import { Survivor } from '../src/entities/Survivor.js';
import { CollisionSystem } from '../src/systems/Collision.js';
import { sounds } from '../src/audio.js';

test('the real arena has an accessible route to reception from both sides of every obstacle', () => {
  const nav = createNavigation();
  for (const wall of nav.obstacles) {
    for (const p of [{ x: wall.minX - 3, z: wall.minZ - 3 }, { x: wall.maxX + 3, z: wall.maxZ + 3 }]) {
      if (!nav.validSpawn(p)) continue;
      const path = nav.findPath(p, RESCUE_POINT);
      assert.ok(path.length > 0, JSON.stringify(p));
      let previous = p;
      for (const next of path) {
        assert.equal(nav.firstHit(previous, next, false, 1.05), null, JSON.stringify({ previous, next }));
        previous = next;
      }
      assert.ok(Math.hypot(previous.x - RESCUE_POINT.x, previous.z - RESCUE_POINT.z) < 2);
    }
  }
});

test('an actual following survivor takes lethal damage outside but is protected inside the refuge', () => {
  sounds.muted = true;
  const nav = createNavigation();
  const s = Object.assign(Object.create(Survivor.prototype), {
    hp: 100, dead: false, state: 'following', navigation: nav,
    position: new THREE.Vector3(0, 0, -35), sprite: new THREE.Sprite(new THREE.SpriteMaterial())
  });
  assert.equal(s.takeDamage(150), false);
  assert.equal(s.hp, 100);
  s.position.z = 0;
  assert.equal(s.takeDamage(150), true);
  assert.equal(s.state, 'dead');
});

test('a swept bullet hits a wall before a zombie behind it, but can hit one in front', () => {
  const nav = createNavigation();
  const collision = new CollisionSystem(new THREE.Scene(), null, null, nav);
  const player = { score: 0 };
  function fire(z) {
    let received = 0;
    const zombie = { position: new THREE.Vector3(-24, 0, z), dead: false, takeDamage(damage) { received += damage; return false; } };
    const bullet = { previousPosition: new THREE.Vector3(-24, 1.3, -30), position: new THREE.Vector3(-24, 1.3, -15), damage: 40, color: 0xffffff, destroy() { this.dead = true; } };
    const bullets = [bullet];
    collision.checkAll(player, bullets, { zombies: [zombie], pickups: [], survivors: [] });
    assert.equal(bullets.length, 0);
    return received;
  }
  assert.equal(fire(-18), 0);
  assert.ok(fire(-27) >= 40);
});

test('45 agents navigate the actual arena without crossing structures or entering the refuge', () => {
  const nav = createNavigation();
  const cells = [...nav.reachable[1].keys()].filter(i => nav.reachable[1][i]);
  const agents = Array.from({ length: 45 }, (_, i) => ({ position: nav.point(cells[Math.floor(i * cells.length / 45)]), navigationPhase: i / 150 }));
  for (let frame = 0; frame < 120; frame++) {
    for (const agent of agents) {
      nav.follow(agent, { x: 0, z: -27 }, 7, 1 / 30, true, 1.3);
      assert.ok(nav.isFree(agent.position, true));
    }
  }
});
