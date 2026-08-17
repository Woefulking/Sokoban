const TILE_SIZE = 40;

let activeBlock = null;

let levelWidth = null;
let levelHeight = null;

let editorLevel = [];

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

const tileSet = new Image();
tileSet.src = './images/tileset.png';

let isTileSetLoaded = false;

tileSet.onload = () => {
  isTileSetLoaded = true;
};

canvas.addEventListener('click', () => {
  const canvasCoords = canvas.getBoundingClientRect();
  const mouseX = event.clientX - canvasCoords.left;
  const mouseY = event.clientY - canvasCoords.top;

  const x = Math.floor(mouseX / TILE_SIZE);
  const y = Math.floor(mouseY / TILE_SIZE);

  editorLevel[y][x] = activeBlock;

  drawEditor();
});

const canvasWidthInput = document.querySelector('#canvasWidth');
const canvasHeightInput = document.querySelector('#canvasHeigth');

const createCanvasButton = document.querySelector('#createCanvas');

const blockButtons = document.querySelectorAll('[data-block]');

blockButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeBlock = button.dataset.block;
  });
});

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

  ctx.beginPath();

  for (let x = 1; x < levelWidth; x++) {
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, canvasHeight);
  }

  for (let y = 1; y < levelHeight; y++) {
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(canvasWidth, y * TILE_SIZE);
  }

  ctx.strokeStyle = 'black';
  ctx.stroke();

  editorLevel = Array.from({ length: levelHeight }, () => Array(levelWidth).fill(' '));
});

function getWallTile(x, y) {
  const up = editorLevel[y - 1]?.[x] === '#';
  const down = editorLevel[y + 1]?.[x] === '#';
  const left = editorLevel[y]?.[x - 1] === '#';
  const right = editorLevel[y]?.[x + 1] === '#';

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
  const up = editorLevel[y - 1]?.[x] === '~';
  const down = editorLevel[y + 1]?.[x] === '~';
  const left = editorLevel[y]?.[x - 1] === '~';
  const right = editorLevel[y]?.[x + 1] === '~';

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

function drawEditor() {
  if (!isTileSetLoaded) return;

  ctx.imageSmoothingEnabled = false;

  editorLevel.forEach((row, rowIndex) => {
    row.forEach((block, colIndex) => {
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

        case '$': {
          tileX = tiles.box.x;
          tileY = tiles.box.y;
          break;
        }

        default:
          return;
      }

      ctx.drawImage(tileSet, tileX, tileY, 16, 16, x, y, TILE_SIZE, TILE_SIZE);
    });
  });
}
