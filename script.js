const DIFFICULTY_SETTINGS = {
  easy: 20,
  medium: 15,
  hard: 10
};
let currentDifficulty = 'easy'; // Default
let maxDrops = DIFFICULTY_SETTINGS[currentDifficulty];

const gridSize = { rows: 5, columns: 3 }; // Define grid size

// ---- Tile Asset Map ----
const TILE_ASSETS = {
  START:         'img/lvl_1_box_1.png',
  END:           'img/lvl_1_box_15.png',
  C_TR:          'img/lvl_1_box_4_water.png',
  C_RB:          'img/lvl_1_box_5_water.png',
  C_BL:          'img/lvl_1_box_14_water.png',
  C_LT:          'img/lvl_1_box_14_water.png',
  V:             'img/lvl_1_box_8_water.png',
  H:             'img/lvl_1_box_9.png',
  BLOCKED_1:     'img/lvl_1_box_7.png',
  BLOCKED_2:     'img/lvl_1_box_6.png',
  BLOCKED_3:     'img/lvl_1_box_10.png',
  BLOCKED_4:     'img/lvl_1_box_11_water.png',
  T_FOREST:      'img/lvl_1_box_3.png',
  T_DESERT_1:    'img/lvl_1_box_2.png',
  T_DESERT_2:    'img/lvl_1_box_13.png',
  T_DESERT_3:    'img/lvl_1_box_12.png',
  T_GRASS:       'img/lvl_1_box_7.png',
  T_DESERT:      'img/lvl_1_box_2.png',
  T_MOUNTAIN_1:  'img/lvl_1_box_6.png',
  T_MOUNTAIN_2:  'img/lvl_1_box_10.png'
};

// ---- Solution Grid ----
const SOLUTION_GRID = [
  ['START',     'T_DESERT_1', 'T_FOREST'  ],
  ['C_TR',      'C_RB',      'T_MOUNTAIN_1'      ], // Box 5 is C_RB
  ['BLOCKED_1', 'V',      'T_MOUNTAIN_2' ],
  ['BLOCKED_4',   'V',       'T_DESERT_2'],
  ['T_DESERT_3','C_BL',       'END' ] // Box 14 now C_BL (uses pipe_curve_right_box_14.png)
];
const SOLUTION_ROTATIONS = [
  [0, 0, 0],
  [0, 0, 0], // Box 5 back to rotation 0 (victory state)
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0]
];
const LEVEL_1 = [
  ['START',     'T_DESERT_1', 'T_FOREST'  ],
  ['C_TR',      'C_RB',      'T_MOUNTAIN_1'      ],
  ['BLOCKED_1', 'V',      'T_MOUNTAIN_2' ], // Box 8 now V (vertical pipe)
  ['BLOCKED_4',   'V',       'T_DESERT_2'],
  ['T_DESERT_3','C_BL',       'END' ]
];
// Only randomize initial rotations, not positions
let state = {
  grid: [],
  drops: maxDrops,
  score: 0,
  moves: 0,
  solved: false
};

let timerInterval = null;
let elapsedSeconds = 0;
let timerStarted = false;

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const timerElement = document.getElementById('timer');
  if (timerElement) timerElement.textContent = formatTime(elapsedSeconds);
}

function calculateScore() {
  // Base 1000, minus 10 per move, minus 5 per drop used, minus 2 per second elapsed
  let score = 1000 - (state.moves * 10) - ((maxDrops - state.drops) * 5) - (elapsedSeconds * 2);
  if (score < 0) score = 0;
  return score;
}

