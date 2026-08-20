import { useEffect, useReducer, useRef, useState } from 'react';
import { GameReducer, initialState } from '../reducers/gameReducer';
import { useImage } from '../hooks/useImage';
import { drawLevel } from '../utils/drawUtils';
import type { DirectionType } from '../types/types';
import { TOTAL_LEVELS } from '../consts/consts';

interface GameProps {
  currentLevel: number;
  unlockedLevels: number[];
  onLevelUnlock: () => void;
  onBack: () => void;
}
export const Game = ({ currentLevel, unlockedLevels, onLevelUnlock, onBack }: GameProps) => {
  const [state, dispatch] = useReducer(GameReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showLevelMenu, setShowLevelMenu] = useState<boolean>(true);

  const tileSet = useImage('./src/assets/tileset.png');
  const playerTileSet = useImage('./src/assets/player.png');

  const handleStartLevel = async (levelNumber = currentLevel) => {
    try {
      const response = await fetch(`./src/assets/levels/${levelNumber}.txt`);
      if (!response.ok) throw new Error('Уровень не найден');

      const textData = await response.text();

      dispatch({ type: 'initLevel', payload: { rawText: textData } });
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleBackClick = () => {
    if (showLevelMenu) {
      onBack();
    } else {
      setShowLevelMenu(true);
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

  useEffect(() => {
    if (!state.isWon) return;
    onLevelUnlock();
    const nextLevel = currentLevel + 1;
    handleStartLevel(nextLevel);
  }, [state.isWon]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <button
        type="button"
        className="top-[10%] left-4 rounded-xl absolute p-4 text-xl text-white bg-black"
        onClick={handleBackClick}
      >
        Back
      </button>
      {showLevelMenu ? (
        <div className="flex flex-row flex-wrap max-w-6xl gap-4">
          {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((level) => {
            const isUnlocked = unlockedLevels.includes(level);
            return (
              <button
                key={level}
                type="button"
                className={`w-16 h-16 text-xl font-bold rounded-xl transition text-white ${
                  isUnlocked ? 'bg-green-600 scale-105' : 'bg-black hover:bg-zinc-800'
                }`}
                onClick={() => {
                  setShowLevelMenu(false);
                  handleStartLevel(level);
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-screen h-screen gap-4">
          <canvas ref={canvasRef} id="canvas"></canvas>
          <div className="flex flex-row items-center gap-4">
            <button
              id="restart"
              type="button"
              className="rounded-xl p-4 text-xl text-white bg-black"
              onClick={() => handleStartLevel(currentLevel)}
            >
              Start the game
            </button>
            <button
              id="restart"
              type="button"
              className="rounded-xl p-4 text-xl text-white bg-black"
              onClick={() => dispatch({ type: 'resetLevel' })}
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
