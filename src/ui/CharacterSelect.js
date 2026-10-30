import { PLAYABLE_CHARACTERS } from '../config.js';

export class CharacterSelect {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.container = document.getElementById('char-select-screen');
    this.grid = document.getElementById('char-grid');
    this.render();
  }

  render() {
    this.grid.innerHTML = '';
    PLAYABLE_CHARACTERS.forEach(char => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `char-card char-card-${char.id}`;
      card.style.setProperty('--char-accent', char.accentColor);
      card.innerHTML = `
        <div class="char-badge-color">${char.colorName}</div>
        <div class="char-img-wrapper">
          <img src="${char.tiers[1]}" alt="${char.name} (${char.colorName})" />
        </div>
        <div class="char-name">${char.name}</div>
        <div class="char-archetype">${char.archetypeIcon || '⚔️'} ${char.archetype || ''}</div>
        <div class="char-desc">${char.description}</div>
        <div class="char-evolution-preview">
          <span class="evo-label">Linha de Evolução:</span>
          <div class="evo-steps">
            <div class="evo-step" title="Tier 1: ${char.tierConfig?.[1]?.weaponName || 'Inicial'}">
              <img src="${char.tiers[1]}" alt="T1" />
              <span>T1</span>
              <small class="evo-weapon-title">${char.tierConfig?.[1]?.weaponName || ''}</small>
            </div>
            <span class="evo-arrow">→</span>
            <div class="evo-step" title="Tier 2: ${char.tierConfig?.[2]?.weaponName || 'Soldado Equipado'}">
              <img src="${char.tiers[2]}" alt="T2" />
              <span>T2</span>
              <small class="evo-weapon-title">${char.tierConfig?.[2]?.weaponName || ''}</small>
            </div>
            <span class="evo-arrow">→</span>
            <div class="evo-step" title="Tier 3: ${char.tierConfig?.[3]?.weaponName || 'Supremo'}">
              <img src="${char.tiers[3]}" alt="T3" />
              <span>T3</span>
              <small class="evo-weapon-title">${char.tierConfig?.[3]?.weaponName || ''}</small>
            </div>
          </div>
        </div>
        <div class="char-select-cta">SELECIONAR</div>
      `;
      card.onclick = () => {
        this.select(char);
      };
      this.grid.appendChild(card);
    });
  }

  select(character) {
    this.container.classList.add('hidden');
    this.onSelect(character);
  }
}