function initLevel(level) {
  timerStarted = false;
  do {
    state.grid = [];
    // Generate fresh initial rotations for each new game
    let INITIAL_ROTATIONS = [];
    for (let y = 0; y < gridSize.rows; y++) {
      INITIAL_ROTATIONS[y] = [];
      for (let x = 0; x < gridSize.columns; x++) {
        INITIAL_ROTATIONS[y][x] = (["H","V","C_TR","C_RB","C_BL","C_LT"].includes(level[y][x])) ? Math.floor(Math.random() * 4) : 0;
      }
    }
    for (let y = 0; y < gridSize.rows; y++) {
      state.grid[y] = [];
      for (let x = 0; x < gridSize.columns; x++) {
        const type = level[y][x];
        const isWater = ["H","V","C_TR","C_RB","C_BL","C_LT","START","END"].includes(type);
        let initialRot = 0;
        if (isWater && type !== 'START' && type !== 'END') {
          initialRot = INITIAL_ROTATIONS[y][x]; // Use randomized initial rotations
        }
        state.grid[y][x] = { type, rot: initialRot, x, y };
      }
    }
  } while (isPuzzleSolved()); // Ensure puzzle does not start solved

  state.drops = maxDrops;
  state.moves = 0;
  state.solved = false;
  state.score = calculateScore(); // Reset score at start
  renderGame();
  updateHud();
  hideModal();

  console.log('State grid after initialization:', state.grid);
}

function renderGame() {
  const gameGrid = document.getElementById('gameGrid');
  if (!gameGrid) {
    console.error('Error: gameGrid element not found');
    return;
  }
  gameGrid.innerHTML = '';

  // Find all tiles that are part of the valid path
  const pathTiles = getValidPathTiles();
  console.log('Full valid path:', pathTiles.map(pt => `[${pt.y+1},${pt.x+1}]`).join(' -> '));

  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
      const tile = state.grid[y][x];
      const div = document.createElement('div');
      div.classList.add('tile');
      // Debug info for each tile in the path
      const inPath = pathTiles.some(pt => pt.y === y && pt.x === x);
      const isWater = ['H','V','C_TR','C_RB','C_BL','C_LT','START','END'].includes(tile.type);
      const matchesSolution = tile.type === SOLUTION_GRID[y][x] && tile.rot === SOLUTION_ROTATIONS[y][x];
      // Add glow if this tile is part of the valid path, matches solution, and is not box 1 (START)
      if (
        !(y === 0 && x === 0) &&
        inPath &&
        isWater &&
        matchesSolution
      ) {
        div.classList.add('tile-glow');
      }
      // Make box 1 (START) and box 15 (END) static (not rotatable)
      if ((y === 0 && x === 0) || (y === gridSize.rows - 1 && x === gridSize.columns - 1)) {
        div.classList.add('fixed');
      } else if (isWater) {
        div.onclick = (e) => {
          rotateTile(y, x, 1); // Left click: clockwise
        };
        div.oncontextmenu = (e) => {
          e.preventDefault();
          rotateTile(y, x, -1); // Right click: counterclockwise
        };
      }
      if (!isWater) {
        div.classList.add('terrain');
      }
      // Use box number to select the image
      const boxNumber = y * gridSize.columns + x + 1;
      let imgName = `img/lvl_1_box_${boxNumber}`;
      // Prefer water version if it exists for water tiles
      if (isWater && [4,5,8,11,14].includes(boxNumber)) {
        imgName += '_water';
      }
      imgName += '.png';
      const img = document.createElement('img');
      img.src = imgName;
      img.alt = tile.type;
      img.style.transform = `rotate(${tile.rot * 90}deg)`;
      div.appendChild(img);
      gameGrid.appendChild(div);
    }
  }
}

// Helper to get all tiles in the valid path from START to END
function getValidPathTiles() {
  // Find START
  let startY = -1, startX = -1;
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
      if (state.grid[y][x].type === 'START') {
        startY = y; startX = x;
      }
    }
  }
  if (startY === -1 || startX === -1) return [];
  const visited = Array.from({length: gridSize.rows}, () => Array(gridSize.columns).fill(false));
  const path = [];
  function dfs(y, x, fromDir) {
    if (visited[y][x]) return;
    visited[y][x] = true;
    path.push({y, x});
    const tile = state.grid[y][x];
    const rot = tile.rot % 4;
    const connections = TILE_CONNECTIONS[tile.type]?.[rot] || [];
    for (const dir of connections) {
      let ny = y, nx = x;
      if (dir === 'top') ny--;
      if (dir === 'bottom') ny++;
      if (dir === 'left') nx--;
      if (dir === 'right') nx++;
      if (ny < 0 || ny >= gridSize.rows || nx < 0 || nx >= gridSize.columns) continue;
      const nextTile = state.grid[ny][nx];
      if (!TILE_CONNECTIONS[nextTile.type]) continue;
      const nextRot = nextTile.rot % 4;
      const nextConnections = TILE_CONNECTIONS[nextTile.type][nextRot];
      // Only continue if the next tile connects back to us
      if (nextConnections.includes(opposite(dir))) {
        dfs(ny, nx, dir);
      }
    }
  }
  dfs(startY, startX, null);
  console.log('getValidPathTiles path:', path.map(pt => `[${pt.y+1},${pt.x+1}]`).join(' -> '));
  return path;
}

