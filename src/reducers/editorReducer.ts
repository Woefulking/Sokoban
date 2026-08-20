import type { BlockType, EditorActions, EditorState } from '../types/types';
import { checkBlock, isPlayerPlaced, resizeGrid } from '../utils/editorUtils';
import {
  convertWallsToWater,
  findOuterWalls,
  findPlayerOnLevel,
  floorFill,
} from '../utils/gameUtils';

export const initialState: EditorState = {
  editorFloor: [],
  editorLevel: [],
  activeBlock: '#',
  eraserMode: false,
  isDrawing: false,
  startPosition: null,
  endPosition: null,
};
export function EditorReducer(state: EditorState, action: EditorActions): EditorState {
  switch (action.type) {
    case 'initGrid': {
      const { width, height } = action.payload;

      const newEditorFloor: BlockType[][] = resizeGrid(state.editorFloor, width, height, '_');
      const newEditorLevel = resizeGrid(state.editorLevel, width, height, '');

      return {
        ...state,
        editorFloor: newEditorFloor,
        editorLevel: newEditorLevel,
      };
    }
    case 'loadLevelToEditor': {
      const rawText = action.payload;
      if (!rawText || rawText.trim() === '') return state;

      const lines = rawText.split(/\r?\n/);
      const cols = Math.max(...lines.map((line) => line.length));
      let parsedMatrix = lines.map((line) => line.padEnd(cols, ' ').split('')) as BlockType[][];

      const tempPlayer = findPlayerOnLevel(parsedMatrix);
      if (tempPlayer) {
        parsedMatrix = floorFill(parsedMatrix, tempPlayer);

        const outerWalls = findOuterWalls(parsedMatrix);
        parsedMatrix = convertWallsToWater(parsedMatrix, outerWalls);
      }

      const height = parsedMatrix.length;
      const width = parsedMatrix[0].length;

      const newEditorFloor = Array.from({ length: height }, () =>
        Array(width).fill('')
      ) as BlockType[][];
      const newEditorLevel = Array.from({ length: height }, () =>
        Array(width).fill('')
      ) as BlockType[][];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const char = parsedMatrix[y][x];

          switch (char) {
            case '#': {
              newEditorFloor[y][x] = '#';
              break;
            }
            case '~': {
              newEditorFloor[y][x] = '~';
              break;
            }
            case '$': {
              newEditorFloor[y][x] = '_';
              newEditorLevel[y][x] = '$';
              break;
            }
            case '@': {
              newEditorFloor[y][x] = '_';
              newEditorLevel[y][x] = '@';
              break;
            }
            case '.': {
              newEditorFloor[y][x] = '.';
              break;
            }
            case '_': {
              newEditorFloor[y][x] = '_';
              break;
            }
            default:
              break;
          }
        }
      }

      return {
        ...state,
        editorFloor: newEditorFloor,
        editorLevel: newEditorLevel,
        isDrawing: false,
        startPosition: null,
        endPosition: null,
      };
    }
    case 'setActiveBlock': {
      const newBlock = action.payload;

      return {
        ...state,
        activeBlock: newBlock,
      };
    }
    case 'toggleEraser': {
      const newStatus = !state.eraserMode;
      return {
        ...state,
        eraserMode: newStatus,
      };
    }

    case 'startDrawing': {
      const coords = action.payload;

      return {
        ...state,
        isDrawing: true,
        startPosition: coords,
        endPosition: coords,
      };
    }

    case 'updateDrawing': {
      if (!state.isDrawing) return state;

      const coords = action.payload;

      return {
        ...state,
        endPosition: coords,
      };
    }

    case 'stopDrawing': {
      if (!state.isDrawing || !state.startPosition || !state.endPosition) {
        return state;
      }

      const { x: startX, y: startY } = state.startPosition;
      const { x: endX, y: endY } = state.endPosition;

      const updatedFloor = state.editorFloor.map((row) => [...row]);
      const updatedLevel = state.editorLevel.map((row) => [...row]);

      const levelElements: BlockType[] = ['$', '@'];
      const floorElements: BlockType[] = ['_', '~', '#', '.'];

      const applyBlock = (x: number, y: number) => {
        if (y < 0 || y >= updatedFloor.length || x < 0 || x >= updatedFloor[0].length) return;

        if (state.eraserMode) {
          if (updatedLevel[y][x] !== '') {
            updatedLevel[y][x] = '';
          } else if (updatedFloor[y][x] !== '') {
            updatedFloor[y][x] = '';
          }
        } else {
          if (state.activeBlock === '@' && isPlayerPlaced(updatedLevel)) return state;

          if (levelElements.includes(state.activeBlock)) {
            if (!checkBlock(updatedFloor, state.activeBlock, y, x)) return state;
            updatedLevel[y][x] = state.activeBlock;
          }

          if (floorElements.includes(state.activeBlock)) {
            updatedFloor[y][x] = state.activeBlock;
          }
        }
      };

      const dx = Math.abs(endX - startX);
      const dy = Math.abs(endY - startY);

      if (dx > dy) {
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        for (let i = minX; i <= maxX; i++) {
          applyBlock(i, startY);
        }
      } else {
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        for (let j = minY; j <= maxY; j++) {
          applyBlock(startX, j);
        }
      }

      return {
        ...state,
        isDrawing: false,
        startPosition: null,
        endPosition: null,
        editorFloor: updatedFloor,
        editorLevel: updatedLevel,
      };
    }

    case 'clearGrid': {
      const height = state.editorFloor.length;
      const width = state.editorFloor[0].length;

      const clearFloor = Array.from({ length: height }, () => Array(width).fill(''));
      const clearLevel = Array.from({ length: height }, () => Array(width).fill(''));

      return {
        ...state,
        editorFloor: clearFloor,
        editorLevel: clearLevel,
      };
    }

    default:
      return state;
  }
}
