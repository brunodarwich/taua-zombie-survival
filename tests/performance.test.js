import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ParticleSystem } from '../src/systems/ParticleSystem.js';
import { HUD } from '../src/ui/HUD.js';
import { createNavigation } from '../src/world.js';

test('120 sparks share one render object, retain colors, and disappear after expiry', () => {
  const scene = new THREE.Scene(), fx = new ParticleSystem(scene);
  fx.spawnBurst(new THREE.Vector3(), 0xffaa00, 60);
  fx.spawnBurst(new THREE.Vector3(5, 0, 0), 0x00ffff, 60);
  fx.update(0.01); fx.syncInstances();
  assert.equal(scene.children.length, 1);
  assert.equal(fx.instances.count, 120);
  const color = new THREE.Color();
  fx.instances.getColorAt(0, color); assert.equal(color.getHex(), 0xffaa00);
  fx.instances.getColorAt(119, color); assert.equal(color.getHex(), 0x00ffff);
  fx.update(2); fx.syncInstances();
  assert.equal(fx.instances.count, 0);
});

test('repeated flashes reuse GPU resources without growing the scene', () => {
  const scene = new THREE.Scene(), fx = new ParticleSystem(scene);
  fx.flash(new THREE.Vector3(), 0xffaa00, 2, 0.1);
  const mesh = fx.flashes[0].mesh, material = mesh.material;
  fx.update(1);
  fx.flash(new THREE.Vector3(5, 1, 0), 0x00ffff, 3, 0.1, true);
  assert.equal(fx.flashes[0].mesh, mesh);
  assert.equal(mesh.material, material);
  assert.equal(mesh.visible, true);
  assert.equal(mesh.material.opacity, 1);
  assert.equal(mesh.geometry, fx.ringGeo);
  assert.equal(scene.children.length, 2);
});

test('cached navigation edges match obstacle checks for humans and zombies', () => {
  const nav = createNavigation();
  for (const zombie of [false, true]) {
    for (let i = 0; i < nav.width ** 2; i++) {
      assert.deepEqual(nav.neighbors(i, zombie), nav.buildNeighbors(i, zombie));
    }
  }
});

test('HUD avoids unchanged DOM writes but updates escort and refuge changes', () => {
  let writes = 0;
  const elements = new Map();
  globalThis.document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, {
      getAttribute: () => 'skin', set textContent(value) { this.value = value; writes++; },
      style: { set transform(value) { writes++; }, set width(value) { writes++; } }
    });
    return elements.get(id);
  } };
  try {
    const hud = new HUD(), player = { hp: 100, maxHp: 100, tier: 1, score: 0,
      rescuedCount: 0, currentSkinUrl: 'skin', position: { x: 0, z: 0 } };
    const nav = { inSafeZone: () => false }, refuge = { x: 0, z: -39 };
    hud.update(player, 1, [], refuge, nav);
    writes = 0;
    for (let i = 0; i < 1000; i++) hud.update(player, 1, [], refuge, nav);
    assert.equal(writes, 0);
    player.position.z = -3;
    hud.update(player, 1, [{ state: 'following', dead: false }], refuge, nav);
    assert.equal(elements.get('escort-val').value, 1);
    assert.match(elements.get('refuge-distance').value, /36 m/);
  } finally { delete globalThis.document; }
});
