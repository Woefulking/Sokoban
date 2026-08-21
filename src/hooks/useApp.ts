import { useEffect, useReducer } from 'react';
import { AppReducer, initialState } from 'reducers/appReducer';
import type { ScreenType } from 'types/types';
import { getSavedAppData } from 'utils/getSavedAppData';

export function useApp() {
  const [state, dispatch] = useReducer(AppReducer, initialState, getSavedAppData);

  const changeScreen = (screen: ScreenType) => {
    dispatch({ type: 'changeScreen', payload: screen });
  };

  const selectLevel = (level: number) => {
    dispatch({ type: 'selectLevel', payload: level });
  };

  const unlockNextLevel = () => {
    dispatch({ type: 'unlockNextLevel' });
  };

  useEffect(() => {
    const currentPath = window.location.pathname.replace('/', '');
    if (currentPath !== state.screen) {
      window.history.pushState({}, '', `/${state.screen}`);
    }
  }, [state.screen]);

  useEffect(() => {
    const handlePopState = () => {
      const pathScreen = window.location.pathname.replace('/', '') as ScreenType;
      const validScreens: ScreenType[] = ['menu', 'game', 'editor', 'settings', 'custom', 'splash'];

      if (validScreens.includes(pathScreen)) {
        changeScreen(pathScreen);
      } else {
        changeScreen('menu');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'savedAppState',
      JSON.stringify({
        ...state,
      })
    );
  }, [state]);

  return { state, changeScreen, selectLevel, unlockNextLevel };
}
