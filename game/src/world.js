// Turkey Trot — the whole game simulation: the turkey, the farmer, the
// obstacles, the pickups and the three stages. Pure fixed-step logic, no
// drawing and no sound here; render.js draws this state, main.js plays the
// sounds for the events step() returns. All randomness comes from the seeded
// generator, so the same seed always plays the same game.
import { ESCAPE_DISTANCE, FARMER, FIELD, LIVES, OBSTACLE, POINTS, RUN, STAGES, STEP, TURKEY } from './config.js';
import { createRandom } from './random.js';

/** Metres shown on screen per pixel of world travel. */
export const PX_PER_METRE = 48;

export const EVENT_HIT = 'hit';
export const EVENT_OVER = 'over';
export const EVENT_STAGE = 'stage';
export const EVENT_CORN = 'corn';
export const EVENT_PIE = 'pie';
export const EVENT_FEATHER = 'feather';
export const EVENT_DASH = 'dash';
export const EVENT_HIDE = 'hide';
export const EVENT_FOUND = 'found';
export const EVENT_YELL = 'yell';
export const EVENT_MUD = 'mud';

const SPAWN_AHEAD = 420;

function stageIndexFor(distance) {
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance < STAGES[i].to) return i;
  }
  return STAGES.length - 1;
}

