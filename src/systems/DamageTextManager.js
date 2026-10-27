import * as THREE from 'three';

export class DamageTextManager {
  constructor(scene) {
    this.scene = scene;
    this.numbers = [];
  }

  spawnDamage(position, amount, isCritical = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Estilo Paper Mario: borda preta grossa, cor vibrante (amarelo ou vermelho para crítico)
    const text = Math.round(amount).toString();
    ctx.font = isCritical ? '900 48px Impact, "Arial Black", sans-serif' : '900 40px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Borda preta grossa estilo cartoon / Paper Mario
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 80, 42);

    // Gradiente de preenchimento chamativo
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

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    const scale = isCritical ? 2.6 : 2.0;
    sprite.scale.set(scale, scale * 0.5, 1);

    // Posição inicial levemente aleatória acima do alvo
    sprite.position.copy(position);
    sprite.position.x += (Math.random() - 0.5) * 0.8;
    sprite.position.y += 2.5 + Math.random() * 0.5;

    this.scene.add(sprite);
    this.numbers.push({
      sprite,
      canvas,
      life: 0.7,
      maxLife: 0.7,
      velocityY: 3.2
    });
  }

  update(delta) {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const d = this.numbers[i];
      d.life -= delta;

      if (d.life <= 0) {
        this.scene.remove(d.sprite);
        d.sprite.material.map.dispose();
        d.sprite.material.dispose();
        this.numbers.splice(i, 1);
        continue;
      }

      // Sobe e desacelera
      d.sprite.position.y += d.velocityY * delta;
      d.velocityY = Math.max(0.5, d.velocityY - 4.5 * delta);

      // Fade out no final
      const progress = d.life / d.maxLife;
      d.sprite.material.opacity = Math.min(1, progress * 1.5);
    }
  }
}
