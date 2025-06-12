// ---- Tile Asset Map ----
const TILE_ASSETS = {
  'START': 'img/start_faucet_des_wtr_.png',
  'END': 'img/end_village_house.png',
  'C_TR': 'img/wtr_des_terrain_1.png',
  'C_RB': 'img/wtr_des_terrain_2.png',
  'C_BL': 'img/wtr_des_terrain_3.png',
  'C_LT': 'img/wtr_des_terrain_4.png',
  'H': 'img/wtr_des_terrain_5.png',
  'BLOCKED_1': 'img/terrain_grass_deadend.png',
  'BLOCKED_2': 'img/terrain_dbl_mtn_peak_2.png',
  'BLOCKED_3': 'img/terrain_dbl_peak_mtn_1.png',
  'BLOCKED_4': 'img/terrain_tpl_mtn_peak.png',
  'T_GRASS': 'img/terrain_open_desert1.png',
  'T_DESERT': 'img/terrain_open_desert_2.png',
  'T_FOREST': 'img/terrain_small_woodland.png',
  'PUZZLE_COMPLETE': 'img/wtr_path_puzzle_complete.png'
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
  ['START', 'H', 'H', 'H', 'END'],
  ['BLOCKED_1', 'C_TR', 'T_GRASS', 'C_LT', 'BLOCKED_2'],
  ['BLOCKED_3', 'C_RB', 'T_DESERT', 'C_BL', 'BLOCKED_4']
];
const gridSize = { rows: 3, columns: 5 }; // Updated grid size to 5x3
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
  for (let y = 0; y < gridSize.rows; y++) {
    state.grid[y] = [];
    for (let x = 0; x < gridSize.columns; x++) {
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
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
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
  console.log('Rendering game grid:', state.grid);
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
    state.score += 100 + (state.drops * 10);
    showModal(true, 'You brought clean water to the village!');
  } else {
    showModal(false, 'Water path is not complete!');
  }
  updateHud();
}
// Water flow logic
function checkSolved() {
  // Find start tile
  let startY = -1, startX = -1;
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
      if (state.grid[y][x].type === 'START') {
        startY = y;
        startX = x;
      }
    }
  }
  if (startY === -1) return false;
  let visited = Array.from({length: gridSize.rows}, () => Array(gridSize.columns).fill(false));
  function traverse(y, x, cameFrom) {
    if (y < 0 || y >= gridSize.rows || x < 0 || x >= gridSize.columns) return false;
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
      if (ny < 0 || ny >= gridSize.rows || nx < 0 || nx >= gridSize.columns) continue;
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
function showPopup(message, isSuccess) {
  const popup = document.getElementById('winPopup');
  const popupMessage = popup.querySelector('p');
  const popupScore = popup.querySelector('.score');

  if (isSuccess) {
    popupMessage.innerHTML = message || 'You brought clean water to the village!';
    popupScore.style.display = 'block';
  } else {
    popupMessage.innerHTML = message || 'Water path is not complete!';
    popupScore.style.display = 'none';
  }

  popup.style.display = 'block';
}

function hidePopup() {
  document.getElementById('winPopup').style.display = 'none';
}
function closePopup() {
  hidePopup();
  // Optionally: Reset the game state or navigate to the next level
  console.log('Popup closed');
}
function restartGame() {
  // Placeholder function for restarting the game
  console.log('Game restarted');
  initLevel(LEVEL_1);
}
// ---- Modal ----
const winningFacts = [
  "Clean water can prevent waterborne diseases like cholera.",
  "Access to clean water improves education for children.",
  "Every $30 donated can provide clean water to one person for life."
];

const losingFacts = [
  "700 million people worldwide lack access to clean water.",
  "Women and children spend hours daily collecting water.",
  "Dirty water kills more people than all forms of violence combined."
];

const cleanWaterFacts = [
  "1 in 10 people worldwide lack access to clean water.",
  "Women and girls spend 200 million hours every day collecting water.",
  "Access to clean water reduces child mortality by nearly 50%.",
  "Clean water improves school attendance, especially for girls.",
  "Dirty water kills more people than all forms of violence, including war.",
  "Every $1 invested in clean water returns $4 in economic productivity.",
  "2 billion people live without access to safe water globally.",
  "Unsafe water is responsible for more deaths than malaria, HIV, and all wars combined."
];

function showRandomFact() {
  const factElement = document.getElementById("fact-box");
  const randomIndex = Math.floor(Math.random() * cleanWaterFacts.length);
  factElement.textContent = cleanWaterFacts[randomIndex];
}

function showModal(isSuccess, message) {
  const modal = document.getElementById('game-modal');
  const modalHeading = document.getElementById('modal-heading');
  const modalText = document.getElementById('modal-text');
  const modalButton1 = document.getElementById('modal-button-1');
  const modalButton2 = document.getElementById('modal-button-2');

  showRandomFact();

  if (isSuccess) {
    modal.className = 'game-modal success';
    modalHeading.textContent = 'WELL DONE!';
    modalText.textContent = message || 'A fact about clean water goes here.';
    modalButton1.style.display = 'block';
    modalButton2.style.display = 'block';
  } else {
    modal.className = 'game-modal error';
    modalHeading.textContent = 'MISSION INCOMPLETE';
    modalText.textContent = message || 'You haven’t connected the clean water to the village. Keep trying!';
    modalButton1.textContent = 'TRY AGAIN';
    modalButton1.style.display = 'block';
    modalButton2.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function hideModal() {
  const modal = document.getElementById('game-modal');
  modal.style.display = 'none';
}
// ---- INIT ----
window.onload = () => {
  initLevel(LEVEL_1);
};

function updateTimer(time) {
  const timerElement = document.getElementById('timer');
  timerElement.textContent = time;
  timerElement.setAttribute('aria-label', `Time remaining: ${time}`);
}

function updateScore(score) {
  const scoreElement = document.getElementById('score');
  scoreElement.textContent = `SCORE ${score}`;
  scoreElement.setAttribute('aria-label', `Current score: ${score}`);
}

function updateLevel(level) {
  const levelElement = document.getElementById('level');
  levelElement.textContent = `LEVEL ${level}`;
  levelElement.setAttribute('aria-label', `Current level: ${level}`);
}

function updateTurns(remainingTurns) {
  const turnsElement = document.getElementById('turns');
  turnsElement.textContent = `TURNS: ${remainingTurns}`;
  turnsElement.setAttribute('aria-label', `Turns remaining: ${remainingTurns}`);
}

function updateProgressBar(percentage) {
  const progressBarFill = document.querySelector('.progress-fill');
  progressBarFill.style.width = `${percentage}%`;
  progressBarFill.setAttribute('aria-label', `Progress: ${percentage}%`);
}

function startGame() {
  console.log('Game started');
  // Initialize the game state or perform any setup needed
  initLevel(LEVEL_1);
}

let gameInterval;
let correctTilesPlaced = 0;
const totalTiles = 15; // Example total tiles

function startTimer(duration = 60) {
  let time = duration;
  gameInterval = setInterval(() => {
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    updateTimer(`${minutes}:${seconds}`);
    time--;
    if (time < 0) {
      clearInterval(gameInterval);
      console.log('Time is up!');
    }
  }, 1000);
}

document.getElementById('start-btn').addEventListener('click', () => {
  startTimer(60); // 1-minute timer
  document.getElementById('start-btn').disabled = true;
  enableTileInteraction();
});

function enableTileInteraction() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.style.pointerEvents = 'auto';
  });
}

