import { useEffect } from 'react';
import type { DirectionType } from 'types/types';

type GameDispatchType = React.Dispatch<
  { type: 'movePlayer'; payload: { direction: DirectionType } } | { type: 'undoMove' }
>;

export function useGameKeyboard(dispatch: GameDispatchType, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyZ') {
        event.preventDefault();
        dispatch({ type: 'undoMove' });
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 'KeyS':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'KeyA':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'KeyD':
          direction = 'right';
          break;
      }

      if (direction) {
        dispatch({ type: 'movePlayer', payload: { direction } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isActive]);
}
