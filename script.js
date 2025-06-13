// ---- Tile Asset Map ----
const TILE_ASSETS = {
   START:         'img/pipe_start_faucet.png',
  END:           'img/pipe_end_village.png',
  C_LT:          'img/pipe_curve_left_top.png',
  C_RB:          'img/pipe_curve_right_bottom.png',
  C_BL:          'img/pipe_curve_bottom_left.png',
  C_TR:          'img/pipe_curve_top_right.png',
  V:             'img/pipe_straight_horizontal.png',
  H:             'img/pipe_straight_horizontal.png',
  BLOCKED_1:     'img/terrain_grass_deadend.png',
  BLOCKED_2:     'img/terrain_mountain_peaks_1.png',
  BLOCKED_3:     'img/terrain_mountain_peaks_2.png',
  BLOCKED_4:     'img/terrain_mountain_peaks_3.png',
  T_FOREST:      'img/terrain_woodland_small.png',
  T_DESERT_1:    'img/terrain_desert_open_1.png',
  T_DESERT_2:    'img/terrain_desert_open_2.png',
  T_DESERT_3:    'img/terrain_desert_open_3.png',
  T_GRASS:       'img/terrain_grass_deadend.png',
  T_DESERT:      'img/terrain_desert_open_1.png',
  T_MOUNTAIN_1:  'img/terrain_mountain_peaks_1.png',
  T_MOUNTAIN_2:  'img/terrain_mountain_peaks_2.png'
};

// ---- Solution Grid ----
const SOLUTION_GRID = [
  ['START',     'T_DESERT_1', 'T_FOREST'  ],
  ['C_TR',      'C_RB',      'T_MOUNTAIN_1'      ], // Box 6 now T_MOUNTAIN_1
  ['BLOCKED_1', 'C_LT',      'T_MOUNTAIN_2' ],
  ['BLOCKED_4',   'C_BL',       'T_DESERT_2'],
  ['T_DESERT_3','H',       'END' ]
];
const SOLUTION_ROTATIONS = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0]
];
const LEVEL_1 = [
  ['START',     'T_DESERT_1', 'T_FOREST'  ],
  ['C_TR',      'C_RB',      'T_MOUNTAIN_1'      ], // Box 6 now T_MOUNTAIN_1
  ['BLOCKED_1', 'C_LT',      'T_MOUNTAIN_2' ],
  ['BLOCKED_4',   'C_BL',       'T_DESERT_2'],
  ['T_DESERT_3','H',       'END' ]
];
const gridSize = { rows: 5, columns: 3 };
const maxDrops = 15;
let state = {
  grid: [],
  drops: maxDrops,
  score: 0,
  moves: 0,
  solved: false,
  turns: 0
};

let timerInterval = null;
let elapsedSeconds = 0;

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
  // Example: base 1000, minus 5 per second, minus 2 per move, plus 10 per drop left
  let score = 1000 - (elapsedSeconds * 5) - (state.moves * 2) + (state.drops * 10);
  if (score < 0) score = 0;
  return score;
}

function initLevel(level) {
  state.grid = [];
  for (let y = 0; y < gridSize.rows; y++) {
    state.grid[y] = [];
    for (let x = 0; x < gridSize.columns; x++) {
      const type = level[y][x];
      const isWater = ['H','V','C_TR','C_RB','C_BL','C_LT','START','END'].includes(type);
      let initialRot = 0;
      if (isWater && type !== 'START' && type !== 'END') {
        initialRot = Math.floor(Math.random() * 4);
      }
      state.grid[y][x] = { type, rot: initialRot, x, y };
    }
  }
  state.drops = maxDrops;
  state.moves = 0;
  state.turns = 0;
  state.solved = false;
  renderGame();
  updateHud();
  hideModal();
  updateProgressBarFromAlignment();
}

function renderGame() {
  const gameGrid = document.getElementById('gameGrid');
  if (!gameGrid) {
    console.error('Error: gameGrid element not found');
    return;
  }
  gameGrid.innerHTML = '';
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
      const tile = state.grid[y][x];
      const div = document.createElement('div');
      div.classList.add('tile');
      if (!['H', 'V', 'C_TR', 'C_RB', 'C_BL', 'C_LT', 'START', 'END'].includes(tile.type)) {
        div.classList.add('terrain');
      } else {
        div.onclick = () => rotateTile(y, x);
      }
      const img = document.createElement('img');
      img.src = TILE_ASSETS[tile.type] || 'img/terrain_grass_deadend.png';
      img.alt = tile.type;
      img.style.transform = `rotate(${tile.rot * 90}deg)`;
      div.appendChild(img);
      gameGrid.appendChild(div);
    }
  }
}

function rotateTile(y, x) {
  if (state.drops <= 0 || state.solved) return;
  const tile = state.grid[y][x];
  if (['H','V','C_TR','C_RB','C_BL','C_LT','START','END'].includes(tile.type)) {
    tile.rot = (tile.rot + 1) % 4;
    state.drops--;
    state.moves++;
    renderGame();
    updateHud();
    updateProgressBarFromAlignment();
  }
}

function updateHud() {
  const scoreElement = document.getElementById('score');
  const dropsElement = document.getElementById('drops');
  const movesElement = document.getElementById('moves');
  const submitButton = document.getElementById('submitBtn');
  if (scoreElement) scoreElement.textContent = `SCORE ${state.score}`;
  if (dropsElement) dropsElement.textContent = `💧 ${state.drops}`;
  if (movesElement) movesElement.textContent = `MOVES: ${state.moves}`;
  if (submitButton) submitButton.disabled = (state.drops<=0 || state.solved);
}

function updateProgressBarFromAlignment() {
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
  const percent = total ? (correct / total) * 100 : 0;
  document.querySelector('.progress-fill').style.width = `${percent}%`;
}

function checkSolved() {
  const waterTypes = ['H','V','C_TR','C_RB','C_BL','C_LT','START','END'];
  for (let y = 0; y < gridSize.rows; y++) {
    for (let x = 0; x < gridSize.columns; x++) {
      const tile = state.grid[y][x];
      if (waterTypes.includes(tile.type)) {
        if (tile.type !== SOLUTION_GRID[y][x] || tile.rot !== SOLUTION_ROTATIONS[y][x]) {
          return false;
        }
      }
    }
  }
  return true;
}

// ---- Modal/Popup Logic ----
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
  if (factElement) {
    const randomIndex = Math.floor(Math.random() * cleanWaterFacts.length);
    factElement.textContent = cleanWaterFacts[randomIndex];
  }
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
    modalText.textContent = message || 'You brought clean water to the village!';
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
  if (modal) modal.style.display = 'none';
}

// ---- Submit/Validation Logic ----
function submitFlow() {
  if (state.solved) return;
  stopTimer();
  if (checkSolved()) {
    state.solved = true;
    state.score = calculateScore();
    updateHud();
    showModal(true, `You brought clean water to the village!<br>Score: <b>${state.score}</b>`);
  } else {
    showModal(false, 'Water path is not complete!');
  }
}

// ---- Event Listeners ----
window.onload = () => {
  initLevel(LEVEL_1);
  updateTimerDisplay();
  // Attach event listeners
  const startBtn = document.getElementById('startButton');
  const submitBtn = document.getElementById('submitBtn');
  const restartBtn = document.querySelector('button[onclick="restartGame()"]');
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
};

// Expose for HTML inline handlers (if any remain)
window.restartGame = () => { initLevel(LEVEL_1); startTimer(); };
window.hideModal = hideModal;
window.startGame = () => { initLevel(LEVEL_1); startTimer(); };
window.submitFlow = submitFlow;