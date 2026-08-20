import type { BlockType, PlayerPosition, Position } from '../types/types';

export function findPlayerOnLevel(level: BlockType[][]): PlayerPosition {
  const y = level.findIndex((row) => row.includes('@'));
  const x = level[y].indexOf('@');

  return { x, y, direction: 'down', frame: 0 };
}

export function findBoxesOnLevel(level: BlockType[][]): Position[] {
  const boxes: Position[] = [];

  level.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === '$') {
        boxes.push({ x, y });
      }
    });
  });

  return boxes;
}

export function floorFill(level: BlockType[][], player: PlayerPosition) {
  let target: BlockType[] = [' ', '$', '@'];
  let newSymbol: BlockType = '_';

  let startX = player.x;
  let startY = player.y;

  let copy = structuredClone(level);

  const dir = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const queue: [number, number][] = [];
  queue.push([startX, startY]);

  copy[startY][startX] = newSymbol;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const [cx, cy] = current;

    for (const it of dir) {
      const nx: number = cx + it[0];
      const ny: number = cy + it[1];

      if (
        ny >= 0 &&
        ny < copy.length &&
        nx >= 0 &&
        nx < copy[0].length &&
        target.includes(copy[ny][nx])
      ) {
        copy[ny][nx] = newSymbol;
        queue.push([nx, ny]);
      }
    }
  }

  return copy;
}

export function findGoalsOnLevel(floor: BlockType[][]) {
  const goals: Position[] = [];

  floor.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === '.') {
        goals.push({ x, y });
      }
    });
  });

  return goals;
}

export function findOuterWalls(floor: BlockType[][]) {
  const queue: [number, number][] = [];
  const outerWalls = new Set<string>();

  const rows = floor.length;
  const cols = floor[0].length;

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isBorder = x === 0 || x === cols - 1 || y === 0 || y === rows - 1;

      if (isBorder && floor[y][x] === '#') {
        queue.push([x, y]);
        outerWalls.add(`${x},${y}`);
      }
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const [cx, cy] = current;

    for (const [dx, dy] of directions) {
      const nx: number = cx + dx;
      const ny: number = cy + dy;

      if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) {
        continue;
      }

      if (floor[ny][nx] !== '#') {
        continue;
      }

      const key = `${nx},${ny}`;

      if (!outerWalls.has(key)) {
        outerWalls.add(key);
        queue.push([nx, ny]);
      }
    }
  }

  return outerWalls;
}

export function convertWallsToWater(floor: BlockType[][], outerWalls: Set<string>) {
  const convertedLevel = structuredClone(floor);

  const hasManualWater = floor.some((row) => row.includes('~'));

  if (hasManualWater) {
    return convertedLevel;
  }
  for (let y = 0; y < convertedLevel.length; y++) {
    for (let x = 0; x < convertedLevel[y].length; x++) {
      if (convertedLevel[y][x] !== '#') {
        continue;
      }

      const key = `${x},${y}`;

      if (!outerWalls.has(key)) {
        convertedLevel[y][x] = '~';
      }
    }
  }

  return convertedLevel;
}

export function initializeLevel(rawText: string) {
  const lines = rawText.split(/\r?\n/);
  const cols = Math.max(...lines.map((line) => line.length));
  const parsedLevel = lines.map((line) => line.padEnd(cols, ' ').split('')) as BlockType[][];

  const foundPlayer = findPlayerOnLevel(parsedLevel);
  const foundBoxes = findBoxesOnLevel(parsedLevel);
  let generatedFloor = floorFill(parsedLevel, foundPlayer);
  const foundGoals = findGoalsOnLevel(generatedFloor);

  const outerWalls = findOuterWalls(generatedFloor);
  generatedFloor = convertWallsToWater(generatedFloor, outerWalls);

  return {
    level: parsedLevel,
    floor: generatedFloor,
    player: foundPlayer,
    boxes: foundBoxes,
    goals: foundGoals,
  };
}
