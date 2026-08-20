import { levelTiles, playerTiles, SOURCE_TILE_SIZE, TILE_SIZE } from '../consts/consts';
import type { BlockType, EditorConfig, PlayerPosition, Position } from '../types/types';
import { getWallTile, getWaterTile } from './generalUtils';

function drawFloorBlock(
  ctx: CanvasRenderingContext2D,
  tileSet: HTMLImageElement,
  floor: BlockType[][],
  block: string,
  colIndex: number,
  rowIndex: number,
  boxes?: Position[] | null
) {
  const x = colIndex * TILE_SIZE;
  const y = rowIndex * TILE_SIZE;

  let tileX = 0;
  let tileY = 0;

  switch (block) {
    case '#': {
      const tile = getWallTile(floor, colIndex, rowIndex);
      tileX = tile.x;
      tileY = tile.y;
      break;
    }

    case '~': {
      const tile = getWaterTile(floor, colIndex, rowIndex);
      tileX = tile.x;
      tileY = tile.y;
      break;
    }

    case '.':
      const isOnGoal = boxes
        ? boxes.some((box) => box.x === colIndex && box.y === rowIndex)
        : false;
      const tile = isOnGoal ? levelTiles.boxOnGoal : levelTiles.goal;

      tileX = tile.x;
      tileY = tile.y;
      break;

    case '_':
      tileX = levelTiles.floor.x;
      tileY = levelTiles.floor.y;
      break;

    default:
      return;
  }

  ctx.drawImage(
    tileSet,
    tileX,
    tileY,
    SOURCE_TILE_SIZE,
    SOURCE_TILE_SIZE,
    x,
    y,
    TILE_SIZE,
    TILE_SIZE
  );
}

export function drawBox(ctx: CanvasRenderingContext2D, tileSet: HTMLImageElement, box: Position) {
  ctx.drawImage(
    tileSet,
    levelTiles.box.x,
    levelTiles.box.y,
    SOURCE_TILE_SIZE,
    SOURCE_TILE_SIZE,
    box.x * TILE_SIZE + 4,
    box.y * TILE_SIZE + 4,
    TILE_SIZE - 4,
    TILE_SIZE - 4
  );
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  playerTileSet: HTMLImageElement,
  player: PlayerPosition
) {
  const direction = player.direction || 'down';
  const frame = player.frame || 0;
  const playerSprite = playerTiles[direction][frame];

  ctx.drawImage(
    playerTileSet,
    playerSprite.x,
    playerSprite.y,
    12,
    14,
    player.x * TILE_SIZE + 6,
    player.y * TILE_SIZE + 4,
    TILE_SIZE - 8,
    TILE_SIZE - 8
  );
}

export function drawEditorGrid(ctx: CanvasRenderingContext2D, cols: number, rows: number) {
  const width = cols * TILE_SIZE;
  const height = rows * TILE_SIZE;

  ctx.beginPath();

  for (let x = 1; x < cols; x++) {
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, height);
  }

  for (let y = 1; y < rows; y++) {
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(width, y * TILE_SIZE);
  }

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.stroke();
}

export function drawGhostPath(ctx: CanvasRenderingContext2D, config: EditorConfig) {
  const { startPosition, endPosition, eraserMode } = config;

  if (!startPosition || !endPosition) return;

  const startX = startPosition.x;
  const startY = startPosition.y;
  const endX = endPosition.x;
  const endY = endPosition.y;

  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);

  ctx.fillStyle = eraserMode ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 120, 255, 0.5)';

  if (dx > dy) {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    for (let i = minX; i <= maxX; i++) {
      ctx.fillRect(i * TILE_SIZE, startY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  } else {
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    for (let j = minY; j <= maxY; j++) {
      ctx.fillRect(startX * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

export function drawLevel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tileSet: HTMLImageElement,
  playerTileSet: HTMLImageElement,
  floor: BlockType[][],
  boxes: Position[],
  player: PlayerPosition | null,
  editorConfig?: {
    isDrawing: boolean;
    startPosition: Position | null;
    endPosition: Position | null;
    eraserMode: boolean;
  }
) {
  if (!floor || floor.length === 0) return;

  canvas.width = floor[0].length * TILE_SIZE;
  canvas.height = floor.length * TILE_SIZE;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  floor.forEach((row, rowIndex) => {
    row.forEach((block, colIndex) => {
      drawFloorBlock(ctx, tileSet, floor, block, colIndex, rowIndex, boxes);
    });
  });

  boxes.forEach((box) => {
    drawBox(ctx, tileSet, box);
  });

  if (player) {
    drawPlayer(ctx, playerTileSet, player);
  }

  if (editorConfig) {
    drawGhostPath(ctx, editorConfig);
    drawEditorGrid(ctx, floor[0].length, floor.length);
  }
}
