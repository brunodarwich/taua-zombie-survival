import * as THREE from 'three';
import { ASSETS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';
import { sounds } from '../audio.js';

export class Survivor {
  constructor(scene, position) {
    this.scene = scene;
    this.position = position.clone();
    this.hp = 80;
    this.dead = false;
    this.rescued = false;
    this.scale = 2.1;
    this.followSpeed = 10;

    // Começa sem equipamento
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

    // Ícone de "SOCORRO!" flutuante
    this.helpCanvas = document.createElement('canvas');
    this.helpCanvas.width = 128;
    this.helpCanvas.height = 64;
    const ctx = this.helpCanvas.getContext('2d');
    ctx.fillStyle = '#ff3366';
    ctx.roundRect(4, 4, 120, 56, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SOCORRO!', 64, 32);

    const helpTex = new THREE.CanvasTexture(this.helpCanvas);
    const helpMat = new THREE.SpriteMaterial({ map: helpTex, transparent: true });
    this.helpSprite = new THREE.Sprite(helpMat);
    this.helpSprite.scale.set(1.8, 0.9, 1);
    this.helpSprite.position.y = this.scale + 0.6;

    const shadowGeo = new THREE.CircleGeometry(0.7, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3
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

    // Remove aviso de socorro e substitui por "SALVO!"
    const ctx = this.helpCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 64);
    ctx.fillStyle = '#00ff88';
    ctx.roundRect(4, 4, 120, 56, 12);
    ctx.fill();
    ctx.fillStyle = '#052210';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SALVO!', 64, 32);
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
      if (this.sprite.material) {
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
      // Segue o jogador com uma distância segura de apoio
      const dir = new THREE.Vector3().subVectors(playerPosition, this.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist > 3.5) {
        dir.normalize();
        this.position.addScaledVector(dir, this.followSpeed * delta);
        this.group.position.copy(this.position);

        if (dir.x < -0.1) {
          this.sprite.scale.x = -Math.abs(this.scale);
        } else if (dir.x > 0.1) {
          this.sprite.scale.x = Math.abs(this.scale);
        }
      }
    } else {
      // Flutua o ícone de socorro
      if (this.helpSprite) {
        this.helpSprite.position.y = this.scale + 0.6 + Math.sin(Date.now() * 0.006) * 0.2;
      }
    }
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
