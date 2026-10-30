import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Player } from '../src/entities/Player.js';
import { Bullet } from '../src/entities/Bullet.js';
import { CollisionSystem } from '../src/systems/Collision.js';
import { ParticleSystem } from '../src/systems/ParticleSystem.js';
import { PLAYABLE_CHARACTERS } from '../src/config.js';
import { textureCache } from '../src/systems/TextureCache.js';
import { sounds } from '../src/audio.js';

test('each playable character has unique archetype and distinct weaponConfigs across tiers', t => {
  t.mock.method(textureCache, 'load', () => new THREE.Texture());
  t.mock.method(sounds, 'playPowerup', () => {});

  const [cherry, cobalto, sombra] = PLAYABLE_CHARACTERS;
  assert.equal(cherry.id, 'rosa');
  assert.equal(cobalto.id, 'azul');
  assert.equal(sombra.id, 'preto');

  // Cherry (Rosa) - Explosive / Area of Effect
  const playerCherry = new Player(new THREE.Scene(), cherry);
  const cherryT1 = playerCherry.getWeaponConfig();
  assert.equal(cherryT1.projectileType, 'explosive');
  assert.ok(cherryT1.splashRadius > 0);

  playerCherry.upgrade();
  const cherryT2 = playerCherry.getWeaponConfig();
  assert.equal(cherryT2.projectileType, 'explosive');
  assert.ok(cherryT2.splashRadius > cherryT1.splashRadius);

  playerCherry.upgrade();
  const cherryT3 = playerCherry.getWeaponConfig();
  assert.equal(cherryT3.projectileType, 'cluster');
  assert.ok(cherryT3.clusterCount > 0);

  // Cobalto (Azul) - Piercing / High Cadence
  const playerCobalto = new Player(new THREE.Scene(), cobalto);
  const cobaltoT1 = playerCobalto.getWeaponConfig();
  assert.equal(cobaltoT1.projectileType, 'piercing');
  assert.equal(cobaltoT1.pierceCount, 1);

  playerCobalto.upgrade();
  const cobaltoT2 = playerCobalto.getWeaponConfig();
  assert.equal(cobaltoT2.pierceCount, 2);

  playerCobalto.upgrade();
  const cobaltoT3 = playerCobalto.getWeaponConfig();
  assert.equal(cobaltoT3.pierceCount, 4);
  assert.ok(cobaltoT3.fireRate < cobaltoT1.fireRate); // Faster cadence

  // Sombra (Preto) - Heavy / Knockback
  const playerSombra = new Player(new THREE.Scene(), sombra);
  const sombraT1 = playerSombra.getWeaponConfig();
  assert.equal(sombraT1.projectileType, 'heavy_slug');
  assert.ok(sombraT1.knockback > 0);

  playerSombra.upgrade();
  const sombraT2 = playerSombra.getWeaponConfig();
  assert.equal(sombraT2.projectileType, 'shotgun');
  assert.equal(sombraT2.bulletSpread, 4);

  playerSombra.upgrade();
  const sombraT3 = playerSombra.getWeaponConfig();
  assert.equal(sombraT3.projectileType, 'void_shotgun');
  assert.equal(sombraT3.bulletSpread, 6);
  assert.ok(sombraT3.knockback > sombraT2.knockback);
});

