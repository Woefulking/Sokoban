import type { BlockType } from '../types/types';

export function isPlayerPlaced(level: BlockType[][]): Boolean {
  return level.some((row) => row.includes('@'));
}

export function checkBlock(floor: BlockType[][], block: BlockType, y: number, x: number) {
  const floorBlock = floor[y][x];

  if (block === '@' || block === '$') {
    if (floorBlock === '#' || floorBlock === '~') {
      return false;
    }
  }

  return true;
}

export function resizeGrid(
  oldGrid: BlockType[][],
  newWidth: number,
  newHeight: number,
  defaultValue: string = ''
): BlockType[][] {
  return Array.from({ length: newHeight }, (_, y) => {
    return Array.from({ length: newWidth }, (_, x) => {
      return oldGrid[y] && oldGrid[y][x] !== undefined ? oldGrid[y][x] : defaultValue;
    });
  }) as BlockType[][];
}

export const validateLevel = (editorFloor: BlockType[][], editorLevel: BlockType[][]): boolean => {
  const playerExists = editorLevel.some((row) => row.includes('@'));
  if (!playerExists) {
    alert('Error: There must be one player on the level.');
    return false;
  }

  const boxesCount = editorLevel.flat().filter((cell) => cell === '$').length;

  const goalsCount = editorFloor.flat().filter((cell) => cell === '.').length;

  if (boxesCount === 0 || goalsCount === 0) {
    alert('Error: The level must contain at least one box and one target!');
    return false;
  }

  if (boxesCount !== goalsCount) {
    alert(
      `Error: The number of boxes (${boxesCount}) must match the number of targets. (${goalsCount})!`
    );
    return false;
  }

  return true;
};

export function mergeEditorLevel(
  editorFloor: BlockType[][],
  editorLevel: BlockType[][]
): BlockType[][] {
  return editorFloor.map((row, rowIndex) => {
    return row.map((floorItem, colIndex) => {
      const levelItem = editorLevel[rowIndex][colIndex];

      return levelItem !== '' ? levelItem : floorItem;
    });
  });
}
