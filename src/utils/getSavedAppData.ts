import { initialState } from 'reducers/appReducer';
import type { AppState } from '../types/types';

export const getSavedAppData = (): AppState => {
  try {
    const savedState = localStorage.getItem('savedAppState');
    if (!savedState) return initialState;

    const parsedState = JSON.parse(savedState);

    return {
      ...parsedState,
      // screen: 'menu',
    };
  } catch {
    return initialState;
  }
};
