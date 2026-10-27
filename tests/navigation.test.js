import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldNavigation, segmentBoxHit } from '../src/systems/WorldNavigation.js';

const wall = { minX: -5, maxX: 5, minZ: -1, maxZ: 1 };
const safe = { minX: -10, maxX: 10, minZ: -46, maxZ: -30 };

test('a fast projectile hits a thin wall along its whole segment', () => {
  assert.equal(segmentBoxHit({ x: 0, z: -10 }, { x: 0, z: 10 }, wall), 0.45);
  assert.equal(segmentBoxHit({ x: 9, z: -10 }, { x: 9, z: 10 }, wall), null);
});

test('movement slides along walls without crossing, including a long frame', () => {
  const nav = new WorldNavigation({ obstacles: [wall], safeBounds: safe });
  const p = { x: 0, z: -8 };
  nav.move(p, 3, 20);
  assert.ok(p.z < -2);
  assert.ok(p.x > 2);
});

test('A* finds a traversable route around a wall', () => {
  const nav = new WorldNavigation({ obstacles: [wall], safeBounds: safe });
  const from = { x: 0, z: -8 }, to = { x: 0, z: 8 };
  const path = nav.findPath(from, to);
  assert.ok(path.length > 1);
  let previous = from;
  for (const point of path) {
    assert.equal(nav.firstHit(previous, point, false, 1.25), null);
    previous = point;
  }
  assert.ok(Math.hypot(previous.x - to.x, previous.z - to.z) < 2);
});

test('the refuge admits survivors but blocks zombies and their spawn points', () => {
  const nav = new WorldNavigation({ obstacles: [], safeBounds: safe });
  assert.equal(nav.isFree({ x: 0, z: -38 }), true);
  assert.equal(nav.isFree({ x: 0, z: -38 }, true), false);
  const zombie = { x: 0, z: -26 };
  nav.move(zombie, 0, -20, true);
  assert.ok(zombie.z > -29);
  assert.ok(nav.findPath({ x: 0, z: 0 }, { x: 0, z: -38 }).length);
  for (let i = 0; i < 100; i++) {
    const point = nav.spawnPoint({ x: 0, z: -28 }, 10, 20, true);
    assert.ok(point && nav.isFree(point, true));
    assert.equal(nav.inSafeZone(point), false);
  }
});
