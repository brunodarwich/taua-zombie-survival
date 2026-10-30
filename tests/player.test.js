import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Player } from '../src/entities/Player.js';
import { PLAYABLE_CHARACTERS } from '../src/config.js';
import { textureCache } from '../src/systems/TextureCache.js';
import { sounds } from '../src/audio.js';

test('playable characters evolve along their exact defined tier progression and preserve final skin', t => {
  const textures = t.mock.method(textureCache, 'load', () => new THREE.Texture());
  t.mock.method(sounds, 'playPowerup', () => {});

  for (const charConfig of PLAYABLE_CHARACTERS) {
    const player = new Player(new THREE.Scene(), charConfig);
    assert.equal(player.tier, 1);
    assert.equal(player.currentSkinUrl, charConfig.tiers[1]);

    // Tier 1 -> Tier 2
    player.upgrade();
    assert.equal(player.tier, 2);
    assert.equal(player.currentSkinUrl, charConfig.tiers[2]);

    // Tier 2 -> Tier 3
    player.upgrade();
    assert.equal(player.tier, 3);
    assert.equal(player.currentSkinUrl, charConfig.tiers[3]);

    // Extra upgrades heal and preserve Tier 3 skin
    const finalSkin = player.currentSkinUrl;
    player.hp = 10;
    player.upgrade();
    assert.equal(player.tier, 3);
    assert.equal(player.currentSkinUrl, finalSkin);
    assert.equal(player.hp, 50);
  }
});
