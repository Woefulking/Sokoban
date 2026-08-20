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
    alert('Ошибка: На уровне должен быть один игрок (@)!');
    return false;
  }

  const boxesCount = editorLevel.flat().filter((cell) => cell === '$').length;

  const goalsCount = editorFloor.flat().filter((cell) => cell === '.').length;

  if (boxesCount === 0 || goalsCount === 0) {
    alert('Ошибка: На уровне должна быть минимум одна коробка и одна цель!');
    return false;
  }

  if (boxesCount !== goalsCount) {
    alert(
      `Ошибка: Количество коробок (${boxesCount}) должно совпадать с количеством целей (${goalsCount})!`
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
