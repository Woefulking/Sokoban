import { levelTiles } from '../consts/consts';
import type { BlockType, Position } from '../types/types';

export function getWallTile(floor: BlockType[][], x: number, y: number) {
  const up = floor[y - 1]?.[x] === '#';
  const down = floor[y + 1]?.[x] === '#';
  const left = floor[y]?.[x - 1] === '#';
  const right = floor[y]?.[x + 1] === '#';

  const mask = +up * 1 + +down * 2 + +left * 4 + +right * 8;

  const wallMap: { [key: number]: Position } = {
    0: levelTiles.wall,

    1: levelTiles.wallHorizontal,
    2: levelTiles.wall,
    4: levelTiles.wallHorizontal,
    8: levelTiles.wallHorizontal,

    3: levelTiles.wallCorner,
    12: levelTiles.wallHorizontal,

    5: levelTiles.wallRight,
    9: levelTiles.wallHorizontal,
    6: levelTiles.wall,
    10: levelTiles.wall,

    7: levelTiles.wallHorizontal,
    11: levelTiles.wallHorizontal,
    13: levelTiles.wallHorizontal,
    14: levelTiles.wall,
    15: levelTiles.wall,
  };

  return wallMap[mask] || levelTiles.wall;
}

export function getWaterTile(floor: BlockType[][], x: number, y: number) {
  const up = floor[y - 1]?.[x] === '~';
  const down = floor[y + 1]?.[x] === '~';
  const left = floor[y]?.[x - 1] === '~';
  const right = floor[y]?.[x + 1] === '~';

  const mask = +up * 1 + +down * 2 + +left * 4 + +right * 8;

  const waterMap: { [key: number]: Position } = {
    0: levelTiles.waterFloor,
    2: levelTiles.waterFloor,
    4: levelTiles.waterFloor,
    8: levelTiles.waterFloor,
    12: levelTiles.waterFloor,

    6: levelTiles.waterFloor,
    10: levelTiles.waterFloor,
  };

  return waterMap[mask] || levelTiles.water;
}
