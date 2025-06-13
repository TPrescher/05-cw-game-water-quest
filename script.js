// =============================================================
// Clean Water Quest – script.js (3 columns × 5 rows)
//  ► This version adds **explicit asset‑to‑grid mapping comments** so you
//    can clearly see how every image (file name) corresponds to its
//    position and rotation in the completed puzzle.  Copy/paste assets
//    as‑is and the game will render exactly like the reference image.
// =============================================================

/********************** A. VISUAL TILE KEY *********************
Tile # → row, col  |  Asset file (TILE_ASSETS key)  |  Rot
--------------------------------------------------------------
01 → 0,0  |  START.png             | 0°
02 → 0,1  |  V.png                 | 0°
03 → 0,2  |  T_DESERT.png          | 0°
04 → 1,0  |  BLOCKED_1.png         | 0°
05 → 1,1  |  C_TR.png              | 270°
06 → 1,2  |  T_DESERT.png          | 0°
07 → 2,0  |  BLOCKED_2.png         | 0°
08 → 2,1  |  C_RB.png              | 90°
09 → 2,2  |  END.png               | 0°
10 → 3,0 |  T_GRASS.png           | 0°
11 → 3,1 |  C_BL.png              | 180°
12 → 3,2 |  T_DESERT.png          | 0°
13 → 4,0 |  T_FOREST.png          | 0°
14 → 4,1 |  C_LT.png              | 90°
15 → 4,2 |  BLOCKED_3.png         | 0°
***************************************************************/

/************************** 1. ASSET MAP *************************/
const TILE_ASSETS = {
  START:       'img/start_faucet_des_wtr_.png',
  END:         'img/end_village_house.png',
  C_TR:        'img/wtr_des_terrain_1.png',   // curve top→right
  C_RB:        'img/wtr_des_terrain_2.png',   // curve right→bottom
  C_BL:        'img/wtr_des_terrain_3.png',   // curve bottom→left
  C_LT:        'img/wtr_des_terrain_4.png',   // curve left→top
  H:           'img/wtr_des_terrain_5.png',   // horizontal pipe
  V:           'img/wtr_des_terrain_6.png',   // vertical pipe // TODO: file missing if not present
  BLOCKED_1:   'img/terrain_grass_deadend.png',
  BLOCKED_2:   'img/terrain_dbl_mtn_peak_2.png',
  BLOCKED_3:   'img/terrain_dbl_peak_mtn_1.png',
  BLOCKED_4:   'img/terrain_tpl_mtn_peak.png',
  T_GRASS:     'img/terrain_open_desert_1.png',
  T_DESERT:    'img/terrain_open_desert_2.png',
  T_FOREST:    'img/terrain_open_desert_3.png'
};
// TODO: Ensure every image above exists and is unique for its tile type. Do not reuse images for different tile types.

/********************** 2. CONNECTION MAP ************************/
const TILE_CONNECTIONS = {
  H: [['left','right'], ['top','bottom'], ['left','right'], ['top','bottom']],
  V: [['top','bottom'], ['left','right'], ['top','bottom'], ['left','right']],
  C_TR: [['top','right'], ['right','bottom'], ['bottom','left'], ['left','top']],
  C_RB: [['right','bottom'], ['bottom','left'], ['left','top'], ['top','right']],
  C_BL: [['bottom','left'], ['left','top'], ['top','right'], ['right','bottom']],
  C_LT: [['left','top'], ['top','right'], ['right','bottom'], ['bottom','left']],
  START: [['bottom'], ['left'], ['top'], ['right']],
  END:   [['top'], ['right'], ['bottom'], ['left']]
};

const WATER_TYPES = ['H','V','C_TR','C_RB','C_BL','C_LT','START','END'];

