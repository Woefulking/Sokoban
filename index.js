const TILE_SIZE = 40;

const canvas = document.getElementById('canvas');
const cxt = canvas.getContext('2d');

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

function createLevelFromTxt(levelData) {
  const lines = levelData.split(/\r?\n/);
  const cols = Math.max(...lines.map((line) => line.length));

  return lines.map((line) => {
    const paddedLine = line.padEnd(cols, '0');
    return paddedLine.split('');
  });
}

function findPlayerOnLevel(level) {
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

function findBoxesOnLevel(level) {
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

function findGoalsOnLevel(level) {
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

function floorFill(level, player) {
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

function drawBackground(floor) {
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

function drawBoxes(boxes) {
  cxt.fillStyle = 'orange';

  boxes.forEach((box) => {
    cxt.fillRect(box.x * TILE_SIZE, box.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });
}

function drawPlayer(player) {
  cxt.fillStyle = 'blue';

  cxt.fillRect(player.x * TILE_SIZE, player.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function updateScreen(floor, boxes, player) {
  cxt.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(floor);
  drawBoxes(boxes);
  drawPlayer(player);
}

function checkWin(boxes, goals) {
  const isWin =
    boxes.length === goals.length &&
    boxes.every((box) => goals.some((goal) => goal.x === box.x && goal.y === box.y));

  if (isWin) console.log('Победа');
}

function moveBoxes(level, box, boxes, goals, newX, newY, oldX, oldY, player) {
  const dx = newX - oldX;
  const dy = newY - oldY;

  const nextX = newX + dx;
  const nextY = newY + dy;

  if (level[nextY][nextX] === '#') return;

  const anotherBox = boxes.some(
    (otherBox) => otherBox !== box && otherBox.x === nextX && otherBox.y === nextY,
  );

  if (anotherBox) return;

  box.x = nextX;
  box.y = nextY;

  checkWin(boxes, goals);

  player.x = newX;
  player.y = newY;

  return true;
}

function movePlayer(level, boxes, goals, floor, player) {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }

    const oldX = player.x;
    const oldY = player.y;

    let newX = oldX;
    let newY = oldY;

    let flag = null;

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        newY -= 1;
        flag = 'up';
        break;
      case 'ArrowDown':
      case 'KeyS':
        newY += 1;
        flag = 'down';
        break;
      case 'ArrowLeft':
      case 'KeyA':
        newX -= 1;
        flag = 'left';
        break;
      case 'ArrowRight':
      case 'KeyD':
        newX += 1;
        flag = 'right';
        break;
      default:
        return;
    }

    if (
      newY >= 0 &&
      newY < level.length &&
      newX >= 0 &&
      newX < level[newY].length &&
      level[newY][newX] !== '#'
    ) {
      const box = boxes.find((box) => box.x === newX && box.y === newY);
      if (box) {
        moveBoxes(level, box, boxes, goals, newX, newY, oldX, oldY, player);
      } else {
        player.x = newX;
        player.y = newY;
      }
    }
    updateScreen(floor, boxes, player);
  });
}

async function startGame() {
  const levelData = await getLevelDataFromTxt(1);
  const level = createLevelFromTxt(levelData);
  const player = findPlayerOnLevel(level);
  const boxes = findBoxesOnLevel(level);
  const floor = floorFill(level, player);
  const goals = findGoalsOnLevel(level);

  drawBackground(floor);
  drawBoxes(boxes);
  drawPlayer(player);
  movePlayer(level, boxes, goals, floor, player);
}

startGame();
