import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Player } from '../src/entities/Player.js';
import { ASSETS } from '../src/config.js';
import { textureCache } from '../src/systems/TextureCache.js';
import { sounds } from '../src/audio.js';

test('equipment evolves the player to the final character and then preserves that skin while healing', t => {
  const textures = t.mock.method(textureCache, 'load', () => new THREE.Texture());
  t.mock.method(sounds, 'playPowerup', () => {});
  const player = new Player(new THREE.Scene(), ASSETS.unarmed[0]);
  player.upgrade();
  assert.equal(player.tier, 2);
  assert.ok(ASSETS.player.includes(player.currentSkinUrl));
  player.upgrade();
  assert.equal(player.tier, 3);
  assert.ok(ASSETS.playerTop.includes(player.currentSkinUrl));
  const finalSkin = player.currentSkinUrl;
  const finalTexture = player.sprite.material.map;
  const loads = textures.mock.callCount();
  player.hp = 10;
  for (const expectedHp of [50, 90, 100, 100]) {
    player.upgrade();
    assert.equal(player.tier, 3);
    assert.equal(player.currentSkinUrl, finalSkin);
    assert.equal(player.sprite.material.map, finalTexture);
    assert.equal(player.hp, expectedHp);
  }
  assert.equal(textures.mock.callCount(), loads);
  assert.equal(player.equipmentsCollected, 6);
});
