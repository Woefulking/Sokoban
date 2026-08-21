import type { GameActions, GameState } from 'types/types';
import { initializeLevel } from 'utils/gameUtils';

export const initialState: GameState = {
  rawLevelText: null,
  floor: [],
  level: [],
  playerPosition: { x: 0, y: 0, direction: 'down', frame: 0 },
  boxes: [],
  goals: [],
  history: [{ playerPosition: { x: 0, y: 0, direction: 'down', frame: 0 }, boxes: [] }],
  isWon: false,
};

export function GameReducer(state: GameState, action: GameActions): GameState {
  switch (action.type) {
    case 'initLevel':
      const rawText = action.payload.rawText;

      if (!rawText || rawText.trim() === '') {
        return state;
      }

      const { level, floor, player, boxes, goals } = initializeLevel(rawText);

      return {
        ...state,
        rawLevelText: rawText,
        level,
        floor,
        playerPosition: player,
        boxes,
        goals,
        history: [
          {
            playerPosition: { ...player },
            boxes: boxes.map((box) => ({ ...box })),
          },
        ],
        isWon: false,
      };
    case 'movePlayer': {
      if (!state.playerPosition) return state;
      const { direction } = action.payload;

      const oldX = state.playerPosition.x;
      const oldY = state.playerPosition.y;

      let newX = oldX;
      let newY = oldY;

      switch (direction) {
        case 'up':
          newY -= 1;
          break;
        case 'down':
          newY += 1;
          break;
        case 'left':
          newX -= 1;
          break;
        case 'right':
          newX += 1;
          break;
      }

      if (
        newY >= 0 &&
        newY < state.level.length &&
        newX >= 0 &&
        newX < state.level[newY].length &&
        state.level[newY][newX] === '#'
      )
        return state;

      const dx = newX - oldX;
      const dy = newY - oldY;
      const nextX = newX + dx;
      const nextY = newY + dy;

      const boxIndex = state.boxes.findIndex((b) => b.x === newX && b.y === newY);

      let updatedBoxes = state.boxes;

      if (boxIndex !== -1) {
        if (
          nextY < 0 ||
          nextY >= state.level.length ||
          nextX < 0 ||
          nextX >= state.level[nextY].length ||
          state.level[nextY][nextX] === '#'
        ) {
          return state;
        }

        const hasAnotherBox = state.boxes.some((b) => b.x === nextX && b.y === nextY);
        if (hasAnotherBox) {
          return state;
        }

        updatedBoxes = state.boxes.map((b, index) =>
          index === boxIndex ? { x: nextX, y: nextY } : b
        );
      }

      const isWon = updatedBoxes.every((box) =>
        state.goals.some((goal) => goal.x === box.x && goal.y === box.y)
      );

      const updatedPlayerPosition = {
        x: newX,
        y: newY,
        direction: direction,
        frame: (state.playerPosition.frame + 1) % 3,
      };

      const newHistorySnapshot = {
        playerPosition: { x: oldX, y: oldY, direction, frame: state.playerPosition.frame },
        boxes: state.boxes.map((b) => ({ x: b.x, y: b.y })),
      };

      return {
        ...state,
        playerPosition: updatedPlayerPosition,
        boxes: updatedBoxes,
        history: [...state.history, newHistorySnapshot],
        isWon: isWon,
      };
    }

    case 'undoMove': {
      if (state.history.length <= 1) return state;

      const updatedHistory = [...state.history];

      const previousState = updatedHistory.pop()!;

      return {
        ...state,
        playerPosition: {
          x: previousState.playerPosition.x,
          y: previousState.playerPosition.y,
          direction: previousState.playerPosition.direction,
          frame: state.playerPosition.frame,
        },
        boxes: previousState.boxes,
        history: updatedHistory,
        isWon: false,
      };
    }
    case 'resetLevel': {
      if (!state.rawLevelText) return state;
      const { level, floor, player, boxes, goals } = initializeLevel(state.rawLevelText);
      return {
        ...state,
        level,
        floor,
        playerPosition: player,
        boxes,
        goals,
        history: [{ playerPosition: { ...player }, boxes: boxes.map((b) => ({ ...b })) }],
        isWon: false,
      };
    }
    default:
      return state;
  }
}
