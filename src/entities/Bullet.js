import * as THREE from 'three';

export class Bullet {
  constructor(scene, origin, direction, properties) {
    this.scene = scene;
    this.position = origin.clone();
    this.direction = direction.clone().normalize();
    this.speed = properties.bulletSpeed;
    this.damage = properties.bulletDamage;
    this.life = 1.8; // segundos de vida máxima
    this.dead = false;

    // Criar mesh do projétil com brilho
    const geometry = new THREE.SphereGeometry(0.22, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: properties.bulletColor
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 1.2;

    this.scene.add(this.mesh);
  }

  update(delta) {
    if (this.dead) return;

    this.position.addScaledVector(this.direction, this.speed * delta);
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;

    this.life -= delta;
    if (this.life <= 0) {
      this.destroy();
    }
  }

  destroy() {
    this.dead = true;
    this.scene.remove(this.mesh);
  }
}