function rotateTile(y, x, direction = 1) {
  if (state.drops <= 0 || state.solved) return;
  if (!timerStarted) {
    startTimer();
    timerStarted = true;
  }
  const tile = state.grid[y][x];
  if (["H","V","C_TR","C_RB","C_BL","C_LT","START","END"].includes(tile.type)) {
    tile.rot = (tile.rot + direction + 4) % 4;
    state.drops--;
    state.moves++;
    state.score = calculateScore(); // Update score after move
    renderGame();
    updateHud();
    // updateProgressBarFromAlignment(); // <-- REMOVE THIS LINE
    // If player runs out of moves and puzzle is not solved, show TRY AGAIN pop-up
    if (state.drops === 0 && !isPuzzleSolved()) {
      stopTimer();
      showModal(false, 'TRY AGAIN!');
    }
  }
}

const WATER_TILES = ['H','V','C_TR','C_RB','C_BL','C_LT','START','END'];

// --- Unified HUD Logic ---
function updateUnifiedHUD() {
  // Timer
  document.getElementById('hud-timer').textContent = formatTime(elapsedSeconds);
  // Drops
  document.getElementById('hud-drops').textContent = state.drops;
  // Score
  document.getElementById('hud-score').textContent = state.score;
  // Progress bar (percent of water tiles correctly aligned)
  const waterTypes = ['H','V','C_TR','C_RB','C_BL','C_LT','START','END'];
  let total = 0, correct = 0;
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
      const tile = state.grid[y][x];
      if (waterTypes.includes(tile.type)) {
        total++;
        if (tile.type === SOLUTION_GRID[y][x] && tile.rot === SOLUTION_ROTATIONS[y][x]) {
          correct++;
        }
      }
    }
  }
  const percent = total ? Math.round((correct / total) * 100) : 0;
  document.getElementById('wpPercent').textContent = percent + '%';
  document.getElementById('wpBarFill').style.width = percent + '%';
  if (percent >= 100) {
    document.getElementById('wpSuccessMsg').style.display = 'block';
    document.querySelector('.wp-hud-circle').style.boxShadow = '0 0 24px 8px #FFD700cc, 0 0 12px #00AEEF88';
  } else {
    document.getElementById('wpSuccessMsg').style.display = 'none';
    document.querySelector('.wp-hud-circle').style.boxShadow = '0 2px 10px rgba(0,174,239,0.10)';
  }
}

// Patch all game update points to call updateUnifiedHUD
function updateHud() {
  state.score = calculateScore();
  updateUnifiedHUD();
  const submitButton = document.getElementById('submitBtn');
  if (submitButton) submitButton.disabled = (!isPuzzleSolved() && state.drops <= 0) || state.solved;
}
function updateTimerDisplay() {
  updateUnifiedHUD();
}

// Remove Help More button logic and milestone logic

// ---- Tile Connection Map ----
const TILE_CONNECTIONS = {
  H:     [['left', 'right'], ['top', 'bottom'], ['left', 'right'], ['top', 'bottom']],
  V:     [['top', 'bottom'], ['left', 'right'], ['top', 'bottom'], ['left', 'right']],
  C_TR:  [['top', 'right'], ['right', 'bottom'], ['bottom', 'left'], ['left', 'top']],
  C_RB:  [['right', 'bottom', 'left'], ['bottom', 'left'], ['left', 'top'], ['top', 'right']], // Added 'left' to rot 0
  C_BL:  [['top', 'bottom', 'left'], ['left', 'top'], ['top', 'right'], ['right', 'bottom']],
  C_LT:  [['left', 'top'], ['top', 'right'], ['right', 'bottom'], ['bottom', 'left']],
  START: [['bottom'], ['right'], ['top'], ['left']], // Depends on start orientation
  END:   [['top'], ['left'], ['bottom'], ['right']]  // Depends on end orientation
};

