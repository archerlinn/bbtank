import { Player, Projectile } from '../shared/types';
import { ENHANCED_TANK_TYPES, GAME_SETTINGS } from './gameSettings';

// Define enemy behavior types as an enum
export enum EnemyBehavior {
  PATROL = 'patrol',
  CHASE = 'chase',
  ATTACK = 'attack',
  RETREAT = 'retreat',
  FLANK = 'flank',
  BOSS = 'boss'
}

export interface Enemy extends Player {
  target?: Player;
  lastShot: number;
  directionChangeTime: number;
  currentDirection: number;
  behavior: EnemyBehavior;
  flankPosition?: { x: number, y: number };
  nextWaypoint?: { x: number, y: number };
  lastHitTime: number;
  isBoss: boolean;
  variant: 'normal' | 'scout' | 'heavy' | 'sniper';
  targeting: {
    player: boolean;
    timeToRetarget: number;
  };
  shooting: {
    cooldown: number;
    rate: number;
  };
  patrolPoint: { x: number, y: number };
  speed: number;
  lastBehaviorChange: number;
  behaviorChangeInterval: number;
}

interface EnemyVariant {
  speedModifier: number;
  healthModifier: number;
  damageModifier: number;
  reloadModifier: number;
}

const ENEMY_VARIANTS: Record<Enemy['variant'], EnemyVariant> = {
  normal: { speedModifier: 1.0, healthModifier: 1.0, damageModifier: 1.0, reloadModifier: 1.0 },
  scout: { speedModifier: 1.5, healthModifier: 0.8, damageModifier: 0.8, reloadModifier: 0.7 },
  heavy: { speedModifier: 0.7, healthModifier: 1.5, damageModifier: 1.3, reloadModifier: 1.2 },
  sniper: { speedModifier: 0.8, healthModifier: 0.9, damageModifier: 1.5, reloadModifier: 1.5 },
};

export class EnemyManager {
  private enemies: Enemy[] = [];
  private difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  private mapWidth: number;
  private mapHeight: number;
  private targetPlayer?: Player;
  private difficultySettings = {
    EASY: { DAMAGE_MODIFIER: 0.8, SPEED_MODIFIER: 0.8 },
    MEDIUM: { DAMAGE_MODIFIER: 1.0, SPEED_MODIFIER: 1.0 },
    HARD: { DAMAGE_MODIFIER: 1.2, SPEED_MODIFIER: 1.2 }
  };
  private lastUpdateTime: number = 0;
  private updateInterval: number = 100; // Update every 100ms

