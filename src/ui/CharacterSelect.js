import { ASSETS } from '../config.js';

export class CharacterSelect {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.container = document.getElementById('char-select-screen');
    this.grid = document.getElementById('char-grid');
    this.render();
  }

  render() {
    this.grid.innerHTML = '';
    ASSETS.unarmed.forEach((assetPath, index) => {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `
        <div class="char-img-wrapper">
          <img src="${assetPath}" alt="Sobrevivente ${index + 1}" />
        </div>
        <div class="char-name">Recruta #${index + 1}</div>
        <div class="char-tier">Tier 1: Inicial</div>
      `;
      card.onclick = () => {
        this.select(assetPath);
      };
      this.grid.appendChild(card);
    });
  }

  select(skinUrl) {
    this.container.classList.add('hidden');
    this.onSelect(skinUrl);
  }
}