export function createWorld(seed) {
  const random = createRandom(seed);
  const state = {
    screen: 'title',
    outcome: null,
    outcomeReason: '',
    distance: 0,
    score: 0,
    lives: LIVES,
    stage: 0,
    banner: '',
    bannerTime: 0,
    time: 0,
    turkey: {
      y: 0,
      vy: 0,
      ducking: false,
      hidden: false,
      hideTime: 0,
      invulnerable: 0,
      dashTime: 0,
      feather: 1,
      runPhase: 0,
      mud: false,
    },
    farmer: {
      gap: FARMER.startGap,
      mode: 'chase',
      modeTime: 0,
      sprintIn: 5 + random() * 3,
      runPhase: 0,
    },
    obstacles: [],
    pickups: [],
    swings: [],
    particles: [],
    spawnIn: 1.1,
    best: 0,
  };

  function reset() {
    state.screen = 'title';
    state.outcome = null;
    state.outcomeReason = '';
    state.distance = 0;
    state.score = 0;
    state.lives = LIVES;
    state.stage = 0;
    state.banner = 'FARMYARD — run, Gobbles, run!';
    state.bannerTime = 3;
    state.time = 0;
    state.turkey.y = 0;
    state.turkey.vy = 0;
    state.turkey.ducking = false;
    state.turkey.hidden = false;
    state.turkey.hideTime = 0;
    state.turkey.invulnerable = 0;
    state.turkey.dashTime = 0;
    state.turkey.feather = 1;
    state.turkey.runPhase = 0;
    state.turkey.mud = false;
    state.farmer.gap = FARMER.startGap;
    state.farmer.mode = 'chase';
    state.farmer.modeTime = 0;
    state.farmer.sprintIn = 5 + random() * 3;
    state.farmer.runPhase = 0;
    state.obstacles.length = 0;
    state.pickups.length = 0;
    state.swings.length = 0;
    state.particles.length = 0;
    state.spawnIn = 1.1;
  }

  function turkeyRect() {
    const t = state.turkey;
    const height = t.ducking ? TURKEY.duckHeight : TURKEY.height;
    return {
      x: TURKEY.x,
      y: FIELD.groundY - t.y - height,
      width: TURKEY.width,
      height,
    };
  }

  function burst(x, y, colours, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const v = speed * (0.4 + random() * 0.8);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 60,
        life: 0.7 + random() * 0.5,
        age: 0,
        colour: colours[Math.floor(random() * colours.length)],
        size: 3 + random() * 5,
      });
    }
  }

  function spawnPattern() {
    const stage = state.stage;
    const roll = random();
    const x = FIELD.width + 60 + random() * 180;
    if (stage === 2) {
      // Kitchen: ovens, swinging and thrown carving knives, corn to grab.
      if (roll < 0.22) {
        state.obstacles.push({ kind: 'oven', x, width: OBSTACLE.oven.width, height: OBSTACLE.oven.height });
        for (let i = -1; i <= 1; i += 1) {
          state.pickups.push({ kind: 'corn', x: x + i * 46, y: FIELD.groundY - 156 + Math.abs(i) * 26, size: OBSTACLE.corn.size, taken: false });
        }
      } else if (roll < 0.38) {
        state.swings.push({ x, pivotY: 8, length: 360, angle: -0.5, speed: 1.4 + random() * 0.4, direction: 1 });
      } else if (roll < 0.55) {
        state.obstacles.push({ kind: 'thrown', x, y: FIELD.groundY - 52, width: 44, height: 14, speed: 340 + stage * 40 });
      } else if (roll < 0.68) {
        state.obstacles.push({ kind: 'oven', x, width: OBSTACLE.oven.width, height: OBSTACLE.oven.height });
      } else if (roll < 0.82) {
        state.pickups.push({ kind: 'corn', x, y: FIELD.groundY - 34, size: OBSTACLE.corn.size, taken: false });
        state.pickups.push({ kind: 'corn', x: x + 44, y: FIELD.groundY - 34, size: OBSTACLE.corn.size, taken: false });
      } else if (roll < 0.9) {
        state.pickups.push({ kind: 'feather', x, y: FIELD.groundY - 120, size: OBSTACLE.feather.size, taken: false });
      } else {
        state.pickups.push({ kind: 'pie', x, y: FIELD.groundY - 34, size: OBSTACLE.pie.size, taken: false });
      }
      return;
    }
    if (roll < 0.16) {
      // A fence with a corn arc over it: jump and eat.
      state.obstacles.push({ kind: 'fence', x, width: OBSTACLE.fence.width, height: OBSTACLE.fence.height });
      for (let i = -1; i <= 1; i += 1) {
        state.pickups.push({ kind: 'corn', x: x + i * 46, y: FIELD.groundY - 132 + Math.abs(i) * 26, size: OBSTACLE.corn.size, taken: false });
      }
    } else if (roll < 0.3) {
      const kind = stage === 0 ? 'bale' : 'crate';
      const spec = kind === 'bale' ? OBSTACLE.bale : OBSTACLE.crate;
      state.obstacles.push({ kind, x, width: spec.width, height: spec.height });
    } else if (roll < 0.42) {
      state.obstacles.push({ kind: 'mud', x, width: OBSTACLE.mud.width, height: OBSTACLE.mud.height });
      if (random() < 0.5) state.pickups.push({ kind: 'corn', x: x + 45, y: FIELD.groundY - 34, size: OBSTACLE.corn.size, taken: false });
    } else if (roll < 0.54) {
      // A haystack to hide in, sometimes with a pie slice behind it.
      state.obstacles.push({ kind: 'hay', x, width: 76, height: 62 });
      if (random() < 0.4) state.pickups.push({ kind: 'pie', x: x + 96, y: FIELD.groundY - 40, size: OBSTACLE.pie.size, taken: false });
    } else if (roll < 0.64 && stage >= 1) {
      // A carving knife thrown at head height: duck under it.
      state.obstacles.push({ kind: 'thrown', x, y: FIELD.groundY - 52, width: 44, height: 14, speed: 340 + stage * 40 });
    } else if (roll < 0.74 && stage >= 2) {
      // The oven: tall, hot, jump it clean.
      state.obstacles.push({ kind: 'oven', x, width: OBSTACLE.oven.width, height: OBSTACLE.oven.height });
    } else if (roll < 0.82 && stage >= 2) {
      // A carving knife swinging from the kitchen ceiling: its long blade
      // sweeps down through the turkey's path — jump it while it is low.
      state.swings.push({ x, pivotY: 8, length: 360, angle: -0.5, speed: 1.4 + random() * 0.4, direction: 1 });
    } else if (roll < 0.9) {
      state.pickups.push({ kind: 'corn', x, y: FIELD.groundY - 34, size: OBSTACLE.corn.size, taken: false });
      state.pickups.push({ kind: 'corn', x: x + 44, y: FIELD.groundY - 34, size: OBSTACLE.corn.size, taken: false });
    } else if (roll < 0.95) {
      state.pickups.push({ kind: 'feather', x, y: FIELD.groundY - 120, size: OBSTACLE.feather.size, taken: false });
    } else {
      state.pickups.push({ kind: 'pie', x, y: FIELD.groundY - 34, size: OBSTACLE.pie.size, taken: false });
    }
  }

  function runSpeed() {
    const t = state.turkey;
    let speed = RUN.baseSpeed + state.stage * RUN.speedPerStage;
    if (t.dashTime > 0) speed = RUN.dashSpeed;
    if (t.mud) speed *= 0.55;
    return speed;
  }

  function hitTurkey() {
    const t = state.turkey;
    if (t.invulnerable > 0 || t.hidden) return;
    state.lives -= 1;
    t.invulnerable = TURKEY.invulnerable;
    state.farmer.gap = Math.max(0, state.farmer.gap - FARMER.hitLoss);
    burst(TURKEY.x + 32, FIELD.groundY - t.y - 30, ['#fff3e0', '#e8a33c', '#c94f38'], 22, 260);
    if (state.lives <= 0) {
      endGame('caught', 'out of lives — the farmer scoops Gobbles up');
    }
  }

  function endGame(outcome, reason) {
    state.screen = 'over';
    state.outcome = outcome;
    state.outcomeReason = reason;
    if (outcome === 'escaped') {
      state.score += POINTS.escape + state.lives * POINTS.lifeBonus;
      burst(TURKEY.x + 32, FIELD.groundY - 90, ['#f2c94c', '#ff9a3c', '#4d7a2e', '#fff3e0'], 60, 320);
    }
  }

  function step(dt, controls) {
    const events = [];
    const t = state.turkey;
    const f = state.farmer;
    state.time += dt;
    if (state.bannerTime > 0) state.bannerTime -= dt;
    if (t.invulnerable > 0) t.invulnerable -= dt;

    // Hidden in a haystack: the farmer searches, the turkey waits.
    if (t.hidden) {
      t.hideTime -= dt;
      f.gap = Math.min(420, f.gap + (FARMER.hideGain / FARMER.searchTime) * dt);
      if (t.hideTime <= 0) {
        t.hidden = false;
        t.dashTime = 0.7;
        events.push(EVENT_FOUND);
      }
      updateParticles(dt);
      return events;
    }

    const speed = runSpeed();
    const scroll = speed * PX_PER_METRE * dt;
    state.distance += speed * dt;
    state.score += speed * dt * POINTS.perMetre;
    t.runPhase += dt * (t.dashTime > 0 ? 22 : 13);
    f.runPhase += dt * 11;

    // Stage changes: farmyard -> barn -> kitchen -> forest gate.
    const nextStage = stageIndexFor(state.distance);
    if (nextStage !== state.stage && state.distance < ESCAPE_DISTANCE) {
      state.stage = nextStage;
      state.banner = `${STAGES[nextStage].name} — it gets hotter in here!`;
      state.bannerTime = 2.6;
      state.score += POINTS.stage;
      events.push(EVENT_STAGE);
    }

    // Jump / duck / dash.
    if (controls.jump && t.y === 0 && !t.ducking) {
      t.vy = TURKEY.jumpSpeed;
    }
    t.ducking = controls.duck && t.y === 0;
    if (controls.dash && t.dashTime <= 0 && t.feather >= 0.5) {
      t.dashTime = RUN.dashTime;
      t.feather -= 0.5;
      f.gap = Math.min(420, f.gap + FARMER.dashGain);
      events.push(EVENT_DASH);
    }
    if (t.dashTime > 0) t.dashTime -= dt;
    t.feather = Math.min(1, t.feather + RUN.dashRefill * dt);

    // Vertical motion.
    if (t.y > 0 || t.vy !== 0) {
      t.vy -= TURKEY.gravity * dt;
      t.y += t.vy * dt;
      if (t.y <= 0) {
        t.y = 0;
        t.vy = 0;
      }
    }

    // The farmer: he closes in, sprints when close, and searches haystacks.
    if (f.mode === 'sprint') {
      f.modeTime -= dt;
      f.gap = Math.max(0, f.gap - 45 * dt);
      if (f.modeTime <= 0) {
        f.mode = 'chase';
        f.sprintIn = 5 + random() * 4;
      }
    } else {
      f.sprintIn -= dt;
      f.gap = Math.max(0, f.gap - 7 * dt);
      if (f.sprintIn <= 0 && f.gap < 160) {
        f.mode = 'sprint';
        f.modeTime = FARMER.sprintTime;
        events.push(EVENT_YELL);
      }
    }
    if (f.gap <= FARMER.caughtGap) {
      endGame('caught', 'the farmer caught up — dinner is served');
      events.push(EVENT_OVER);
      return events;
    }

    // Move the world left, spawn ahead, drop what passed.
    for (const o of state.obstacles) o.x -= scroll;
    for (const p of state.pickups) p.x -= scroll;
    for (const s of state.swings) {
      s.x -= scroll;
      s.angle += s.speed * s.direction * dt;
      if (s.angle > 0.5 || s.angle < -0.5) s.direction *= -1;
    }
    state.obstacles = state.obstacles.filter((o) => o.x > -220);
    state.pickups = state.pickups.filter((p) => p.x > -80 && !p.taken);
    state.swings = state.swings.filter((s) => s.x > -220);
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnPattern();
      state.spawnIn = 1.0 + random() * 0.6 - state.stage * 0.08;
      if (state.spawnIn < 0.65) state.spawnIn = 0.65;
    }

    // Thrown knives fly left faster than the scroll.
    for (const o of state.obstacles) {
      if (o.kind === 'thrown') o.x -= o.speed * dt;
    }

    // Hiding: duck beside a haystack and the turkey dives in.
    const rect = turkeyRect();
    if (controls.duck && t.y === 0) {
      for (const o of state.obstacles) {
        if (o.kind === 'hay' && rect.x + rect.width > o.x && rect.x < o.x + o.width) {
          t.hidden = true;
          t.hideTime = FARMER.searchTime;
          f.mode = 'search';
          f.modeTime = FARMER.searchTime;
          events.push(EVENT_HIDE);
          break;
        }
      }
    }

    // Mud slows the turkey and lets the farmer gain.
    t.mud = false;
    for (const o of state.obstacles) {
      if (o.kind === 'mud' && rect.x + rect.width > o.x + 6 && rect.x < o.x + o.width - 6 && t.y === 0) {
        t.mud = true;
        f.gap = Math.max(0, f.gap - 26 * dt);
        events.push(EVENT_MUD);
        break;
      }
    }

    // Collisions with solid obstacles.
    for (const o of state.obstacles) {
      if (o.kind === 'mud' || o.kind === 'hay') continue;
      const oy = o.kind === 'thrown' ? o.y : FIELD.groundY - o.height;
      const oh = o.kind === 'thrown' ? o.height : o.height;
      if (rect.x + rect.width - 10 > o.x + 4 && rect.x + 10 < o.x + o.width - 4 && rect.y + rect.height - 4 > oy && rect.y + 4 < oy + oh) {
        const before = state.lives;
        hitTurkey();
        if (state.lives !== before) events.push(EVENT_HIT);
        if (state.screen === 'over') {
          events.push(EVENT_OVER);
          return events;
        }
        break;
      }
    }

    // Swinging carving knives: the blade tip is the danger.
    for (const s of state.swings) {
      const tipX = s.x + Math.sin(s.angle) * s.length;
      const tipY = s.pivotY + Math.cos(s.angle) * s.length;
      const dx = tipX - (rect.x + rect.width / 2);
      const dy = tipY - (rect.y + rect.height / 2);
      if (dx * dx + dy * dy < 34 * 34) {
        const before = state.lives;
        hitTurkey();
        if (state.lives !== before) events.push(EVENT_HIT);
        if (state.screen === 'over') {
          events.push(EVENT_OVER);
          return events;
        }
        break;
      }
    }

    // Pickups.
    for (const p of state.pickups) {
      if (p.taken) continue;
      const cx = p.x;
      const cy = p.y;
      if (cx > rect.x - 14 && cx < rect.x + rect.width + 14 && cy > rect.y - 14 && cy < rect.y + rect.height + 14) {
        p.taken = true;
        if (p.kind === 'corn') {
          state.score += POINTS.corn;
          f.gap = Math.min(420, f.gap + FARMER.cornGain);
          events.push(EVENT_CORN);
        } else if (p.kind === 'pie') {
          state.score += POINTS.pie;
          state.lives = Math.min(3, state.lives + 1);
          events.push(EVENT_PIE);
        } else if (p.kind === 'feather') {
          t.feather = 1;
          events.push(EVENT_FEATHER);
        }
      }
    }

    updateParticles(dt);

    // Escape: the forest gate at 1200m.
    if (state.distance >= ESCAPE_DISTANCE) {
      state.distance = ESCAPE_DISTANCE;
      endGame('escaped', 'Gobbles slips through the forest gate — free!');
      events.push(EVENT_OVER);
    }
    return events;
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
    }
    state.particles = state.particles.filter((p) => p.age < p.life);
  }

  return { state, reset, step, turkeyRect, stageIndexFor };
}

export { STEP };
