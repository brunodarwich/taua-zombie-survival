export const PLAYABLE_CHARACTERS = [
  {
    id: 'rosa',
    name: 'Cherry',
    colorName: 'Rosa',
    accentColor: '#ff4081',
    archetype: 'Dano em Área / Explosivo',
    archetypeIcon: '💥',
    description: 'Ágil e destemida com estilo explosivo. Lança munições incendiárias, foguetes e ogivas cluster.',
    tiers: {
      1: 'assets/sem equipamento (16).webp',
      2: 'assets/player (13).webp',
      3: 'assets/player top (9).webp'
    },
    tierConfig: {
      1: {
        weaponName: 'Pistola Incendiária',
        projectileType: 'explosive',
        fireRate: 0.28,
        bulletSpeed: 36,
        bulletDamage: 45,
        bulletSpread: 1,
        spreadAngle: 0,
        splashRadius: 2.2,
        splashDamageRatio: 0.65,
        bulletColor: 0xff4081,
        glowColor: 0xff1744,
        trailType: 'fire',
        name: 'Sem Equipamento'
      },
      2: {
        weaponName: 'Lança-Foguetes Tático',
        projectileType: 'explosive',
        fireRate: 0.20,
        bulletSpeed: 42,
        bulletDamage: 85,
        bulletSpread: 1,
        spreadAngle: 0,
        splashRadius: 3.6,
        splashDamageRatio: 0.75,
        bulletColor: 0xff2a6d,
        glowColor: 0xff5500,
        trailType: 'rocket',
        name: 'Soldado Equipado'
      },
      3: {
        weaponName: 'Canhão Cluster Supremo',
        projectileType: 'cluster',
        fireRate: 0.16,
        bulletSpeed: 46,
        bulletDamage: 140,
        bulletSpread: 1,
        spreadAngle: 0,
        splashRadius: 4.8,
        splashDamageRatio: 0.85,
        clusterCount: 4,
        clusterDamage: 45,
        clusterRadius: 2.2,
        bulletColor: 0xff0055,
        glowColor: 0xff8800,
        trailType: 'cluster_core',
        name: 'PLAYER TOP (SUPREMO)'
      }
    }
  },
  {
    id: 'azul',
    name: 'Cobalto',
    colorName: 'Azul',
    accentColor: '#00d0ff',
    archetype: 'Alta Cadência / Perfurante',
    archetypeIcon: '⚡',
    description: 'Focado e veloz em operações táticas. Dispara dardos e lasers de alta frequência que perfuram inimigos.',
    tiers: {
      1: 'assets/sem equipamento (4).webp',
      2: 'assets/player (2).webp',
      3: 'assets/player top (1).webp'
    },
    tierConfig: {
      1: {
        weaponName: 'Agulhas Táticas',
        projectileType: 'piercing',
        pierceCount: 1,
        fireRate: 0.16,
        bulletSpeed: 52,
        bulletDamage: 30,
        bulletSpread: 1,
        spreadAngle: 0,
        bulletColor: 0x00d0ff,
        glowColor: 0x0077ff,
        trailType: 'needle',
        name: 'Sem Equipamento'
      },
      2: {
        weaponName: 'Fuzil de Plasma Penetrante',
        projectileType: 'piercing',
        pierceCount: 2,
        fireRate: 0.11,
        bulletSpeed: 58,
        bulletDamage: 55,
        bulletSpread: 1,
        spreadAngle: 0,
        bulletColor: 0x00ffff,
        glowColor: 0x0044ff,
        trailType: 'laser',
        name: 'Soldado Equipado'
      },
      3: {
        weaponName: 'Dual Railgun Tático',
        projectileType: 'piercing',
        pierceCount: 4,
        fireRate: 0.075,
        bulletSpeed: 68,
        bulletDamage: 85,
        bulletSpread: 2,
        spreadAngle: 0.08,
        bulletColor: 0x88ffff,
        glowColor: 0x00aaff,
        trailType: 'railgun',
        name: 'PLAYER TOP (SUPREMO)'
      }
    }
  },
  {
    id: 'preto',
    name: 'Sombra',
    colorName: 'Preto',
    accentColor: '#94a3b8',
    archetype: 'Combate Pesado / Repulsão',
    archetypeIcon: '🛡️',
    description: 'Especialista furtivo em combate pesado. Disparos maciços com grande dispersão e forte empurrão (knockback).',
    tiers: {
      1: 'assets/sem equipamento (8).webp',
      2: 'assets/player (12).webp',
      3: 'assets/player top (10).webp'
    },
    tierConfig: {
      1: {
        weaponName: 'Canhão Pesado Compacto',
        projectileType: 'heavy_slug',
        fireRate: 0.32,
        bulletSpeed: 34,
        bulletDamage: 75,
        knockback: 3.5,
        bulletSpread: 1,
        spreadAngle: 0,
        bulletColor: 0xa855f7,
        glowColor: 0x3b0764,
        trailType: 'heavy',
        name: 'Sem Equipamento'
      },
      2: {
        weaponName: 'Escopeta Tática Sombria',
        projectileType: 'shotgun',
        fireRate: 0.26,
        bulletSpeed: 40,
        bulletDamage: 38,
        knockback: 2.8,
        bulletSpread: 4,
        spreadAngle: 0.28,
        bulletColor: 0xc084fc,
        glowColor: 0x581c87,
        trailType: 'shrapnel',
        name: 'Soldado Equipado'
      },
      3: {
        weaponName: 'Devastador do Vácuo',
        projectileType: 'void_shotgun',
        fireRate: 0.22,
        bulletSpeed: 45,
        bulletDamage: 55,
        knockback: 4.8,
        bulletSpread: 6,
        spreadAngle: 0.40,
        bulletColor: 0xe9d5ff,
        glowColor: 0x2e1065,
        trailType: 'void',
        name: 'PLAYER TOP (SUPREMO)'
      }
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
