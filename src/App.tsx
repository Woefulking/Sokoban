import { useEffect, useReducer, useRef } from 'react';
import './App.css';
import { GameReducer, initialState } from './reducers/gameReducer';
import { useImage } from './hooks/useImage';
import { drawLevel } from './utils/drawUtils';
import type { DirectionType } from './types/types';

function App() {
  const [state, dispatch] = useReducer(GameReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const tileSet = useImage('./src/assets/tileset.png');
  const playerTileSet = useImage('./src/assets/player.png');

  const handleStartLevel = async () => {
    try {
      const response = await fetch('./src/assets/levels/1.txt');
      if (!response.ok) throw new Error('Уровень не найден');

      const textData = await response.text();

      dispatch({ type: 'initLevel', payload: { rawText: textData } });
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (!tileSet || !playerTileSet) return;

    drawLevel(ctx, canvas, tileSet, playerTileSet, state.floor, state.boxes, state.playerPosition);
  }, [[state.floor, state.boxes, state.playerPosition, tileSet, playerTileSet]]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyZ') {
        event.preventDefault();
        dispatch({ type: 'undoMove' });
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }

      let direction: DirectionType | null = null;

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
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen">
      <canvas ref={canvasRef} id="canvas"></canvas>
      <button
        id="restart"
        type="button"
        className="w-20 h-20 text-white bg-black"
        onClick={handleStartLevel}
      >
        Start the game
      </button>
    </div>
  );
}

export default App;
