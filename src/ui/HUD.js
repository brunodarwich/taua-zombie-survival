import { CONFIG } from '../config.js';

export class HUD {
  constructor() {
    this.hpBar = document.getElementById('hp-fill');
    this.hpText = document.getElementById('hp-text');
    this.tierBadge = document.getElementById('tier-badge');
    this.scoreText = document.getElementById('score-val');
    this.rescueText = document.getElementById('rescue-val');
    this.waveText = document.getElementById('wave-val');
    this.avatarImg = document.getElementById('hud-avatar');
    this.banner = document.getElementById('evolution-banner');
    this.lastTier = 1;
  }

  update(player, wave) {
    // Atualizar vida
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    this.hpBar.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

    // Atualizar Tier
    const tierInfo = CONFIG.TIER_PROPERTIES[player.tier];
    this.tierBadge.textContent = tierInfo.name;
    this.tierBadge.className = `tier-tag tier-${player.tier}`;

    // Atualizar Avatar do HUD
    if (this.avatarImg.src !== player.currentSkinUrl) {
      this.avatarImg.src = player.currentSkinUrl;
    }

    // Alerta de evolução quando sobe de Tier
    if (player.tier > this.lastTier) {
      this.showEvolutionAlert(tierInfo.name);
      this.lastTier = player.tier;
    }

    // Pontos e Resgates
    this.scoreText.textContent = player.score;
    this.rescueText.textContent = player.rescuedCount;
    this.waveText.textContent = wave;
  }

  showEvolutionAlert(tierName) {
    this.banner.textContent = `⚡ EVOLUÇÃO ATIVADA: ${tierName}! ⚡`;
    this.banner.classList.remove('hidden');
    this.banner.classList.add('animate-pop');

    setTimeout(() => {
      this.banner.classList.remove('animate-pop');
      this.banner.classList.add('hidden');
    }, 2800);
  }
}
