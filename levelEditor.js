const TILE_SIZE = 40;

let activeBlock = null;

let levelWidth = null;
let levelHeight = null;

let editorFloor = [];
let editorLevel = [];

let eraserMode = false;

const canvas = document.getElementById('levelEditor');
const ctx = canvas.getContext('2d');

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

function isPlayerPlaced() {
  return editorLevel.some((row) => row.includes('@'));
}

canvas.addEventListener('click', (event) => {
  const canvasCoords = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasCoords.left;
  const mouseY = event.clientY - canvasCoords.top;

  const levelElements = ['.', '$', '@'];
  const floorElements = ['_', '~', '#'];

  const x = Math.floor(mouseX / TILE_SIZE);
  const y = Math.floor(mouseY / TILE_SIZE);

  if (y < 0 || y >= editorFloor.length || x < 0 || x >= editorFloor[0].length) {
    return;
  }

  if (eraserMode) {
    if (editorLevel[y][x] !== ' ') {
      editorLevel[y][x] = ' ';
    } else if (editorFloor[y][x] !== ' ') {
      editorFloor[y][x] = ' ';
    }
  } else {
    if (activeBlock === '@' && isPlayerPlaced()) {
      return;
    }

    if (levelElements.includes(activeBlock)) {
      editorLevel[y][x] = activeBlock;
    }

    if (floorElements.includes(activeBlock)) {
      editorFloor[y][x] = activeBlock;
    }
  }

  drawEditor();
});

const canvasWidthInput = document.querySelector('#canvasWidth');
const canvasHeightInput = document.querySelector('#canvasHeigth');

const createCanvasButton = document.querySelector('#createCanvas');

const blockButtons = document.querySelectorAll('[data-block]');

blockButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeBlock = button.dataset.block;
    if (eraserMode) eraserMode = false;
  });
});

const eraserButton = document.querySelector('#eraser');
eraserButton.addEventListener('click', (event) => {
  eraserMode = true;
  activeBlock = null;
});

async function saveEditorLevel(params) {
  const convertedEditorLevel = editorLevel.map((row) => row.join('')).join('\n');

  const boxes = editorLevel.flatMap((row, y) =>
    [...row].map((cell, x) => (cell === '$' ? { x, y } : null)).filter(Boolean),
  );

  const goals = editorLevel.flatMap((row, y) =>
    [...row].map((cell, x) => (cell === '.' ? { x, y } : null)).filter(Boolean),
  );

  if (boxes.length !== goals.length) return;

  try {
    const options = {
      name: 'custom-level.txt',
      types: [
        {
          description: 'custom level',
          accept: { 'text/plain': ['.txt'] },
        },
      ],
    };

    const handle = await window.showSaveFilePicker(options);

    const writable = await handle.createWritable();
    await writable.write(convertedEditorLevel);
    await writable.close();
  } catch (err) {
    console.error('Ошибка сохранения:', err);
  }
}
const saveLevelButton = document.querySelector('#saveLevel');
saveLevelButton.addEventListener('click', saveEditorLevel);

canvasWidthInput.onchange = (e) => {
  levelWidth = Number(e.target.value);
};

canvasHeightInput.onchange = (e) => {
  levelHeight = Number(e.target.value);
};

createCanvasButton.addEventListener('click', () => {
  const canvasWidth = levelWidth * TILE_SIZE;
  const canvasHeight = levelHeight * TILE_SIZE;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  editorLevel = resizeGrid(editorLevel, levelWidth, levelHeight, ' ');
  editorFloor = resizeGrid(editorFloor, levelWidth, levelHeight, ' ');
  drawEditor();
});

function resizeGrid(oldGrid, newWidth, newHeight, defaultValue) {
  return Array.from({ length: newHeight }, (_, y) => {
    return Array.from({ length: newWidth }, (_, x) => {
      return oldGrid[y] && oldGrid[y][x] !== undefined ? oldGrid[y][x] : defaultValue;
    });
  });
}

function getWallTile(x, y) {
  const up = editorFloor[y - 1]?.[x] === '#';
  const down = editorFloor[y + 1]?.[x] === '#';
  const left = editorFloor[y]?.[x - 1] === '#';
  const right = editorFloor[y]?.[x + 1] === '#';

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
  const up = editorFloor[y - 1]?.[x] === '~';
  const down = editorFloor[y + 1]?.[x] === '~';
  const left = editorFloor[y]?.[x - 1] === '~';
  const right = editorFloor[y]?.[x + 1] === '~';

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

function drawEditorGrid() {
  ctx.beginPath();

  for (let x = 1; x < levelWidth; x++) {
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, canvas.height);
  }

  for (let y = 1; y < levelHeight; y++) {
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(canvas.width, y * TILE_SIZE);
  }

  ctx.strokeStyle = 'black';
  ctx.stroke();
}

function drawFloorBlock(block, colIndex, rowIndex) {
  const x = colIndex * TILE_SIZE;
  const y = rowIndex * TILE_SIZE;

  let tileX = 0;
  let tileY = 0;

  switch (block) {
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

    case '_': {
      tileX = tiles.floor.x;
      tileY = tiles.floor.y;
      break;
    }
    default: {
      return;
    }
  }

  ctx.drawImage(tileSet, tileX, tileY, 16, 16, x, y, TILE_SIZE, TILE_SIZE);
}

function drawLevelBlock(block, colIndex, rowIndex) {
  const x = colIndex * TILE_SIZE;
  const y = rowIndex * TILE_SIZE;

  let tileX = 0;
  let tileY = 0;

  switch (block) {
    case '$': {
      tileX = tiles.box.x;
      tileY = tiles.box.y;
      break;
    }

    case '.': {
      tileX = tiles.goal.x;
      tileY = tiles.goal.y;
      break;
    }

    case '@': {
      tileX = playerSprites.down[0].x;
      tileY = playerSprites.down[0].y;
      break;
    }
    default: {
      return;
    }
  }

  if (block === '@') {
    ctx.drawImage(
      playerTileSet,
      playerSprites.down[0].x,
      playerSprites.down[0].y,
      12,
      14,
      x + 6,
      y + 4,
      TILE_SIZE - 8,
      TILE_SIZE - 8,
    );
  } else {
    ctx.drawImage(tileSet, tileX, tileY, 16, 16, x, y, TILE_SIZE, TILE_SIZE);
  }
}

function drawEditor() {
  if (!isTileSetLoaded) return;
  if (!isPlayerTileSetLoaded) return;
  ctx.imageSmoothingEnabled = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  editorFloor.forEach((row, rowIndex) => {
    row.forEach((block, colIndex) => {
      drawFloorBlock(block, colIndex, rowIndex);
    });
  });

  editorLevel.forEach((row, rowIndex) => {
    row.forEach((block, colIndex) => {
      drawLevelBlock(block, colIndex, rowIndex);
    });
  });

  drawEditorGrid();
}
