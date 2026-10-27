import * as THREE from 'three';

export class Bullet {
  constructor(scene, origin, direction, properties) {
    this.scene = scene;
    this.position = origin.clone();
    this.position.y = 1.3;
    this.direction = direction.clone().normalize();
    this.speed = properties.bulletSpeed;
    this.damage = properties.bulletDamage;
    this.color = properties.bulletColor;
    this.glowColor = properties.glowColor;
    this.life = 1.6;
    this.dead = false;

    this.group = new THREE.Group();

    // 1. Núcleo brilhante (Core)
    const coreGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(coreMesh);

    // 2. Halo exterior colorido (Plasma Glow)
    const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.65
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(glowMesh);

    // 3. Mini luz pontual para iluminação dinâmica Paper Mario nos arredores
    this.light = new THREE.PointLight(this.color, 1.8, 4.5);
    this.group.add(this.light);

    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Trilha de partículas leves
    this.trailTimer = 0;
  }

  update(delta, particleSystem) {
    if (this.dead) return;

    this.position.addScaledVector(this.direction, this.speed * delta);
    this.group.position.copy(this.position);

    // Efeito de cauda/trilha
    this.trailTimer += delta;
    if (this.trailTimer >= 0.04 && particleSystem) {
      this.trailTimer = 0;
      particleSystem.spawnHitSparks(this.position, this.color, 1);
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
