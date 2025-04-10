import { GAME_SETTINGS } from './gameSettings';
import { Player } from '../shared/types';

export interface Powerup {
  id: string;
  type: keyof typeof GAME_SETTINGS.POWERUPS.TYPES;
  x: number;
  y: number;
  creation: number;
  value: number;
  duration: number;
  color: string;
  active: boolean;
  collected: boolean;
  collectedBy?: string;
  expiresAt?: number;
}

export interface PlayerPowerupEffect {
  type: keyof typeof GAME_SETTINGS.POWERUPS.TYPES;
  value: number;
  expiresAt: number;
}

export class PowerupManager {
  private powerups: Powerup[] = [];
  private playerEffects: Map<string, PlayerPowerupEffect[]> = new Map();
  private lastSpawnTime: number = 0;
  
  constructor() {
    this.lastSpawnTime = Date.now();
  }
  
  public update(mapWidth: number, mapHeight: number): void {
    const now = Date.now();
    
    // Spawn new powerups if needed
    if (now - this.lastSpawnTime > GAME_SETTINGS.POWERUPS.SPAWN_RATE && 
        this.powerups.filter(p => !p.collected).length < GAME_SETTINGS.POWERUPS.MAX_ACTIVE) {
      this.spawnPowerup(mapWidth, mapHeight);
      this.lastSpawnTime = now;
    }
    
    // Remove expired powerups
    this.powerups = this.powerups.filter(powerup => {
      // Remove collected powerups that have expired
      if (powerup.collected && powerup.expiresAt && now > powerup.expiresAt) {
        return false;
      }
      
      // Keep collected powerups that haven't expired
      if (powerup.collected) {
        return true;
      }
      
      // Remove uncollected powerups older than the duration
      return now - powerup.creation < GAME_SETTINGS.POWERUPS.DURATION;
    });
    
    // Update player effects
    this.playerEffects.forEach((effects, playerId) => {
      // Filter out expired effects
      const activeEffects = effects.filter(effect => effect.expiresAt > now);
      if (activeEffects.length < effects.length) {
        this.playerEffects.set(playerId, activeEffects);
      }
    });
  }
  
  public spawnPowerup(mapWidth: number, mapHeight: number): Powerup {
    // Choose random powerup type
    const powerupTypes = Object.keys(GAME_SETTINGS.POWERUPS.TYPES) as Array<keyof typeof GAME_SETTINGS.POWERUPS.TYPES>;
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    const powerupSettings = GAME_SETTINGS.POWERUPS.TYPES[type];
    
    // Generate random position (avoiding edges)
    const x = Math.random() * (mapWidth - 100) + 50;
    const y = Math.random() * (mapHeight - 100) + 50;
    
    const powerup: Powerup = {
      id: `powerup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x,
      y,
      creation: Date.now(),
      value: powerupSettings.VALUE,
      duration: powerupSettings.DURATION,
      color: powerupSettings.COLOR,
      active: true,
      collected: false,
    };
    
    this.powerups.push(powerup);
    return powerup;
  }
  
  public checkCollisions(player: Player): Powerup | null {
    const now = Date.now();
    
    for (const powerup of this.powerups) {
      if (!powerup.collected) {
        const dx = powerup.x - player.x;
        const dy = powerup.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) { // Collision radius
          // Mark as collected
          powerup.collected = true;
          powerup.collectedBy = player.id;
          
          // Set expiration time if powerup has duration
          if (powerup.duration > 0) {
            powerup.expiresAt = now + powerup.duration;
            
            // Add effect to player
            if (!this.playerEffects.has(player.id)) {
              this.playerEffects.set(player.id, []);
            }
            
            const playerEffects = this.playerEffects.get(player.id) || [];
            playerEffects.push({
              type: powerup.type,
              value: powerup.value,
              expiresAt: powerup.expiresAt,
            });
            
            this.playerEffects.set(player.id, playerEffects);
          } else {
            // Immediate effect (like health)
            this.applyImmediateEffect(player, powerup);
          }
          
          return powerup;
        }
      }
    }
    
    return null;
  }
  
  private applyImmediateEffect(player: Player, powerup: Powerup): void {
    switch(powerup.type) {
      case 'HEALTH':
        player.health = Math.min(100, player.health + powerup.value);
        break;
      // Other immediate effects could be added here
    }
  }
  
  public getPlayerEffects(playerId: string): PlayerPowerupEffect[] {
    return this.playerEffects.get(playerId) || [];
  }
  
  public getActivePowerups(): Powerup[] {
    return this.powerups.filter(p => !p.collected);
  }
  
  public drawPowerups(ctx: CanvasRenderingContext2D): void {
    this.powerups.forEach(powerup => {
      if (!powerup.collected) {
        // Draw powerup
        ctx.save();
        
        // Draw glow effect
        const now = Date.now();
        const age = now - powerup.creation;
        const pulseIntensity = 0.7 + 0.3 * Math.sin(age / 200);
        
        ctx.globalAlpha = pulseIntensity;
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner circle
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon based on powerup type
        ctx.fillStyle = powerup.color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '';
        switch(powerup.type) {
          case 'HEALTH': icon = '❤️'; break;
          case 'SPEED': icon = '⚡'; break;
          case 'DAMAGE': icon = '💥'; break;
          case 'SHIELD': icon = '🛡️'; break;
          case 'RAPID_FIRE': icon = '🔥'; break;
        }
        
        ctx.fillText(icon, powerup.x, powerup.y);
        
        ctx.restore();
      }
    });
  }
  
  public applyPowerupEffects(player: Player): Player {
    const modifiedPlayer = { ...player };
    const effects = this.getPlayerEffects(player.id);
    
    // Skip if no active effects
    if (effects.length === 0) return modifiedPlayer;
    
    // Apply each active effect
    effects.forEach(effect => {
      switch(effect.type) {
        case 'SPEED':
          modifiedPlayer.speed = (modifiedPlayer.speed || 3) * effect.value;
          break;
        case 'DAMAGE':
          // Damage multiplier will be applied when projectiles are created
          break;
        case 'SHIELD':
          // Shield is handled in damage calculation
          break;
        case 'RAPID_FIRE':
          // Rapid fire is handled in shooting logic
          break;
      }
    });
    
    return modifiedPlayer;
  }
  
  public hasEffect(playerId: string, effectType: keyof typeof GAME_SETTINGS.POWERUPS.TYPES): boolean {
    const effects = this.getPlayerEffects(playerId);
    return effects.some(effect => effect.type === effectType);
  }
  
  public getEffectValue(playerId: string, effectType: keyof typeof GAME_SETTINGS.POWERUPS.TYPES): number {
    const effects = this.getPlayerEffects(playerId);
    const effect = effects.find(e => e.type === effectType);
    return effect ? effect.value : 1; // Return multiplier of 1 if no effect
  }
  
  public clearAllPowerups(): void {
    this.powerups = [];
    this.playerEffects.clear();
  }
} 