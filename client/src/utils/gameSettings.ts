// Game Settings
export const GAME_SETTINGS = {
  // Canvas settings
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
    BACKGROUND_COLOR: '#222222',
  },
  
  // Player settings
  PLAYER: {
    DEFAULT_HEALTH: 100,
    SPAWN_POSITION: { x: 50, y: 550 },
    INVINCIBILITY_TIME: 2000, // ms of invincibility after spawn
    RESPAWN_TIME: 3000,       // ms before respawn
    HEALTH_REGEN: 0.05,       // health per frame when not in combat
    OUT_OF_COMBAT_TIME: 5000, // ms until player is considered out of combat
  },
  
  // Enemy settings
  ENEMY: {
    BASE_HEALTH: 100,
    MIN_SPAWN_DISTANCE: 200,
    BOSS_HEALTH_MULTIPLIER: 3,
    DIFFICULTY_SETTINGS: {
      EASY: {
        COUNT: 5,
        SPEED_MODIFIER: 0.7,
        DAMAGE_MODIFIER: 0.8,
        SPAWN_RATE: 5000, // ms between spawns
        BOSS_CHANCE: 0.1,
      },
      MEDIUM: {
        COUNT: 8,
        SPEED_MODIFIER: 0.9,
        DAMAGE_MODIFIER: 1.0,
        SPAWN_RATE: 4000,
        BOSS_CHANCE: 0.15,
      },
      HARD: {
        COUNT: 12,
        SPEED_MODIFIER: 1.1,
        DAMAGE_MODIFIER: 1.2,
        SPAWN_RATE: 3000,
        BOSS_CHANCE: 0.2,
      },
    },
    BEHAVIOR: {
      PATROL_RADIUS: 150,
      CHASE_DISTANCE: 300,
      RETREAT_HEALTH_THRESHOLD: 30,
      SHOOTING_RANGE: 250,
      DIRECTION_CHANGE_TIME: { MIN: 1000, MAX: 3000 },
    },
  },
  
  // Game mechanics
  MECHANICS: {
    PROJECTILE_LIFETIME: 3000, // ms until projectile despawns
    COLLISION_DAMAGE: 10,      // damage when tanks collide
    FRIENDLY_FIRE: false,      // whether players can damage each other
    SCORE_PER_KILL: 100,
    SCORE_MULTIPLIER_PER_LEVEL: 1.5,
  },
  
  // Powerups
  POWERUPS: {
    TYPES: {
      HEALTH: { VALUE: 30, DURATION: 0, COLOR: '#00FF00' },
      SPEED: { VALUE: 1.5, DURATION: 5000, COLOR: '#0088FF' },
      DAMAGE: { VALUE: 1.5, DURATION: 7000, COLOR: '#FF0000' },
      SHIELD: { VALUE: 1, DURATION: 4000, COLOR: '#FFFF00' },
      RAPID_FIRE: { VALUE: 0.5, DURATION: 6000, COLOR: '#FF00FF' },
    },
    SPAWN_RATE: 10000, // ms between powerup spawns
    MAX_ACTIVE: 3,     // maximum powerups active at once
    DURATION: 10000,   // ms of powerup duration
  },
  
  // Map settings
  MAP: {
    TILE_SIZE: 50,
    OBSTACLE_DENSITY: 0.1, // percentage of map filled with obstacles
    DESTRUCTIBLE_CHANCE: 0.7, // chance of obstacle being destructible
    OBSTACLE_HEALTH: { MIN: 50, MAX: 150 },
  },

  // Flag capture
  FLAG: {
    POSITION: { x: 700, y: 50 },
    CAPTURE_DISTANCE: 30,
    POINTS: 500,
  },
  
  // UI settings
  UI: {
    COLORS: {
      PRIMARY: '#4CAF50',
      SECONDARY: '#2196F3',
      ACCENT: '#FF9800',
      WARNING: '#F44336',
      BACKGROUND: '#121212',
      TEXT: '#FFFFFF',
      TEXT_SECONDARY: '#AAAAAA',
    },
    HEALTH_BAR: {
      WIDTH: 30,
      HEIGHT: 3,
      OFFSET_Y: 30,
      BOSS_WIDTH: 60,
    },
    SCORE_ANIMATION_DURATION: 1000,
  },
  
  // Audio settings
  AUDIO: {
    MASTER_VOLUME: 0.7,
    MUSIC_VOLUME: 0.5,
    SFX_VOLUME: 0.8,
    MUSIC_FADE_TIME: 1000,
  },
};