function onTilePlaced(isCorrect) {
  if (isCorrect) {
    correctTilesPlaced++;
    updateProgressBar((correctTilesPlaced / totalTiles) * 100);
    updateScore(state.score + 10); // Example score increment
  }
  updateTurns(state.drops - 1); // Example turns decrement
}

// Timer Logic
let elapsedSeconds = 0;
let timerInterval;

function startGameTimer() {
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const seconds = String(elapsedSeconds % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
  }, 1000);
}

// Start Game Button Logic
document.getElementById('startButton').addEventListener('click', () => {
  startGameTimer();
  document.getElementById('startButton').disabled = true;
  // Enable tile placement logic here
});

// Progress Bar Logic
function onCorrectTilePlaced() {
  correctTilesPlaced++;
  const progress = (correctTilesPlaced / totalTiles) * 100;
  document.getElementById('progress-fill').style.width = `${progress}%`;
}

// Score Calculation
function onPuzzleComplete() {
  clearInterval(timerInterval);
  const finalScore = Math.max(1000 - (elapsedSeconds * 10), 100);
  document.getElementById('score').textContent = `SCORE ${finalScore}`;
}

// Turns and Level Logic
let turnsRemaining = 10;
let currentLevel = 1;

function updateTurns() {
  turnsRemaining--;
  document.getElementById('turns').textContent = `TURNS ${turnsRemaining}`;
}

function advanceLevel() {
  currentLevel++;
  document.getElementById('level').textContent = `LEVEL ${currentLevel}`;
}
