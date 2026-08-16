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
  for (let rowIndex = 0; rowIndex < level.length; rowIndex++) {
    const row = level[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (row[colIndex] === '@') {
        return { x: colIndex, y: rowIndex };
      }
    }
  }
  return { x: null, y: null };
}

function findBoxesOnLevel() {
  let boxes = [];
  for (let rowIndex = 0; rowIndex < level.length; rowIndex++) {
    const row = level[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (row[colIndex] === '$') {
        boxes.push({ x: colIndex, y: rowIndex });
      }
    }
  }
  return boxes;
}

function findGoalsOnLevel() {
  let goals = [];
  for (let rowIndex = 0; rowIndex < level.length; rowIndex++) {
    const row = level[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      if (row[colIndex] === '.') {
        goals.push({ x: colIndex, y: rowIndex });
      }
    }
  }
  return goals;
}

function floorFill() {
  let target = [' ', '$', '@'];
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

const tiles = {
  wall: { x: 32, y: 0 },
  water: { x: 0, y: 48 },
  floor: { x: 0, y: 16 },
  box: { x: 0, y: 64 },
  goal: { x: 48, y: 0 },
  boxOnGoal: { x: 64, y: 0 },
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

function findOuterWalls(level) {
  const queue = [];
  const outerWalls = new Set();

  const rows = level.length;
  const cols = level[0].length;

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isBorder = x === 0 || x === cols - 1 || y === 0 || y === rows - 1;

      if (isBorder && level[y][x] === '#') {
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

      if (level[ny][nx] !== '#') {
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
        case '#':
          const key = `${colIndex},${rowIndex}`;
          if (outerWalls.has(key)) {
            tileX = tiles.wall.x;
            tileY = tiles.wall.y;
          } else {
            tileX = tiles.water.x;
            tileY = tiles.water.y;
          }
          break;
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
  cxt.drawImage(
    playerTileSet,
    12,
    3,
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

function moveBoxe(box, newX, newY, oldX, oldY) {
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

  turnsHistory.push({
    player: { x: player.x, y: player.y },
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

  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      newY -= 1;
      break;
    case 'ArrowDown':
    case 'KeyS':
      newY += 1;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      newX -= 1;
      break;
    case 'ArrowRight':
    case 'KeyD':
      newX += 1;
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
    moveBoxe(box, newX, newY, oldX, oldY);
    return;
  }

  player.x = newX;
  player.y = newY;
  turnsHistory.push({
    player: { x: player.x, y: player.y },
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

//TODO
//3) Перейти на react + typescript и vite
//4) Сделать меню
//5) Сделать выбор уровня
//6) Сделать редактор уровней

async function startGame(currentLevel) {
  disableGameControls();

  turnsHistory = [];
  if (!levelData) {
    levelData = await getLevelDataFromTxt(currentLevel);
  }

  level = createLevelFromTxt();
  player = findPlayerOnLevel();
  floor = floorFill();
  outerWalls = findOuterWalls(floor);
  boxes = findBoxesOnLevel();
  turnsHistory.push({
    player: { x: player.x, y: player.y },
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