  constructor(difficulty: 'EASY' | 'MEDIUM' | 'HARD', mapWidth: number, mapHeight: number) {
    this.difficulty = difficulty;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  spawnEnemies(player: Player): Enemy[] {
    const numEnemies = this.difficulty === 'EASY' ? 5 : this.difficulty === 'MEDIUM' ? 8 : 10;
    this.enemies = [];
    this.targetPlayer = player;

    for (let i = 0; i < numEnemies; i++) {
      let validPosition = false;
      let x = 0, y = 0;
      let attempts = 0;
      const maxAttempts = 50;

      while (!validPosition && attempts < maxAttempts) {
        // Spawn enemies in different quadrants of the map
        const quadrant = Math.floor(Math.random() * 4);
        switch (quadrant) {
          case 0: // Top-left
            x = Math.random() * (this.mapWidth / 2);
            y = Math.random() * (this.mapHeight / 2);
            break;
          case 1: // Top-right
            x = this.mapWidth / 2 + Math.random() * (this.mapWidth / 2);
            y = Math.random() * (this.mapHeight / 2);
            break;
          case 2: // Bottom-left
            x = Math.random() * (this.mapWidth / 2);
            y = this.mapHeight / 2 + Math.random() * (this.mapHeight / 2);
            break;
          case 3: // Bottom-right
            x = this.mapWidth / 2 + Math.random() * (this.mapWidth / 2);
            y = this.mapHeight / 2 + Math.random() * (this.mapHeight / 2);
            break;
        }

        // Check distance from player and other enemies
        const distanceFromPlayer = Math.sqrt(
          Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
        );

        let tooCloseToOtherEnemy = false;
        for (const enemy of this.enemies) {
          const distanceFromEnemy = Math.sqrt(
            Math.pow(x - enemy.x, 2) + Math.pow(y - enemy.y, 2)
          );
          if (distanceFromEnemy < 100) {
            tooCloseToOtherEnemy = true;
            break;
          }
        }

        if (distanceFromPlayer > 200 && !tooCloseToOtherEnemy) {
          validPosition = true;
        }

        attempts++;
      }

      if (validPosition) {
        const enemy: Enemy = {
          id: `enemy_${i}`,
          x,
          y,
          angle: Math.random() * Math.PI * 2,
          health: 100,
          tankType: 'ASSAULT',
          speed: this.difficulty === 'EASY' ? 1.5 : this.difficulty === 'MEDIUM' ? 2 : 2.5,
          target: undefined,
          lastShot: 0,
          behavior: EnemyBehavior.PATROL,
          patrolPoint: { x, y },
          lastBehaviorChange: 0,
          behaviorChangeInterval: 3000 + Math.random() * 2000,
          directionChangeTime: 0,
          currentDirection: 0,
          isBoss: false,
          variant: 'normal',
          targeting: { player: false, timeToRetarget: 0 },
          shooting: { cooldown: 0, rate: 0 },
          lastHitTime: 0
        };
        this.enemies.push(enemy);
      }
    }

    return this.enemies;
  }

  updateEnemies(player: Player, deltaTime: number): { enemies: Enemy[]; projectiles: Projectile[] } {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return { enemies: this.enemies, projectiles: [] };
    }
    this.lastUpdateTime = now;
    this.targetPlayer = player;

    const projectiles: Projectile[] = [];

    this.enemies.forEach(enemy => {
      if (enemy.health <= 0) return;

      const distanceToPlayer = Math.sqrt(
        Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
      );

      // Update behavior based on distance to player and time
      if (now - enemy.lastBehaviorChange > enemy.behaviorChangeInterval) {
        // Calculate probability of each behavior based on distance
        let newBehavior: EnemyBehavior;
        
        if (distanceToPlayer < 200) {
          // When very close to player
          const rand = Math.random();
          if (rand < 0.6) {
            newBehavior = EnemyBehavior.ATTACK; // 60% attack
          } else if (rand < 0.8) {
            newBehavior = EnemyBehavior.RETREAT; // 20% retreat
          } else {
            newBehavior = EnemyBehavior.FLANK; // 20% flank
          }
        } else if (distanceToPlayer < 400) {
          // Medium distance
          const rand = Math.random();
          if (rand < 0.5) {
            newBehavior = EnemyBehavior.CHASE; // 50% chase
          } else if (rand < 0.8) {
            newBehavior = EnemyBehavior.FLANK; // 30% flank
          } else {
            newBehavior = EnemyBehavior.ATTACK; // 20% attack from distance
          }
        } else {
          // Far away
          const rand = Math.random();
          if (rand < 0.7) {
            newBehavior = EnemyBehavior.CHASE; // 70% chase
          } else {
            newBehavior = EnemyBehavior.PATROL; // 30% patrol
          }
        }
        
        enemy.behavior = newBehavior;
        enemy.lastBehaviorChange = now;
        
        // Set up new flank position if needed
        if (enemy.behavior === EnemyBehavior.FLANK) {
          enemy.flankPosition = this.calculateFlankPosition(enemy, player);
        }
      }

      // Handle different behaviors
      switch (enemy.behavior) {
        case EnemyBehavior.PATROL:
          this.handlePatrolBehavior(enemy, deltaTime);
          break;

        case EnemyBehavior.CHASE:
          this.handleChaseBehavior(enemy, player, deltaTime);
          break;
          
        case EnemyBehavior.ATTACK:
          this.handleAttackBehavior(enemy, player, projectiles, now);
          break;
          
        case EnemyBehavior.RETREAT:
          this.handleRetreatBehavior(enemy, player, deltaTime);
          break;
          
        case EnemyBehavior.FLANK:
          this.handleFlankBehavior(enemy, player, deltaTime, projectiles, now);
          break;
      }
      
      // Ensure enemy stays within map boundaries
      this.enforceMapBoundary(enemy);
    });

    return { enemies: this.enemies, projectiles };
  }

