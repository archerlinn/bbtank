# BBTank

A multiplayer tank battle game built with TypeScript, React, and Socket.IO.

## Features

- Real-time multiplayer gameplay
- Multiple tank types with different stats
- Single-player chapter mode with AI enemies
- Flag capture objective
- Particle effects for explosions and hits
- Responsive controls

## Game Modes

### PvP Mode
- Battle against other players in real-time
- Choose from different tank types
- Last tank standing wins

### Chapter Mode
- Single-player campaign with increasing difficulty
- Defeat AI-controlled enemies
- Capture the flag to win
- Three difficulty levels:
  - Easy: 5 enemies
  - Medium: 8 enemies
  - Hard: 10 enemies

## Tank Types

- **SNIPER**: High damage, low health, slow reload
- **ASSAULT**: Balanced stats
- **HEAVY**: High health, low speed
- **SCOUT**: High speed, low damage

## Controls

- **WASD**: Move tank
- **Mouse**: Aim
- **Left Click**: Shoot
- **Space**: Special ability (coming soon)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bbtank.git
cd bbtank
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start the development server:
```bash
# From the root directory
npm run dev
```

The game will be available at `http://localhost:3000`

## Technologies Used

- Frontend: React, TypeScript, Socket.IO Client
- Backend: Node.js, Express, Socket.IO
- Game Engine: Custom built with Canvas API
- Styling: CSS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 