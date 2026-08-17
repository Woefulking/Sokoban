const TILE_SCALE = 3;
const SOURCE_TILE_SIZE = 16;
const TILE_SIZE = SOURCE_TILE_SIZE * TILE_SCALE;

const canvas = document.getElementById('canvas');
const cxt = canvas.getContext('2d');

let levelData = null;
let level = null;
let turnsHistory = [];
let player = null;
let goals = null;
let boxes = null;
let floor = null;
let outerWalls = new Set();
let currentLevel = 1;

const tiles = {
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

const playerSprites = {
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

const tileSet = new Image();
tileSet.src = './images/tileset.png';

let isTileSetLoaded = false;

tileSet.onload = () => {
  isTileSetLoaded = true;
};

const playerTileSet = new Image();
playerTileSet.src = './images/player.png';

let isPlayerTileSetLoaded = false;

playerTileSet.onload = () => {
  isPlayerTileSetLoaded = true;
};

async function getLevelDataFromTxt(level) {
  try {
    const responce = await fetch(`./levels/${level}.txt`);

    if (!responce.ok) {
      throw new Error(`Файл не найден: ${responce.status}`);
    }

    const data = await responce.text();
    return data;
  } catch (error) {
    console.error(error);
  }
}

function createLevelFromTxt() {
  const lines = levelData.split(/\r?\n/);
  const cols = Math.max(...lines.map((line) => line.length));

  return lines.map((line) => {
    const paddedLine = line.padEnd(cols, ' ');
    return paddedLine.split('');
  });
}

function findPlayerOnLevel() {
  const y = level.findIndex((row) => row.includes('@'));
  const x = level[y].indexOf('@');

  return { x, y, direction: 'down', frame: 0 };
}

function findBoxesOnLevel() {
  return level.flatMap((row, y) =>
    [...row].map((cell, x) => (cell === '$' ? { x, y } : null)).filter(Boolean),
  );
}

function findGoalsOnLevel() {
  return level.flatMap((row, y) =>
    [...row].map((cell, x) => (cell === '.' ? { x, y } : null)).filter(Boolean),
  );
}

function floorFill() {
  let target = [' ', '$', '@', '.'];
  let newSymbol = '_';

  let startX = player.x;
  let startY = player.y;

  let copy = structuredClone(level);

  const dir = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const queue = [];
  queue.push([startX, startY]);

  copy[startY][startX] = newSymbol;

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();

    for (const it of dir) {
      const nx = cx + it[0];
      const ny = cy + it[1];

      if (
        ny >= 0 &&
        ny < copy.length &&
        nx >= 0 &&
        nx < copy[0].length &&
        target.includes(copy[ny][nx])
      ) {
        copy[ny][nx] = newSymbol;
        queue.push([nx, ny]);
      }
    }
  }

  return copy;
}

function getWallTile(x, y) {
  const up = floor[y - 1]?.[x] === '#';
  const down = floor[y + 1]?.[x] === '#';
  const left = floor[y]?.[x - 1] === '#';
  const right = floor[y]?.[x + 1] === '#';

  if (left && right && !up && !down) {
    return tiles.wallHorizontal;
  }

  if (left && !right && !up && !down) {
    return tiles.wallHorizontal;
  }

  if (!left && !right && up && !down) {
    return tiles.wallHorizontal;
  }

  if (left && right && !up && !down) {
    return tiles.wallHorizontal;
  }

  if (!left && right && !up && !down) {
    return tiles.wallHorizontal;
  }

  if (left && !right && up && !down) {
    return tiles.wallRight;
  }

  if (!left && right && up && !down) {
    return tiles.wallHorizontal;
  }

  if (left && right && up && !down) {
    return tiles.wallHorizontal;
  }

  if (up && down && !left && !right) {
    return tiles.wallCorner;
  }

  return tiles.wall;
}

function getWaterTile(x, y) {
  const up = floor[y - 1]?.[x] === '~';
  const down = floor[y + 1]?.[x] === '~';
  const left = floor[y]?.[x - 1] === '~';
  const right = floor[y]?.[x + 1] === '~';

  if (left && right && !up && !down) {
    return tiles.waterFloor;
  }

  if (!left && !right && !up && down) {
    return tiles.waterFloor;
  }

  if (left && !right && !up && !down) {
    return tiles.waterFloor;
  }

  if (!left && right && !up && !down) {
    return tiles.waterFloor;
  }

  if (!left && !right && !up && !down) {
    return tiles.waterFloor;
  }

  if ((left || right) && !up && down) {
    return tiles.waterFloor;
  }

  return tiles.water;
}

function findOuterWalls() {
  const queue = [];
  const outerWalls = new Set();

  const rows = floor.length;
  const cols = floor[0].length;

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isBorder = x === 0 || x === cols - 1 || y === 0 || y === rows - 1;

      if (isBorder && floor[y][x] === '#') {
        queue.push([x, y]);
        outerWalls.add(`${x},${y}`);
      }
    }
  }

  while (queue.length > 0) {
    const [cx, cy] = queue.shift();

    for (const [dx, dy] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) {
        continue;
      }

      if (floor[ny][nx] !== '#') {
        continue;
      }

      const key = `${nx},${ny}`;

      if (!outerWalls.has(key)) {
        outerWalls.add(key);
        queue.push([nx, ny]);
      }
    }
  }

  return outerWalls;
}