  private calculateFlankPosition(enemy: Enemy, target: Player): { x: number, y: number } {
    // Calculate a position to flank the target
    const distanceToTarget = this.getDistance(enemy.x, enemy.y, target.x, target.y);
    const angleToTarget = this.getAngleTo(enemy, target);
    
    // Flank by moving perpendicular to the target
    const flankAngle = angleToTarget + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
    const flankDistance = 150 + Math.random() * 100;
    
    return {
      x: target.x + Math.cos(flankAngle) * flankDistance,
      y: target.y + Math.sin(flankAngle) * flankDistance
    };
  }
  
  private getRandomDirectionChangeTime(): number {
    const { MIN, MAX } = GAME_SETTINGS.ENEMY.BEHAVIOR.DIRECTION_CHANGE_TIME;
    return Date.now() + MIN + Math.random() * (MAX - MIN);
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  private getAngleTo(from: { x: number, y: number }, to: { x: number, y: number }): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }
  
  private getRandomPatrolPoint(): { x: number, y: number } {
    if (this.enemies.length === 0) {
      return { x: Math.random() * this.mapWidth, y: Math.random() * this.mapHeight };
    }
    
    return this.enemies[Math.floor(Math.random() * this.enemies.length)].patrolPoint;
  }
  
  private rotateTowardsAngle(enemy: Enemy, targetAngle: number, rotationSpeed: number): void {
    // Calculate shortest rotation direction
    let angleDiff = targetAngle - enemy.angle;
    
    // Normalize angle difference to be between -PI and PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // Apply rotation
    if (Math.abs(angleDiff) < rotationSpeed) {
      enemy.angle = targetAngle;
    } else {
      enemy.angle += Math.sign(angleDiff) * rotationSpeed;
    }
    
    // Normalize final angle
    while (enemy.angle > Math.PI * 2) enemy.angle -= Math.PI * 2;
    while (enemy.angle < 0) enemy.angle += Math.PI * 2;
  }
  
  private moveForward(enemy: Enemy, speed: number): void {
    enemy.x += Math.cos(enemy.angle) * speed;
    enemy.y += Math.sin(enemy.angle) * speed;
  }
  
