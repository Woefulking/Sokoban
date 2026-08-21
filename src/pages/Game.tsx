import { useEffect, useReducer, useRef, useState } from 'react';
import { GameReducer, initialState } from 'reducers/gameReducer';
import { useImage } from 'hooks/useImage';
import { drawLevel } from 'utils/drawUtils';
import { TOTAL_LEVELS } from 'consts/consts';
import { useGameKeyboard } from 'hooks/useGameKeyboard';

interface GameProps {
  currentLevel: number;
  unlockedLevels: number[];
  onLevelUnlock: () => void;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}
export const Game = ({
  currentLevel,
  unlockedLevels,
  onLevelUnlock,
  onSelectLevel,
  onBack,
}: GameProps) => {
  const [state, dispatch] = useReducer(GameReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showLevelMenu, setShowLevelMenu] = useState<boolean>(true);

  const tileSet = useImage('/assets/tiles/tileset.png');
  const playerTileSet = useImage('/assets/tiles/player.png');

  useGameKeyboard(dispatch, true);

  const loadLevelData = async (levelNumber: number) => {
    try {
      const response = await fetch(`/assets/levels/${levelNumber}.txt`);
      if (!response.ok) throw new Error('Level not found');
      const textData = await response.text();

      dispatch({ type: 'initLevel', payload: { rawText: textData } });
    } catch (error) {
      throw new Error('Loading error');
    }
  };

  const handleSelectLevel = async (levelNumber: number) => {
    onSelectLevel(levelNumber);
    setShowLevelMenu(false);
    await loadLevelData(levelNumber);
  };

  const handleNextLevel = async () => {
    const nextLevel = currentLevel + 1;
    onLevelUnlock();
    onSelectLevel(nextLevel);
    await loadLevelData(nextLevel);
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

  return (
    <div className="relative flex items-center justify-center w-screen min-h-screen p-6">
      <button
        type="button"
        className="top-6 left-6 rounded-2xl bg-[#25859d] hover:bg-[#25709d] border-2 border-b-6 border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md px-6 py-3 text-2xl font-black transition-all absolute z-50"
        onClick={handleBackClick}
      >
        Back
      </button>

      {showLevelMenu ? (
        <div className="z-10 flex flex-col items-center w-full max-w-4xl gap-6 mt-16">
          <h2 className="text-4xl md:text-5xl xl:text-[80px] font-black tracking-wide text-white drop-shadow-[0_4px_0_#341d27] [text-shadow:-2px_-2px_0_#341d27,2px_-2px_0_#341d27,-2px_2px_0_#341d27,2px_2px_0_#341d27]">
            Select Level
          </h2>

          <div className="flex flex-row flex-wrap justify-center max-w-3xl gap-4 bg-[#757d90] border-4 border-[#341d27] rounded-3xl p-6 md:p-8 shadow-[0_10px_0_0_#341d27]">
            {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((level) => {
              const isUnlocked = unlockedLevels.includes(level);

              return (
                <button
                  key={level}
                  type="button"
                  disabled={!isUnlocked}
                  className={`w-16 h-16 text-2xl font-black rounded-2xl border-2 border-[#341d27] transition-all duration-150 ${
                    isUnlocked
                      ? 'bg-[#7b9d25] hover:bg-[#5b851e] text-white border-b-6 active:border-b-2 active:translate-y-1 hover:shadow-md cursor-pointer'
                      : 'bg-[#45465e]/40 border-b-2 text-[#757d90] opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => handleSelectLevel(level)}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="top-1/2 -translate-y-1/2 left-6 border-4 border-[#341d27] bg-[#757d90] rounded-2xl p-4 shadow-[0_6px_0_0_#341d27] flex flex-col items-center gap-3 absolute z-40 max-w-60 select-none">
            <div className="text-amber-50 text-2xl font-black tracking-wider drop-shadow-[0_2px_0_#341d27] [text-shadow:-1px_-1px_0_#341d27,1px_-1px_0_#341d27] uppercase">
              Controls
            </div>

            <div className="justify-items-center grid w-full grid-cols-3 gap-2">
              <div></div>

              <div className="flex flex-col items-center justify-center w-16 h-16 bg-stone-50 border-2 border-b-4 border-[#341d27] rounded-xl text-[#341d27] text-lg font-black shadow-sm">
                <span>W</span>
                <span className="text-base leading-none">▲</span>
              </div>

              <div></div>

              <div className="flex flex-col items-center justify-center w-16 h-16 bg-stone-50 border-2 border-b-4 border-[#341d27] rounded-xl text-[#341d27] text-lg font-black shadow-sm">
                <span>A</span>
                <span className="text-base leading-none">◀</span>
              </div>

              <div className="flex flex-col items-center justify-center w-16 h-16 bg-stone-50 border-2 border-b-4 border-[#341d27] rounded-xl text-[#341d27] text-lg font-black shadow-sm">
                <span>S</span>
                <span className="text-base leading-none">▼</span>
              </div>

              <div className="flex flex-col items-center justify-center w-16 h-16 bg-stone-50 border-2 border-b-4 border-[#341d27] rounded-xl text-[#341d27] text-lg font-black shadow-sm">
                <span>D</span>
                <span className="text-base leading-none">▶</span>
              </div>
            </div>

            <div className="flex items-center justify-center w-full px-2 py-1 bg-[#45465e] border-2 border-[#341d27] rounded-xl text-white text-lg font-bold mt-1">
              <span className="font-black text-[#amber-400] mr-1">Z</span> — Undo Move
            </div>
          </div>
          <div className="z-10 flex flex-col items-center justify-center gap-6 mt-16">
            <div className="px-6 py-2 bg-[#a54d34] border-2 border-b-4 border-[#341d27] text-white text-2xl font-black rounded-xl shadow-sm">
              Level {currentLevel}
            </div>

            <div className="p-3 bg-[#45465e] border-4 border-[#341d27] rounded-3xl shadow-[0_8px_0_0_#341d27]">
              <canvas ref={canvasRef} className="rounded-xl block"></canvas>
            </div>

            <div className="flex flex-row items-center gap-4">
              <button
                type="button"
                className="rounded-2xl bg-[#25859d] hover:bg-[#25709d] border-2 border-b-6 border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md px-6 py-3 text-2xl font-black transition-colors duration-150"
                onClick={() => setShowLevelMenu(true)}
              >
                Levels
              </button>
              <button
                type="button"
                className="rounded-2xl bg-[#a54d34] hover:bg-[#6a3931] border-2 border-b-6 border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md px-6 py-3 text-2xl font-black transition-colors duration-150"
                onClick={() => dispatch({ type: 'resetLevel' })}
              >
                Restart
              </button>
              {state.isWon && (
                <button
                  type="button"
                  className="rounded-2xl bg-[#7b9d25] hover:bg-[#5b851e] border-2 border-b-6 border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md px-6 py-3 text-2xl font-black transition-colors duration-150"
                  onClick={handleNextLevel}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
