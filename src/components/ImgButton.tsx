import { levelTiles, playerTiles } from 'consts/consts';
import type { ButtonHTMLAttributes } from 'react';
// Проверь правильный путь к константам

export const ImgButtonVariants = {
  WALL: 'wall',
  WATER: 'water',
  FLOOR: 'floor',
  BOX: 'box',
  GOAL: 'goal',
  PLAYER: 'player',
} as const;

export type ButtonVariant = (typeof ImgButtonVariants)[keyof typeof ImgButtonVariants];

interface ImgButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant: ButtonVariant;
  isActive?: boolean;
}

const BUTTON_SIZE = 64;
const ORIGINAL_TILE_SIZE = 16;
const SCALE = BUTTON_SIZE / ORIGINAL_TILE_SIZE;

export const ImgButton = ({ className, variant, isActive, ...props }: ImgButtonProps) => {
  const tileSetUrl = '/assets/tiles/tileset.png';
  const playerTileSetUrl = '/assets/tiles/player.png';

  const isPlayer = variant === ImgButtonVariants.PLAYER;
  const imgUrl = isPlayer ? playerTileSetUrl : tileSetUrl;

  let sourceX = 0;
  let sourceY = 0;

  if (isPlayer) {
    sourceX = playerTiles.down[0].x;
    sourceY = playerTiles.down[0].y;
  } else {
    const tileConfig = levelTiles[variant as keyof typeof levelTiles];
    if (tileConfig) {
      sourceX = tileConfig.x;
      sourceY = tileConfig.y;
    }
  }

  const backgroundPosition = `-${sourceX * SCALE}px -${sourceY * SCALE}px`;

  return (
    <button
      {...props}
      type="button"
      style={{
        width: `${BUTTON_SIZE}px`,
        height: `${BUTTON_SIZE}px`,
        backgroundImage: `url(${imgUrl})`,
        backgroundPosition: backgroundPosition,
        backgroundSize: isPlayer ? `${52 * SCALE}px auto` : `${80 * SCALE}px auto`,
      }}
      className={`
        inline-block 
        [image-rendering:pixelated] 
        bg-no-repeat 
        border-2 
        transition-all 
        duration-100 
        cursor-pointer
        ${
          isActive
            ? 'border-[#7b9d25] bg-stone-200 border-b-4 -translate-y-0.5 shadow-md'
            : 'border-[#341d27] bg-stone-50 hover:bg-stone-100 border-b-6 active:border-b-2 active:translate-y-1'
        } 
        ${className || ''}
      `}
    />
  );
};
