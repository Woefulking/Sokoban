export type ScreenType = 'splash' | 'menu' | 'game' | 'editor' | 'custom' | 'settings';
export type BlockType = '' | ' ' | '#' | '~' | '_' | '.' | '$' | '@';
export type DirectionType = 'up' | 'down' | 'left' | 'right';

export interface AppState {
  screen: ScreenType;
  currentLevel: number;
  unlockedLevels: number[];
}

export type AppActions =
  | { type: 'changeScreen'; payload: ScreenType }
  | { type: 'selectLevel'; payload: number }
  | { type: 'unlockNextLevel' };

export interface Position {
  x: number;
  y: number;
}

export interface PlayerPosition extends Position {
  direction: DirectionType;
  frame: number;
}

export interface HistorySnapshot {
  playerPosition: PlayerPosition;
  boxes: Position[];
}

export interface GameState {
  rawLevelText: string | null;
  floor: BlockType[][];
  level: BlockType[][];
  playerPosition: PlayerPosition;
  boxes: Position[];
  goals: Position[];
  history: HistorySnapshot[];
  isWon: boolean;
}

export type GameActions =
  | { type: 'initLevel'; payload: { rawText: string } }
  | { type: 'movePlayer'; payload: { direction: DirectionType } }
  | { type: 'undoMove' }
  | { type: 'resetLevel' };

export interface EditorState {
  editorFloor: BlockType[][];
  editorLevel: BlockType[][];
  activeBlock: BlockType;
  eraserMode: boolean;
  isDrawing: boolean;
  startPosition: Position | null;
  endPosition: Position | null;
}

export type EditorActions =
  | { type: 'initGrid'; payload: { width: number; height: number } }
  | { type: 'loadLevelToEditor'; payload: string }
  | { type: 'setActiveBlock'; payload: BlockType }
  | { type: 'toggleEraser' }
  | { type: 'startDrawing'; payload: Position }
  | { type: 'updateDrawing'; payload: Position }
  | { type: 'stopDrawing' }
  | { type: 'clearGrid' };

export interface EditorConfig {
  startPosition: Position | null;
  endPosition: Position | null;
  eraserMode: boolean;
}
