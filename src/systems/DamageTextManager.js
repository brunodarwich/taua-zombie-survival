import * as THREE from 'three';

export class DamageTextManager {
  constructor(scene) {
    this.scene = scene;
    this.activeNumbers = [];
    this.pool = [];
    this.maxActive = 30; // Limite para evitar acúmulo excessivo
  }

  getEntry() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.visible = false;
    this.scene.add(sprite);

    return { canvas, ctx, texture, material, sprite };
  }

  spawnDamage(position, amount, isCritical = false) {
    if (this.activeNumbers.length >= this.maxActive) {
      // Reutiliza o mais antigo imediatamente
      const oldest = this.activeNumbers.shift();
      oldest.life = 0;
      this.recycle(oldest);
    }

    const entry = this.getEntry();
    const ctx = entry.ctx;
    const text = Math.round(amount).toString();

    ctx.clearRect(0, 0, 160, 80);

    ctx.font = isCritical ? '900 48px Impact, "Arial Black", sans-serif' : '900 40px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 80, 42);

    if (isCritical) {
      const grad = ctx.createLinearGradient(0, 20, 0, 65);
      grad.addColorStop(0, '#ff0055');
      grad.addColorStop(1, '#ffcc00');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(0, 20, 0, 65);
      grad.addColorStop(0, '#ffff00');
      grad.addColorStop(1, '#ff8800');
      ctx.fillStyle = grad;
    }
    ctx.fillText(text, 80, 42);

    entry.texture.needsUpdate = true;

    const scale = isCritical ? 2.6 : 2.0;
    entry.sprite.scale.set(scale, scale * 0.5, 1);
    entry.sprite.position.copy(position);
    entry.sprite.position.x += (Math.random() - 0.5) * 0.8;
    entry.sprite.position.y += 2.5 + Math.random() * 0.5;
    entry.material.opacity = 1;
    entry.sprite.visible = true;

    this.activeNumbers.push({
      entry,
      life: 0.7,
      maxLife: 0.7,
      velocityY: 3.2
    });
  }

  recycle(numObj) {
    numObj.entry.sprite.visible = false;
    this.pool.push(numObj.entry);
  }

  update(delta) {
    for (let i = this.activeNumbers.length - 1; i >= 0; i--) {
      const d = this.activeNumbers[i];
      d.life -= delta;

      if (d.life <= 0) {
        this.recycle(d);
        this.activeNumbers.splice(i, 1);
        continue;
      }

      d.entry.sprite.position.y += d.velocityY * delta;
      d.velocityY = Math.max(0.5, d.velocityY - 4.5 * delta);

      const progress = d.life / d.maxLife;
      d.entry.material.opacity = Math.min(1, progress * 1.5);
    }
  }
}