// Tank types with improved balancing
export const ENHANCED_TANK_TYPES = {
  SNIPER: {
    name: "Sniper",
    description: "Long range, high damage, but fragile and slow to reload.",
    health: 80,
    speed: 2.5,
    turnSpeed: 0.1,
    width: 38,
    height: 38,
    barrelLength: 35,
    weapon: {
      damage: 35,
      speed: 12,
      range: 500,
      spread: 0.03,
      projectileSize: 4,
    },
    reloadTime: 1.8,
    specialAbility: {
      name: "Scope Shot",
      description: "Increased damage and range when stationary for 1 second",
      cooldown: 8000,
      duration: 3000,
      effect: {
        damageMultiplier: 1.8,
        rangeMultiplier: 1.5,
      }
    },
    color: "#D32F2F",
    barrelColor: "#B71C1C",
  },
  
  ASSAULT: {
    name: "Assault",
    description: "Well-balanced tank with decent firepower and mobility.",
    health: 100,
    speed: 3,
    turnSpeed: 0.12,
    width: 40,
    height: 40,
    barrelLength: 30,
    weapon: {
      damage: 20,
      speed: 10,
      range: 350,
      spread: 0.05,
      projectileSize: 5,
    },
    reloadTime: 1.2,
    specialAbility: {
      name: "Rapid Fire",
      description: "Greatly increased fire rate for a short time",
      cooldown: 10000,
      duration: 3000,
      effect: {
        reloadMultiplier: 0.4,
      }
    },
    color: "#388E3C",
    barrelColor: "#1B5E20",
  },
  
  HEAVY: {
    name: "Heavy",
    description: "Slow but extremely durable with devastating firepower.",
    health: 150,
    speed: 2,
    turnSpeed: 0.08,
    width: 45,
    height: 45,
    barrelLength: 28,
    weapon: {
      damage: 30,
      speed: 8,
      range: 300,
      spread: 0.08,
      projectileSize: 6,
    },
    reloadTime: 1.5,
    specialAbility: {
      name: "Shockwave",
      description: "Damages and pushes back nearby enemies",
      cooldown: 12000,
      duration: 1000,
      effect: {
        radius: 150,
        damage: 15,
        knockback: 100,
      }
    },
    color: "#1565C0",
    barrelColor: "#0D47A1",
  },
  
  SCOUT: {
    name: "Scout",
    description: "Extremely fast and agile, but with lighter firepower.",
    health: 70,
    speed: 4,
    turnSpeed: 0.15,
    width: 36,
    height: 36,
    barrelLength: 25,
    weapon: {
      damage: 15,
      speed: 11,
      range: 250,
      spread: 0.06,
      projectileSize: 4,
    },
    reloadTime: 0.8,
    specialAbility: {
      name: "Afterburner",
      description: "Temporary speed boost and invulnerability",
      cooldown: 8000,
      duration: 2000,
      effect: {
        speedMultiplier: 1.8,
        invincible: true,
      }
    },
    color: "#FFA000",
    barrelColor: "#FF6F00",
  },
  
  DEMOLISHER: {
    name: "Demolisher",
    description: "Specializes in explosive rounds that deal area damage.",
    health: 110,
    speed: 2.3,
    turnSpeed: 0.09,
    width: 42,
    height: 42,
    barrelLength: 32,
    weapon: {
      damage: 25,
      speed: 9,
      range: 320,
      spread: 0.07,
      projectileSize: 5,
      explosive: true,
      explosionRadius: 80,
    },
    reloadTime: 1.7,
    specialAbility: {
      name: "Cluster Bomb",
      description: "Fires multiple explosive projectiles in a spread",
      cooldown: 15000,
      duration: 1000,
      effect: {
        projectileCount: 5,
        spreadAngle: 0.6,
      }
    },
    color: "#7B1FA2",
    barrelColor: "#4A148C",
  },
};