  private attemptToShoot(enemy: Enemy, player: Player, now: number, projectiles: Projectile[], reloadMultiplier: number = 1): void {
    const tank = ENHANCED_TANK_TYPES[enemy.tankType as keyof typeof ENHANCED_TANK_TYPES];
    const variantModifier = ENEMY_VARIANTS[enemy.variant];
    
    // Apply difficulty and variant modifiers to reload time
    const baseReloadTime = tank.reloadTime * 1000;
    const modifiedReloadTime = baseReloadTime * variantModifier.reloadModifier * reloadMultiplier;
    
    if (now - enemy.lastShot > modifiedReloadTime) {
      // Calculate accuracy based on distance and movement
      const distanceToTarget = this.getDistance(enemy.x, enemy.y, player.x, player.y);
      const maxShotRange = tank.weapon.range || 400;
      
      // Only shoot if in range
      if (distanceToTarget <= maxShotRange) {
        // Introduce inaccuracy based on distance and enemy type
        let inaccuracy = 0;
        
        if (enemy.variant !== 'sniper') {
          // Non-snipers have reduced accuracy at range
          inaccuracy = (distanceToTarget / maxShotRange) * 0.2;
          
          // Moving enemies are less accurate
          if (enemy.behavior === EnemyBehavior.CHASE || enemy.behavior === EnemyBehavior.FLANK) {
            inaccuracy += 0.1;
          }
        } else {
          // Snipers are more accurate but still have some spread
          inaccuracy = (distanceToTarget / maxShotRange) * 0.05;
        }
        
        // Ensure minimum inaccuracy
        inaccuracy = Math.max(0.02, inaccuracy);
        
        // Calculate shot angle with inaccuracy
        let targetAngle = this.getAngleTo(enemy, player);
        
        // Apply random spread
        targetAngle += (Math.random() - 0.5) * inaccuracy;
        
        // Create projectile
        projectiles.push({
          id: `enemy_projectile_${now}_${enemy.id}`,
          x: enemy.x,
          y: enemy.y,
          angle: targetAngle,
          speed: tank.weapon.speed,
          owner: enemy.id,
          damage: tank.weapon.damage * variantModifier.damageModifier * this.difficultySettings[this.difficulty].DAMAGE_MODIFIER
        });
        
        enemy.lastShot = now;
      }
    }
  }
  
  private enforceMapBoundary(enemy: Enemy): void {
    const margin = 50;
    
    if (enemy.x < margin) {
      enemy.x = margin;
      if (enemy.behavior === EnemyBehavior.RETREAT) {
        enemy.currentDirection = Math.random() * Math.PI - Math.PI/2; // Random angle pointing right
      }
    }
    
    if (enemy.x > this.mapWidth - margin) {
      enemy.x = this.mapWidth - margin;
      if (enemy.behavior === EnemyBehavior.RETREAT) {
        enemy.currentDirection = Math.random() * Math.PI + Math.PI/2; // Random angle pointing left
      }
    }
    
    if (enemy.y < margin) {
      enemy.y = margin;
      if (enemy.behavior === EnemyBehavior.RETREAT) {
        enemy.currentDirection = Math.random() * Math.PI + Math.PI; // Random angle pointing down
      }
    }
    
    if (enemy.y > this.mapHeight - margin) {
      enemy.y = this.mapHeight - margin;
      if (enemy.behavior === EnemyBehavior.RETREAT) {
        enemy.currentDirection = Math.random() * Math.PI; // Random angle pointing up
      }
    }
  }
  
  public handleEnemyHit(enemyId: string, damage: number): void {
    const enemy = this.enemies.find(e => e.id === enemyId);
    if (enemy) {
      enemy.health -= damage;
      enemy.lastHitTime = Date.now();
      
      // Adjust behavior when hit
      if (!enemy.isBoss) {
        // Chance to change behavior when hit
        if (Math.random() < 0.3) {
          // Choose between retreating or attacking
          enemy.behavior = Math.random() < 0.6 ? EnemyBehavior.RETREAT : EnemyBehavior.ATTACK;
          
          // If not retreating, try to face the attacker
          if (enemy.behavior === EnemyBehavior.ATTACK && this.targetPlayer) {
            const angleToPlayer = this.getAngleTo(enemy, this.targetPlayer);
            this.rotateTowardsAngle(enemy, angleToPlayer, 0.5);
          }
        }
      }
    }
  }

