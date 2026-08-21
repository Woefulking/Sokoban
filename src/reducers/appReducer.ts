import type { AppActions, AppState } from 'types/types';

export const initialState: AppState = {
  screen: 'menu',
  currentLevel: 1,
  unlockedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
};

export function AppReducer(state: AppState, action: AppActions): AppState {
  switch (action.type) {
    case 'changeScreen': {
      const newScreen = action.payload;
      return {
        ...state,
        screen: newScreen,
      };
    }
    case 'selectLevel':
      const currentLevel = action.payload;
      return {
        ...state,
        currentLevel: currentLevel,
      };
    case 'unlockNextLevel': {
      const nextLevel = state.currentLevel + 1;
      const isAlreadyUnlocked = state.unlockedLevels.includes(nextLevel);
      const updatedUnlockedLevels = isAlreadyUnlocked
        ? state.unlockedLevels
        : [...state.unlockedLevels, state.currentLevel + 1];

      return {
        ...state,
        currentLevel: nextLevel,
        unlockedLevels: updatedUnlockedLevels,
      };
    }
    default:
      return state;
  }
}
