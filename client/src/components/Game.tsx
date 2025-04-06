import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { GameState, Player, Projectile, TANK_TYPES, MapBlock } from '../shared/types';
import { ParticleSystem } from '../utils/particles';
import { EnemyManager, Enemy } from '../utils/enemyAI';
import { useParams } from 'react-router-dom';

interface GameProps {
  mode: 'pvp' | 'chapter';
}

const Game: React.FC<GameProps> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTank, setSelectedTank] = useState<string>('SNIPER');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [particleSystem] = useState(() => new ParticleSystem());
  const [interpolatedPlayers, setInterpolatedPlayers] = useState<{ [id: string]: Player }>({});
  const lastUpdateTime = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const movementState = useRef<{ x: number; y: number; angle: number }>({ x: 0, y: 0, angle: 0 });
  const [enemyManager, setEnemyManager] = useState<EnemyManager | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [enemyProjectiles, setEnemyProjectiles] = useState<Projectile[]>([]);
  const { id: chapterId } = useParams<{ id: string }>();
  const [gameWon, setGameWon] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const FLAG_POSITION = { x: 700, y: 50 };
  const [deadEnemies, setDeadEnemies] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mode === 'chapter') {
      // Initialize enemy manager based on chapter difficulty
      const difficulty = chapterId === '1' ? 'easy' : 
                        chapterId === '2' ? 'medium' : 'hard';
      setEnemyManager(new EnemyManager(difficulty));
    }
  }, [mode, chapterId]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!gameState || !enemyManager || mode !== 'chapter') return;

    const now = Date.now();
    const deltaTime = (now - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = now;

    const player = gameState.players[socket?.id];
    if (!player) return;

    // Update enemies and get new projectiles
    const { enemies: updatedEnemies, projectiles } = enemyManager.updateEnemies(player, deltaTime);
    
    // Check for newly dead enemies
    const newDeadEnemies = new Set(deadEnemies);
    updatedEnemies.forEach(enemy => {
      if (enemy.health <= 0 && !deadEnemies.has(enemy.id)) {
        newDeadEnemies.add(enemy.id);
        // Add explosion particles
        for (let i = 0; i < 20; i++) {
          particleSystem.addParticle({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            color: '#FF0000',
            size: Math.random() * 4 + 2
          });
        }
      }
    });

    setDeadEnemies(newDeadEnemies);
    setEnemies(updatedEnemies);
    setEnemyProjectiles(projectiles);

    // Check for collisions between player projectiles and enemies
    gameState.projectiles.forEach(projectile => {
      if (projectile.owner === socket?.id) {
        enemies.forEach(enemy => {
          const distance = Math.sqrt(
            Math.pow(projectile.x - enemy.x, 2) + Math.pow(projectile.y - enemy.y, 2)
          );
          if (distance < 25) {
            enemy.health -= TANK_TYPES[selectedTank].weapon.damage;
            // Add hit particles
            for (let i = 0; i < 5; i++) {
              particleSystem.addParticle({
                x: projectile.x,
                y: projectile.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 0.5,
                color: '#FF0000',
                size: Math.random() * 3 + 1
              });
            }
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
        player.health -= TANK_TYPES[enemies.find(e => e.id === projectile.owner)?.tankType || 'SNIPER'].weapon.damage;
        // Add hit particles
        for (let i = 0; i < 5; i++) {
          particleSystem.addParticle({
            x: projectile.x,
            y: projectile.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 0.5,
            color: '#FF0000',
            size: Math.random() * 3 + 1
          });
        }
      }
    });
  }, [gameState, enemyManager, mode]);

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
    if (socket) {
      socket.emit('joinGame', selectedTank);
      setIsGameStarted(true);

      if (mode === 'chapter' && enemyManager) {
        const player = {
          id: socket.id,
          x: 400,
          y: 300,
          angle: 0,
          health: TANK_TYPES[selectedTank].health,
          tankType: selectedTank
        };
        const spawnedEnemies = enemyManager.spawnEnemies(800, 600, player);
        setEnemies(spawnedEnemies);
      }
    }
  };

  const handleBulletHit = (projectile: Projectile) => {
    particleSystem.addExplosion(projectile.x, projectile.y);
  };

  const handleTankMove = (player: Player) => {
    particleSystem.addSmoke(player.x, player.y);
  };

  const gameLoop = () => {
    particleSystem.update();
  };

  const renderGame = () => {
    if (!canvasRef.current || !gameState) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw map blocks
    gameState.map.blocks.forEach(block => {
      ctx.fillStyle = `rgba(100, 100, 100, ${block.health / 100})`;
      ctx.fillRect(block.x, block.y, 50, 50);
    });

    // Draw flag in top right corner
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(FLAG_POSITION.x, FLAG_POSITION.y, 30, 30);
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText('🏁', FLAG_POSITION.x, FLAG_POSITION.y + 20);

    // Draw players using interpolated positions
    Object.entries(interpolatedPlayers).forEach(([id, player]) => {
      // Determine tank color based on player ID
      const isCurrentPlayer = id === socket?.id;
      const tankColor = isCurrentPlayer ? '#4CAF50' : '#F44336';
      
      // Draw tank body
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.fillStyle = tankColor;
      ctx.fillRect(-20, -20, 40, 40);
      
      // Draw tank barrel
      ctx.fillStyle = isCurrentPlayer ? '#388E3C' : '#D32F2F';
      ctx.fillRect(0, -5, 30, 10);
      ctx.restore();

      // Draw player ID
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(id.slice(0, 6), player.x, player.y - 40);

      // Draw health bar (shorter)
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(player.x - 15, player.y - 30, 30, 3);
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(player.x - 15, player.y - 30, 30 * (player.health / 100), 3);
    });

    // Draw enemies in chapter mode
    if (mode === 'chapter') {
      enemies.forEach(enemy => {
        // Skip rendering dead enemies
        if (enemy.health <= 0) return;

        // Draw enemy tank
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-20, -20, 40, 40);
        
        // Draw enemy barrel
        ctx.fillStyle = '#990000';
        ctx.fillRect(0, -5, 30, 10);
        ctx.restore();

        // Draw enemy health bar (shorter)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(enemy.x - 15, enemy.y - 30, 30, 3);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(enemy.x - 15, enemy.y - 30, 30 * (enemy.health / 100), 3);
      });

      // Draw enemy projectiles
      enemyProjectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFA500';
        ctx.fill();
      });
    }

    // Draw player projectiles
    gameState.projectiles.forEach(projectile => {
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = projectile.owner === socket?.id ? '#FFD700' : '#FFA500';
      ctx.fill();
    });

    // Check if player reached the flag
    const player = gameState.players[socket?.id];
    if (player) {
      const distanceToFlag = Math.sqrt(
        Math.pow(player.x - FLAG_POSITION.x, 2) + Math.pow(player.y - FLAG_POSITION.y, 2)
      );
      if (distanceToFlag < 30) {
        setGameWon(true);
      }
    }

    particleSystem.draw(ctx);
  };

  // Call renderGame in the useEffect for gameState changes
  useEffect(() => {
    renderGame();
  }, [gameState]);

  return (
    <div className="game-container">
      {!isGameStarted ? (
        <div className="tank-selection">
          <h2>Select Your Tank</h2>
          <div className="tank-options">
            {Object.entries(TANK_TYPES).map(([type, tank]) => (
              <div
                key={type}
                className={`tank-option ${selectedTank === type ? 'selected' : ''}`}
                onClick={() => setSelectedTank(type)}
              >
                <h3>{type}</h3>
                <p>Health: {tank.health}</p>
                <p>Speed: {tank.speed}</p>
                <p>Damage: {tank.weapon.damage}</p>
                <p>Reload: {tank.reloadTime}s</p>
              </div>
            ))}
          </div>
          <button onClick={startGame}>Start Game</button>
        </div>
      ) : gameWon ? (
        <div className="game-over">
          <h2>Victory!</h2>
          <p>You have captured the flag!</p>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          tabIndex={0}
        />
      )}
    </div>
  );
};

export default Game; 