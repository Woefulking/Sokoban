import React, { useReducer, useRef, useEffect } from 'react';
import { useImage } from '../hooks/useImage';
import { GameReducer, initialState } from 'reducers/gameReducer';
import { drawLevel } from 'utils/drawUtils';
import { useGameKeyboard } from 'hooks/useGameKeyboard';
import { Button, ButtonVariants } from 'components/Button';

interface CustomProps {
  onBack: () => void;
}

export const Custom = ({ onBack }: CustomProps) => {
  const [state, dispatch] = useReducer(GameReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const tileSet = useImage('/assets/tiles/tileset.png');
  const playerTileSet = useImage('/assets/tiles/player.png');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileText = e.target?.result as string;
      if (!fileText || fileText.trim() === '') return;

      dispatch({ type: 'initLevel', payload: { rawText: fileText } });
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tileSet || !playerTileSet) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawLevel(ctx, canvas, tileSet, playerTileSet, state.floor, state.boxes, state.playerPosition);
  }, [state.floor, state.boxes, state.playerPosition, tileSet, playerTileSet]);

  useEffect(() => {
    if (state.isWon) {
      setTimeout(() => alert('Вы прошли уровень'), 100);
    }
  }, [state.isWon, onBack]);

  const isLevelLoaded = state.floor && state.floor.length > 0;
  const isKeyboardActive = state.floor && state.floor.length > 0 && !state.isWon;
  useGameKeyboard(dispatch, isKeyboardActive);

  return (
    <div className="relative flex flex-col items-center justify-center w-screen h-screen gap-6 text-white">
      <button
        type="button"
        className="top-6 left-6 rounded-2xl bg-[#25859d] hover:bg-[#25709d] border-2 border-b-6 border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md px-6 py-3 text-2xl font-black transition-all absolute z-50"
        onClick={onBack}
      >
        Back
      </button>
      <div
        className={`p-3 bg-[#45465e] border-4 border-[#341d27] rounded-3xl shadow-[0_8px_0_0_#341d27] ${
          isLevelLoaded ? 'block' : 'hidden'
        }`}
      >
        <canvas ref={canvasRef} className="rounded-xl block" />
      </div>

      <div
        className={`flex flex-col items-center gap-4 ${
          isLevelLoaded ? 'flex-row' : 'justify-center h-1/2'
        }`}
      >
        <input type="file" id="file-upload" accept=".txt" hidden onChange={handleFileUpload} />
        <label
          htmlFor="file-upload"
          className="cursor-pointer rounded-2xl bg-[#7b9d25] hover:bg-[#5b851e] border-2 border-b-6 text-center border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md xl:text-8 min-w-30 md:max-w-70 md:min-w-36 md:text-2xl lg:min-w-50 lg:px-4 lg:py-1 lg:text-3xl xl:min-w-62 xl:py-2 2xl:min-w-70 px-2 py-0 min-h-15 text-lg font-black w-full transition-colors duration-150"
        >
          {isLevelLoaded ? 'Upload different map' : 'Choose .txt file'}
        </label>

        {isLevelLoaded && (
          <Button
            type="button"
            variant={ButtonVariants.ORANGE}
            className="min-w-28!"
            onClick={() => dispatch({ type: 'resetLevel' })}
          >
            Restart
          </Button>
        )}
      </div>
    </div>
  );
};