function validateWaterPath() {
  // Find START
  let startY = -1, startX = -1;
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
      if (state.grid[y][x].type === 'START') {
        startY = y; startX = x;
      }
    }
  }
  if (startY === -1 || startX === -1) return false;
  // BFS or DFS from START
  const visited = Array.from({length: gridSize.rows}, () => Array(gridSize.columns).fill(false));
  const stack = [{y: startY, x: startX, from: null}];
  while (stack.length) {
    const {y, x, from} = stack.pop();
    if (visited[y][x]) continue;
    visited[y][x] = true;
    const tile = state.grid[y][x];
    const rot = tile.rot % 4;
    const connections = TILE_CONNECTIONS[tile.type]?.[rot] || [];
    for (const dir of connections) {
      // Don't go back the way we came
      if (from && dir === opposite(from)) continue;
      let ny = y, nx = x;
      if (dir === 'top') ny--;
      if (dir === 'bottom') ny++;
      if (dir === 'left') nx--;
      if (dir === 'right') nx++;
      if (ny < 0 || ny >= gridSize.rows || nx < 0 || nx >= gridSize.columns) continue;
      const nextTile = state.grid[ny][nx];
      if (!TILE_CONNECTIONS[nextTile.type]) continue;
      const nextRot = nextTile.rot % 4;
      const nextConnections = TILE_CONNECTIONS[nextTile.type][nextRot];
      if (nextConnections.includes(opposite(dir))) {
        if (nextTile.type === 'END') return true;
        stack.push({y: ny, x: nx, from: dir});
      }
    }
  }
  return false;
}
function opposite(dir) {
  return {top:'bottom', bottom:'top', left:'right', right:'left'}[dir];
}

function checkSolved() {
  // Must have a valid water path from START to END
  const valid = validateWaterPath();
  console.log('checkSolved (path-based) result:', valid);
  return valid;
}

function submitFlow() {
  console.log('submitFlow called');
  stopTimer(); // Stop the timer when submitting
  // If out of moves and not solved, force TRY AGAIN popup
  if (state.drops <= 0 && !isPuzzleSolved()) {
    showModal(false, 'TRY AGAIN!');
    console.log('submitPuzzle executed (out of moves, not solved)');
    return;
  }
  submitPuzzle();
  console.log('submitPuzzle executed'); // Debug log to confirm execution
}

// Function to check if the puzzle is in its victory state
function isPuzzleSolved() {
  const pathTiles = getValidPathTiles();
  for (const {y, x} of pathTiles) {
    const tile = state.grid[y][x];
    if (tile.type !== SOLUTION_GRID[y][x] || tile.rot !== SOLUTION_ROTATIONS[y][x]) {
      return false;
    }
  }
  return true;
}

// Function to handle puzzle submission
function submitPuzzle() {
  const solved = isPuzzleSolved();
  const message = solved ? 'WELL DONE!' : 'TRY AGAIN!';
  showModal(solved, message); // Use the styled game-modal version
}

// Function to show the pop-up modal with a message
function showModal(isSuccess, message) {
  console.log('showModal called with isSuccess:', isSuccess, '| message:', message);
  const modal = document.getElementById('game-modal');
  const modalHeading = document.getElementById('modal-heading');
  const factBox = document.getElementById('fact-box');

  if (modal) modal.style.display = 'none';

  if (isSuccess) {
    modal.className = 'game-modal success';
    modalHeading.textContent = 'WELL DONE!';
    factBox.textContent = 'Did you know? More than 700 million people worldwide lack access to clean water.';
  } else {
    modal.className = 'game-modal error';
    modalHeading.textContent = 'TRY AGAIN!';
    factBox.textContent = 'Please try again to complete the water path!';
  }

  if (modal) {
    modal.style.display = 'block';
    console.log('Modal displayed with class:', modal.className); // Debug log for modal visibility
  }
}

function hideModal() {
  const modal = document.getElementById('game-modal');
  if (modal) modal.style.display = 'none';
}

