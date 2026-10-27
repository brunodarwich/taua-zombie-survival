import * as THREE from 'three';
import { ASSETS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';
import { sounds } from '../audio.js';

export class Survivor {
  constructor(scene, position) {
    this.scene = scene;
    this.position = position.clone();
    this.hp = 100;
    this.dead = false;
    this.rescued = false;
    this.scale = 3.4; // Aumentado para visibilidade nítida
    this.followSpeed = 11;

    const randUnarmed = ASSETS.unarmed[Math.floor(Math.random() * ASSETS.unarmed.length)];
    this.unarmedUrl = randUnarmed;

    const texture = textureCache.load(this.unarmedUrl);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.sprite.position.y = this.scale * 0.48;

    // Balão de socorro Paper Mario
    this.helpCanvas = document.createElement('canvas');
    this.helpCanvas.width = 160;
    this.helpCanvas.height = 70;
    const ctx = this.helpCanvas.getContext('2d');
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ff1155';
    ctx.beginPath();
    ctx.roundRect(6, 6, 148, 58, 16);
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SOCORRO!', 80, 36);

    const helpTex = new THREE.CanvasTexture(this.helpCanvas);
    const helpMat = new THREE.SpriteMaterial({ map: helpTex, transparent: true, depthTest: false });
    this.helpSprite = new THREE.Sprite(helpMat);
    this.helpSprite.scale.set(2.4, 1.1, 1);
    this.helpSprite.position.y = this.scale + 0.9;

    const shadowGeo = new THREE.CircleGeometry(0.9, 20);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x070b14,
      transparent: true,
      opacity: 0.45
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.05;

    this.group = new THREE.Group();
    this.group.add(this.shadow);
    this.group.add(this.sprite);
    this.group.add(this.helpSprite);
    this.group.position.copy(this.position);

    this.scene.add(this.group);
  }

  rescue() {
    if (this.rescued) return;
    this.rescued = true;

    // Troca para capacete aleatório!
    const randHelmet = ASSETS.helmet[Math.floor(Math.random() * ASSETS.helmet.length)];
    const helmetTex = textureCache.load(randHelmet);
    this.sprite.material.map = helmetTex;
    this.sprite.material.needsUpdate = true;

    // Pop visual
    this.sprite.scale.set(this.scale * 1.3, this.scale * 1.3, 1);
    setTimeout(() => {
      if (this.sprite) this.sprite.scale.set(this.scale, this.scale, 1);
    }, 200);

    // Balão SALVO
    const ctx = this.helpCanvas.getContext('2d');
    ctx.clearRect(0, 0, 160, 70);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#00ff66';
    ctx.beginPath();
    ctx.roundRect(6, 6, 148, 58, 16);
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = '#052210';
    ctx.font = '900 26px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SALVO!', 80, 36);
    this.helpSprite.material.map.needsUpdate = true;

    setTimeout(() => {
      if (this.helpSprite && this.group) {
        this.group.remove(this.helpSprite);
      }
    }, 1500);

    sounds.playRescue();
  }

  takeDamage(amount) {
    if (this.rescued) return false;
    this.hp -= amount;
    this.sprite.material.color.setRGB(1, 0.2, 0.2);
    setTimeout(() => {
      if (this.sprite && this.sprite.material) {
        this.sprite.material.color.setRGB(1, 1, 1);
      }
    }, 100);

    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  update(delta, playerPosition) {
    if (this.dead) return;

    if (this.rescued) {
      const dir = new THREE.Vector3().subVectors(playerPosition, this.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist > 4.0) {
        dir.normalize();
        this.position.addScaledVector(dir, this.followSpeed * delta);
        this.group.position.copy(this.position);

        const walkCycle = Math.sin(Date.now() * 0.015);
        this.sprite.position.y = (this.scale * 0.48) + Math.abs(walkCycle) * 0.2;
        this.sprite.material.rotation = walkCycle * 0.06;

        if (dir.x < -0.1) {
          this.sprite.scale.x = -Math.abs(this.scale);
        } else if (dir.x > 0.1) {
          this.sprite.scale.x = Math.abs(this.scale);
        }
      } else {
        this.sprite.material.rotation = 0;
      }
    } else {
      if (this.helpSprite) {
        this.helpSprite.position.y = this.scale + 0.9 + Math.sin(Date.now() * 0.007) * 0.25;
      }
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
