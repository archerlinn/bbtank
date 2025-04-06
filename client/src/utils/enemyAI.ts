import { Player, Projectile, TANK_TYPES } from '../shared/types';

export interface Enemy extends Player {
  target?: Player;
  lastShot: number;
  directionChangeTime: number;
  currentDirection: number;
}

export class EnemyManager {
  private enemies: Enemy[] = [];
  private difficulty: 'easy' | 'medium' | 'hard';
  private enemyCount: number;
  private readonly ENEMY_SPEED = 1; // Slower constant speed for all enemies

  // Map boundaries constants
  private readonly MIN_X = 50;
  private readonly MAX_X = 750;
  private readonly MIN_Y = 50;
  private readonly MAX_Y = 550;
  
  constructor(difficulty: 'easy' | 'medium' | 'hard') {
    this.difficulty = difficulty;
    this.enemyCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10;
  }

  // Returns a random number between min (inclusive) and max (exclusive)
  private getRandomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // Calculates the Euclidean distance between two points
  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // Clamps a value between a minimum and a maximum
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  // Finds a valid spawn position away from the player and existing enemies
  private findValidSpawnPosition(
    mapWidth: number,
    mapHeight: number,
    player: Player,
    existingEnemies: Enemy[]
  ): { x: number; y: number } | null {
    const maxAttempts = 50;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Spawn enemies in the top half of the map
      const x = this.getRandomInRange(this.MIN_X, mapWidth - this.MIN_X);
      const y = this.getRandomInRange(this.MIN_Y, (mapHeight / 2) - this.MIN_Y);
      
      const distanceFromPlayer = this.getDistance(x, y, player.x, player.y);
      const tooCloseToOtherEnemy = existingEnemies.some(
        enemy => this.getDistance(x, y, enemy.x, enemy.y) < 100
      );
      
      if (distanceFromPlayer > 200 && !tooCloseToOtherEnemy) {
        return { x, y };
      }
    }
    return null;
  }

  public spawnEnemies(mapWidth: number, mapHeight: number, player: Player): Enemy[] {
    const enemies: Enemy[] = [];
    const tankTypes = Object.keys(TANK_TYPES);
    
    for (let i = 0; i < this.enemyCount; i++) {
      // Choose random tank type
      const tankType = tankTypes[Math.floor(Math.random() * tankTypes.length)];
      const tank = TANK_TYPES[tankType];
      
      // Find valid spawn position (away from player and other enemies)
      let x: number = 0;
      let y: number = 0;
      let validPosition = false;
      let attempts = 0;
      
      while (!validPosition && attempts < 50) {
        // Spawn enemies in the top half of the map
        x = Math.random() * (mapWidth - 100) + 50;
        y = Math.random() * (mapHeight/2 - 100) + 50;
        
        // Check distance from player
        const distanceFromPlayer = Math.sqrt(
          Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
        );
        
        // Check distance from other enemies
        const tooCloseToOtherEnemy = enemies.some(enemy => 
          Math.sqrt(Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)) < 100
        );
        
        if (distanceFromPlayer > 200 && !tooCloseToOtherEnemy) {
          validPosition = true;
        }
        
        attempts++;
      }
      
      if (validPosition) {
        enemies.push({
          id: `enemy_${i}`,
          x,
          y,
          angle: Math.random() * Math.PI * 2,
          health: 100, // Fixed health for all enemies
          tankType,
          target: player,
          lastShot: 0,
          directionChangeTime: Date.now() + Math.random() * 2000, // Random time for next direction change
          currentDirection: Math.random() * Math.PI * 2 // Random initial direction
        });
      }
    }
    
    this.enemies = enemies;
    return enemies;
  }

  public updateEnemies(player: Player, deltaTime: number): { enemies: Enemy[], projectiles: Projectile[] } {
    const projectiles: Projectile[] = [];
    
    // Filter out dead enemies and update remaining ones
    this.enemies = this.enemies.filter(enemy => enemy.health > 0);
    
    this.enemies.forEach(enemy => {
      // Random movement
      if (Date.now() > enemy.directionChangeTime) {
        // Change direction randomly
        enemy.currentDirection = Math.random() * Math.PI * 2;
        enemy.directionChangeTime = Date.now() + Math.random() * 2000 + 1000; // Change direction every 1-3 seconds
      }

      // Update angle to match movement direction
      enemy.angle = enemy.currentDirection;

      // Move in current direction with constant speed
      enemy.x += Math.cos(enemy.currentDirection) * this.ENEMY_SPEED;
      enemy.y += Math.sin(enemy.currentDirection) * this.ENEMY_SPEED;

      // Keep enemies within map bounds
      if (enemy.x < 50) enemy.x = 50;
      if (enemy.x > 750) enemy.x = 750;
      if (enemy.y < 50) enemy.y = 50;
      if (enemy.y > 550) enemy.y = 550;

      // Shooting logic - only shoot if player is in range
      const distanceToPlayer = Math.sqrt(
        Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
      );

      const enemyTank = TANK_TYPES[enemy.tankType];
      if (distanceToPlayer < 300 && Date.now() - enemy.lastShot > enemyTank.reloadTime * 1000) {
        // Calculate angle to player for shooting
        const angleToPlayer = Math.atan2(
          player.y - enemy.y,
          player.x - enemy.x
        );
        
        projectiles.push({
          id: `enemy_projectile_${Date.now()}`,
          x: enemy.x,
          y: enemy.y,
          angle: angleToPlayer,
          speed: enemyTank.weapon.speed,
          owner: enemy.id
        });
        enemy.lastShot = Date.now();
      }
    });

    return { enemies: this.enemies, projectiles };
  }
}
