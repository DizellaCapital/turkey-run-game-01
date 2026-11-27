// Turkey Trot — every pixel the game draws: the autumn farm, the barn, the
// kitchen, the turkey, the farmer, the HUD and the three screens. Canvas 2D,
// vector art only, no image files. The logical field is 1280x480 and the
// renderer scales it to the window.
import { ESCAPE_DISTANCE, FIELD, PALETTE, STAGES, TURKEY } from './config.js';
import { PX_PER_METRE } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(0, 8, 0, 2, 4, 2);
  ctx.bezierCurveTo(6, 2, 8, 4, 8, 6);
  ctx.bezierCurveTo(8, 4, 10, 2, 12, 2);
  ctx.bezierCurveTo(16, 2, 16, 8, 8, 14);
  ctx.closePath();
  ctx.fillStyle = filled ? PALETTE.heart : 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.restore();
}

function drawCloud(ctx, x, y, scale, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 22 * scale, y - 8 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.arc(x + 44 * scale, y, 17 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawTurkey(ctx, x, feetY, phase, ducking, hidden, invulnerable, dashing) {
  if (hidden) {
    // Only tail feathers poke out of the haystack.
    ctx.save();
    ctx.translate(x + 38, feetY - 58);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = PALETTE.tail[i];
      ctx.save();
      ctx.rotate(-0.5 + i * 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -16, 7, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    return;
  }
  if (invulnerable > 0 && Math.floor(invulnerable * 12) % 2 === 0) return; // blink
  const bob = Math.sin(phase) * 3;
  const legSwing = Math.sin(phase) * 12;
  const bodyY = feetY - 30 + bob;
  ctx.save();
  ctx.translate(x, bodyY);
  if (ducking) ctx.scale(1.25, 0.62);
  // Tail fan.
  for (let i = 0; i < 5; i += 1) {
    const angle = -1.1 + i * 0.55;
    ctx.save();
    ctx.translate(-26, -6);
    ctx.rotate(angle);
    ctx.fillStyle = PALETTE.tail[i % PALETTE.tail.length];
    ctx.beginPath();
    ctx.ellipse(0, -20, 8, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#e8a33c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, 22);
  ctx.lineTo(-6 + legSwing, 30 - bob);
  ctx.moveTo(8, 22);
  ctx.lineTo(8 - legSwing, 30 - bob);
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyBelly;
  ctx.beginPath();
  ctx.ellipse(8, 8, 18, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#6e3d1e';
  ctx.beginPath();
  ctx.ellipse(-4, -2, 16, 10, -0.4 + (dashing ? -0.5 : 0), 0, Math.PI * 2);
  ctx.fill();
  // Neck and head.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.fillRect(20, -34, 9, 22);
  ctx.fillStyle = PALETTE.head;
  ctx.beginPath();
  ctx.arc(26, -38, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak, wattle, eye.
  ctx.fillStyle = PALETTE.beak;
  ctx.beginPath();
  ctx.moveTo(35, -40);
  ctx.lineTo(46, -36);
  ctx.lineTo(35, -33);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(31, -28, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(29, -41, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFarmer(ctx, x, feetY, phase, mode) {
  const lean = mode === 'sprint' ? 0.35 : 0.12;
  const legSwing = Math.sin(phase) * 13;
  ctx.save();
  ctx.translate(x, feetY);
  ctx.rotate(lean);
  // Legs (overalls).
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-4, -34);
  ctx.lineTo(-4 + legSwing, 0);
  ctx.moveTo(6, -34);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();
  // Body: shirt + overalls.
  ctx.fillStyle = PALETTE.farmerShirt;
  roundRect(ctx, -16, -72, 34, 40, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-14, -46, 30, 14);
  // Arm reaching forward with a pitchfork.
  ctx.strokeStyle = PALETTE.farmerSkin;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(12, -62);
  ctx.lineTo(34, -44);
  ctx.stroke();
  ctx.strokeStyle = '#8a8f98';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(30, -70);
  ctx.lineTo(44, -26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(44, -26);
  ctx.lineTo(38, -14);
  ctx.moveTo(44, -26);
  ctx.lineTo(50, -16);
  ctx.stroke();
  // Head + straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(2, -84, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(2, -94, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, -106, 20, 12);
  // Angry moustache + eyes.
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-6, -80, 16, 4);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(6, -88, 2, 0, Math.PI * 2);
  ctx.arc(12, -88, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (mode === 'search') {
    ctx.save();
    ctx.font = 'bold 26px ' + 'system-ui, sans-serif';
    ctx.fillStyle = '#fff3e0';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeText('?', x + 18, feetY - 118);
    ctx.fillText('?', x + 18, feetY - 118);
    ctx.restore();
  }
}

function drawObstacle(ctx, o, groundY) {
  const x = o.x;
  if (o.kind === 'fence') {
    ctx.fillStyle = '#6e4a26';
    ctx.fillRect(x, groundY - o.height, 6, o.height);
    ctx.fillRect(x + o.width - 6, groundY - o.height, 6, o.height);
    ctx.fillRect(x - 4, groundY - o.height + 8, o.width + 8, 8);
    ctx.fillRect(x - 4, groundY - o.height + 30, o.width + 8, 8);
  } else if (o.kind === 'bale') {
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.arc(x + o.width / 2, groundY - o.height / 2, o.height / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + o.width / 2, groundY - o.height / 2, o.height / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (o.kind === 'crate') {
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(x, groundY - o.height, o.width, o.height);
    ctx.strokeStyle = '#7a5222';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, groundY - o.height + 2, o.width - 4, o.height - 4);
    ctx.beginPath();
    ctx.moveTo(x, groundY - o.height);
    ctx.lineTo(x + o.width, groundY);
    ctx.moveTo(x + o.width, groundY - o.height);
    ctx.lineTo(x, groundY);
    ctx.stroke();
  } else if (o.kind === 'mud') {
    ctx.fillStyle = '#4a2f16';
    ctx.beginPath();
    ctx.ellipse(x + o.width / 2, groundY - 2, o.width / 2, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.ellipse(x + o.width / 2 - 14, groundY - 4, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('MUD!', x + o.width / 2 - 18, groundY - 16);
  } else if (o.kind === 'hay') {
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.quadraticCurveTo(x + o.width / 2, groundY - o.height - 18, x + o.width, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const hx = x + 8 + i * 14;
      ctx.beginPath();
      ctx.moveTo(hx, groundY - 8);
      ctx.lineTo(hx + 4, groundY - 34 - (i % 2) * 10);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('HIDE! ↓', x + 6, groundY - o.height - 22);
  } else if (o.kind === 'oven') {
    // A big hot oven with a glowing door and flames on top.
    ctx.fillStyle = PALETTE.ovenBody;
    roundRect(ctx, x, groundY - o.height, o.width, o.height, 8);
    ctx.fill();
    ctx.fillStyle = '#22222a';
    roundRect(ctx, x + 12, groundY - o.height + 14, o.width - 24, 44, 5);
    ctx.fill();
    const glow = 0.6 + Math.sin(Date.now() / 90) * 0.4;
    ctx.fillStyle = `rgba(255, 154, 60, ${glow})`;
    roundRect(ctx, x + 18, groundY - o.height + 20, o.width - 36, 32, 4);
    ctx.fill();
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('OVEN', x + o.width / 2 - 20, groundY - 14);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = PALETTE.flame[i % 3];
      ctx.beginPath();
      ctx.ellipse(x + 20 + i * 26, groundY - o.height - 8 - Math.sin(Date.now() / 120 + i) * 4, 9, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (o.kind === 'thrown') {
    ctx.save();
    ctx.translate(o.x + o.width / 2, o.y);
    ctx.rotate(0.5);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-22, -5);
    ctx.lineTo(14, -5);
    ctx.lineTo(24, 0);
    ctx.lineTo(14, 5);
    ctx.lineTo(-22, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeHandle;
    ctx.fillRect(-32, -6, 12, 12);
    ctx.restore();
  }
}

function drawSwing(ctx, s) {
  const tipX = s.x + Math.sin(s.angle) * s.length;
  const tipY = s.pivotY + Math.cos(s.angle) * s.length;
  ctx.strokeStyle = '#c9ced6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x, s.pivotY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(s.angle + Math.PI / 2);
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.lineTo(6, -34);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.knifeHandle;
  ctx.fillRect(-7, -46, 14, 14);
  ctx.restore();
}

function drawPickup(ctx, p) {
  if (p.kind === 'corn') {
    ctx.fillStyle = PALETTE.cornHusk;
    ctx.beginPath();
    ctx.moveTo(p.x - 12, p.y + 8);
    ctx.lineTo(p.x - 4, p.y - 12);
    ctx.lineTo(p.x + 2, p.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.corn;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 10, 13, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a441';
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(p.x + i * 5 - 1, p.y - 9, 2, 18);
    }
  } else if (p.kind === 'pie') {
    ctx.fillStyle = '#c98d4b';
    ctx.beginPath();
    ctx.moveTo(p.x - 15, p.y + 8);
    ctx.lineTo(p.x + 15, p.y + 8);
    ctx.lineTo(p.x + 8, p.y - 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a85a2a';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 10, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('PIE +1♥', p.x - 20, p.y - 20);
  } else if (p.kind === 'feather') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(0.6);
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a83c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 16);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('DASH', p.x - 14, p.y - 22);
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fitCanvas() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = FIELD.width;
    canvas.height = FIELD.height;
    canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
    canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  function drawBackground(state, scrollPx) {
    const stage = state.stage;
    if (state.outcome === 'escaped') {
      // The forest gate: Gobbles made it out. Green woods, morning light.
      const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
      sky.addColorStop(0, '#bfe3a0');
      sky.addColorStop(0.6, '#8ec06a');
      sky.addColorStop(1, '#5d8a3c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#fff3c9';
      ctx.beginPath();
      ctx.arc(1080, 90, 40, 0, Math.PI * 2);
      ctx.fill();
      drawCloud(ctx, 220 - (scrollPx * 0.05) % 1400, 60, 1, 'rgba(255,255,255,0.85)');
      drawCloud(ctx, 760 - (scrollPx * 0.07) % 1400, 100, 0.8, 'rgba(255,255,255,0.7)');
      // Pine trees.
      for (let i = 0; i < 9; i += 1) {
        const tx = ((i * 170 - scrollPx * 0.35) % 1530 + 1530) % 1530 - 40;
        ctx.fillStyle = '#2e5d23';
        ctx.beginPath();
        ctx.moveTo(tx, 200);
        ctx.lineTo(tx + 42, 330);
        ctx.lineTo(tx - 42, 330);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3c6123';
        ctx.beginPath();
        ctx.moveTo(tx, 150);
        ctx.lineTo(tx + 32, 260);
        ctx.lineTo(tx - 32, 260);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5f3817';
        ctx.fillRect(tx - 6, 330, 12, 78);
      }
      // The forest gate: two posts and a "FREE!" sign.
      ctx.fillStyle = '#6e4a26';
      ctx.fillRect(1120, FIELD.groundY - 150, 14, 150);
      ctx.fillRect(1200, FIELD.groundY - 150, 14, 150);
      ctx.fillStyle = '#f2c94c';
      roundRect(ctx, 1080, FIELD.groundY - 190, 170, 44, 8);
      ctx.fill();
      ctx.fillStyle = '#5f3817';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FREE!', 1165, FIELD.groundY - 160);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4d7a2e';
      ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
      ctx.fillStyle = '#3c6123';
      ctx.fillRect(0, FIELD.groundY, FIELD.width, 6);
      return;
    }
    if (stage >= 2) {
      // Kitchen interior.
      ctx.fillStyle = PALETTE.kitchenWall;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = '#a85a2a';
      for (let x = 0; x < FIELD.width; x += 90) ctx.fillRect(x, 0, 4, FIELD.height);
      // Window with the moon.
      ctx.fillStyle = '#2a2a4a';
      roundRect(ctx, 880, 40, 220, 130, 10);
      ctx.fill();
      ctx.fillStyle = '#f7e8c9';
      ctx.beginPath();
      ctx.arc(1030, 90, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5d3a24';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(990, 40);
      ctx.lineTo(990, 170);
      ctx.moveTo(880, 105);
      ctx.lineTo(1100, 105);
      ctx.stroke();
      // Hanging pots.
      ctx.strokeStyle = '#3d3d46';
      ctx.lineWidth = 3;
      for (const px of [120, 220, 320]) {
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, 52);
        ctx.stroke();
        ctx.fillStyle = '#4a4a55';
        ctx.beginPath();
        ctx.arc(px, 66, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.kitchenFloor;
      ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
      ctx.fillStyle = '#6b4423';
      for (let x = 0; x < FIELD.width; x += 64) ctx.fillRect(x, FIELD.groundY + 30, 60, 4);
      return;
    }
    // Dusk sky over the farm.
    const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.55, PALETTE.skyMid);
    sky.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Low sun.
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(1050, 120, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
    ctx.beginPath();
    ctx.arc(1050, 120, 66, 0, Math.PI * 2);
    ctx.fill();
    drawCloud(ctx, 180 - (scrollPx * 0.05) % 1400, 70, 1, 'rgba(255,243,224,0.85)');
    drawCloud(ctx, 700 - (scrollPx * 0.08) % 1400, 46, 0.8, 'rgba(255,243,224,0.7)');
    drawCloud(ctx, 1150 - (scrollPx * 0.06) % 1400, 100, 1.1, 'rgba(255,243,224,0.6)');
    // Distant barn + trees (slow parallax).
    const far = scrollPx * 0.25;
    ctx.fillStyle = stage === 1 ? '#5a2d1a' : '#6b3a1e';
    for (let i = 0; i < 4; i += 1) {
      const bx = ((i * 420 - far) % 1680 + 1680) % 1680 - 140;
      ctx.fillRect(bx, 300, 120, 108);
      ctx.beginPath();
      ctx.moveTo(bx - 12, 302);
      ctx.lineTo(bx + 60, 258);
      ctx.lineTo(bx + 132, 302);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#3c4a22';
    for (let i = 0; i < 8; i += 1) {
      const tx = ((i * 190 - scrollPx * 0.4) % 1520 + 1520) % 1520 - 40;
      ctx.beginPath();
      ctx.arc(tx, 330, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(tx - 5, 330, 10, 78);
    }
    // Fence posts (fast parallax).
    ctx.fillStyle = '#5f3817';
    for (let x = -((scrollPx * 0.8) % 96); x < FIELD.width; x += 96) {
      ctx.fillRect(x, FIELD.groundY - 26, 6, 26);
    }
    ctx.fillRect(0, FIELD.groundY - 22, FIELD.width, 5);
    // Ground.
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = PALETTE.groundDark;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 6);
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, FIELD.groundY - 4, FIELD.width, 6);
    for (let x = -((scrollPx) % 70); x < FIELD.width; x += 70) {
      ctx.fillStyle = PALETTE.grassDark;
      ctx.beginPath();
      ctx.moveTo(x, FIELD.groundY - 2);
      ctx.lineTo(x + 5, FIELD.groundY - 14);
      ctx.lineTo(x + 10, FIELD.groundY - 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawHud(state) {
    const stage = STAGES[state.stage];
    // Top bar.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 12, 10, 1256, 56, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Score.
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 28, 46);
    // Distance progress bar with stage ticks.
    const barX = 330;
    const barW = 560;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, barX, 26, barW, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    const frac = Math.min(1, state.distance / ESCAPE_DISTANCE);
    roundRect(ctx, barX, 26, barW * frac, 14, 7);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(state.distance)}m / ${ESCAPE_DISTANCE}m — ${stage.name}`, barX + barW / 2, 58);
    // Turkey marker on the bar.
    ctx.fillStyle = '#fff3e0';
    ctx.beginPath();
    ctx.arc(barX + barW * frac, 33, 7, 0, Math.PI * 2);
    ctx.fill();
    // Lives.
    for (let i = 0; i < 3; i += 1) {
      drawHeart(ctx, 940 + i * 30, 24, 22, i < state.lives);
    }
    // Feather dash meter.
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, 1040, 26, 110, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#7ec8ff';
    roundRect(ctx, 1040, 26, 110 * state.turkey.feather, 12, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DASH ⇧', 1042, 56);
    // Farmer proximity warning.
    if (state.farmer.gap < 130 && state.screen === 'play') {
      const blink = Math.floor(state.time * 6) % 2 === 0;
      if (blink) {
        ctx.fillStyle = PALETTE.danger;
        ctx.font = 'bold 26px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ FARMER CLOSE! DASH OR HIDE! ⚠', FIELD.width / 2, 104);
      }
    }
    // Stage banner.
    if (state.bannerTime > 0 && state.screen === 'play') {
      ctx.save();
      ctx.globalAlpha = Math.min(1, state.bannerTime);
      ctx.fillStyle = 'rgba(24,14,8,0.7)';
      roundRect(ctx, FIELD.width / 2 - 260, 130, 520, 52, 12);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.banner, FIELD.width / 2, 165);
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }

  function drawTitle(state) {
    ctx.fillStyle = 'rgba(24, 10, 4, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('TURKEY TROT', FIELD.width / 2, 120);
    ctx.fillStyle = '#f2c94c';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('The Great Thanksgiving Escape', FIELD.width / 2, 158);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Thanksgiving is coming — and YOU are the main course.', FIELD.width / 2, 200);
    ctx.fillText('Outrun Farmer Jed, dodge the oven and the carving knife,', FIELD.width / 2, 228);
    ctx.fillText('and reach the forest gate 1200m away. Hide in the hay when he gets close!', FIELD.width / 2, 256);
    ctx.fillStyle = '#f2c94c';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('SPACE / CLICK — jump      ↓ — duck & hide      SHIFT — feather dash', FIELD.width / 2, 306);
    ctx.fillText('P — pause      M — mute', FIELD.width / 2, 334);
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#fff3e0';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText('▶ PRESS SPACE TO RUN', FIELD.width / 2, 392);
    }
    if (state.best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(`Best score: ${Math.floor(state.best)}`, FIELD.width / 2, 430);
    }
    ctx.textAlign = 'left';
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(24, 10, 4, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3e0';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 220);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Press P to keep running — the farmer waits for no turkey.', FIELD.width / 2, 262);
    ctx.textAlign = 'left';
  }

  function drawOver(state) {
    const escaped = state.outcome === 'escaped';
    ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.55)' : 'rgba(60, 10, 5, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = escaped ? '#b8f28a' : '#ff8a7a';
    ctx.font = 'bold 58px system-ui, sans-serif';
    ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', FIELD.width / 2, 130);
    ctx.fillStyle = '#fff3e0';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(state.outcomeReason, FIELD.width / 2, 172);
    if (escaped) {
      ctx.fillText('Gobbles lives to gobble another day. Happy Thanksgiving!', FIELD.width / 2, 202);
    } else {
      ctx.fillText('Farmer Jed serves dinner at six. Better luck next run!', FIELD.width / 2, 202);
    }
    ctx.fillStyle = '#f2c94c';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`FINAL SCORE: ${Math.floor(state.score)}`, FIELD.width / 2, 262);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(`Distance: ${Math.floor(state.distance)}m of ${ESCAPE_DISTANCE}m   •   Lives left: ${state.lives}`, FIELD.width / 2, 298);
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) {
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('▶ PRESS SPACE TO RUN AGAIN', FIELD.width / 2, 356);
    }
    ctx.textAlign = 'left';
  }

  function render(state, screen) {
    const scrollPx = state.distance * PX_PER_METRE;
    drawBackground(state, scrollPx);
    // Farmer: gap px behind the turkey.
    const farmerX = TURKEY.x - state.farmer.gap;
    if (farmerX > -120) {
      drawFarmer(ctx, farmerX, FIELD.groundY, state.farmer.runPhase, state.farmer.mode);
    }
    for (const o of state.obstacles) drawObstacle(ctx, o, FIELD.groundY);
    for (const s of state.swings) drawSwing(ctx, s);
    for (const p of state.pickups) drawPickup(ctx, p);
    // Particles.
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.colour;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    const t = state.turkey;
    drawTurkey(ctx, TURKEY.x, FIELD.groundY - t.y, t.runPhase, t.ducking, t.hidden, t.invulnerable, t.dashTime > 0);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state);
    if (screen === SCREEN_TITLE) drawTitle(state);
    if (screen === SCREEN_PAUSED) drawPaused();
    if (screen === SCREEN_OVER) drawOver(state);
  }

  return { render, fitCanvas };
}
