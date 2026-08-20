interface MenuProps {
  onPlay: () => void;
  onOpenEditor: () => void;
}

export const Menu = ({ onPlay, onOpenEditor }: MenuProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <button type="button" className="rounded-xl p-4 text-xl text-white bg-black" onClick={onPlay}>
        Play
      </button>
      <button
        type="button"
        className="rounded-xl p-4 text-xl text-white bg-black"
        onClick={onOpenEditor}
      >
        Editor
      </button>
    </div>
  );
};
