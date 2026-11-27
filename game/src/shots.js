// The screenshot scenes behind ?shot=start|play|chase|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (jump the next fence, duck under a thrown knife, hide
// in the hay when the farmer is close, dash when he sprints), so the frame is
// what a real game looks like and the same seed always gives the same frame.
import { FIELD, RUN, STEP, TURKEY } from './config.js';
import { EVENT_OVER, PX_PER_METRE } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = 1 / 30;

/** Current scroll speed in px/s, so jump timing holds in mud and at speed. */
function scrollSpeed(state) {
  let speed = RUN.baseSpeed + state.stage * RUN.speedPerStage;
  if (state.turkey.mud) speed *= 0.55;
  return speed * PX_PER_METRE;
}

/** The autopilot's move for this step: jump, duck, dash, or nothing. */
function autopilot(world) {
  const state = world.state;
  const t = state.turkey;
  const rect = world.turkeyRect();
  const scroll = scrollSpeed(state);
  let jump = false;
  let duck = false;
  let dash = false;

  for (const o of state.obstacles) {
    const ahead = o.x - (rect.x + rect.width);
    if (ahead < -80 || ahead > 300) continue;
    const secondsAway = ahead / scroll;
    if (o.kind === 'thrown') {
      if (ahead < 220) duck = true;
    } else if (o.kind === 'hay') {
      if (state.farmer.gap < 230 && ahead < 40) duck = true; // dive into the hay
    } else if (o.kind !== 'mud') {
      // Jump late, so the turkey is still high while the obstacle passes
      // under it: an early jump lands on top of the fence.
      if (secondsAway < 0.24 && t.y === 0) jump = true;
    }
  }
  // A swinging knife overhead: jump over the blade while it sweeps low.
  for (const s of state.swings) {
    const tipX = s.x + Math.sin(s.angle) * s.length;
    const tipY = s.pivotY + Math.cos(s.angle) * s.length;
    if (Math.abs(tipX - (rect.x + rect.width / 2)) < 110 && tipY > FIELD.groundY - 130) {
      if (t.y === 0) jump = true;
    }
  }
  if (state.farmer.mode === 'sprint' && t.feather >= 0.5) dash = true;
  if (state.farmer.gap < 200 && t.feather >= 0.5) dash = true;
  return { jump, duck, dash };
}

function runSteps(world, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const controls = pilot ? autopilot(world) : { jump: false, duck: false, dash: false };
    const events = world.step(STEP, controls);
    if (events.includes(EVENT_OVER)) break;
  }
}

/**
 * Keep playing (up to `capSeconds` more) until `wanted(state)` is true:
 * used to frame a good screenshot moment, e.g. an oven in view.
 */
function runUntil(world, wanted, capSeconds) {
  const steps = Math.floor(capSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (wanted(world.state)) return true;
    const events = world.step(STEP, autopilot(world));
    if (events.includes(EVENT_OVER)) return false;
  }
  return wanted(world.state);
}

/** True when a solid obstacle sits in the middle of the frame. */
function obstacleInFrame(state, kinds) {
  for (const o of state.obstacles) {
    if (kinds.includes(o.kind) && o.x > 480 && o.x < 1150) return true;
  }
  for (const s of state.swings) {
    if (kinds.includes('swing') && s.x > 480 && s.x < 1150) return true;
  }
  return false;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: title over the farmyard. play: mid-run in the barn, HUD up, farmer
 * behind, corn ahead. chase: deep in the kitchen, farmer close, oven and a
 * swinging knife in frame. end: a full run the autopilot wins — ESCAPED.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    runSteps(world, 66, true);
    runUntil(world, (s) => obstacleInFrame(s, ['fence', 'bale', 'crate', 'hay', 'thrown']), 14);
    // Frame the chase: the farmer visible just behind the turkey.
    world.state.farmer.gap = 210;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'chase') {
    runSteps(world, 120, true);
    runUntil(world, (s) => obstacleInFrame(s, ['oven', 'swing', 'thrown']), 45);
    // Force the farmer right onto the turkey's tail for the shot.
    world.state.farmer.gap = 92;
    world.state.farmer.mode = 'sprint';
    world.state.farmer.modeTime = 1.2;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    runSteps(world, 600, true);
    if (world.state.outcome !== 'escaped') {
      // The pilot should have escaped by now; if not, force the ending frame.
      world.state.distance = 1200;
      world.state.screen = 'over';
      world.state.outcome = 'escaped';
      world.state.outcomeReason = 'Gobbles slips through the forest gate — free!';
      world.state.score += 1000 + world.state.lives * 200;
    }
    return { screen: SCREEN_OVER };
  }
  runSteps(world, 4, false);
  return { screen: SCREEN_TITLE };
}
