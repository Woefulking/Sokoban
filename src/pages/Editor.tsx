import { useEffect, useReducer, useRef, useState } from 'react';
import { EditorReducer, initialState } from '../reducers/editorReducer';
import { TILE_SIZE } from '../consts/consts';
import { mergeEditorLevel, validateLevel } from '../utils/editorUtils';
import { useImage } from '../hooks/useImage';
import { drawLevel } from '../utils/drawUtils';
import type { PlayerPosition, Position } from '../types/types';
import { Button, ButtonVariants } from 'components/Button';
import { ImgButton, ImgButtonVariants } from 'components/ImgButton';

interface EditorProps {
  onBack: () => void;
}

export const Editor = ({ onBack }: EditorProps) => {
  const [state, dispatch] = useReducer(EditorReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const tileSet = useImage('/assets/tiles/tileset.png');
  const playerTileSet = useImage('/assets/tiles/player.png');

  const [inputWidth, setInputWidth] = useState<number>(10);
  const [inputHeight, setInputHeight] = useState<number>(10);

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [previewBoxes, setPreviewBoxes] = useState<Position[]>([]);
  const [previewPlayer, setPreviewPlayer] = useState<PlayerPosition | null>(null);

  const [isCanvasVisible, setIsCanvasVisible] = useState<boolean>(false);

  const handleCreateGrid = () => {
    setIsCanvasVisible(true);
    dispatch({
      type: 'initGrid',
      payload: { width: inputWidth, height: inputHeight },
    });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const gridX = Math.floor((event.clientX - rect.left) / TILE_SIZE);
    const gridY = Math.floor((event.clientY - rect.top) / TILE_SIZE);

    dispatch({ type: 'startDrawing', payload: { x: gridX, y: gridY } });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const gridX = Math.floor((event.clientX - rect.left) / TILE_SIZE);
    const gridY = Math.floor((event.clientY - rect.top) / TILE_SIZE);

    dispatch({ type: 'updateDrawing', payload: { x: gridX, y: gridY } });
  };

  const handleMouseUp = () => {
    if (!state.isDrawing) return;
    dispatch({ type: 'stopDrawing' });
  };

  const handleSaveLevel = async () => {
    if (!validateLevel(state.editorFloor, state.editorLevel)) return;

    const mergedLevel = mergeEditorLevel(state.editorFloor, state.editorLevel);

    const convertedEditorLevel = mergedLevel
      .map((row) => row.join(''))
      .join('\n')
      .replaceAll('_', ' ');

    try {
      const options = {
        suggestedName: 'custom-level.txt',
        types: [
          {
            description: 'Sokoban Custom Level',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      };

      const handle = await (window as any).showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(convertedEditorLevel);
      await writable.close();

      alert('Level successfully saved');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Save error', err);
      }
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewMode) {
      setIsPreviewMode(false);
    } else {
      if (!validateLevel(state.editorFloor, state.editorLevel)) return;

      const boxes: Position[] = [];

      state.editorLevel.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === '$') {
            boxes.push({ x, y });
          }
        });
      });

      let player: PlayerPosition | null = null;
      state.editorLevel.forEach((row, y) => {
        const x = row.indexOf('@');
        if (x !== -1) player = { x, y, direction: 'down', frame: 0 };
      });

      setPreviewBoxes(boxes);
      setPreviewPlayer(player);
      setIsPreviewMode(true);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !tileSet || !playerTileSet) return;

    if (isPreviewMode) {
      drawLevel(
        ctx,
        canvas,
        tileSet,
        playerTileSet,
        state.editorFloor,
        previewBoxes,
        previewPlayer
      );
    } else {
      const editorBoxes: Position[] = [];

      state.editorLevel.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === '$') {
            editorBoxes.push({ x, y });
          }
        });
      });

      let editorPlayer: PlayerPosition | null = null;
      state.editorLevel.forEach((row, y) => {
        const x = row.indexOf('@');
        if (x !== -1) editorPlayer = { x, y, direction: 'down', frame: 0 };
      });

      drawLevel(ctx, canvas, tileSet, playerTileSet, state.editorFloor, editorBoxes, editorPlayer, {
        isDrawing: state.isDrawing,
        startPosition: state.startPosition,
        endPosition: state.endPosition,
        eraserMode: state.eraserMode,
      });
    }
  }, [
    state.editorFloor,
    state.editorLevel,
    state.isDrawing,
    state.startPosition,
    state.endPosition,
    state.eraserMode,
    isPreviewMode,
    previewBoxes,
    previewPlayer,
  ]);

  useEffect(() => {
    if (!isPreviewMode || !previewPlayer) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }

      let dx = 0;
      let dy = 0;
      let dir = previewPlayer.direction;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          dy = -1;
          dir = 'up';
          break;
        case 'ArrowDown':
        case 'KeyS':
          dy = 1;
          dir = 'down';
          break;
        case 'ArrowLeft':
        case 'KeyA':
          dx = -1;
          dir = 'left';
          break;
        case 'ArrowRight':
        case 'KeyD':
          dx = 1;
          dir = 'right';
          break;
        default:
          return;
      }

      const newX = previewPlayer.x + dx;
      const newY = previewPlayer.y + dy;

      if (
        newY >= 0 &&
        newY < state.editorFloor.length &&
        newX >= 0 &&
        newX < state.editorFloor[newY].length
      ) {
        const block = state.editorFloor[newY][newX];
        if (block === '#' || block === '~') return;
      }

      const boxIndex = previewBoxes.findIndex((b) => b.x === newX && b.y === newY);
      if (boxIndex !== -1) {
        const nextBoxX = newX + dx;
        const nextBoxY = newY + dy;

        const targetBlock = state.editorFloor[nextBoxY]?.[nextBoxX];
        const hasAnotherBox = previewBoxes.some((b) => b.x === nextBoxX && b.y === nextBoxY);

        if (targetBlock === '#' || targetBlock === '~' || hasAnotherBox) return;

        const updatedBoxes = previewBoxes.map((b, idx) =>
          idx === boxIndex ? { x: nextBoxX, y: nextBoxY } : b
        );
        setPreviewBoxes(updatedBoxes);
      }

      setPreviewPlayer({
        x: newX,
        y: newY,
        direction: dir,
        frame: (previewPlayer.frame + 1) % 3,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, previewPlayer, previewBoxes, state.editorFloor]);

  return (
    <div className="md:flex-row md:pt-6 relative flex flex-col items-center justify-center min-h-screen gap-8 p-6 pt-24">
      <button
        type="button"
        className="top-6 left-6 rounded-2xl bg-[#25859d] hover:bg-[#25709d] border-2 border-b-6 border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md px-6 py-3 text-2xl font-black transition-all absolute z-50"
        onClick={onBack}
      >
        Back
      </button>

      <div className="absolute top-1/2 -translate-y-1/2 left-6 flex flex-col items-stretch w-full max-w-sm gap-6 bg-[#757d90] border-4 border-[#341d27] rounded-3xl p-6 shadow-[0_10px_0_0_#341d27] z-10">
        <div className="flex flex-col gap-2">
          <div className="text-amber-50 text-lg font-black tracking-wider uppercase drop-shadow-[0_1px_0_#341d27] [text-shadow:-1px_-1px_0_#341d27,1px_-1px_0_#341d27]">
            Grid Size
          </div>
          <div className="flex flex-row items-center w-full gap-3">
            <input
              type="number"
              placeholder="W"
              value={inputWidth}
              className="w-full rounded-xl border-2 border-b-4 border-[#341d27] bg-stone-50 px-2 py-2 text-center text-xl font-black text-[#341d27] outline-none focus:bg-white transition-colors"
              onChange={(e) => setInputWidth(Number(e.target.value))}
            />
            <span className="font-black text-[#341d27] text-xl">×</span>
            <input
              type="number"
              placeholder="H"
              value={inputHeight}
              className="w-full rounded-xl border-2 border-b-4 border-[#341d27] bg-stone-50 px-2 py-2 text-center text-xl font-black text-[#341d27] outline-none focus:bg-white transition-colors"
              onChange={(e) => setInputHeight(Number(e.target.value))}
            />
            <div className="min-w-28">
              <Button
                type="button"
                variant={ButtonVariants.BLUE}
                onClick={handleCreateGrid}
                className="min-w-24!"
              >
                Create
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-amber-50 text-lg font-black tracking-wider uppercase drop-shadow-[0_1px_0_#341d27] [text-shadow:-1px_-1px_0_#341d27,1px_-1px_0_#341d27]">
            Pallete Tools
          </div>
          <div className="grid grid-cols-3 gap-3 bg-[#45465e] border-2 border-[#341d27] p-3 rounded-2xl shadow-inner">
            <ImgButton
              variant={ImgButtonVariants.WALL}
              isActive={state.activeBlock === '#' && !state.eraserMode}
              onClick={() => dispatch({ type: 'setActiveBlock', payload: '#' })}
            />
            <ImgButton
              variant={ImgButtonVariants.WATER}
              isActive={state.activeBlock === '~' && !state.eraserMode}
              onClick={() => dispatch({ type: 'setActiveBlock', payload: '~' })}
            />
            <ImgButton
              variant={ImgButtonVariants.FLOOR}
              isActive={state.activeBlock === '_' && !state.eraserMode}
              onClick={() => dispatch({ type: 'setActiveBlock', payload: '_' })}
            />
            <ImgButton
              variant={ImgButtonVariants.BOX}
              isActive={state.activeBlock === '$' && !state.eraserMode}
              onClick={() => dispatch({ type: 'setActiveBlock', payload: '$' })}
            />
            <ImgButton
              variant={ImgButtonVariants.GOAL}
              isActive={state.activeBlock === '.' && !state.eraserMode}
              onClick={() => dispatch({ type: 'setActiveBlock', payload: '.' })}
            />
            <ImgButton
              variant={ImgButtonVariants.PLAYER}
              isActive={state.activeBlock === '@' && !state.eraserMode}
              onClick={() => dispatch({ type: 'setActiveBlock', payload: '@' })}
            />
          </div>
        </div>

        <div className="flex flex-row w-full gap-3">
          <button
            id="eraser"
            type="button"
            className={`w-full rounded-2xl border-2 border-b-6 border-[#341d27] py-2 text-xl font-black transition-all ${
              state.eraserMode
                ? 'bg-red-500 hover:bg-red-600 text-white border-b-2 translate-y-1'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 active:border-b-2 active:translate-y-1'
            }`}
            onClick={() => dispatch({ type: 'toggleEraser' })}
          >
            {state.eraserMode ? 'Eraser: ON' : 'Use Eraser'}
          </button>
          <button
            id="eraseAll"
            type="button"
            className="w-full rounded-2xl bg-[#a54d34] hover:bg-[#6a3931] border-2 border-b-6 border-[#341d27] py-2 text-xl font-black text-white active:border-b-2 active:translate-y-1 transition-colors"
            onClick={() => dispatch({ type: 'clearGrid' })}
          >
            Clear All
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t-2 border-[#341d27]/20">
          <Button
            id="preview"
            type="button"
            variant={ButtonVariants.GREEN}
            onClick={handleTogglePreview}
          >
            {isPreviewMode ? 'Back to Editor' : 'Play Preview'}
          </Button>
          <Button
            id="saveLevel"
            type="button"
            variant={ButtonVariants.ORANGE}
            onClick={handleSaveLevel}
          >
            Save Level Map
          </Button>
        </div>
      </div>

      {isCanvasVisible && (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="p-3 bg-[#45465e] border-4 border-[#341d27] rounded-3xl shadow-[0_8px_0_0_#341d27]">
            <canvas
              ref={canvasRef}
              onMouseDown={!isPreviewMode ? handleMouseDown : undefined}
              onMouseMove={!isPreviewMode ? handleMouseMove : undefined}
              onMouseUp={!isPreviewMode ? handleMouseUp : undefined}
              className="block cursor-crosshair bg-[#45465e]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
