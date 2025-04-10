import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import { GameState, Player, Projectile, TANK_TYPES, MapBlock } from '../shared/types';
import { ParticleSystem } from '../utils/particles';
import { EnemyManager, Enemy } from '../utils/enemyAI';
import { PowerupManager } from '../utils/powerupManager';
import { GAME_SETTINGS, ENHANCED_TANK_TYPES, GAME_CHAPTERS } from '../utils/gameSettings';

interface GameProps {
  mode: 'pvp' | 'chapter';
  username?: string;
}

// Add or update these interfaces to match the UI needs
interface ChapterObjective {
  type: string;
  description: string;
  reward?: string;
  optional?: boolean;
  completed?: boolean;
}

interface ChapterReward {
  xp: number;
  coins: number;
}

// Update the Chapter interface if it exists, or add it
interface Chapter {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  enemyTypes: string[];
  mapTheme: string;
  objectives: ChapterObjective[];
  unlockRequirement: null | number;
  completed: boolean;
  highScore: number;
  bestTime: number;
  reward: ChapterReward;
}

// Add this helper function before the Game component declaration
const getChapterReward = (chapter: any): ChapterReward => {
  // If chapter has reward property, use it, otherwise create default reward
  if (chapter && chapter.reward) {
    return chapter.reward;
  }
  
  // Default rewards based on difficulty
  if (chapter && chapter.difficulty) {
    switch(chapter.difficulty) {
      case 'EASY':
        return { xp: 100, coins: 50 };
      case 'MEDIUM':
        return { xp: 200, coins: 100 };
      case 'HARD':
        return { xp: 300, coins: 150 };
      default:
        return { xp: 100, coins: 50 };
    }
  }
  
  return { xp: 100, coins: 50 };
};

