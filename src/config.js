export const PLAYABLE_CHARACTERS = [
  {
    id: 'rosa',
    name: 'Cherry',
    colorName: 'Rosa',
    accentColor: '#ff4081',
    description: 'Ágil e destemida com estilo explosivo.',
    tiers: {
      1: 'assets/sem equipamento (16).webp',
      2: 'assets/player (13).webp',
      3: 'assets/player top (9).webp'
    }
  },
  {
    id: 'azul',
    name: 'Cobalto',
    colorName: 'Azul',
    accentColor: '#00d0ff',
    description: 'Focado e veloz em operações táticas.',
    tiers: {
      1: 'assets/sem equipamento (4).webp',
      2: 'assets/player (2).webp',
      3: 'assets/player top (1).webp'
    }
  },
  {
    id: 'preto',
    name: 'Sombra',
    colorName: 'Preto',
    accentColor: '#94a3b8',
    description: 'Especialista furtivo em combate pesado.',
    tiers: {
      1: 'assets/sem equipamento (8).webp',
      2: 'assets/player (12).webp',
      3: 'assets/player top (10).webp'
    }
  }
];

export const ASSETS = {
  // Tier 1: Sem equipamento (1 a 20)
  unarmed: Array.from({ length: 20 }, (_, i) => `assets/sem equipamento (${i + 1}).webp`),

  // Tier 2: Player com equipamento básico
  player: [
    'assets/player (2).webp',
    'assets/player (10).webp',
    'assets/player (11).webp',
    'assets/player (12).webp',
    'assets/player (13).webp'
  ],

  // Tier 3: Player Top (1 a 10)
  playerTop: Array.from({ length: 10 }, (_, i) => `assets/player top (${i + 1}).webp`),

  // Sobreviventes resgatados com capacete (1 a 10)
  helmet: Array.from({ length: 10 }, (_, i) => `assets/capacete (${i + 1}).webp`),

  // Drops de equipamento
  pickups: [
    'assets/equipamento (1).webp',
    'assets/equipamento (2).webp'
  ],

  // Inimigo
  zombie: 'assets/zombie.webp'
};

export const CONFIG = {
  WORLD_SIZE: 110,
  PLAYER_SPEED: 14,
  // Escalas maiores para personagens bem visíveis
  TIER_PROPERTIES: {
    1: {
      scale: 3.8,            // Aumentado consideravelmente
      fireRate: 0.25,
      bulletSpeed: 38,
      bulletDamage: 40,
      bulletSpread: 1,
      bulletColor: 0xffea00,
      glowColor: 0xffaa00,
      name: 'Sem Equipamento'
    },
    2: {
      scale: 4.6,            // Grande
      fireRate: 0.15,
      bulletSpeed: 44,
      bulletDamage: 75,
      bulletSpread: 2,
      bulletColor: 0x00f0ff,
      glowColor: 0x0088ff,
      name: 'Soldado Equipado'
    },
    3: {
      scale: 5.6,            // Gigante / Supremo
      fireRate: 0.09,
      bulletSpeed: 52,
      bulletDamage: 135,
      bulletSpread: 3,
      bulletColor: 0xff0055,
      glowColor: 0xff5500,
      name: 'PLAYER TOP (SUPREMO)'
    }
  }
};
