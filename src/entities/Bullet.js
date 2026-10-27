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

    this.group = new THREE.Group();

    // 1. Núcleo brilhante (Core compartilhado)
    const coreMesh = new THREE.Mesh(sharedCoreGeo, sharedCoreMat);
    this.group.add(coreMesh);

    // 2. Halo exterior colorido (Plasma Glow com material cached)
    const glowMesh = new THREE.Mesh(sharedGlowGeo, getGlowMaterial(this.color));
    this.group.add(glowMesh);
    // A continuous tracer stays readable even when a phone renders fewer frames.
    coreMesh.scale.set(0.5, 0.5, 2.8);
    glowMesh.scale.set(0.55, 0.55, 2.2);
    glowMesh.position.z = -0.55;
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

    // Efeito de cauda/trilha
    this.trailTimer += delta;
    if (this.trailTimer >= 0.08 && particleSystem) {
      this.trailTimer = 0;
      particleSystem.flash(this.position, this.color, 2, 0.12);
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
