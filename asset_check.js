// Asset verification for Clean Water Quest
const fs = require('fs');
const path = require('path');

const TILE_ASSETS = {
  START:       'img/start_faucet_des_wtr_.png',
  END:         'img/end_village_house.png',
  C_TR:        'img/wtr_des_terrain_1.png',
  C_RB:        'img/wtr_des_terrain_2.png',
  C_BL:        'img/wtr_des_terrain_3.png',
  C_LT:        'img/wtr_des_terrain_4.png',
  H:           'img/wtr_des_terrain_5.png',
  V:           'img/wtr_des_terrain_5.png', // vertical pipe fallback to horizontal asset
  BLOCKED_1:   'img/terrain_grass_deadend.png',
  BLOCKED_2:   'img/terrain_dbl_mtn_peak_2.png',
  BLOCKED_3:   'img/terrain_dbl_peak_mtn_1.png',
  BLOCKED_4:   'img/terrain_tpl_mtn_peak.png',
  T_GRASS:     'img/terrain_open_desert_1.png',
  T_DESERT:    'img/terrain_open_desert_2.png',
  T_FOREST:    'img/terrain_open_desert_3.png'
};

const imgDir = path.join(__dirname, 'img');
const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png'));
const fileSet = new Set(files);

// Check for missing asset files
const mapping = Object.entries(TILE_ASSETS).map(([key, relPath]) => {
  const fname = relPath.replace('img/', '');
  const exists = fileSet.has(fname);
  return { key, filename: fname, exists };
});

// List extra PNGs in img/ not referenced
const referenced = new Set(Object.values(TILE_ASSETS).map(f => f.replace('img/', '')));
const extraPNGs = files.filter(f => !referenced.has(f));

// Optionally copy any duplicate desert images
const desert2 = path.join(imgDir, 'terrain_open_desert_2.png');
const desert3 = path.join(imgDir, 'terrain_open_desert_3.png');
if (!fs.existsSync(desert2) && fs.existsSync(desert3)) {
  fs.copyFileSync(desert3, desert2);
  console.log('Copied terrain_open_desert_3.png to terrain_open_desert_2.png');
}

// Output summary
if (extraPNGs.length) {
  console.log('/* Extra PNGs in img/ not referenced by TILE_ASSETS:');
  extraPNGs.forEach(f => console.log('   -', f));
  console.log('*/');
}
console.table(mapping);

// Inline TODOs for missing files
mapping.forEach(m => {
  if (!m.exists) {
    console.log(`// TODO: ${m.filename} is missing for TILE_ASSETS['${m.key}']`);
  }
});
