import * as THREE from 'three';

// Geometrias e materiais compartilhados estaticamente para evitar alocações constantes
const sharedCoreGeo = new THREE.SphereGeometry(0.3, 6, 6);
const sharedCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const sharedGlowGeo = new THREE.SphereGeometry(0.5, 6, 6);
const glowMaterialCache = new Map();

function getGlowMaterial(colorHex) {
  if (glowMaterialCache.has(colorHex)) {
    return glowMaterialCache.get(colorHex);
  }
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.65
  });
  glowMaterialCache.set(colorHex, mat);
  return mat;
}

export class Bullet {
  constructor(scene, origin, direction, properties) {
    this.scene = scene;
    this.position = origin.clone();
    this.position.y = 1.3;
    this.previousPosition = this.position.clone();
    this.direction = direction.clone().normalize();
    this.speed = properties.bulletSpeed;
    this.damage = properties.bulletDamage;
    this.color = properties.bulletColor;
    this.life = 1.6;
    this.dead = false;

    // Propriedades customizadas dos arquétipos
    this.type = properties.projectileType || 'normal';
    this.pierceCount = properties.pierceCount ?? 1;
    this.hitZombies = new Set();
    this.knockback = properties.knockback || 0;
    this.splashRadius = properties.splashRadius || 0;
    this.splashDamageRatio = properties.splashDamageRatio ?? 0.7;
    this.clusterCount = properties.clusterCount || 0;
    this.clusterDamage = properties.clusterDamage || 45;
    this.clusterRadius = properties.clusterRadius || 2.2;
    this.trailType = properties.trailType || 'normal';

    this.group = new THREE.Group();

    // 1. Núcleo brilhante (Core compartilhado)
    const coreMesh = new THREE.Mesh(sharedCoreGeo, sharedCoreMat);
    this.group.add(coreMesh);

    // 2. Halo exterior colorido (Plasma Glow com material cached)
    const glowMesh = new THREE.Mesh(sharedGlowGeo, getGlowMaterial(this.color));
    this.group.add(glowMesh);

    // Estilização geométrica conforme o tipo de projétil
    if (this.trailType === 'needle' || this.trailType === 'laser' || this.trailType === 'railgun') {
      // Dardo fino e alongado de alta velocidade
      coreMesh.scale.set(0.3, 0.3, 3.8);
      glowMesh.scale.set(0.42, 0.42, 3.2);
      glowMesh.position.z = -0.6;
    } else if (this.trailType === 'heavy' || this.trailType === 'shrapnel' || this.trailType === 'void') {
      // Projétil pesado, maciço e denso
      const s = this.trailType === 'void' ? 0.7 : 0.6;
      coreMesh.scale.set(s, s, 2.0);
      glowMesh.scale.set(s * 1.3, s * 1.3, 1.8);
      glowMesh.position.z = -0.4;
    } else if (this.trailType === 'fire' || this.trailType === 'rocket' || this.trailType === 'cluster_core') {
      // Foguete / Ogiva incandescente
      coreMesh.scale.set(0.55, 0.55, 2.6);
      glowMesh.scale.set(0.72, 0.72, 2.3);
      glowMesh.position.z = -0.5;
    } else {
      coreMesh.scale.set(0.5, 0.5, 2.8);
      glowMesh.scale.set(0.55, 0.55, 2.2);
      glowMesh.position.z = -0.55;
    }

    this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.direction);
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Trilha de partículas controlada
    this.trailTimer = 0;
  }

  update(delta, particleSystem) {
    if (this.dead) return;

    this.previousPosition.copy(this.position);
    this.position.addScaledVector(this.direction, this.speed * delta);
    this.group.position.copy(this.position);

    // Efeito de rastro customizado por arquétipo
    this.trailTimer += delta;
    const interval = this.trailType === 'railgun' || this.trailType === 'laser' ? 0.05 : 0.08;
    if (this.trailTimer >= interval && particleSystem) {
      this.trailTimer = 0;
      if (this.trailType === 'fire' || this.trailType === 'rocket' || this.trailType === 'cluster_core') {
        particleSystem.flash(this.position, this.color, 1.8, 0.1);
        particleSystem.spawnHitSparks(this.position, 0xff7700, 1);
      } else if (this.trailType === 'railgun' || this.trailType === 'laser') {
        particleSystem.flash(this.position, this.color, 1.4, 0.08);
      } else if (this.trailType === 'void' || this.trailType === 'shrapnel') {
        particleSystem.flash(this.position, this.color, 1.6, 0.09);
      } else {
        particleSystem.flash(this.position, this.color, 2, 0.12);
      }
    }

    this.life -= delta;
    if (this.life <= 0) {
      this.destroy();
    }
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.scene.remove(this.group);
  }
}
