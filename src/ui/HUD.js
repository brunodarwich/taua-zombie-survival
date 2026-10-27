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
    this.escortText = document.getElementById('escort-val');
    this.refugeText = document.getElementById('refuge-distance');
    this.refugeArrow = document.getElementById('refuge-arrow');

    // Cache de valores anteriores para evitar reflows de DOM desnecessários
    this._lastHp = -1;
    this._lastMaxHp = -1;
    this._lastScore = -1;
    this._lastRescued = -1;
    this._lastWave = -1;
  }

  update(player, wave, survivors, reception, navigation) {
    this.escortText.textContent = survivors.filter(s => s.state === 'following' && !s.dead).length;
    const dx = reception.x - player.position.x, dz = reception.z - player.position.z;
    this.refugeText.textContent = navigation.inSafeZone(player.position) ? 'Você está no abrigo' : `Abrigo · ${Math.round(Math.hypot(dx, dz))} m`;
    this.refugeArrow.style.transform = `rotate(${Math.atan2(dx, -dz)}rad)`;
    // Atualizar vida somente quando mudar
    const roundedHp = Math.ceil(player.hp);
    if (roundedHp !== this._lastHp || player.maxHp !== this._lastMaxHp) {
      this._lastHp = roundedHp;
      this._lastMaxHp = player.maxHp;
      const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
      this.hpBar.style.width = `${hpPct}%`;
      this.hpText.textContent = `${roundedHp} / ${player.maxHp}`;
    }

    // Atualizar Tier
    const tierInfo = CONFIG.TIER_PROPERTIES[player.tier];
    if (player.tier !== this.lastTier) {
      this.tierBadge.textContent = tierInfo.name;
      this.tierBadge.className = `tier-tag tier-${player.tier}`;
      this.showEvolutionAlert(tierInfo.name);
      this.lastTier = player.tier;
    }

    // Atualizar Avatar do HUD
    if (this.avatarImg.getAttribute('src') !== player.currentSkinUrl) {
      this.avatarImg.src = player.currentSkinUrl;
    }

    // Pontos, Resgates e Wave somente quando alterados
    if (player.score !== this._lastScore) {
      this._lastScore = player.score;
      this.scoreText.textContent = player.score;
    }
    if (player.rescuedCount !== this._lastRescued) {
      this._lastRescued = player.rescuedCount;
      this.rescueText.textContent = player.rescuedCount;
    }
    if (wave !== this._lastWave) {
      this._lastWave = wave;
      this.waveText.textContent = wave;
    }
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