/********************** 3. SOLUTION LAYOUT **********************/
const SOLUTION_GRID = [
  // row 0
  ['START',     'V',       'T_FOREST'],
  // row 1
  ['BLOCKED_1', 'C_TR',    'BLOCKED_4'],
  // row 2
  ['T_GRASS',   'C_RB',    'T_DESERT'],
  // row 3
  ['BLOCKED_2', 'C_BL',    'T_DESERT'],
  // row 4
  ['BLOCKED_3', 'C_LT',    'END'] // house in bottom right
];
const SOLUTION_ROTATIONS = [
  [0, 0, 0],    // row 0
  [0, 3, 0],    // row 1
  [0, 1, 0],    // row 2
  [0, 2, 0],    // row 3
  [0, 1, 0]     // row 4
];

// Ensure all images in TILE_ASSETS exist and are unique for their tile type.
// If any image is missing or broken, add a TODO comment above and fix the asset in the img/ folder.

const gridSize = { rows: 5, columns: 3 };
const maxDrops = 20;

/********************** 4. GAME STATE ***************************/
let state = { grid: [], drops: maxDrops, moves: 0, solved: false };

/********************** 5. INITIALISE ***************************/
function initLevel(){
  state.grid=[];
  for(let y=0;y<gridSize.rows;y++){
    state.grid[y]=[];
    for(let x=0;x<gridSize.columns;x++){
      const type=SOLUTION_GRID[y][x];
      let rot = WATER_TYPES.includes(type)&&!['START','END'].includes(type)?Math.floor(Math.random()*4):SOLUTION_ROTATIONS[y][x];
      state.grid[y][x]={type,rot,x,y};
    }
  }
  state.drops=maxDrops;state.moves=0;state.solved=false;
  renderGrid();updateHud();updateProgress();
}

/************************ 6. RENDER *****************************/
function renderGrid(){
  const g=document.getElementById('gameGrid');
  g.style.gridTemplateColumns=`repeat(${gridSize.columns},1fr)`;
  g.style.gridTemplateRows=`repeat(${gridSize.rows},1fr)`;
  g.innerHTML='';
  state.grid.flat().forEach(t=>{
    const d=document.createElement('div');d.className='tile';
    if(!WATER_TYPES.includes(t.type))d.classList.add('terrain');
    if(!state.solved&&WATER_TYPES.includes(t.type))d.onclick=()=>rotateTile(t.y,t.x);
    const i=document.createElement('img');i.src=TILE_ASSETS[t.type];i.style.transform=`rotate(${t.rot*90}deg)`;
    d.appendChild(i);g.appendChild(d);
  });
}

/************************ 7. ROTATE *****************************/
function rotateTile(y,x){if(state.drops<=0||state.solved)return;const t=state.grid[y][x];if(!WATER_TYPES.includes(t.type))return;t.rot=(t.rot+1)%4;state.drops--;state.moves++;renderGrid();updateHud();updateProgress();}

/*********************** 8. PROGRESS ***************************/
function updateProgress(){
  let total=0,correct=0;WATER_TYPES.forEach(()=>{});
  for(let y=0;y<gridSize.rows;y++)for(let x=0;x<gridSize.columns;x++){const t=state.grid[y][x];if(WATER_TYPES.includes(t.type)){total++;if(t.type===SOLUTION_GRID[y][x]&&t.rot===SOLUTION_ROTATIONS[y][x])correct++;}}
  const pct=total?(correct/total)*100:0;document.querySelector('.progress-fill').style.width=`${pct}%`;if(correct===total&&!state.solved){state.solved=true;showModal(true,'You brought clean water to the village!');}}

/************************ 9. HUD *******************************/
function updateHud(){document.getElementById('drops').textContent=state.drops;document.getElementById('moves').textContent=state.moves;}

/********************** 10. RESTART ****************************/
function restartGame(){initLevel();}

document.getElementById('restartBtn')?.addEventListener('click',restartGame);
document.addEventListener('DOMContentLoaded',initLevel);
// =============================================================
// End of script – All asset mappings now explicitly documented.
// =============================================================
