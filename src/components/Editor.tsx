import { useEffect, useReducer, useRef, useState } from 'react';
import { EditorReducer, initialState } from '../reducers/editorReducer';
import { TILE_SIZE } from '../consts/consts';
import { mergeEditorLevel, validateLevel } from '../utils/editorUtils';
import { useImage } from '../hooks/useImage';
import { drawLevel } from '../utils/drawUtils';
import type { PlayerPosition, Position } from '../types/types';

export const Editor = () => {
  const [state, dispatch] = useReducer(EditorReducer, initialState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const tileSet = useImage('./src/assets/tileset.png');
  const playerTileSet = useImage('./src/assets/player.png');

  const [inputWidth, setInputWidth] = useState<number>(10);
  const [inputHeight, setInputHeight] = useState<number>(10);

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [previewBoxes, setPreviewBoxes] = useState<Position[]>([]);
  const [previewPlayer, setPreviewPlayer] = useState<PlayerPosition | null>(null);

  const handleCreateGrid = () => {
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

      alert('Уровень успешно сохранен!');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Ошибка сохранения:', err);
      }
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewMode) {
      setIsPreviewMode(false);
    } else {
      if (!validateLevel(state.editorFloor, state.editorLevel)) return;

      const boxes: Position[] = state.editorLevel.flatMap((row, y) =>
        row
          .map((cell, x) => (cell === '$' ? { x, y } : null))
          .filter((b): b is Position => b !== null)
      );

      let player: PlayerPosition | null = null;
      state.editorLevel.forEach((row, y) => {
        const x = row.indexOf('@');
        if (x !== -1) {
          player = { x, y, direction: 'down', frame: 0 };
        }
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
      const editorBoxes = state.editorLevel.flatMap((row, y) =>
        row
          .map((cell, x) => (cell === '$' ? { x, y } : null))
          .filter((b): b is Position => b !== null)
      );
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
    <div className="flex flex-row items-center w-full h-full gap-12">
      <div className="flex flex-col items-start justify-between gap-4">
        <div className="flex flex-row items-center gap-4">
          <input
            type="number"
            placeholder="Canvas Width"
            value={inputWidth}
            onChange={(e) => setInputWidth(Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Canvas Height"
            value={inputHeight}
            onChange={(e) => setInputHeight(Number(e.target.value))}
          />
          <button
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={handleCreateGrid}
          >
            Создать Структуру Уровня
          </button>
          <button
            id="saveLevel"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={handleSaveLevel}
          >
            Сохранить уровень
          </button>
          <button
            id="preview"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={handleTogglePreview}
          >
            {isPreviewMode ? 'Вернуться в Редактор' : 'Превью уровня'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <button
            data-block="#"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'setActiveBlock', payload: '#' })}
          >
            Стена
          </button>
          <button
            data-block="~"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'setActiveBlock', payload: '~' })}
          >
            Вода
          </button>
          <button
            data-block="_"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'setActiveBlock', payload: '_' })}
          >
            Пол
          </button>
          <button
            data-block="$"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'setActiveBlock', payload: '$' })}
          >
            Ящик
          </button>
          <button
            data-block="."
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'setActiveBlock', payload: '.' })}
          >
            Цель
          </button>
          <button
            data-block="@"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'setActiveBlock', payload: '@' })}
          >
            Игрок
          </button>
          <button
            id="eraser"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'toggleEraser' })}
          >
            Удалить блок
          </button>
          <button
            id="eraseAll"
            type="button"
            className="rounded-xl p-4 text-xl text-white bg-black"
            onClick={() => dispatch({ type: 'clearGrid' })}
          >
            Удалить все
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={!isPreviewMode ? handleMouseDown : undefined}
        onMouseMove={!isPreviewMode ? handleMouseMove : undefined}
        onMouseUp={!isPreviewMode ? handleMouseUp : undefined}
      />
    </div>
  );
};
