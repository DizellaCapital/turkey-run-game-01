// Turkey Trot — the entry point: the loop, the screens, and the wiring
// between input, world, render and sound. ?shot=start|play|chase|end stages
// one deterministic scene (used for the screenshots) and draws it once;
// without it the game plays live with requestAnimationFrame.
import { BEST_KEY, STEP } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_CORN, EVENT_DASH, EVENT_FEATHER, EVENT_FOUND, EVENT_HIDE, EVENT_HIT, EVENT_OVER, EVENT_PIE, EVENT_STAGE, EVENT_YELL } from './world.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? 7) || 7;

const input = createInput(canvas);
const audio = createAudio();
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const state = world.state;

function loadBest() {
  try {
    state.best = Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
  } catch {
    state.best = 0;
  }
}
function saveBest() {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.floor(state.best)));
  } catch {
    // Best score is a nicety; a browser without storage still plays.
  }
}
loadBest();

function announce(text) {
  if (status) status.textContent = text;
}

function playSound(event) {
  if (event === EVENT_CORN) audio.corn();
  else if (event === EVENT_PIE) audio.pie();
  else if (event === EVENT_FEATHER) audio.feather();
  else if (event === EVENT_DASH) audio.dash();
  else if (event === EVENT_HIT) audio.hit();
  else if (event === EVENT_HIDE) { audio.gobble(); audio.hide(); }
  else if (event === EVENT_FOUND) audio.dash();
  else if (event === EVENT_STAGE) audio.stage();
  else if (event === EVENT_YELL) audio.farmerYell();
}

function startRun() {
  audio.unlock();
  world.reset();
  state.screen = 'play';
  announce('Running! Jump the fences, dodge the knives, reach the forest gate.');
}

if (shot) {
  // Screenshot mode: stage the scene from the real rules and draw one frame.
  const staged = stageShot(shot, world);
  state.screen = staged.screen === SCREEN_OVER ? 'over' : staged.screen === SCREEN_TITLE ? 'title' : 'play';
  if (state.screen === 'over' && state.outcome === null) {
    state.outcome = 'escaped';
    state.outcomeReason = 'Gobbles slips through the forest gate — free!';
  }
  renderer.render(state, staged.screen);
  document.title = `Turkey Trot — ${shot}`;
} else {
  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    state.time += elapsed;

    if (input.mutePressed) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }

    if (state.screen === 'title') {
      world.reset();
      state.screen = 'title';
      if (input.jumpPressed) startRun();
      renderer.render(state, SCREEN_TITLE);
      input.endStep();
      return;
    }

    if (state.screen === 'over') {
      if (input.jumpPressed) startRun();
      renderer.render(state, SCREEN_OVER);
      input.endStep();
      return;
    }

    if (input.pausePressed) {
      state.screen = state.screen === 'paused' ? 'play' : 'paused';
      announce(state.screen === 'paused' ? 'Paused.' : 'Running!');
    }
    if (state.screen === 'paused') {
      renderer.render(state, SCREEN_PAUSED);
      input.endStep();
      return;
    }

    accumulator += elapsed;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const events = world.step(STEP, {
        jump: input.jumpPressed,
        duck: input.duckHeld,
        dash: input.dashPressed,
      });
      for (const event of events) playSound(event);
      input.endStep();
      if (state.screen === 'over') {
        if (state.outcome === 'escaped') audio.escape();
        else audio.caught();
        if (Math.floor(state.score) > Math.floor(state.best)) {
          state.best = state.score;
          saveBest();
        }
        announce(state.outcome === 'escaped'
          ? `Escaped! Final score ${Math.floor(state.score)}. Press Space to run again.`
          : `Caught! ${state.outcomeReason}. Final score ${Math.floor(state.score)}. Press Space to run again.`);
        break;
      }
    }
    renderer.render(state, SCREEN_PLAY);
  }
  requestAnimationFrame(frame);
}