function convertWallsToWater() {
  const convertedLevel = structuredClone(floor);
  for (let y = 0; y < convertedLevel.length; y++) {
    for (let x = 0; x < convertedLevel[y].length; x++) {
      if (convertedLevel[y][x] !== '#') {
        continue;
      }

      const key = `${x},${y}`;

      if (!outerWalls.has(key)) {
        convertedLevel[y][x] = '~';
      }
    }
  }

  return convertedLevel;
}
function drawBackground() {
  if (!isTileSetLoaded) return;

  const rows = floor.length;
  const cols = floor[0].length;

  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;

  cxt.imageSmoothingEnabled = false;
  floor.forEach((row, rowIndex) =>
    row.forEach((elem, colIndex) => {
      const x = colIndex * TILE_SIZE;
      const y = rowIndex * TILE_SIZE;

      let tileX = 0;
      let tileY = 0;

      switch (elem) {
        case '#': {
          const tile = getWallTile(colIndex, rowIndex);
          tileX = tile.x;
          tileY = tile.y;
          break;
        }

        case '~': {
          const tile = getWaterTile(colIndex, rowIndex);
          tileX = tile.x;
          tileY = tile.y;
          break;
        }

        case '_':
          tileX = tiles.floor.x;
          tileY = tiles.floor.y;
          break;

        default:
          return;
      }

      cxt.drawImage(
        tileSet,
        tileX,
        tileY,
        SOURCE_TILE_SIZE,
        SOURCE_TILE_SIZE,
        x,
        y,
        TILE_SIZE,
        TILE_SIZE,
      );
    }),
  );
}

function drawBoxes() {
  if (!isTileSetLoaded) return;
  boxes.forEach((box) => {
    cxt.drawImage(
      tileSet,
      tiles.box.x,
      tiles.box.y,
      SOURCE_TILE_SIZE,
      SOURCE_TILE_SIZE,
      box.x * TILE_SIZE + 4,
      box.y * TILE_SIZE + 4,
      TILE_SIZE - 4,
      TILE_SIZE - 4,
    );
  });
}

function drawGoals() {
  if (!isTileSetLoaded) return;
  goals.forEach((goal) => {
    const isOnGoal = boxes.some((box) => goal.x === box.x && goal.y === box.y);
    const tile = isOnGoal ? tiles.boxOnGoal : tiles.goal;
    cxt.drawImage(
      tileSet,
      tile.x,
      tile.y,
      SOURCE_TILE_SIZE,
      SOURCE_TILE_SIZE,
      goal.x * TILE_SIZE,
      goal.y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
    );
  });
}

function drawPlayer() {
  if (!isPlayerTileSetLoaded) return;
  const playerSprite = playerSprites[player.direction][player.frame];
  cxt.drawImage(
    playerTileSet,
    playerSprite.x,
    playerSprite.y,
    12,
    14,
    player.x * TILE_SIZE + 6,
    player.y * TILE_SIZE + 4,
    TILE_SIZE - 8,
    TILE_SIZE - 8,
  );
}

