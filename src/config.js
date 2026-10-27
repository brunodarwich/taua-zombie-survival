export const ASSETS = {
  // Tier 1: Sem equipamento (1 a 20)
  unarmed: Array.from({ length: 20 }, (_, i) => `assets/sem equipamento (${i + 1}).png`),

  // Tier 2: Player com equipamento básico (arquivos existentes)
  player: [
    'assets/player (2).png',
    'assets/player (10).png',
    'assets/player (11).png',
    'assets/player (12).png',
    'assets/player (13).png'
  ],

  // Tier 3: Player Top (1 a 10)
  playerTop: Array.from({ length: 10 }, (_, i) => `assets/player top (${i + 1}).png`),

  // Sobreviventes resgatados com capacete (1 a 10)
  helmet: Array.from({ length: 10 }, (_, i) => `assets/capacete (${i + 1}).png`),

  // Drops de equipamento coletáveis no chão
  pickups: [
    'assets/equipamento (1).png',
    'assets/equipamento (2).png'
  ],

  // Inimigo
  zombie: 'assets/zombie.png'
};

export const CONFIG = {
  WORLD_SIZE: 90,
  PLAYER_SPEED: 14,
  TIER_PROPERTIES: {
    1: {
      scale: 2.2,
      fireRate: 0.28,
      bulletSpeed: 32,
      bulletDamage: 35,
      bulletSpread: 1,
      bulletColor: 0xffe600,
      name: 'Sem Equipamento'
    },
    2: {
      scale: 2.8,
      fireRate: 0.16,
      bulletSpeed: 38,
      bulletDamage: 60,
      bulletSpread: 2,
      bulletColor: 0x00f0ff,
      name: 'Soldado Equipado'
    },
    3: {
      scale: 3.5,
      fireRate: 0.10,
      bulletSpeed: 45,
      bulletDamage: 110,
      bulletSpread: 3,
      bulletColor: 0xff0055,
      name: 'PLAYER TOP (SUPREMO)'
    }
  }
};
