import * as THREE from 'three';
import { CONFIG, ASSETS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';
import { sounds } from '../audio.js';

export class Player {
  constructor(scene, initialSkinUrl) {
    this.scene = scene;
    this.tier = 1; // 1: Sem Equipamento, 2: Player, 3: Player Top
    this.currentSkinUrl = initialSkinUrl;
    this.equipmentsCollected = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.score = 0;
    this.rescuedCount = 0;
    this.lastShotTime = 0;

    this.position = new THREE.Vector3(0, 0, 0);
    this.aimDirection = new THREE.Vector3(1, 0, 0);
    this.velocity = new THREE.Vector3();

    // Criação do Sprite 3D com Three.js
    const texture = textureCache.load(this.currentSkinUrl);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    this.sprite = new THREE.Sprite(material);

    // Sombra circular no chão
    const shadowGeo = new THREE.CircleGeometry(0.8, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.05;

    this.group = new THREE.Group();
    this.group.add(this.shadow);
    this.group.add(this.sprite);

    this.updateProperties();
    this.scene.add(this.group);
  }

  updateProperties() {
    const props = CONFIG.TIER_PROPERTIES[this.tier];
    this.scale = props.scale;
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.sprite.position.y = this.scale * 0.48;
    this.shadow.scale.set(this.scale * 0.45, this.scale * 0.45, 1);
  }

  upgrade() {
    this.equipmentsCollected++;
    if (this.tier === 1) {
      this.tier = 2;
      // Escolhe uma skin aleatória da lista de player
      const randSkin = ASSETS.player[Math.floor(Math.random() * ASSETS.player.length)];
      this.setSkin(randSkin);
      sounds.playPowerup(2);
    } else if (this.tier === 2) {
      this.tier = 3;
      // Evolução máxima para Player Top!
      const randSkin = ASSETS.playerTop[Math.floor(Math.random() * ASSETS.playerTop.length)];
      this.setSkin(randSkin);
      sounds.playPowerup(3);
    } else {
      // Já é Player Top -> troca de skin para outra top aleatória e recupera vida
      const randSkin = ASSETS.playerTop[Math.floor(Math.random() * ASSETS.playerTop.length)];
      this.setSkin(randSkin);
      this.hp = Math.min(this.maxHp, this.hp + 40);
      sounds.playPowerup(3);
    }
    this.updateProperties();
  }

  setSkin(url) {
    this.currentSkinUrl = url;
    const tex = textureCache.load(url);
    this.sprite.material.map = tex;
    this.sprite.material.needsUpdate = true;
  }

  takeDamage(amount) {
    this.hp -= amount;
    sounds.playPlayerHurt();
    // Flash vermelho de dano
    this.sprite.material.color.setRGB(1, 0.3, 0.3);
    setTimeout(() => {
      if (this.sprite.material) {
        this.sprite.material.color.setRGB(1, 1, 1);
      }
    }, 120);

    return this.hp <= 0;
  }

  update(delta, inputState, raycaster, groundPlane, camera) {
    // Movimentação
    const move = new THREE.Vector3();
    if (inputState.forward) move.z -= 1;
    if (inputState.backward) move.z += 1;
    if (inputState.left) move.x -= 1;
    if (inputState.right) move.x += 1;

    if (move.lengthSq() > 0) {
      move.normalize();
      this.position.addScaledVector(move, CONFIG.PLAYER_SPEED * delta);

      // Limitar ao mapa
      const limit = CONFIG.WORLD_SIZE / 2 - 2;
      this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
      this.position.z = Math.max(-limit, Math.min(limit, this.position.z));

      // Efeito sutil de bobbing / caminhada
      this.sprite.position.y = (this.scale * 0.48) + Math.sin(Date.now() * 0.015) * 0.1;
    } else {
      this.sprite.position.y = this.scale * 0.48;
    }

    this.group.position.copy(this.position);

    // Mira com o Mouse em relação ao plano do chão
    const intersects = raycaster.intersectObject(groundPlane);
    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const dir = new THREE.Vector3().subVectors(hitPoint, this.position);
      dir.y = 0;
      if (dir.lengthSq() > 0.1) {
        dir.normalize();
        this.aimDirection.copy(dir);

        // Espelhar horizontalmente o sprite de acordo com a direção que está olhando
        if (dir.x < -0.1) {
          this.sprite.scale.x = -Math.abs(this.scale);
        } else if (dir.x > 0.1) {
          this.sprite.scale.x = Math.abs(this.scale);
        }
      }
    }
  }

  canShoot(currentTime) {
    const props = CONFIG.TIER_PROPERTIES[this.tier];
    return (currentTime - this.lastShotTime) >= props.fireRate;
  }
}