  // Patrol behavior - move around randomly
  private handlePatrolBehavior(enemy: Enemy, deltaTime: number): void {
    // Move to patrol point
    const dx = enemy.patrolPoint.x - enemy.x;
    const dy = enemy.patrolPoint.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 50) {
      // Choose new patrol point
      enemy.patrolPoint = {
        x: Math.max(50, Math.min(this.mapWidth - 50, enemy.x + (Math.random() - 0.5) * 300)),
        y: Math.max(50, Math.min(this.mapHeight - 50, enemy.y + (Math.random() - 0.5) * 300))
      };
    } else {
      // Move towards patrol point with smooth rotation
      const targetAngle = Math.atan2(dy, dx);
      this.rotateTowardsAngle(enemy, targetAngle, 0.1);
      this.moveForward(enemy, enemy.speed * 0.6); // Move at reduced speed
    }
  }
  
  // Chase behavior - move directly towards player
  private handleChaseBehavior(enemy: Enemy, player: Player, deltaTime: number): void {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only chase if not too close
    if (distance > 150) {
      const targetAngle = Math.atan2(dy, dx);
      this.rotateTowardsAngle(enemy, targetAngle, 0.1);
      
      // Move faster when chasing
      const chaseSpeed = enemy.speed * (enemy.variant === 'scout' ? 1.2 : 0.9);
      this.moveForward(enemy, chaseSpeed);
    } else {
      // Switch to attack when close enough
      enemy.behavior = EnemyBehavior.ATTACK;
      enemy.lastBehaviorChange = Date.now();
    }
  }
  
  // Attack behavior - face player and shoot
  private handleAttackBehavior(enemy: Enemy, player: Player, projectiles: Projectile[], now: number): void {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const targetAngle = Math.atan2(dy, dx);
    
    // Rotate to face player more quickly in attack mode
    this.rotateTowardsAngle(enemy, targetAngle, 0.15);
    
    // Attempt to shoot if facing approximately the right direction
    const angleDiff = Math.abs(enemy.angle - targetAngle);
    if (angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3) {
      this.attemptToShoot(enemy, player, now, projectiles, 0.8); // Faster reload in attack mode
    }
    
    // Sometimes move slightly to avoid being a stationary target
    if (Math.random() < 0.3) {
      const jitterAmount = (Math.random() - 0.5) * 2;
      enemy.x += jitterAmount;
      enemy.y += jitterAmount;
    }
  }
  
  // Retreat behavior - move away from player
  private handleRetreatBehavior(enemy: Enemy, player: Player, deltaTime: number): void {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    
    // Calculate angle away from player
    const awayAngle = Math.atan2(-dy, -dx);
    this.rotateTowardsAngle(enemy, awayAngle, 0.15);
    
    // Move faster when retreating
    const retreatSpeed = enemy.speed * 1.2;
    this.moveForward(enemy, retreatSpeed);
    
    // If we've retreated far enough, consider changing behavior
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
    if (distanceToPlayer > 400 && Math.random() < 0.1) {
      enemy.behavior = EnemyBehavior.PATROL;
      enemy.lastBehaviorChange = Date.now();
    }
  }
  
  // Flank behavior - move to a position to the side of player
  private handleFlankBehavior(enemy: Enemy, player: Player, deltaTime: number, projectiles: Projectile[], now: number): void {
    // If no flank position or we're close to current one, calculate a new one
    if (!enemy.flankPosition || 
        (Math.abs(enemy.x - enemy.flankPosition.x) < 30 && 
         Math.abs(enemy.y - enemy.flankPosition.y) < 30)) {
      enemy.flankPosition = this.calculateFlankPosition(enemy, player);
    }
    
    // Move to flank position
    const dx = enemy.flankPosition.x - enemy.x;
    const dy = enemy.flankPosition.y - enemy.y;
    const moveAngle = Math.atan2(dy, dx);
    
    // Determine if we should move or shoot
    const distanceToFlankPos = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToFlankPos > 30) {
      // Move to flank position
      this.rotateTowardsAngle(enemy, moveAngle, 0.1);
      this.moveForward(enemy, enemy.speed * 0.8);
    } else {
      // At flank position, face and shoot at player
      const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      this.rotateTowardsAngle(enemy, angleToPlayer, 0.15);
      
      // Shoot if facing player
      const angleDiff = Math.abs(enemy.angle - angleToPlayer);
      if (angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3) {
        this.attemptToShoot(enemy, player, now, projectiles, 0.9);
      }
    }
  }
}
