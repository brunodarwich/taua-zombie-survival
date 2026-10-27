import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { nearestZombie } from '../src/systems/Targeting.js';
import { ParticleSystem } from '../src/systems/ParticleSystem.js';

test('aim selects the closest living zombie and switches after death or movement', () => {
  const origin = { x: 0, z: 0 };
  const close = { hp: 80, position: { x: 2, z: 1 } };
  const far = { hp: 80, position: { x: -5, z: 0 } };
  assert.equal(nearestZombie(origin, [far, close]), close);
  close.dead = true;
  assert.equal(nearestZombie(origin, [far, close]), far);
  far.hp = 0;
  assert.equal(nearestZombie(origin, [far, close]), null);
  assert.equal(nearestZombie(origin, []), null);
  close.dead = false; far.hp = 80;
  assert.equal(nearestZombie({ x: -6, z: 0 }, [close, far]), far);
});

test('impact stays at collision height and combat effects expire within bounded budgets', () => {
  const fx = new ParticleSystem(new THREE.Scene());
  const point = new THREE.Vector3(3, 1.3, 4);
  fx.spawnImpact(point, 0xffbb55, new THREE.Vector3(1, 0, 0), true);
  assert.ok(fx.activeParticles.every(p => Math.abs(p.mesh.position.y - point.y) < 0.4));
  for (let i = 0; i < 200; i++) fx.spawnMuzzleFlash(point, new THREE.Vector3(1, 0, 0), 0xffbb55);
  assert.ok(fx.activeParticles.length <= fx.maxActive);
  assert.ok(fx.flashes.length <= 20);
  fx.update(2);
  assert.equal(fx.activeParticles.length, 0);
  assert.equal(fx.flashes.length, 0);
});