const Game: React.FC<GameProps> = ({ mode, username = 'Player' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTank, setSelectedTank] = useState<string>('ASSAULT');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showPause, setShowPause] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [gameObjectives, setGameObjectives] = useState<any[]>([]);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);

  // Player and world state
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerEffects, setPlayerEffects] = useState<{[key: string]: boolean}>({});
  const [playerAbilityCooldown, setPlayerAbilityCooldown] = useState(0);
  
  // Game systems
  const [particleSystem] = useState(() => new ParticleSystem());
  const [powerupManager] = useState(() => new PowerupManager());
  const [enemyManager, setEnemyManager] = useState<EnemyManager | null>(null);
  
  // Enemy state
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [enemyProjectiles, setEnemyProjectiles] = useState<Projectile[]>([]);
  const [deadEnemies, setDeadEnemies] = useState<Set<string>>(new Set());
  
  // Animation and interpolation
  const [interpolatedPlayers, setInterpolatedPlayers] = useState<{ [id: string]: Player }>({});
  const lastUpdateTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Input handling
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const movementState = useRef<{ x: number; y: number; angle: number }>({ x: 0, y: 0, angle: 0 });
  const mousePosition = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const mousePressed = useRef<boolean>(false);
  const lastShootTime = useRef<number>(0);
  
  // Chapter specific
  const { id: chapterId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentChapter = chapterId ? GAME_CHAPTERS.find(c => c.id === parseInt(chapterId)) : null;
  
  // Constants for player spawn and flag position
  const PLAYER_SPAWN = { x: 100, y: window.innerHeight - 100 }; // Bottom left
  const FLAG_POSITION = { x: window.innerWidth - 100, y: 100 }; // Top right
  const CANVAS_WIDTH = window.innerWidth;
  const CANVAS_HEIGHT = window.innerHeight;

  // Add this after currentChapter is defined
  const chapterReward = currentChapter ? getChapterReward(currentChapter) : { xp: 100, coins: 50 };

  // Initialize game based on mode
  useEffect(() => {
    // Set canvas to full screen
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }

    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);

    if (mode === 'chapter' && currentChapter) {
      // Initialize enemy manager based on chapter difficulty
      const difficulty = currentChapter.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      const newEnemyManager = new EnemyManager(difficulty, 
        window.innerWidth, 
        window.innerHeight
      );
      setEnemyManager(newEnemyManager);
      
      // Set game objectives from chapter data
      setGameObjectives(currentChapter.objectives);
      
      // Initialize player health based on selected tank
      const tank = ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES];
      setPlayerHealth(tank.health);
      
      // Initialize game state for chapter mode with player in bottom left
      const initialGameState: GameState = {
        players: {
          'player1': {
            id: 'player1',
            x: PLAYER_SPAWN.x,
            y: PLAYER_SPAWN.y,
            angle: 0,
            health: tank.health,
            tankType: selectedTank,
            speed: tank.speed
          }
        },
        projectiles: [],
        map: {
          id: 'chapter_' + chapterId,
          width: window.innerWidth,
          height: window.innerHeight,
          blocks: generateMapBlocks(currentChapter?.mapTheme || 'GRASS')
        },
        scores: { 'player1': 0 },
        status: 'playing'
      };
      
      setGameState(initialGameState);
    }

    // Connect to socket server for pvp mode
    if (mode === 'pvp') {
      const newSocket = io('http://localhost:3001');
      setSocket(newSocket);

      newSocket.on('gameState', (state: GameState) => {
        // Ensure the player is spawned at the correct position in PvP mode as well
        if (state.players[newSocket.id] && 
            (state.players[newSocket.id].x !== PLAYER_SPAWN.x || 
             state.players[newSocket.id].y !== PLAYER_SPAWN.y)) {
          state.players[newSocket.id].x = PLAYER_SPAWN.x;
          state.players[newSocket.id].y = PLAYER_SPAWN.y;
        }
        setGameState(state);
      });

      // Handle score updates
      newSocket.on('scoreUpdate', ({ playerId, score }: { playerId: string, score: number }) => {
        if (playerId === newSocket.id) {
          setScore(score);
          addProgressMessage(`Score: ${score}`);
        }
      });

      // Handle kill notifications
      newSocket.on('kill', ({ killer, victim }: { killer: string, victim: string }) => {
        if (killer === newSocket.id) {
          setKills(prev => prev + 1);
          addProgressMessage('Enemy tank destroyed!');
          setScore(prev => prev + GAME_SETTINGS.MECHANICS.SCORE_PER_KILL);
        }
      });

      return () => {
        newSocket.close();
      };
    }

    // Start game timer
    timerInterval.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [mode, currentChapter, selectedTank]);

  // Handle user input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      
      // Toggle pause menu
      if (e.key === 'Escape') {
        setShowPause(prev => !prev);
      }
      
      // Toggle controls help
      if (e.key === 'h') {
        setShowControls(prev => !prev);
      }
      
      // Use special ability
      if (e.key === ' ' && playerAbilityCooldown <= 0) {
        activateSpecialAbility();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click only
        mousePressed.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) { // Left click only
        mousePressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [playerAbilityCooldown]);

  // Helper function to add progress message with auto-removal
  const addProgressMessage = useCallback((message: string) => {
    setProgressMessages(prev => [...prev, message]);
    setTimeout(() => {
      setProgressMessages(prev => prev.filter(m => m !== message));
    }, 3000);
  }, []);

  // Special ability activation
  const activateSpecialAbility = useCallback(() => {
    if (playerAbilityCooldown > 0 || !gameState) return;
    
    const player = gameState.players[socket?.id];
    if (!player) return;
    
    const tank = ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES];
    if (!tank.specialAbility) return;
    
    // Set cooldown
    setPlayerAbilityCooldown(tank.specialAbility.cooldown / 1000);
    
    // Start cooldown timer
    const cooldownTimer = setInterval(() => {
      setPlayerAbilityCooldown(prev => {
        if (prev <= 0) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Apply ability effect
    setPlayerEffects(prev => ({
      ...prev,
      [tank.specialAbility.name]: true
    }));
    
    // Add particles for visual effect
    for (let i = 0; i < 20; i++) {
      particleSystem.addParticle({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        color: tank.color,
        size: Math.random() * 5 + 3
      });
    }
    
    // Show message
    addProgressMessage(`Activated: ${tank.specialAbility.name}!`);
    
    // Remove effect after duration
    setTimeout(() => {
      setPlayerEffects(prev => {
        const newEffects = { ...prev };
        delete newEffects[tank.specialAbility.name];
        return newEffects;
      });
    }, tank.specialAbility.duration);
  }, [socket, gameState, selectedTank, playerAbilityCooldown, addProgressMessage, particleSystem]);

  // Single player (chapter mode) game update
  useEffect(() => {
    if (!gameState || !enemyManager || mode !== 'chapter') return;

    const now = Date.now();
    const deltaTime = (now - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = now;

    const player = gameState.players[socket?.id];
    if (!player) return;

    // Update powerups
    powerupManager.update(GAME_SETTINGS.CANVAS.WIDTH, GAME_SETTINGS.CANVAS.HEIGHT);
    
    // Check for powerup collisions
    const collectedPowerup = powerupManager.checkCollisions(player);
    if (collectedPowerup) {
      addProgressMessage(`Collected ${collectedPowerup.type} powerup!`);
      
      // Add particles for collection effect
      for (let i = 0; i < 10; i++) {
        particleSystem.addParticle({
          x: collectedPowerup.x,
          y: collectedPowerup.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 0.5,
          color: collectedPowerup.color,
          size: Math.random() * 3 + 1
        });
      }
    }

    // Update enemies and get new projectiles
    const { enemies: updatedEnemies, projectiles } = enemyManager.updateEnemies(player, deltaTime);
    
    // Check for newly dead enemies
    const newDeadEnemies = new Set(deadEnemies);
    updatedEnemies.forEach(enemy => {
      if (enemy.health <= 0 && !deadEnemies.has(enemy.id)) {
        newDeadEnemies.add(enemy.id);
        
        // Update score and kill count
        setScore(prev => prev + GAME_SETTINGS.MECHANICS.SCORE_PER_KILL);
        setKills(prev => prev + 1);
        
        // Show message
        addProgressMessage(`Enemy ${enemy.variant.toUpperCase()} tank destroyed!`);
        
        // Create explosion effect
        createExplosion(enemy.x, enemy.y, enemy.isBoss ? 40 : 20);
      }
    });

    setDeadEnemies(newDeadEnemies);
    setEnemies(updatedEnemies);
    setEnemyProjectiles(projectiles);

    // Update player health
    setPlayerHealth(player.health);

    // Check for collisions between player projectiles and enemies
    gameState.projectiles.forEach(projectile => {
      if (projectile.owner === socket?.id) {
        enemies.forEach(enemy => {
          if (enemy.health <= 0) return; // Skip dead enemies
          
          const distance = Math.sqrt(
            Math.pow(projectile.x - enemy.x, 2) + Math.pow(projectile.y - enemy.y, 2)
          );
          
          // Check if projectile hit enemy tank
          if (distance < 25) {
            // Calculate damage with powerup effects
            const baseDamage = ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES].weapon.damage;
            const damageMultiplier = powerupManager.getEffectValue(player.id, 'DAMAGE');
            const damage = baseDamage * damageMultiplier;
            
            // Apply damage
            enemyManager.handleEnemyHit(enemy.id, damage);
            
            // Add hit particles
            createHitEffect(projectile.x, projectile.y);
          }
        });
      }
    });

    // Check for collisions between enemy projectiles and player
    enemyProjectiles.forEach(projectile => {
      const distance = Math.sqrt(
        Math.pow(projectile.x - player.x, 2) + Math.pow(projectile.y - player.y, 2)
      );
      
      if (distance < 25) {
        // Calculate incoming damage
        const enemy = enemies.find(e => e.id === projectile.owner);
        const baseDamage = enemy 
          ? ENHANCED_TANK_TYPES[enemy.tankType as keyof typeof ENHANCED_TANK_TYPES].weapon.damage
          : 10;
        const damage = baseDamage * (projectile.damage || 1);
        
        // Reduce damage if player has shield powerup
        const damageReduction = powerupManager.hasEffect(player.id, 'SHIELD') ? 
          powerupManager.getEffectValue(player.id, 'SHIELD') : 1;
        
        const finalDamage = damage / damageReduction;
        
        // Apply damage
        player.health -= finalDamage;
        
        // Update UI
        setPlayerHealth(player.health);
        
        // Add hit effect
        createHitEffect(projectile.x, projectile.y);
        
        // Check for game over
        if (player.health <= 0) {
          setGameLost(true);
          addProgressMessage("Mission failed!");
        }
      }
    });
    
    // Check if player reached the flag
    const distanceToFlag = Math.sqrt(
      Math.pow(player.x - FLAG_POSITION.x, 2) + Math.pow(player.y - FLAG_POSITION.y, 2)
    );
    
    if (distanceToFlag < GAME_SETTINGS.FLAG.CAPTURE_DISTANCE) {
      setGameWon(true);
      setScore(prev => prev + GAME_SETTINGS.FLAG.POINTS);
      addProgressMessage("Flag captured! Mission complete!");
    }
    
    // Update particles
    particleSystem.update(deltaTime);
  }, [gameState, enemyManager, mode, deadEnemies, socket?.id, selectedTank, addProgressMessage]);

  // Helper function for creating explosion effects
  const createExplosion = useCallback((x: number, y: number, particleCount: number = 20) => {
    for (let i = 0; i < particleCount; i++) {
      particleSystem.addParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1 + Math.random(),
        color: i % 3 === 0 ? '#FF0000' : i % 3 === 1 ? '#FFA500' : '#FFFF00',
        size: Math.random() * 4 + 2
      });
    }
  }, [particleSystem]);

  // Helper function for creating hit effects
  const createHitEffect = useCallback((x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
      particleSystem.addParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.5,
        color: '#FF0000',
        size: Math.random() * 3 + 1
      });
    }
  }, [particleSystem]);

  useEffect(() => {
    if (!gameState) return;

    const now = Date.now();
    const deltaTime = now - lastUpdateTime.current;
    lastUpdateTime.current = now;

    // Interpolate player positions
    const newInterpolatedPlayers = { ...interpolatedPlayers };
    Object.entries(gameState.players).forEach(([id, player]) => {
      const currentPlayer = interpolatedPlayers[id];
      if (currentPlayer) {
        // Smoothly interpolate position with a higher lerp factor for more responsive movement
        const lerpFactor = 0.5;
        newInterpolatedPlayers[id] = {
          ...player,
          x: currentPlayer.x + (player.x - currentPlayer.x) * lerpFactor,
          y: currentPlayer.y + (player.y - currentPlayer.y) * lerpFactor,
          angle: currentPlayer.angle + (player.angle - currentPlayer.angle) * lerpFactor
        };
      } else {
        newInterpolatedPlayers[id] = player;
      }
    });
    setInterpolatedPlayers(newInterpolatedPlayers);
  }, [gameState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    keysPressed.current[e.key.toLowerCase()] = true;
    handleMovement();
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    keysPressed.current[e.key.toLowerCase()] = false;
    handleMovement();
  };

  const handleMovement = () => {
    if (!socket || !gameState) return;

    const player = gameState.players[socket.id];
    if (!player) return;

    const tank = TANK_TYPES[player.tankType];
    const moveSpeed = tank.speed;
    const rotateSpeed = 0.1;

    let newX = player.x;
    let newY = player.y;
    let newAngle = player.angle;

    // Handle rotation
    if (keysPressed.current['a']) {
      newAngle -= rotateSpeed;
    }
    if (keysPressed.current['d']) {
      newAngle += rotateSpeed;
    }

    // Handle movement
    if (keysPressed.current['w']) {
      newX += Math.cos(newAngle) * moveSpeed;
      newY += Math.sin(newAngle) * moveSpeed;
    }
    if (keysPressed.current['s']) {
      newX -= Math.cos(newAngle) * moveSpeed;
      newY -= Math.sin(newAngle) * moveSpeed;
    }

    // Update movement state
    movementState.current = { x: newX, y: newY, angle: newAngle };

    // Send movement update to server
    socket.emit('playerMove', {
      x: newX,
      y: newY,
      angle: newAngle
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!socket || !gameState) return;

    const player = gameState.players[socket.id];
    if (!player) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const angle = Math.atan2(y - player.y, x - player.x);

    socket.emit('playerMove', {
      x: player.x,
      y: player.y,
      angle
    });
  };

  const handleMouseDown = () => {
    if (!socket || !gameState) return;

    const player = gameState.players[socket.id];
    if (!player) return;

    const tank = TANK_TYPES[player.tankType];
    socket.emit('shoot', {
      angle: player.angle,
      speed: tank.weapon.speed
    });
  };

  const startGame = () => {
    if (mode === 'pvp' && socket) {
      socket.emit('joinGame', selectedTank);
      setIsGameStarted(true);
    } else if (mode === 'chapter' && enemyManager) {
      // Create a fake socket with required methods for single player mode
      const fakeSocket = { 
        id: 'player1',
        emit: (event: string, data: any) => {
          // Handle fake socket events locally
          if (event === 'playerUpdate') {
            const { direction, angle, shooting } = data;
            handleLocalPlayerUpdate(direction, angle, shooting);
          } else if (event === 'shoot') {
            handleLocalPlayerShoot(data);
          }
        }
      };
      setSocket(fakeSocket);
      
      // Create initial player state at the bottom left corner
      const tank = ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES];
      const player: Player = {
        id: fakeSocket.id,
        x: PLAYER_SPAWN.x,
        y: PLAYER_SPAWN.y,
        angle: 0,
        health: tank.health,
        tankType: selectedTank,
        speed: tank.speed
      };
      
      // Create initial game state
      const initialGameState: GameState = {
        players: { [fakeSocket.id]: player },
        projectiles: [],
        map: {
          id: 'chapter_' + chapterId,
          width: window.innerWidth,
          height: window.innerHeight,
          blocks: generateMapBlocks(currentChapter?.mapTheme || 'GRASS')
        },
        scores: { [fakeSocket.id]: 0 },
        status: 'playing'
      };
      
      setGameState(initialGameState);
      setIsGameStarted(true);
      
      // Spawn enemies
      const spawnedEnemies = enemyManager.spawnEnemies(player);
      setEnemies(spawnedEnemies);
      
      // Add start message
      addProgressMessage(`Chapter ${chapterId}: ${currentChapter?.name || 'Mission'} started!`);
    }
  };

  // Handle local player movement in chapter mode
  const handleLocalPlayerUpdate = (direction: { x: number, y: number }, angle: number, shooting: boolean) => {
    if (!gameState) return;
    
    const player = gameState.players['player1'];
    if (!player) return;
    
    // Update player position
    const newX = player.x + direction.x;
    const newY = player.y + direction.y;
    
    // Keep player within map bounds
    const boundedX = Math.max(50, Math.min(newX, window.innerWidth - 50));
    const boundedY = Math.max(50, Math.min(newY, window.innerHeight - 50));
    
    // Update game state
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          'player1': {
            ...player,
            x: boundedX,
            y: boundedY,
            angle
          }
        }
      };
    });
    
    // Handle shooting if needed
    if (shooting) {
      handleLocalPlayerShoot({ angle });
    }
  };

  // Handle local player shooting in chapter mode
  const handleLocalPlayerShoot = (data: { angle: number }) => {
    if (!gameState) return;
    
    const player = gameState.players['player1'];
    if (!player) return;
    
    const now = Date.now();
    const tank = ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES];
    const reloadTime = tank.reloadTime * 1000; // Convert to milliseconds
    
    if (now - lastShootTime.current > reloadTime) {
      const projectile: Projectile = {
        id: `projectile_${now}`,
        x: player.x,
        y: player.y,
        angle: data.angle,
        speed: tank.weapon.speed,
        owner: player.id,
        damage: tank.weapon.damage
      };
      
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          projectiles: [...prev.projectiles, projectile]
        };
      });
      
      // Create muzzle flash particles
      const barrelLength = tank.barrelLength || 30;
      const flashX = player.x + Math.cos(data.angle) * barrelLength;
      const flashY = player.y + Math.sin(data.angle) * barrelLength;
      
      for (let i = 0; i < 5; i++) {
        particleSystem.addParticle({
          x: flashX,
          y: flashY,
          vx: Math.cos(data.angle) * 2 + (Math.random() - 0.5) * 2,
          vy: Math.sin(data.angle) * 2 + (Math.random() - 0.5) * 2,
          life: 0.3,
          color: '#FFFF00',
          size: Math.random() * 4 + 2
        });
      }
      
      lastShootTime.current = now;
    }
  };

  // Process player input and send updates to server
  const processPlayerInput = () => {
    if (!gameState || !socket) return;
    
    const player = gameState.players[socket.id];
    if (!player) return;
    
    // Apply powerup effects to player movement
    const baseSpeed = ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES].speed;
    const speedMultiplier = powerupManager.hasEffect(socket.id, 'SPEED') ?
      powerupManager.getEffectValue(socket.id, 'SPEED') : 1;
    const currentSpeed = baseSpeed * speedMultiplier;
    
    // Calculate direction of movement
    let dx = 0, dy = 0;
    if (keysPressed.current['w']) dy -= 1;
    if (keysPressed.current['s']) dy += 1;
    if (keysPressed.current['a']) dx -= 1;
    if (keysPressed.current['d']) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const factor = 1 / Math.sqrt(2);
      dx *= factor;
      dy *= factor;
    }
    
    // Apply speed
    dx *= currentSpeed;
    dy *= currentSpeed;
    
    // Calculate angle to mouse position
    let angle = player.angle;
    if (mousePosition.current) {
      angle = Math.atan2(
        mousePosition.current.y - player.y,
        mousePosition.current.x - player.x
      );
    }
    
    // Send update through socket (real or fake)
    socket.emit('playerUpdate', {
      direction: { x: dx, y: dy },
      angle,
      shooting: mousePressed.current
    });
  };

  // Generate random map blocks based on theme
  const generateMapBlocks = (theme: string): MapBlock[] => {
    const blocks: MapBlock[] = [];
    const tileSize = GAME_SETTINGS.MAP.TILE_SIZE;
    const mapWidth = window.innerWidth;
    const mapHeight = window.innerHeight;
    const density = GAME_SETTINGS.MAP.OBSTACLE_DENSITY;
    
    // Create border walls
    for (let x = 0; x < mapWidth; x += tileSize) {
      blocks.push({ x, y: 0, type: 'wall', health: 100 });
      blocks.push({ x, y: mapHeight - tileSize, type: 'wall', health: 100 });
    }
    
    for (let y = tileSize; y < mapHeight - tileSize; y += tileSize) {
      blocks.push({ x: 0, y, type: 'wall', health: 100 });
      blocks.push({ x: mapWidth - tileSize, y, type: 'wall', health: 100 });
    }
    
    // Add random obstacles based on theme
    const obstacleCount = Math.floor((mapWidth * mapHeight) / (tileSize * tileSize) * density);
    
    for (let i = 0; i < obstacleCount; i++) {
      // Ensure we don't block the player spawn or flag
      let x, y;
      let validPosition = false;
      
      while (!validPosition) {
        x = Math.floor(Math.random() * (mapWidth / tileSize - 2) + 1) * tileSize;
        y = Math.floor(Math.random() * (mapHeight / tileSize - 2) + 1) * tileSize;
        
        // Check distance from spawn and flag
        const distanceFromSpawn = Math.sqrt(
          Math.pow((x as number) - PLAYER_SPAWN.x, 2) + 
          Math.pow((y as number) - PLAYER_SPAWN.y, 2)
        );
        
        const distanceFromFlag = Math.sqrt(
          Math.pow((x as number) - FLAG_POSITION.x, 2) + 
          Math.pow((y as number) - FLAG_POSITION.y, 2)
        );
        
        validPosition = distanceFromSpawn > 150 && distanceFromFlag > 150;
      }
      
      // Different obstacle types based on theme
      let obstacleType = 'block';
      let health = Math.floor(Math.random() * 
        (GAME_SETTINGS.MAP.OBSTACLE_HEALTH.MAX - GAME_SETTINGS.MAP.OBSTACLE_HEALTH.MIN + 1) + 
        GAME_SETTINGS.MAP.OBSTACLE_HEALTH.MIN);
      
      if (theme === 'URBAN') {
        obstacleType = Math.random() < 0.7 ? 'building' : 'car';
      } else if (theme === 'DESERT') {
        obstacleType = Math.random() < 0.6 ? 'rock' : 'cactus';
      } else {
        obstacleType = Math.random() < 0.5 ? 'tree' : 'rock';
      }
      
      // Destructible check
      if (Math.random() < GAME_SETTINGS.MAP.DESTRUCTIBLE_CHANCE) {
        blocks.push({ 
          x: x as number, 
          y: y as number, 
          type: obstacleType, 
          health: health
        });
      } else {
        blocks.push({ 
          x: x as number, 
          y: y as number, 
          type: obstacleType, 
          health: Infinity 
        });
      }
    }
    
    return blocks;
  };

  // Return to chapters/home screen
  const exitGame = () => {
    if (mode === 'chapter') {
      navigate('/chapters');
    } else {
      navigate('/home');
    }
  };

  // Restart current chapter
  const restartGame = () => {
    setGameWon(false);
    setGameLost(false);
    setIsGameStarted(false);
    setScore(0);
    setKills(0);
    setTimeElapsed(0);
    setDeadEnemies(new Set());
    setEnemies([]);
    setEnemyProjectiles([]);
    powerupManager.clearAllPowerups();
    setPlayerHealth(100);
    setPlayerEffects({});
    setPlayerAbilityCooldown(0);
    setProgressMessages([]);
    
    // Re-initialize enemy manager
    if (currentChapter) {
      const difficulty = currentChapter.difficulty as 'EASY' | 'MEDIUM' | 'HARD';
      const newEnemyManager = new EnemyManager(difficulty, 
        GAME_SETTINGS.CANVAS.WIDTH, 
        GAME_SETTINGS.CANVAS.HEIGHT
      );
      setEnemyManager(newEnemyManager);
    }
  };

  // Game loop and rendering
  useEffect(() => {
    if (!isGameStarted || !gameState) return;
    
    // Skip rendering if game is paused
    if (showPause) return;
    
    const gameLoop = () => {
      renderGame();
      processPlayerInput();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [isGameStarted, gameState, showPause]);

  const renderGame = () => {
    if (!canvasRef.current || !gameState) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas with background color
    ctx.fillStyle = GAME_SETTINGS.CANVAS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw map grid
    drawGrid(ctx);
    
    // Draw map blocks
    gameState.map.blocks.forEach(block => {
      const healthPercent = block.health / 100;
      ctx.fillStyle = `rgba(100, 100, 100, ${healthPercent})`;
      ctx.fillRect(block.x, block.y, GAME_SETTINGS.MAP.TILE_SIZE, GAME_SETTINGS.MAP.TILE_SIZE);
      
      // Add detail to blocks
      ctx.strokeStyle = `rgba(80, 80, 80, ${healthPercent})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(block.x + 2, block.y + 2, 
        GAME_SETTINGS.MAP.TILE_SIZE - 4, 
        GAME_SETTINGS.MAP.TILE_SIZE - 4);
    });

    // Draw flag in top right corner
    drawFlag(ctx);

    // Draw powerups
    powerupManager.drawPowerups(ctx);

    // Draw players using interpolated positions
    Object.entries(interpolatedPlayers).forEach(([id, player]) => {
      drawPlayer(ctx, player, id === socket?.id);
    });

    // Draw enemies in chapter mode
    if (mode === 'chapter') {
      enemies.forEach(enemy => {
        // Skip rendering dead enemies
        if (enemy.health <= 0) return;
        drawEnemy(ctx, enemy);
      });

      // Draw enemy projectiles
      enemyProjectiles.forEach(projectile => {
        drawProjectile(ctx, projectile, '#FFA500');
      });
    }

    // Draw player projectiles
    gameState.projectiles.forEach(projectile => {
      drawProjectile(
        ctx, 
        projectile, 
        projectile.owner === socket?.id ? '#FFD700' : '#FFA500'
      );
    });

    // Draw particles
    particleSystem.draw(ctx);
    
    // Draw UI
    drawUI(ctx);
  };

  // Helper drawing functions
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= GAME_SETTINGS.CANVAS.WIDTH; x += GAME_SETTINGS.MAP.TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_SETTINGS.CANVAS.HEIGHT);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= GAME_SETTINGS.CANVAS.HEIGHT; y += GAME_SETTINGS.MAP.TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_SETTINGS.CANVAS.WIDTH, y);
      ctx.stroke();
    }
  };

  const drawFlag = (ctx: CanvasRenderingContext2D) => {
    // Only draw flag in chapter mode
    if (mode !== 'chapter') return;
    
    const { x, y } = FLAG_POSITION;
    
    // Draw flag pole
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y - 30, 4, 40);
    
    // Draw flag
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 30);
    ctx.lineTo(x + 4, y - 10);
    ctx.lineTo(x + 24, y - 20);
    ctx.closePath();
    ctx.fill();
    
    // Add glow effect
    ctx.globalAlpha = 0.2 + 0.1 * Math.sin(Date.now() / 300);
    ctx.beginPath();
    ctx.arc(x + 2, y + 10, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, isCurrentPlayer: boolean) => {
    // Get colors from tank type or use defaults
    const tankType = player.tankType as keyof typeof ENHANCED_TANK_TYPES;
    const tankConfig = ENHANCED_TANK_TYPES[tankType] || ENHANCED_TANK_TYPES.ASSAULT;
    const tankColor = isCurrentPlayer ? tankConfig.color : '#F44336';
    const barrelColor = isCurrentPlayer ? tankConfig.barrelColor : '#D32F2F';
    
    // Draw tank body
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // Add shield effect if player has shield powerup
    if (isCurrentPlayer && powerupManager.hasEffect(player.id, 'SHIELD')) {
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Date.now() / 200);
      ctx.fillStyle = GAME_SETTINGS.POWERUPS.TYPES.SHIELD.COLOR;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // Draw tank body
    ctx.fillStyle = tankColor;
    const width = tankConfig.width || 40;
    const height = tankConfig.height || 40;
    ctx.fillRect(-width/2, -height/2, width, height);
    
    // Draw barrel
    ctx.fillStyle = barrelColor;
    const barrelLength = tankConfig.barrelLength || 30;
    ctx.fillRect(0, -5, barrelLength, 10);
    
    // Add tank details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-width/2 + 5, -height/2 + 5, width - 10, height - 10);
    
    ctx.restore();

    // Draw player ID/name
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isCurrentPlayer ? username : player.id.slice(0, 6), player.x, player.y - 40);

    // Draw health bar
    const healthWidth = GAME_SETTINGS.UI.HEALTH_BAR.WIDTH;
    const healthHeight = GAME_SETTINGS.UI.HEALTH_BAR.HEIGHT;
    const offsetY = GAME_SETTINGS.UI.HEALTH_BAR.OFFSET_Y;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x - healthWidth/2, player.y - offsetY, healthWidth, healthHeight);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x - healthWidth/2, player.y - offsetY, healthWidth * (player.health / 100), healthHeight);
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    // Determine color based on enemy variant
    let bodyColor, barrelColor;
    
    if (enemy.isBoss) {
      bodyColor = '#8B0000'; // Dark red for bosses
      barrelColor = '#700000';
    } else {
      switch (enemy.variant) {
        case 'scout':
          bodyColor = '#FFA000';
          barrelColor = '#FF6F00';
          break;
        case 'heavy':
          bodyColor = '#1565C0';
          barrelColor = '#0D47A1';
          break;
        case 'sniper':
          bodyColor = '#D32F2F';
          barrelColor = '#B71C1C';
          break;
        default:
          bodyColor = '#F44336';
          barrelColor = '#D32F2F';
      }
    }
    
    // Draw tank body
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
    
    // Make boss tanks larger
    const scale = enemy.isBoss ? 1.5 : 1;
    
    // For bosses, add glow effect
    if (enemy.isBoss) {
      ctx.globalAlpha = 0.3 + 0.1 * Math.sin(Date.now() / 200);
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // Draw tank body
    ctx.fillStyle = bodyColor;
    const width = (ENHANCED_TANK_TYPES[enemy.tankType as keyof typeof ENHANCED_TANK_TYPES]?.width || 40) * scale;
    const height = (ENHANCED_TANK_TYPES[enemy.tankType as keyof typeof ENHANCED_TANK_TYPES]?.height || 40) * scale;
    ctx.fillRect(-width/2, -height/2, width, height);
    
    // Draw barrel
    ctx.fillStyle = barrelColor;
    const barrelLength = (ENHANCED_TANK_TYPES[enemy.tankType as keyof typeof ENHANCED_TANK_TYPES]?.barrelLength || 30) * scale;
    ctx.fillRect(0, -5 * scale, barrelLength, 10 * scale);
    
    // Add tank details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-width/2 + 5, -height/2 + 5, width - 10, height - 10);
    
    ctx.restore();

    // Draw variant/type label
    ctx.fillStyle = '#FFF';
    ctx.font = enemy.isBoss ? 'bold 14px Arial' : '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      enemy.isBoss ? 'BOSS' : enemy.variant.toUpperCase(), 
      enemy.x, 
      enemy.y - 40
    );

    // Draw health bar with appropriate width
    const healthWidth = enemy.isBoss ? GAME_SETTINGS.UI.HEALTH_BAR.BOSS_WIDTH : GAME_SETTINGS.UI.HEALTH_BAR.WIDTH;
    const healthHeight = GAME_SETTINGS.UI.HEALTH_BAR.HEIGHT;
    const offsetY = GAME_SETTINGS.UI.HEALTH_BAR.OFFSET_Y;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(enemy.x - healthWidth/2, enemy.y - offsetY, healthWidth, healthHeight);
    ctx.fillStyle = '#00FF00';
    
    // Calculate health percentage based on enemy type
    let maxHealth = GAME_SETTINGS.ENEMY.BASE_HEALTH;
    if (enemy.isBoss) {
      maxHealth *= GAME_SETTINGS.ENEMY.BOSS_HEALTH_MULTIPLIER;
    }
    
    const healthPercent = Math.max(0, enemy.health / maxHealth);
    ctx.fillRect(enemy.x - healthWidth/2, enemy.y - offsetY, healthWidth * healthPercent, healthHeight);
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile, color: string) => {
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Add glow effect
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Draw score and time at the top
    ctx.fillStyle = GAME_SETTINGS.UI.COLORS.TEXT;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // Format time as MM:SS
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    ctx.textAlign = 'right';
    ctx.fillText(`Time: ${timeString}`, GAME_SETTINGS.CANVAS.WIDTH - 20, 30);
    
    // Draw kills in the center
    ctx.textAlign = 'center';
    ctx.fillText(`Kills: ${kills}`, GAME_SETTINGS.CANVAS.WIDTH / 2, 30);
    
    // Draw ability cooldown if applicable
    if (playerAbilityCooldown > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = GAME_SETTINGS.UI.COLORS.ACCENT;
      ctx.fillText(`Ability ready in: ${playerAbilityCooldown}s`, GAME_SETTINGS.CANVAS.WIDTH / 2, GAME_SETTINGS.CANVAS.HEIGHT - 20);
    } else if (playerAbilityCooldown === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = GAME_SETTINGS.UI.COLORS.ACCENT;
      ctx.fillText('Ability ready! Press SPACE', GAME_SETTINGS.CANVAS.WIDTH / 2, GAME_SETTINGS.CANVAS.HEIGHT - 20);
    }
    
    // Draw active effects
    const effectKeys = Object.keys(playerEffects);
    if (effectKeys.length > 0) {
      ctx.textAlign = 'right';
      ctx.font = '14px Arial';
      ctx.fillStyle = GAME_SETTINGS.UI.COLORS.ACCENT;
      ctx.fillText('Active Effects:', GAME_SETTINGS.CANVAS.WIDTH - 20, 60);
      
      effectKeys.forEach((effect, index) => {
        ctx.fillText(effect, GAME_SETTINGS.CANVAS.WIDTH - 20, 80 + index * 20);
      });
    }
    
    // Draw progress messages
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    progressMessages.forEach((message, index) => {
      // Fade in/out effect
      const age = 3 - (Date.now() - timeElapsed * 1000 - index * 500) / 1000;
      const alpha = Math.min(1, age * 2) * Math.min(1, (3 - age) * 2);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillText(message, GAME_SETTINGS.CANVAS.WIDTH / 2, GAME_SETTINGS.CANVAS.HEIGHT / 2 - 50 + index * 25);
    });
  };

  return (
    <div className="game-container">
      {!isGameStarted ? (
        <div className="game-setup-screen">
          <div className="setup-header">
            <h1>{mode === 'chapter' 
              ? `Chapter ${chapterId}: ${currentChapter?.name || 'Mission'}` 
              : 'Battle Preparation'}
            </h1>
            <p className="setup-subtitle">
              {mode === 'chapter' 
                ? 'Choose your tank wisely for this mission' 
                : 'Select your tank for battle'}
            </p>
          </div>
          
          {mode === 'chapter' && currentChapter && (
            <div className="chapter-briefing">
              <div className="briefing-content">
                <h2>Mission Briefing</h2>
                <p>{currentChapter.description}</p>
                
                <div className="objectives-panel">
                  <h3>Objectives</h3>
                  <ul>
                    {currentChapter.objectives.map((objective, index) => (
                      <li key={index} className={objective.type === 'OPTIONAL' ? 'optional' : ''}>
                        {objective.description}
                        {objective.type === 'OPTIONAL' && <span className="optional-tag">BONUS</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="reward-panel">
                  <h3>Rewards</h3>
                  <p className="reward-text">
                    <span className="reward-value">{chapterReward.xp}XP</span> and 
                    <span className="reward-value">{chapterReward.coins} coins</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="select-tank-title">Select Your Tank</h2>
          
          <div className="tank-selection-carousel">
            {Object.entries(ENHANCED_TANK_TYPES).map(([type, tank]) => (
              <div 
                key={type}
                className={`tank-card ${selectedTank === type ? 'selected' : ''}`}
                onClick={() => setSelectedTank(type)}
              >
                <div 
                  className="tank-preview"
                  style={{ backgroundColor: tank.color || '#4CAF50' }}
                >
                  <div 
                    className="tank-body"
                    style={{ width: '40px', height: '40px', borderRadius: '20px' }}
                  />
                  <div 
                    className="tank-barrel"
                    style={{ 
                      backgroundColor: '#333',
                      width: `${tank.barrelLength || 30}px`,
                      height: '8px',
                      transformOrigin: 'left center'
                    }}
                  />
                </div>
                
                <h3>{tank.name}</h3>
                
                <div className="tank-stats">
                  <div className="stat">
                    <span>Health</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill health-fill"
                        style={{ width: `${(tank.health / 200) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="stat">
                    <span>Speed</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill speed-fill"
                        style={{ width: `${(tank.speed / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="stat">
                    <span>Damage</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill damage-fill"
                        style={{ width: `${(tank.weapon.damage / 40) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="stat">
                    <span>Reload</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill reload-fill"
                        style={{ width: `${(1 / tank.reloadTime) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="tank-special">
                  <h4>Special: {tank.specialAbility.name}</h4>
                  <p>{tank.specialAbility.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="game-controls">
            <button className="start-button" onClick={startGame}>
              <i className="fa fa-play"></i> Start Battle
            </button>
            <button className="back-button" onClick={exitGame}>
              <i className="fa fa-arrow-left"></i> Back
            </button>
          </div>
        </div>
      ) : gameWon ? (
        <div className="victory-screen">
          <div className="victory-content">
            <h1>Victory!</h1>
            <p className="victory-message">Mission Accomplished</p>
            
            <div className="results-panel">
              <div className="result-row">
                <span>Time</span>
                <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
              </div>
              
              <div className="result-row">
                <span>Score</span>
                <span>{score}</span>
              </div>
              
              <div className="result-row">
                <span>Enemies Destroyed</span>
                <span>{kills}</span>
              </div>
            </div>
            
            <div className="reward-summary">
              <h3>Rewards Earned</h3>
              <div className="reward-item">
                <i className="fa fa-star"></i>
                <span>{chapterReward.xp} XP</span>
              </div>
              
              <div className="reward-item">
                <i className="fa fa-coins"></i>
                <span>{chapterReward.coins} Coins</span>
              </div>
            </div>
            
            <div className="victory-buttons">
              <button className="retry-button" onClick={restartGame}>Play Again</button>
              <button className="next-button">Next Chapter</button>
              <button className="home-button" onClick={exitGame}>Return to Menu</button>
            </div>
          </div>
        </div>
      ) : gameLost ? (
        <div className="defeat-screen">
          <div className="defeat-content">
            <h1>Defeat</h1>
            <p className="defeat-message">Mission Failed</p>
            
            <div className="results-panel">
              <div className="result-row">
                <span>Time Survived</span>
                <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
              </div>
              
              <div className="result-row">
                <span>Score</span>
                <span>{score}</span>
              </div>
              
              <div className="result-row">
                <span>Enemies Destroyed</span>
                <span>{kills}</span>
              </div>
            </div>
            
            <div className="defeat-buttons">
              <button className="retry-button" onClick={restartGame}>Try Again</button>
              <button className="home-button" onClick={exitGame}>Return to Menu</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="game-view">
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            tabIndex={0}
          />
          
          {showPause && (
            <div className="pause-overlay">
              <div className="pause-menu">
                <h2>Game Paused</h2>
                <button className="resume-button" onClick={() => setShowPause(false)}>
                  <i className="fa fa-play"></i> Resume
                </button>
                <button className="restart-button" onClick={restartGame}>
                  <i className="fa fa-redo"></i> Restart
                </button>
                <button className="help-button" onClick={() => setShowControls(true)}>
                  <i className="fa fa-question-circle"></i> Controls
                </button>
                <button className="quit-button" onClick={exitGame}>
                  <i className="fa fa-sign-out-alt"></i> Quit
                </button>
              </div>
            </div>
          )}
          
          {showControls && (
            <div className="controls-overlay">
              <div className="controls-panel">
                <h2>Controls</h2>
                
                <div className="controls-grid">
                  <div className="control-item">
                    <div className="key-group">
                      <div className="key">W</div>
                      <div className="key">A</div>
                      <div className="key">S</div>
                      <div className="key">D</div>
                    </div>
                    <div className="control-desc">Movement</div>
                  </div>
                  
                  <div className="control-item">
                    <div className="key-group">
                      <div className="key">Mouse</div>
                    </div>
                    <div className="control-desc">Aim</div>
                  </div>
                  
                  <div className="control-item">
                    <div className="key-group">
                      <div className="key">LMB</div>
                    </div>
                    <div className="control-desc">Shoot</div>
                  </div>
                  
                  <div className="control-item">
                    <div className="key-group">
                      <div className="key wide">Space</div>
                    </div>
                    <div className="control-desc">Special Ability</div>
                  </div>
                  
                  <div className="control-item">
                    <div className="key-group">
                      <div className="key wide">Esc</div>
                    </div>
                    <div className="control-desc">Pause</div>
                  </div>
                </div>
                
                <button className="close-controls" onClick={() => setShowControls(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
          
          <div className="game-hud">
            <div className="top-bar">
              <div className="player-info">
                <div className="username">{username}</div>
                <div className="tank-type">{ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES]?.name || 'Tank'}</div>
              </div>
              
              <div className="score-display">
                <div className="score-value">{score}</div>
                <div className="score-label">Score</div>
              </div>
              
              <div className="time-display">
                <div className="time-value">{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
                <div className="time-label">Time</div>
              </div>
              
              <div className="kills-display">
                <div className="kills-value">{kills}</div>
                <div className="kills-label">Kills</div>
              </div>
            </div>
            
            <div className="bottom-bar">
              <div className="health-bar-container">
                <div className="health-bar-label">Health</div>
                <div className="health-bar">
                  <div 
                    className="health-fill"
                    style={{ 
                      width: `${(playerHealth / (ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES]?.health || 100)) * 100}%`,
                      backgroundColor: playerHealth > 60 ? '#4CAF50' : playerHealth > 30 ? '#FF9800' : '#F44336' 
                    }}
                  />
                </div>
                <div className="health-value">{playerHealth}</div>
              </div>
              
              <div className="ability-bar-container">
                <div className="ability-bar-label">Special</div>
                <div className="ability-bar">
                  <div 
                    className="ability-fill"
                    style={{ 
                      width: `${(1 - (playerAbilityCooldown / (ENHANCED_TANK_TYPES[selectedTank as keyof typeof ENHANCED_TANK_TYPES]?.specialAbility.cooldown || 10))) * 100}%` 
                    }}
                  />
                </div>
                <div className="ability-status">
                  {playerAbilityCooldown <= 0 ? 'Ready' : `${Math.ceil(playerAbilityCooldown)}s`}
                </div>
              </div>
              
              <div className="controls-hint">
                <button className="hint-button" onClick={() => setShowControls(prev => !prev)}>
                  Controls
                </button>
                <button className="pause-button" onClick={() => setShowPause(prev => !prev)}>
                  Pause
                </button>
              </div>
            </div>
            
            {mode === 'chapter' && (
              <div className="objectives-tracker">
                <h3>Objectives</h3>
                <ul>
                  {gameObjectives.map((objective, index) => (
                    <li 
                      key={index} 
                      className={objective.completed ? 'completed' : objective.type === 'OPTIONAL' ? 'optional' : ''}
                    >
                      {objective.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="notifications">
              {progressMessages.slice(-3).map((message, index) => (
                <div key={index} className="notification-message" style={{ animationDelay: `${index * 0.2}s` }}>
                  {message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 