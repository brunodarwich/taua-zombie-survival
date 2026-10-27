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
    this.flashes = [];
    this.ringGeo = new THREE.RingGeometry(0.65, 1, 24);
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
      mesh.position.y += (Math.random() - 0.5) * 0.6;

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

  flash(position, color, size, life, ring = false) {
    if (this.flashes.length >= 20) return;
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(ring ? this.ringGeo : this.sharedGeo, material);
    mesh.position.copy(position);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.setScalar(size);
    this.scene.add(mesh);
    this.flashes.push({ mesh, size, life, maxLife: life, ring });
  }

  spawnMuzzleFlash(position, direction, color) {
    this.flash(position, 0xfff4cc, 8, 0.075);
    this.flash(position, color, 0.6, 0.12, true);
    const start = this.activeParticles.length;
    this.spawnHitSparks(position, color, 3);
    for (const p of this.activeParticles.slice(start)) {
      p.velocity.copy(direction).multiplyScalar(5).addScalar(Math.random() - 0.5);
      p.life = p.maxLife = 0.12;
      p.gravity = 0;
    }
  }

  spawnImpact(position, color, direction, zombie = false) {
    this.flash(position, 0xfff4dc, 10, 0.09);
    this.flash(position, zombie ? 0xff5577 : color, zombie ? 1 : 0.7, 0.24, true);
    const start = this.activeParticles.length;
    this.spawnHitSparks(position, color, zombie ? 12 : 7);
    for (const p of this.activeParticles.slice(start)) {
      if (direction) p.velocity.addScaledVector(direction, -4);
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
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.life -= delta;
      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        f.mesh.material.dispose();
        this.flashes.splice(i, 1);
        continue;
      }
      const ratio = f.life / f.maxLife;
      f.mesh.material.opacity = ratio * ratio;
      f.mesh.scale.setScalar(f.size * (f.ring ? 1 + (1 - ratio) * 2.5 : ratio));
    }
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
