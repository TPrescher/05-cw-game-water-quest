// ---- Tile Asset Map ----
const TILE_ASSETS = {
  'START': 'img/river_start_faucet.png',
  'END': 'img/river_end_house.png',
  'H': 'img/river_straight_horizontal.png',
  'V': 'img/river_straight_vertical.png',
  'C_TR': 'img/river_curve_top_right.png',
  'C_RB': 'img/river_curve_right_bottom.png',
  'C_BL': 'img/river_curve_bottom_left.png',
  'C_LT': 'img/river_curve_left_top.png',
  'BLOCKED': 'img/terrain_blocked.png',
  'TERRAIN': 'img/terrain_grass.png'
};

// ---- Tile Connection Map ----
const TILE_CONNECTIONS = {
  'H': [['left','right'], ['top','bottom'], ['left','right'], ['top','bottom']],
  'V': [['top','bottom'], ['left','right'], ['top','bottom'], ['left','right']],
  'C_TR': [['top','right'], ['right','bottom'], ['bottom','left'], ['left','top']],
  'C_RB': [['right','bottom'], ['bottom','left'], ['left','top'], ['top','right']],
  'C_BL': [['bottom','left'], ['left','top'], ['top','right'], ['right','bottom']],
  'C_LT': [['left','top'], ['top','right'], ['right','bottom'], ['bottom','left']],
  'START': [['bottom'], ['left'], ['top'], ['right']],
  'END': [['top'], ['right'], ['bottom'], ['left']],
  'BLOCKED': [[],[],[],[]],
  'TERRAIN': [[],[],[],[]]
};

// ---- Level Data ----
const LEVEL_1 = [
  ['START', 'H',    'C_RB', 'BLOCKED'],
  ['TERRAIN', 'V', 'H',    'END'],
  ['TERRAIN', 'V', 'C_BL', 'TERRAIN'],
  ['TERRAIN', 'BLOCKED', 'TERRAIN', 'TERRAIN'],
];
const gridSize = 4;
const maxDrops = 15;
// ---- Game State ----
let state = {
  grid: [], // Each {type, rot: 0-3}
  drops: maxDrops,
  score: 0,
  moves: 0,
  solved: false
};
function initLevel(level) {
  state.grid = [];
  for (let y = 0; y < gridSize; y++) {
    state.grid[y] = [];
    for (let x = 0; x < gridSize; x++) {
      let initialRot = 0;
      if (level[y][x] === 'C_RB') initialRot = 1;
      if (level[y][x] === 'C_BL') initialRot = 2;
      state.grid[y][x] = {
        type: level[y][x],
        rot: initialRot,
        x, y
      };
    }
  }
  state.drops = maxDrops;
  state.moves = 0;
  state.solved = false;
  renderGame();
  updateHud();
  hidePopup();
}

function renderGame() {
  const gameGrid = document.getElementById('gameGrid');
  gameGrid.innerHTML = '';
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = state.grid[y][x];
      const div = document.createElement('div');
      div.classList.add('tile');
      if (tile.type === 'BLOCKED') div.classList.add('blocked');
      if (tile.type === 'TERRAIN') div.classList.add('terrain');
      if (tile.type === 'START' || tile.type === 'END') div.classList.add('fixed');
      if (["H","V","C_TR","C_RB","C_BL","C_LT"].includes(tile.type) && state.drops > 0 && !state.solved) {
        div.onclick = () => rotateTile(y, x);
      }
      const img = document.createElement('img');
      img.src = TILE_ASSETS[tile.type];
      img.alt = tile.type;
      img.style.transform = `rotate(${tile.rot * 90}deg)`;
      div.appendChild(img);
      gameGrid.appendChild(div);
    }
  }
  console.log(`Tiles rendered: ${gameGrid.children.length}`);
}

function rotateTile(y, x) {
  if (state.drops <= 0 || state.solved) return;
  state.grid[y][x].rot = (state.grid[y][x].rot + 1) % 4;
  state.drops--;
  state.moves++;
  renderGame();
  updateHud();
  if (state.drops <= 0 && !state.solved) {
    setTimeout(() => alert('Out of Water Drops!'), 150);
  }
}
function updateHud() {
  document.getElementById('score').textContent = state.score;
  document.getElementById('drops').textContent = state.drops;
  document.getElementById('moves').textContent = state.moves;
  document.getElementById('levelNum').textContent = 1;
  document.getElementById('submitBtn').disabled = (state.drops<=0 || state.solved);
}
// ---- Win Condition ----
// Simulates water flow from START, returns true if path reaches END
function submitFlow() {
  if (state.solved) return;
  if (checkSolved()) {
    state.solved = true;
    state.score += 100 + (state.drops*10);
    showPopup();
  } else {
    alert('Water path is not complete!');
  }
  updateHud();
}
// Water flow logic
function checkSolved() {
  // Find start tile
  let startY = -1, startX = -1;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (state.grid[y][x].type === 'START') {
        startY = y;
        startX = x;
      }
    }
  }
  if (startY === -1) return false;
  let visited = Array.from({length: gridSize}, () => Array(gridSize).fill(false));
  function traverse(y, x, cameFrom) {
    if (y < 0 || y >= gridSize || x < 0 || x >= gridSize) return false;
    if (visited[y][x]) return false;
    const tile = state.grid[y][x];
    visited[y][x] = true;
    if (tile.type === 'END') return true;
    const rot = tile.rot;
    const exits = TILE_CONNECTIONS[tile.type][rot];
    for (let dir of exits) {
      if (dir === cameFrom) continue;
      let ny = y, nx = x;
      if (dir === 'top') ny--;
      if (dir === 'bottom') ny++;
      if (dir === 'left') nx--;
      if (dir === 'right') nx++;
      if (ny < 0 || ny >= gridSize || nx < 0 || nx >= gridSize) continue;
      const nextTile = state.grid[ny][nx];
      const nrot = nextTile.rot;
      const nconns = TILE_CONNECTIONS[nextTile.type][nrot];
      const opp = opposite(dir);
      if (nconns.includes(opp)) {
        if (traverse(ny, nx, opp)) return true;
      }
    }
    return false;
  }
  return traverse(startY, startX, null);
}
function opposite(dir) {
  return {top:'bottom', bottom:'top', left:'right', right:'left'}[dir];
}
// ---- Popup ----
function showPopup() {
  document.getElementById('winPopup').style.display = 'block';
}
function hidePopup() {
  document.getElementById('winPopup').style.display = 'none';
}
function closePopup() {
  hidePopup();
  // Optionally: go to next level
}
function restartGame() {
  // Placeholder function for restarting the game
  console.log('Game restarted');
  initLevel(LEVEL_1);
}
// ---- INIT ----
window.onload = () => {
  initLevel(LEVEL_1);
};
