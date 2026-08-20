import type { AppActions, AppState } from '../types/types';

export const initialAppState: AppState = {
  screen: 'menu',
  currentLevel: 1,
  totalLeveles: 50,
  unlockedLevels: [1],
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
