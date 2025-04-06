import { MapBlock } from '../shared/types';

export function generateMap(): MapBlock[] {
  const blocks: MapBlock[] = [];
  const blockSize = 50;
  const mapWidth = 800;
  const mapHeight = 600;

  // Create border walls
  for (let x = 0; x < mapWidth; x += blockSize) {
    blocks.push({ x, y: 0, health: 100 });
    blocks.push({ x, y: mapHeight - blockSize, health: 100 });
  }

  for (let y = blockSize; y < mapHeight - blockSize; y += blockSize) {
    blocks.push({ x: 0, y, health: 100 });
    blocks.push({ x: mapWidth - blockSize, y, health: 100 });
  }

  // Create some random obstacles
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * (mapWidth / blockSize - 2)) * blockSize + blockSize;
    const y = Math.floor(Math.random() * (mapHeight / blockSize - 2)) * blockSize + blockSize;
    blocks.push({ x, y, health: 100 });
  }

  return blocks;
} 