import * as THREE from 'three';
import { ASSETS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';
import { sounds } from '../audio.js';

// Geometria e material de sombra compartilhados
const sharedSurvivorShadowGeo = new THREE.CircleGeometry(0.9, 16);
const sharedSurvivorShadowMat = new THREE.MeshBasicMaterial({
  color: 0x070b14,
  transparent: true,
  opacity: 0.45
});

export class Survivor {
  constructor(scene, position, navigation) {
    this.scene = scene;
    this.position = position.clone();
    this.hp = 100;
    this.dead = false;
    this.state = 'waiting';
    this.navigation = navigation;
    this.scale = 3.4; // Aumentado para visibilidade nítida
    this.followSpeed = 11;
    this._dirVector = new THREE.Vector3();

    const randUnarmed = ASSETS.unarmed[Math.floor(Math.random() * ASSETS.unarmed.length)];
    this.unarmedUrl = randUnarmed;

    const texture = textureCache.load(this.unarmedUrl);
    this.material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    this.sprite = new THREE.Sprite(this.material);
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

    this.helpTex = new THREE.CanvasTexture(this.helpCanvas);
    this.helpMat = new THREE.SpriteMaterial({ map: this.helpTex, transparent: true, depthTest: false });
    this.helpSprite = new THREE.Sprite(this.helpMat);
    this.helpSprite.scale.set(2.4, 1.1, 1);
    this.helpSprite.position.y = this.scale + 0.9;

    this.shadow = new THREE.Mesh(sharedSurvivorShadowGeo, sharedSurvivorShadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.05;

    this.group = new THREE.Group();
    this.group.add(this.shadow);
    this.group.add(this.sprite);
    this.group.add(this.helpSprite);
    this.group.position.copy(this.position);

    this.scene.add(this.group);
  }

  startFollowing() {
    if (this.state !== 'waiting') return;
    this.state = 'following';

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

    // Escoltar ainda não conclui o resgate.
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
    ctx.fillText('SIGA-ME!', 80, 36);
    this.helpSprite.material.map.needsUpdate = true;

    setTimeout(() => {
      if (this.helpSprite && this.group) {
        this.group.remove(this.helpSprite);
      }
    }, 1500);

  }

  deliver() {
    if (this.state !== 'following') return false;
    this.state = 'delivered';
    sounds.playRescue();
    return true;
  }

  takeDamage(amount) {
    if (this.dead || this.state === 'delivered' || this.navigation.inSafeZone(this.position)) return false;
    this.hp -= amount;
    this.sprite.material.color.setRGB(1, 0.2, 0.2);
    setTimeout(() => {
      if (this.sprite && this.sprite.material) {
        this.sprite.material.color.setRGB(1, 1, 1);
      }
    }, 100);

    if (this.hp <= 0) {
      this.dead = true;
      this.state = 'dead';
      return true;
    }
    return false;
  }

  update(delta, playerPosition, rescuePoint) {
    if (this.dead) return;

    if (this.state === 'following') {
      const target = this.navigation.inSafeZone(playerPosition) ? rescuePoint : playerPosition;
      const dir = this._dirVector.set(target.x - this.position.x, 0, target.z - this.position.z);
      dir.y = 0;
      const dist = dir.length();

      if (dist > 1.8) {
        dir.normalize();
        this.navigation.follow(this, target, this.followSpeed, delta, false, 1.8);
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
    this.dead = true;
    this.scene.remove(this.group);
    if (this.material) this.material.dispose();
    if (this.helpMat) this.helpMat.dispose();
    if (this.helpTex) this.helpTex.dispose();
  }
}