// Chapter definitions
export const GAME_CHAPTERS = [
  {
    id: 1,
    name: "Training Grounds",
    description: "Learn the basics of tank combat against a small number of training dummies.",
    difficulty: "EASY",
    enemyTypes: ["ASSAULT"],
    mapTheme: "GRASS",
    objectives: [
      { type: "REACH_FLAG", description: "Reach the flag at the top right corner" },
      { type: "OPTIONAL", description: "Destroy at least 3 enemy tanks", reward: "Extra health in Chapter 2" }
    ],
    unlockRequirement: null,
    completed: false,
    highScore: 0,
    bestTime: null,
  },
  {
    id: 2,
    name: "Urban Warfare",
    description: "Navigate through a city landscape with more enemies and obstacles.",
    difficulty: "MEDIUM",
    enemyTypes: ["ASSAULT", "SNIPER", "SCOUT"],
    mapTheme: "URBAN",
    objectives: [
      { type: "REACH_FLAG", description: "Reach the flag at the top right corner" },
      { type: "DESTROY_ALL", description: "Destroy all enemy tanks" },
      { type: "OPTIONAL", description: "Complete with at least 50% health", reward: "Unlock special tank skin" }
    ],
    unlockRequirement: { chapterId: 1, completed: true },
    completed: false,
    highScore: 0,
    bestTime: null,
  },
  {
    id: 3,
    name: "Desert Storm",
    description: "Face tough enemies in an open desert with limited cover.",
    difficulty: "HARD",
    enemyTypes: ["ASSAULT", "HEAVY", "SNIPER", "DEMOLISHER"],
    mapTheme: "DESERT",
    objectives: [
      { type: "REACH_FLAG", description: "Reach the flag at the top right corner" },
      { type: "SURVIVE", description: "Survive for at least 2 minutes" },
      { type: "OPTIONAL", description: "Destroy the boss tank", reward: "Unlock DEMOLISHER tank" }
    ],
    unlockRequirement: { chapterId: 2, completed: true },
    completed: false,
    highScore: 0,
    bestTime: null,
  },
];

// Player progression system
export const PROGRESSION = {
  XP_PER_KILL: 10,
  XP_PER_CHAPTER_COMPLETION: 50,
  XP_MULTIPLIER_PER_DIFFICULTY: {
    EASY: 1,
    MEDIUM: 1.5,
    HARD: 2.5,
  },
  LEVELS: [
    { level: 1, xpRequired: 0, reward: "Unlock ASSAULT tank" },
    { level: 2, xpRequired: 100, reward: "Unlock basic skins" },
    { level: 3, xpRequired: 250, reward: "Unlock HEAVY tank" },
    { level: 4, xpRequired: 500, reward: "+10% HP on all tanks" },
    { level: 5, xpRequired: 800, reward: "Unlock SCOUT tank" },
    { level: 6, xpRequired: 1200, reward: "Increase maximum powerups to 2" },
    { level: 7, xpRequired: 1700, reward: "Unlock SNIPER tank" },
    { level: 8, xpRequired: 2300, reward: "+10% damage on all tanks" },
    { level: 9, xpRequired: 3000, reward: "Unlock special abilities" },
    { level: 10, xpRequired: 4000, reward: "Unlock DEMOLISHER tank" },
  ],
}; 