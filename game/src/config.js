// Turkey Trot — every tuning number and colour in one place.
// The playfield is a fixed 1280x480 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size. The turkey runs
// from the farmyard (0m) through the barn (400m) and the kitchen (800m) to
// the forest gate at 1200m, where it escapes.
export const FIELD = { width: 1280, height: 480, groundY: 408 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Escape distance, in metres, and where each stage begins. */
export const ESCAPE_DISTANCE = 1200;
export const STAGES = [
  { name: 'FARMYARD', from: 0, to: 400 },
  { name: 'BARN', from: 400, to: 800 },
  { name: 'KITCHEN', from: 800, to: 1200 },
  { name: 'FOREST', from: 1200, to: 1200 },
];

export const TURKEY = {
  x: 300,
  width: 64,
  height: 52,
  jumpSpeed: 950,
  gravity: 2350,
  duckHeight: 30,
  invulnerable: 1.6,
};

export const LIVES = 3;

/** Farmer gap (px behind the turkey) dynamics. */
export const FARMER = {
  startGap: 300,
  caughtGap: 0,
  closeGap: 130,
  hitLoss: 55,
  cornGain: 14,
  hideGain: 110,
  dashGain: 34,
  searchTime: 2.0,
  sprintTime: 1.4,
};

/** Base run speed in metres per second, growing per stage. */
export const RUN = {
  baseSpeed: 7.0,
  speedPerStage: 1.0,
  dashSpeed: 11.5,
  dashTime: 0.9,
  dashRefill: 0.55,
};

export const OBSTACLE = {
  fence: { width: 26, height: 58 },
  bale: { width: 56, height: 44 },
  crate: { width: 48, height: 52 },
  mud: { width: 90, height: 10 },
  oven: { width: 80, height: 100 },
  pie: { size: 30, points: 100 },
  corn: { size: 26, points: 50 },
  feather: { size: 30 },
};

export const POINTS = {
  perMetre: 1,
  corn: 50,
  pie: 100,
  stage: 250,
  escape: 1000,
  lifeBonus: 200,
};

export const PALETTE = {
  skyTop: '#f7b267',
  skyMid: '#f4845f',
  skyLow: '#e3645a',
  kitchenWall: '#8a4b2d',
  kitchenFloor: '#5d3a24',
  ground: '#7a4a21',
  groundDark: '#5f3817',
  grass: '#4d7a2e',
  grassDark: '#3c6123',
  turkeyBody: '#8a5230',
  turkeyBelly: '#c98d4b',
  tail: ['#a0522d', '#d2691e', '#e8a33c', '#c94f38'],
  head: '#e8dcc8',
  wattle: '#e5534b',
  beak: '#f2a93b',
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#3a5a8c',
  farmerSkin: '#e8b88a',
  farmerHat: '#d9a441',
  knifeBlade: '#d7dde6',
  knifeHandle: '#4a2c14',
  ovenBody: '#3d3d46',
  ovenDoor: '#ff9a3c',
  flame: ['#ffdd55', '#ff9a3c', '#ff5a2a'],
  corn: '#f2c94c',
  cornHusk: '#5d8a3c',
  hay: '#e8c85a',
  hayDark: '#c9a83c',
  panel: 'rgba(24, 14, 8, 0.72)',
  panelEdge: '#f2a93b',
  text: '#fff3e0',
  muted: '#e8c9a0',
  danger: '#ff5a2a',
  heart: '#ff5a6e',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'turkey-trot.best';
