import * as THREE from 'three';
import { ASSETS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';

// Geometria e material compartilhados do anel de pickup
const sharedRingGeo = new THREE.RingGeometry(0.8, 1.1, 24);
const sharedRingMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.6
});

export class Pickup {
  constructor(scene, position) {
    this.scene = scene;
    this.position = position.clone();
    this.dead = false;

    // Sorteia entre equipamento 1 e 2
    const randEquip = ASSETS.pickups[Math.floor(Math.random() * ASSETS.pickups.length)];
    this.pickupUrl = randEquip;

    const texture = textureCache.load(this.pickupUrl);
    this.material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(1.7, 1.7, 1);
    this.sprite.position.y = 0.9;

    // Anel de luz giratório compartilhado
    this.ring = new THREE.Mesh(sharedRingGeo, sharedRingMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.05;

    this.group = new THREE.Group();
    this.group.add(this.ring);
    this.group.add(this.sprite);
    this.group.position.copy(this.position);

    this.scene.add(this.group);
  }

  update(delta) {
    if (this.dead) return;

    // Efeito de flutuação e rotação do anel
    this.sprite.position.y = 0.9 + Math.sin(Date.now() * 0.005) * 0.2;
    this.ring.rotation.z += delta * 1.5;
  }

  destroy() {
    this.dead = true;
    this.scene.remove(this.group);
    if (this.material) this.material.dispose();
  }
}