test('Cobalto piercing projectile damages the first zombie, remains active, and damages the second zombie', () => {
  const scene = new THREE.Scene();
  const collision = new CollisionSystem(scene, null, null, {
    firstHit: () => null,
    inSafeZone: () => false
  });
  const player = { score: 0 };

  let z1Hits = 0, z2Hits = 0;
  const zombie1 = {
    position: new THREE.Vector3(0, 0, 5),
    dead: false,
    takeDamage(dmg) { z1Hits += dmg; return false; }
  };
  const zombie2 = {
    position: new THREE.Vector3(0, 0, 10),
    dead: false,
    takeDamage(dmg) { z2Hits += dmg; return false; }
  };

  const bulletProps = {
    bulletSpeed: 50,
    bulletDamage: 40,
    bulletColor: 0x00ffff,
    projectileType: 'piercing',
    pierceCount: 2
  };

  const bullet = new Bullet(scene, new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(0, 0, 1), bulletProps);
  const bullets = [bullet];

  // Frame 1: bullet flies from z=0 to z=6 (hits zombie 1 at z=5)
  bullet.previousPosition.set(0, 1.3, 0);
  bullet.position.set(0, 1.3, 6);

  collision.checkAll(player, bullets, { zombies: [zombie1, zombie2], pickups: [], survivors: [] });

  assert.ok(z1Hits >= 40, 'First zombie took damage');
  assert.equal(bullet.dead, false, 'Bullet is still alive after piercing first zombie');
  assert.equal(bullet.pierceCount, 1, 'Pierce count decreased to 1');
  assert.equal(bullets.length, 1, 'Bullet remains in active bullets array');

  // Frame 2: bullet flies from z=6 to z=12 (hits zombie 2 at z=10)
  bullet.previousPosition.set(0, 1.3, 6);
  bullet.position.set(0, 1.3, 12);

  collision.checkAll(player, bullets, { zombies: [zombie1, zombie2], pickups: [], survivors: [] });

  assert.ok(z2Hits >= 40, 'Second zombie took damage');
  assert.equal(bullet.dead, true, 'Bullet is destroyed after using all pierces');
  assert.equal(bullets.length, 0, 'Bullet was removed from active bullets array');
});

test('Cherry explosive projectile deals splash damage to adjacent zombies in radius', () => {
  const scene = new THREE.Scene();
  const fx = new ParticleSystem(scene);
  const collision = new CollisionSystem(scene, fx, null, {
    firstHit: () => null,
    inSafeZone: () => false
  });
  const player = { score: 0 };

  let mainDmg = 0, splashDmg = 0, distantDmg = 0;
  const directTarget = {
    position: new THREE.Vector3(0, 0, 5),
    dead: false,
    takeDamage(d) { mainDmg += d; return false; }
  };
  const nearbyZombie = {
    position: new THREE.Vector3(1.5, 0, 5), // 1.5m away (within 3.6m splash radius)
    dead: false,
    takeDamage(d) { splashDmg += d; return false; }
  };
  const farZombie = {
    position: new THREE.Vector3(10, 0, 5), // 10m away (outside splash radius)
    dead: false,
    takeDamage(d) { distantDmg += d; return false; }
  };

  const bulletProps = {
    bulletSpeed: 40,
    bulletDamage: 80,
    bulletColor: 0xff0055,
    projectileType: 'explosive',
    splashRadius: 3.6,
    splashDamageRatio: 0.75,
    pierceCount: 1
  };

  const bullet = new Bullet(scene, new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(0, 0, 1), bulletProps);
  const bullets = [bullet];

  bullet.previousPosition.set(0, 1.3, 0);
  bullet.position.set(0, 1.3, 6);

  collision.checkAll(player, bullets, {
    zombies: [directTarget, nearbyZombie, farZombie],
    pickups: [],
    survivors: []
  });

  assert.ok(mainDmg >= 80, 'Direct target took primary damage');
  assert.ok(splashDmg > 0, 'Nearby zombie took splash damage');
  assert.equal(distantDmg, 0, 'Distant zombie was untouched');
  assert.equal(bullets.length, 0, 'Explosive projectile detonated and was removed');
});

test('Sombra heavy slug knocks back the targeted zombie', () => {
  const scene = new THREE.Scene();
  const collision = new CollisionSystem(scene, null, null, {
    firstHit: () => null,
    inSafeZone: () => false
  });
  const player = { score: 0 };

  const zombie = {
    position: new THREE.Vector3(0, 0, 5),
    dead: false,
    takeDamage() { return false; }
  };

  const bulletProps = {
    bulletSpeed: 35,
    bulletDamage: 70,
    bulletColor: 0xa855f7,
    projectileType: 'heavy_slug',
    knockback: 4.5,
    pierceCount: 1
  };

  const bullet = new Bullet(scene, new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(0, 0, 1), bulletProps);
  const bullets = [bullet];

  bullet.previousPosition.set(0, 1.3, 0);
  bullet.position.set(0, 1.3, 6);

  collision.checkAll(player, bullets, { zombies: [zombie], pickups: [], survivors: [] });

  assert.ok(zombie.position.z > 5, 'Zombie was pushed back along shooting vector (z > 5)');
  assert.equal(bullets.length, 0);
});
