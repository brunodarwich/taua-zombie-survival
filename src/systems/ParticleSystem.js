import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  // Cria faíscas / explosão de impacto no zumbi
  spawnHitSparks(position, color = 0xff3355, count = 12) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += (Math.random() - 0.5) * 0.6 + 1.2;

      // Velocidade 3D dispersa
      const speed = 4 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      const vy = 2 + Math.random() * 5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        vy,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        gravity: -14,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7
      });
    }
  }

  // Explosão de resgate ou level up (dourado / azul brilhante)
  spawnBurst(position, color = 0x00f0ff, count = 20) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.12, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y += 1.5;

      const speed = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 3,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        gravity: -10,
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Fade out
      p.mesh.material.opacity = p.life / p.maxLife;
      const currentScale = (p.life / p.maxLife);
      p.mesh.scale.set(currentScale, currentScale, currentScale);
    }
  }
}
