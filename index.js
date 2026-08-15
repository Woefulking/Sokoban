const TILE_SIZE = 40;

const canvas = document.getElementById('canvas');
const cxt = canvas.getContext('2d');
let levelData = null;
let level = null;
let turnsHistory = [];
let player = null;
let goals = null;
let boxes = null;
let floor = null;
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
    const paddedLine = line.padEnd(cols, '0');
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

function drawBackground() {
  const rows = floor.length;
  const cols = floor[0].length;
  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;
  floor.forEach((row, rowIndex) =>
    row.forEach((elem, colIndex) => {
      let color = null;
      switch (elem) {
        case '#':
          color = 'black';
          break;
        case '.':
          color = 'red';
          break;
        case '_':
          color = 'gray';
          break;
        default:
          return;
      }
      cxt.fillStyle = color;
      cxt.fillRect(colIndex * TILE_SIZE, rowIndex * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }),
  );
}

function drawBoxes() {
  cxt.fillStyle = 'orange';

  boxes.forEach((box) => {
    cxt.fillRect(box.x * TILE_SIZE, box.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });
}

function drawPlayer() {
  cxt.fillStyle = 'blue';

  cxt.fillRect(player.x * TILE_SIZE, player.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function updateScreen() {
  drawBackground(floor);
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
  boxes = findBoxesOnLevel();
  turnsHistory.push({
    player: { x: player.x, y: player.y },
    boxes: boxes.map((box) => ({ x: box.x, y: box.y })),
  });
  goals = findGoalsOnLevel();
  floor = floorFill();

  drawBackground();
  drawBoxes();
  drawPlayer();
  initGameControls();
}

startGame(currentLevel);