function updateScreen() {
  drawBackground(floor);
  drawGoals();
  drawBoxes(boxes);
  drawPlayer();
}

function checkWin() {
  const isWin =
    boxes.length === goals.length &&
    boxes.every((box) => goals.some((goal) => goal.x === box.x && goal.y === box.y));

  return isWin;
}

function moveBoxe(box, newX, newY, oldX, oldY, direction) {
  const dx = newX - oldX;
  const dy = newY - oldY;

  const nextX = newX + dx;
  const nextY = newY + dy;

  if (
    nextY < 0 ||
    nextY >= level.length ||
    nextX < 0 ||
    nextX >= level[nextY].length ||
    level[nextY][nextX] === '#'
  ) {
    return;
  }

  const anotherBox = boxes.some(
    (otherBox) => otherBox !== box && otherBox.x === nextX && otherBox.y === nextY,
  );

  if (anotherBox) return;

  box.x = nextX;
  box.y = nextY;

  player.x = newX;
  player.y = newY;
  player.direction = direction;
  player.frame = (player.frame + 1) % 3;

  turnsHistory.push({
    player: { x: player.x, y: player.y, direction },
    boxes: boxes.map((box) => ({ x: box.x, y: box.y })),
  });

  updateScreen();

  if (checkWin()) {
    currentLevel += 1;
    turnsHistory = [];
    levelData = null;
    startGame(currentLevel);
  }
}

function handleGameKeyPress(event) {
  if (event.code === 'KeyZ') {
    event.preventDefault();

    if (turnsHistory.length <= 1) return;

    turnsHistory.pop();

    const previousState = turnsHistory[turnsHistory.length - 1];

    player.x = previousState.player.x;
    player.y = previousState.player.y;
    player.direction = previousState.player.direction;

    boxes = previousState.boxes.map((box) => ({ x: box.x, y: box.y }));
    updateScreen();
    return;
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }

  const oldX = player.x;
  const oldY = player.y;

  let newX = oldX;
  let newY = oldY;

  let direction = player.direction;

  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      newY -= 1;
      direction = 'up';
      break;
    case 'ArrowDown':
    case 'KeyS':
      newY += 1;
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'KeyA':
      newX -= 1;
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'KeyD':
      newX += 1;
      direction = 'right';
      break;
    default:
      return;
  }

  if (
    newY >= 0 &&
    newY < level.length &&
    newX >= 0 &&
    newX < level[newY].length &&
    level[newY][newX] === '#'
  )
    return;

  const box = boxes.find((box) => box.x === newX && box.y === newY);
  if (box) {
    moveBoxe(box, newX, newY, oldX, oldY, direction);
    return;
  }

  player.x = newX;
  player.y = newY;
  player.direction = direction;
  player.frame = (player.frame + 1) % 3;

  turnsHistory.push({
    player: {
      x: player.x,
      y: player.y,
      direction: player.direction,
    },
    boxes: boxes.map((box) => ({ x: box.x, y: box.y })),
  });

  updateScreen();
}

function initGameControls() {
  window.addEventListener('keydown', handleGameKeyPress);
}

function disableGameControls() {
  window.removeEventListener('keydown', handleGameKeyPress);
}

async function startGame(currentLevel) {
  disableGameControls();

  turnsHistory = [];
  if (!levelData) {
    levelData = await getLevelDataFromTxt(currentLevel);
  }

  level = createLevelFromTxt();
  player = findPlayerOnLevel();
  boxes = findBoxesOnLevel();
  floor = floorFill();
  outerWalls = findOuterWalls();
  floor = convertWallsToWater();
  turnsHistory.push({
    player: { x: player.x, y: player.y, direction: 'down' },
    boxes: boxes.map((box) => ({ x: box.x, y: box.y })),
  });
  goals = findGoalsOnLevel();

  drawBackground();
  drawGoals();
  drawBoxes();
  drawPlayer();
  initGameControls();
}

startGame(currentLevel);
