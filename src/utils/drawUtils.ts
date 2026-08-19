import { levelTiles, playerTiles, SOURCE_TILE_SIZE, TILE_SIZE } from '../consts/consts';
import type { BlockType, PlayerPosition, Position } from '../types/types';
import { getWallTile, getWaterTile } from './generalUtils';

function drawFloorBlock(
  ctx: CanvasRenderingContext2D,
  tileSet: HTMLImageElement,
  floor: BlockType[][],
  boxes: Position[],
  block: string,
  colIndex: number,
  rowIndex: number
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
      const isOnGoal = boxes.some((box) => box.x === colIndex && box.y === rowIndex);

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

function drawBox(ctx: CanvasRenderingContext2D, tileSet: HTMLImageElement, box: Position) {
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

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  playerTileSet: HTMLImageElement,
  player: PlayerPosition
) {
  if (!player || !playerTiles) return;
  const playerSprite = playerTiles[player.direction][player.frame];

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

export function drawLevel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tileSet: HTMLImageElement,
  playerTileSet: HTMLImageElement,
  floor: BlockType[][],
  boxes: Position[],
  player: PlayerPosition
) {
  const rows = floor.length;
  const cols = floor[0]?.length || 0;

  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  floor.forEach((row, rowIndex) => {
    row.forEach((block, colIndex) => {
      drawFloorBlock(ctx, tileSet, floor, boxes, block, colIndex, rowIndex);
    });
  });

  boxes.forEach((box) => {
    drawBox(ctx, tileSet, box);
  });

  drawPlayer(ctx, playerTileSet, player);
}
