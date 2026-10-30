import * as THREE from 'three';
import { CONFIG, ASSETS, PLAYABLE_CHARACTERS } from '../config.js';
import { textureCache } from '../systems/TextureCache.js';
import { sounds } from '../audio.js';

export class Player {
  constructor(scene, characterOrSkin) {
    this.scene = scene;
    this.tier = 1; // 1: Sem Equipamento, 2: Player, 3: Player Top
    
    // Suporte tanto para passar o objeto character completo quanto uma URL legada de skin
    if (typeof characterOrSkin === 'object' && characterOrSkin !== null) {
      this.character = characterOrSkin;
      this.currentSkinUrl = characterOrSkin.tiers[1];
    } else {
      // Buscar pelo tiers[1] ou default para o primeiro personagem
      const found = PLAYABLE_CHARACTERS.find(c => c.tiers[1] === characterOrSkin || Object.values(c.tiers).includes(characterOrSkin));
      this.character = found || PLAYABLE_CHARACTERS[0];
      this.currentSkinUrl = characterOrSkin || this.character.tiers[1];
    }

    this.equipmentsCollected = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.score = 0;
    this.rescuedCount = 0;
    this.lastShotTime = 0;

    this.position = new THREE.Vector3(0, 0, 0);
    this.aimDirection = new THREE.Vector3(1, 0, 0);
    this._moveVector = new THREE.Vector3();
    this._hitVector = new THREE.Vector3();

    // Sprite 3D Paper Mario
    const texture = textureCache.load(this.currentSkinUrl);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true
    });
    this.sprite = new THREE.Sprite(material);

    // Sombra de papel destacada
    const shadowGeo = new THREE.CircleGeometry(1.1, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x05070f,
      transparent: true,
      opacity: 0.5
    });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.05;

    // Luz pessoal sutil (Paper Mario Spotlight)
    this.spotLight = new THREE.PointLight(0xffffff, 2.0, 16);
    this.spotLight.position.set(0, 3.5, 2);

    this.group = new THREE.Group();
    this.group.add(this.shadow);
    this.group.add(this.sprite);
    this.group.add(this.spotLight);

    this.updateProperties();
    this.scene.add(this.group);
  }

  updateProperties() {
    const props = CONFIG.TIER_PROPERTIES[this.tier];
    this.scale = props.scale;
    this.sprite.scale.set(this.scale, this.scale, 1);
    this.sprite.position.y = this.scale * 0.48;
    this.shadow.scale.set(this.scale * 0.32, this.scale * 0.32, 1);

    // Atualizar cor e intensidade do spotlight
    if (this.tier === 1) {
      this.spotLight.color.setHex(0xffffff);
      this.spotLight.intensity = 2.0;
    } else if (this.tier === 2) {
      this.spotLight.color.setHex(0x00f0ff);
      this.spotLight.intensity = 2.8;
    } else {
      this.spotLight.color.setHex(0xff0055);
      this.spotLight.intensity = 3.6;
    }
  }

  upgrade() {
    this.equipmentsCollected++;
    if (this.tier === 1) {
      this.tier = 2;
      const tierSkin = this.character?.tiers?.[2] || ASSETS.player[0];
      this.setSkin(tierSkin);
      sounds.playPowerup(2);
    } else if (this.tier === 2) {
      this.tier = 3;
      const tierSkin = this.character?.tiers?.[3] || ASSETS.playerTop[0];
      this.setSkin(tierSkin);
      sounds.playPowerup(3);
    } else {
      this.hp = Math.min(this.maxHp, this.hp + 40);
      sounds.playPowerup(3);
    }
    this.updateProperties();

    // Efeito Paper Mario de pulo/scale up triunfante
    this.sprite.scale.set(this.scale * 1.35, this.scale * 1.35, 1);
    setTimeout(() => {
      if (this.sprite) this.sprite.scale.set(this.scale, this.scale, 1);
    }, 250);
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

    // Efeito de choque Paper Mario
    this.sprite.scale.set(this.scale * 1.2, this.scale * 0.8, 1);
    this.sprite.material.color.setRGB(1, 0.2, 0.2);
    setTimeout(() => {
      if (this.sprite && this.sprite.material) {
        this.sprite.scale.set(this.scale, this.scale, 1);
        this.sprite.material.color.setRGB(1, 1, 1);
      }
    }, 120);

    return this.hp <= 0;
  }

  update(delta, inputState, raycaster, groundPlane, camera, navigation) {
    const move = this._moveVector.set(0, 0, 0);
    if (inputState.forward) move.z -= 1;
    if (inputState.backward) move.z += 1;
    if (inputState.left) move.x -= 1;
    if (inputState.right) move.x += 1;
    const analog = Math.hypot(inputState.moveX || 0, inputState.moveZ || 0);
    if (analog > 0) move.set(inputState.moveX, 0, inputState.moveZ);

    if (move.lengthSq() > 0) {
      if (!analog || move.lengthSq() > 1) move.normalize();
      navigation.move(this.position, move.x * CONFIG.PLAYER_SPEED * delta, move.z * CONFIG.PLAYER_SPEED * delta);

      const limit = CONFIG.WORLD_SIZE / 2 - 2;
      this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
      this.position.z = Math.max(-limit, Math.min(limit, this.position.z));

      // Passo/gingado Paper Mario
      const walkCycle = Math.sin(Date.now() * 0.016);
      this.sprite.position.y = (this.scale * 0.48) + Math.abs(walkCycle) * 0.25;
      this.sprite.material.rotation = walkCycle * 0.08;
    } else {
      this.sprite.position.y = this.scale * 0.48;
      this.sprite.material.rotation = 0;
    }

    this.group.position.copy(this.position);

    // Mira com Mouse ou Joystick Virtual
    if (inputState.aimDirection && inputState.aimDirection.lengthSq() > 0.05) {
      this.aimDirection.copy(inputState.aimDirection).normalize();
      if (this.aimDirection.x < -0.1) {
        this.sprite.scale.x = -Math.abs(this.scale);
      } else if (this.aimDirection.x > 0.1) {
        this.sprite.scale.x = Math.abs(this.scale);
      }
    } else {
      const intersects = raycaster.intersectObject(groundPlane);
      if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        const dir = this._hitVector.subVectors(hitPoint, this.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.1) {
          dir.normalize();
          this.aimDirection.copy(dir);

          if (dir.x < -0.1) {
            this.sprite.scale.x = -Math.abs(this.scale);
          } else if (dir.x > 0.1) {
            this.sprite.scale.x = Math.abs(this.scale);
          }
        }
      }
    }
  }

  canShoot(currentTime) {
    const props = CONFIG.TIER_PROPERTIES[this.tier];
    return (currentTime - this.lastShotTime) >= props.fireRate;
  }
}
