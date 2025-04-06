import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameState, Player, Projectile, TANK_TYPES } from '../shared/types';
import { generateMap } from './mapGenerator';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Game state
const gameState: GameState = {
  players: {},
  projectiles: [],
  map: {
    blocks: generateMap()
  }
};

// Collision detection
function checkCollision(x: number, y: number, size: number = 20): boolean {
  return gameState.map.blocks.some(block => {
    return x < block.x + 50 &&
           x + size > block.x &&
           y < block.y + 50 &&
           y + size > block.y;
  });
}

// Projectile collision
function checkProjectileCollision(projectile: Projectile): boolean {
  // Check wall collision
  const wallCollision = gameState.map.blocks.some(block => {
    return projectile.x < block.x + 50 &&
           projectile.x + 5 > block.x &&
           projectile.y < block.y + 50 &&
           projectile.y + 5 > block.y;
  });

  // Check player collision
  const playerCollision = Object.entries(gameState.players).some(([id, player]) => {
    if (id === projectile.owner) return false;
    return projectile.x < player.x + 20 &&
           projectile.x + 5 > player.x - 20 &&
           projectile.y < player.y + 20 &&
           projectile.y + 5 > player.y - 20;
  });

  return wallCollision || playerCollision;
}

// Game loop
setInterval(() => {
  // Update projectiles
  gameState.projectiles = gameState.projectiles.filter(projectile => {
    projectile.x += Math.cos(projectile.angle) * projectile.speed;
    projectile.y += Math.sin(projectile.angle) * projectile.speed;

    // Check if projectile is out of bounds
    if (projectile.x < 0 || projectile.x > 800 || projectile.y < 0 || projectile.y > 600) {
      return false;
    }

    // Check for collisions
    if (checkProjectileCollision(projectile)) {
      // Handle player damage
      Object.entries(gameState.players).forEach(([id, player]) => {
        if (id !== projectile.owner &&
            projectile.x < player.x + 20 &&
            projectile.x + 5 > player.x - 20 &&
            projectile.y < player.y + 20 &&
            projectile.y + 5 > player.y - 20) {
          const tank = TANK_TYPES[player.tankType];
          player.health -= tank.weapon.damage;
          if (player.health <= 0) {
            delete gameState.players[id];
          }
        }
      });
      return false;
    }

    return true;
  });

  io.emit('gameState', gameState);
}, 16); // ~60 FPS

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Handle player joining
  socket.on('joinGame', (tankType: string) => {
    let x, y;
    do {
      x = Math.random() * 700 + 50;
      y = Math.random() * 500 + 50;
    } while (checkCollision(x, y));

    gameState.players[socket.id] = {
      id: socket.id,
      x,
      y,
      angle: 0,
      health: TANK_TYPES[tankType].health,
      tankType
    };
    io.emit('gameState', gameState);
  });

  // Handle player movement
  socket.on('playerMove', (data: { x: number; y: number; angle: number }) => {
    if (gameState.players[socket.id]) {
      const player = gameState.players[socket.id];
      const tank = TANK_TYPES[player.tankType];
      
      // Check if new position is valid
      if (!checkCollision(data.x, data.y)) {
        player.x = data.x;
        player.y = data.y;
      }
      player.angle = data.angle;
      io.emit('gameState', gameState);
    }
  });

  // Handle shooting
  socket.on('shoot', (data: { angle: number; speed: number }) => {
    if (gameState.players[socket.id]) {
      const player = gameState.players[socket.id];
      gameState.projectiles.push({
        id: Math.random().toString(36).substr(2, 9),
        x: player.x,
        y: player.y,
        angle: data.angle,
        speed: data.speed,
        owner: socket.id
      });
      io.emit('gameState', gameState);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('gameState', gameState);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 