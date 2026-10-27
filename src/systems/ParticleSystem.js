import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeParticles = [];
    this.pool = [];
    this.maxActive = 120; // Limite global seguro para FPS consistente

    // Geometria compartilhada única para todas as partículas
    this.sharedGeo = new THREE.SphereGeometry(0.1, 4, 4);

    // Cache de materiais por cor para evitar criar milhares de MeshBasicMaterial
    this.materialCache = new Map();
  }

  getMaterial(colorHex) {
    if (this.materialCache.has(colorHex)) {
      return this.materialCache.get(colorHex);
    }
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1
    });
    this.materialCache.set(colorHex, mat);
    return mat;
  }

  getMesh(colorHex) {
    let mesh;
    if (this.pool.length > 0) {
      mesh = this.pool.pop();
      mesh.material = this.getMaterial(colorHex);
    } else {
      mesh = new THREE.Mesh(this.sharedGeo, this.getMaterial(colorHex));
      this.scene.add(mesh);
    }
    mesh.visible = true;
    return mesh;
  }

  recycle(p) {
    p.mesh.visible = false;
    this.pool.push(p.mesh);
  }

  // Cria faíscas / explosão de impacto no zumbi
  spawnHitSparks(position, color = 0xff3355, count = 8) {
    const actualCount = Math.min(count, this.maxActive - this.activeParticles.length);
    if (actualCount <= 0) return;

    for (let i = 0; i < actualCount; i++) {
      const mesh = this.getMesh(color);
      mesh.position.copy(position);
      mesh.position.y += (Math.random() - 0.5) * 0.6 + 1.2;

      const baseScale = 0.8 + Math.random() * 0.8;
      mesh.scale.set(baseScale, baseScale, baseScale);

      // Velocidade 3D dispersa
      const speed = 4 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      const vy = 2 + Math.random() * 5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        vy,
        Math.sin(angle) * speed
      );

      this.activeParticles.push({
        mesh,
        velocity,
        gravity: -14,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        baseScale
      });
    }
  }

  // Explosão de resgate ou level up (dourado / azul brilhante)
  spawnBurst(position, color = 0x00f0ff, count = 16) {
    const actualCount = Math.min(count, this.maxActive - this.activeParticles.length);
    if (actualCount <= 0) return;

    for (let i = 0; i < actualCount; i++) {
      const mesh = this.getMesh(color);
      mesh.position.copy(position);
      mesh.position.y += 1.5;

      const baseScale = 1.2;
      mesh.scale.set(baseScale, baseScale, baseScale);

      const speed = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 3,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.activeParticles.push({
        mesh,
        velocity,
        gravity: -10,
        life: 0.55,
        maxLife: 0.55,
        baseScale
      });
    }
  }

  update(delta) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.recycle(p);
        this.activeParticles.splice(i, 1);
        continue;
      }

      p.velocity.y += p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      const ratio = Math.max(0, p.life / p.maxLife);
      const currentScale = p.baseScale * ratio;
      p.mesh.scale.set(currentScale, currentScale, currentScale);
    }
  }
}
