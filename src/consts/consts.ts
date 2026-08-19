const TILE_SCALE = 3;
export const SOURCE_TILE_SIZE = 16;
export const TILE_SIZE = SOURCE_TILE_SIZE * TILE_SCALE;

export const levelTiles = {
  wall: { x: 32, y: 0 },
  wallHorizontal: { x: 0, y: 0 },
  wallRight: { x: 16, y: 0 },
  wallCorner: { x: 32, y: 0 },
  goal: { x: 48, y: 0 },
  boxOnGoal: { x: 64, y: 0 },
  floor: { x: 0, y: 16 },
  waterFloor: { x: 0, y: 32 },
  water: { x: 0, y: 48 },
  box: { x: 0, y: 64 },
  bridgeHorizontal: { x: 32, y: 32 },
  bridgeVertical: { x: 32, y: 48 },
};

export const playerTiles = {
  up: [
    { x: 12, y: 57 },
    { x: 0, y: 57 },
    { x: 24, y: 57 },
  ],
  down: [
    { x: 12, y: 3 },
    { x: 0, y: 3 },
    { x: 24, y: 3 },
  ],
  left: [
    { x: 12, y: 21 },
    { x: 0, y: 21 },
    { x: 24, y: 21 },
  ],

  right: [
    { x: 12, y: 39 },
    { x: 0, y: 39 },
    { x: 24, y: 39 },
  ],
};
