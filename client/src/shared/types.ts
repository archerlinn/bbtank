export interface Tank {
  type: string;
  health: number;
  speed: number;
  reloadTime: number;
  weapon: {
    type: string;
    damage: number;
    speed: number;
    range: number;
  };
}

export interface Player {
  id: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  tankType: string;
  speed?: number;
  effects?: {
    [key: string]: {
      type: string;
      value: number;
      expiresAt: number;
    }
  };
  lastHitTime?: number;
  invincible?: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  owner: string;
  damage?: number;
  explosive?: boolean;
  explosionRadius?: number;
  createdAt?: number;
}

export interface MapBlock {
  x: number;
  y: number;
  type: string;
  health: number;
  destructible?: boolean;
  appearance?: {
    color?: string;
    texture?: string;
  };
}

export interface GameMap {
  id: string;
  width: number;
  height: number;
  blocks: MapBlock[];
  theme?: string;
  background?: string;
  spawnPoints?: Array<{x: number, y: number}>;
}

export interface GameState {
  players: {
    [id: string]: Player;
  };
  projectiles: Projectile[];
  map: GameMap;
  scores: { [id: string]: number };
  status: 'lobby' | 'playing' | 'gameover';
  gameTime?: number;
  powerups?: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    active: boolean;
  }>;
  gameMode?: 'pvp' | 'chapter';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  waveNumber?: number;
}

export interface PlayerStats {
  username: string;
  level: number;
  xp: number;
  totalKills: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  favoriteClass: string;
  highScore: number;
  achievements: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: string;
  icon: string;
}

export interface ChapterProgress {
  id: number;
  completed: boolean;
  highScore: number;
  starsEarned: number;
  bestTime?: number; // in seconds
  objectivesCompleted?: string[];
}

export interface UserProfile {
  userId: string;
  username: string;
  stats: PlayerStats;
  chapters: ChapterProgress[];
  inventory: {
    tanks: string[];
    skins: string[];
    powerups: string[];
  };
  settings: {
    sfxVolume: number;
    musicVolume: number;
    controls: {
      moveUp: string;
      moveDown: string;
      moveLeft: string;
      moveRight: string;
      shoot: string;
      ability: string;
    };
  };
}

export interface NetworkEvent {
  type: string;
  data: any;
  timestamp: number;
  senderId: string;
}

export interface PlayerInput {
  direction: { x: number, y: number };
  angle: number;
  shooting: boolean;
  ability?: boolean;
  timestamp: number;
}

export interface GameOptions {
  mapSize: { width: number, height: number };
  gameMode: 'pvp' | 'chapter';
  timeLimit?: number;
  maxPlayers?: number;
  friendlyFire?: boolean;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  powerupsEnabled?: boolean;
  chapterId?: number;
}

export interface TankAbility {
  name: string;
  description: string;
  cooldown: number;
  duration: number;
  effect: any;
}

export interface TankType {
  name: string;
  description: string;
  health: number;
  speed: number;
  turnSpeed: number;
  width: number;
  height: number;
  barrelLength: number;
  weapon: {
    damage: number;
    speed: number;
    range: number;
    spread: number;
    projectileSize: number;
    explosive?: boolean;
    explosionRadius?: number;
  };
  reloadTime: number;
  specialAbility: TankAbility;
  color: string;
  barrelColor: string;
}

export const TANK_TYPES: { [key: string]: Tank } = {
  SNIPER: {
    type: 'SNIPER',
    health: 80,
    speed: 3,
    reloadTime: 2,
    weapon: {
      type: 'SNIPER',
      damage: 40,
      speed: 10,
      range: 500
    }
  },
  BLASTER: {
    type: 'BLASTER',
    health: 100,
    speed: 4,
    reloadTime: 1,
    weapon: {
      type: 'BLASTER',
      damage: 20,
      speed: 8,
      range: 300
    }
  },
  JUMPER: {
    type: 'JUMPER',
    health: 70,
    speed: 6,
    reloadTime: 1.5,
    weapon: {
      type: 'JUMPER',
      damage: 15,
      speed: 6,
      range: 200
    }
  },
  HEAVY: {
    type: 'HEAVY',
    health: 150,
    speed: 2,
    reloadTime: 2.5,
    weapon: {
      type: 'HEAVY',
      damage: 30,
      speed: 5,
      range: 250
    }
  }
}; 