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
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  owner: string;
}

export interface MapBlock {
  x: number;
  y: number;
  health: number;
}

export interface GameState {
  players: {
    [id: string]: Player;
  };
  projectiles: Projectile[];
  map: {
    blocks: MapBlock[];
  };
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