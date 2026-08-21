import { Button, ButtonVariants } from 'components/Button';

interface MenuProps {
  onPlay: () => void;
  onOpenEditor: () => void;
  onOpenCustom: () => void;
}

export const Menu = ({ onPlay, onOpenEditor, onOpenCustom }: MenuProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-screen min-h-screen gap-4 p-6">
      <h1 className="text-6xl md:text-7xl xl:text-[120px] font-black tracking-wider text-white drop-shadow-[0_6px_0_#341d27] paint-order-normal [text-shadow:-2px_-2px_0_#341d27,2px_-2px_0_#341d27,-2px_2px_0_#341d27,2px_2px_0_#341d27]">
        Sokoban
      </h1>

      <div className="lg:gap-4 flex flex-col items-center w-80 h-71 sm:w-96 gap-4 bg-[#757d90] border-4 border-[#341d27] rounded-3xl p-6 md:p-8 shadow-[0_10px_0_0_#341d27]">
        <Button type="button" variant={ButtonVariants.GREEN} onClick={onPlay}>
          Play
        </Button>
        <Button type="button" variant={ButtonVariants.ORANGE} onClick={onOpenEditor}>
          Editor
        </Button>

        <Button type="button" variant={ButtonVariants.BLUE} onClick={onOpenCustom}>
          Custom
        </Button>
      </div>
    </div>
  );
};