// ---- Event Listeners ----
window.addEventListener('DOMContentLoaded', () => {
  initLevel(LEVEL_1);
  updateTimerDisplay();
  // Attach event listeners
  const startBtn = document.getElementById('startButton');
  const submitBtn = document.getElementById('submitBtn');
  const restartBtn = document.querySelector('button[onclick="restartGame()"]');
  // Settings dropdown logic
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsDropdown = document.getElementById('settingsDropdown');
  if (settingsBtn && settingsDropdown) {
    // Position dropdown absolutely relative to the cog
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle dropdown
      if (settingsDropdown.style.display === 'block') {
        settingsDropdown.style.display = 'none';
      } else {
        // Position dropdown below the cog
        const rect = settingsBtn.getBoundingClientRect();
        settingsDropdown.style.position = 'absolute';
        settingsDropdown.style.top = (settingsBtn.offsetTop + settingsBtn.offsetHeight + 4) + 'px';
        settingsDropdown.style.right = '18px';
        settingsDropdown.style.display = 'block';
        // Highlight current difficulty
        document.querySelectorAll('.settings-dropdown-item').forEach(btn => {
          btn.classList.toggle('selected', btn.dataset.difficulty === currentDifficulty);
        });
      }
    });
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!settingsDropdown.contains(e.target) && e.target !== settingsBtn) {
        settingsDropdown.style.display = 'none';
      }
    });
    // Handle difficulty selection
    settingsDropdown.querySelectorAll('.settings-dropdown-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        setDifficulty(btn.dataset.difficulty);
        settingsDropdown.style.display = 'none';
        e.stopPropagation();
      });
    });
  }
  if (startBtn) {
    startBtn.onclick = () => {
      initLevel(LEVEL_1);
      startTimer();
    };
  }
  if (submitBtn) {
    submitBtn.onclick = () => {
      submitFlow();
    };
  }
  if (restartBtn) {
    restartBtn.onclick = () => {
      initLevel(LEVEL_1);
      startTimer();
    };
  }
  // Modal close button
  const closeBtns = document.querySelectorAll('.close-button');
  closeBtns.forEach(btn => btn.onclick = hideModal);

  // Removed difficulty button listeners for easyBtn, mediumBtn, hardBtn
});

// Expose for HTML inline handlers (if any remain)
window.restartGame = () => { initLevel(LEVEL_1); startTimer(); };
window.hideModal = hideModal;
window.startGame = () => { initLevel(LEVEL_1); startTimer(); };
window.submitFlow = submitFlow;

function setDifficulty(level) {
  currentDifficulty = level;
  maxDrops = DIFFICULTY_SETTINGS[level];
  initLevel(LEVEL_1);
  updateHud();
}

// ---- Shuffle and Randomize Logic ----
function shuffleLevel(level) {
  const shuffled = level.map(row => [...row]); // Clone the level array

  // Flatten the grid, excluding START and END
  const tiles = [];
  for (let y = 0; y < shuffled.length; y++) {
    for (let x = 0; x < shuffled[y].length; x++) {
      if (shuffled[y][x] !== 'START' && shuffled[y][x] !== 'END') {
        tiles.push(shuffled[y][x]);
      }
    }
  }

  // Shuffle the tiles array
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Reassign shuffled tiles back to the grid
  let index = 0;
  for (let y = 0; y < shuffled.length; y++) {
    for (let x = 0; x < shuffled[y].length; x++) {
      if (shuffled[y][x] !== 'START' && shuffled[y][x] !== 'END') {
        shuffled[y][x] = tiles[index++];
      }
    }
  }

  return shuffled;
}

// (Removed tile position shuffling, only randomize rotations)
// for (let y = 0; y < SOLUTION_ROTATIONS.length; y++) {
//   for (let x = 0; x < SOLUTION_ROTATIONS[y].length; x++) {
//     if (LEVEL_1[y][x] !== 'START' && LEVEL_1[y][x] !== 'END') {
//       SOLUTION_ROTATIONS[y][x] = Math.floor(Math.random() * 4); // Random rotation (0-3)
//     }
//   }
// }

function startGame() {
  initLevel(LEVEL_1);
  startTimer();
}

function restartGame() {
  initLevel(LEVEL_1);
  startTimer();
}