// The playable room: real-time loop, input, and canvas rendering.
//
// This is the browser glue on top of the tested engine (game/engine.js) and
// combat math (characters/combat.js). Two heroes you move and attack with;
// enemies that chase and hit back; abilities that visibly damage and stagger
// them. Draft Sela sprite art is wired in with a square fallback while the
// generated sheets are cleaned into exact production atlases.

import {
  spawnHero, spawnEnemy, moveEntity, resolveHeroAttack, distance,
} from '../game/engine.js';
import { createRunStats } from '../game/stats.js';
import { createCooldownTracker, regenStamina } from '../characters/combat.js';
import { mitigateDamage } from '../characters/combat.js';
import { sela, kade } from '../characters/index.js';
import { getEnemy } from '../enemies/index.js';

// Which key does what. Attacks are edge-triggered; movement keys are held.
const MOVE_KEYS = {
  sela: { up: 'w', down: 's', left: 'a', right: 'd' },
  kade: { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' },
};
const ATTACK_KEYS = {
  j: { hero: 'sela', move: 'sela_jab' },
  k: { hero: 'sela', move: 'sela_spinkick' },
  u: { hero: 'sela', move: 'sela_flash' },
  ',': { hero: 'kade', move: 'kade_backhand' },
  '.': { hero: 'kade', move: 'kade_sweep' },
  '/': { hero: 'kade', move: 'kade_phasestrike' },
};

const MIN_ATTACK_GAP_MS = 240; // rate-limit even 0-cooldown normals
const ENEMY_ATTACK_GAP_MS = 900;
const CONTACT_PAD = 4;
const HERO_DRAW_HEIGHT = 66;
const HERO_BAR_WIDTH = 48;
const SELA_EFFECT_DRAW_SIZE = 76;
const SELA_FRAME_PADDING = 3;

// These match assets/sprites/heroes/sela/sela-draft.animations.json. The draft
// PNGs are not final atlases yet, but their 4x4 layout is stable enough for the
// prototype renderer.
const DIR_COLUMNS = ['down', 'left', 'right', 'up'];
const SELA_SHEETS = {
  movement: {
    src: 'assets/sprites/heroes/sela/drafts/sela-torch-guardian-movement-draft-v1.png',
    columns: DIR_COLUMNS,
    rows: ['idle', 'walk_1', 'walk_2', 'walk_3'],
  },
  combat: {
    src: 'assets/sprites/heroes/sela/drafts/sela-torch-guardian-combat-draft-v1.png',
    columns: DIR_COLUMNS,
    rows: ['windup', 'impact', 'follow_through', 'recovery'],
  },
  lightPowers: {
    src: 'assets/sprites/heroes/sela/drafts/sela-torch-guardian-light-powers-draft-v1.png',
    columns: DIR_COLUMNS,
    rows: ['torch_cast_windup', 'torch_cast_burst', 'beacon_plant', 'beam_weave'],
  },
};
const SELA_EFFECT_SHEETS = {
  torchbearer: {
    src: 'assets/sprites/effects/sela/drafts/sela-torchbearer-effects-draft-v1.png',
    columns: 4,
    rows: ['light_cone_shimmer', 'light_pulse_burst', 'hidden_rune_reveal', 'platform_edge_reveal'],
  },
};
const SELA_ACTION_ANIMS = {
  sela_jab: { sheet: 'combat', rows: ['windup', 'impact', 'follow_through', 'recovery'], durationMs: 300 },
  sela_spinkick: { sheet: 'combat', rows: ['windup', 'impact', 'follow_through', 'recovery'], durationMs: 340 },
  sela_flash: {
    sheet: 'lightPowers',
    rows: ['torch_cast_windup', 'torch_cast_burst', 'torch_cast_burst'],
    durationMs: 320,
    effect: 'light_pulse_burst',
  },
};

function atlasColumnCount(atlas) {
  return Array.isArray(atlas.columns) ? atlas.columns.length : atlas.columns;
}

function atlasFrameKey(row, col) {
  return row + ':' + col;
}

function isChromaGreenPixel(r, g, b, a) {
  if (a < 16) return true;
  const strongestNonGreen = Math.max(r, b);
  return g > 120 && g > r * 1.25 && g > b * 1.25 && g - strongestNonGreen > 45;
}

function atlasFrameBounds(atlas, col, row) {
  const cols = atlasColumnCount(atlas);
  const rows = atlas.rows.length;
  const width = atlas.image.naturalWidth;
  const height = atlas.image.naturalHeight;
  const x0 = Math.round((width * col) / cols);
  const x1 = Math.round((width * (col + 1)) / cols);
  const y0 = Math.round((height * row) / rows);
  const y1 = Math.round((height * (row + 1)) / rows);
  return { sx: x0, sy: y0, sw: Math.max(1, x1 - x0), sh: Math.max(1, y1 - y0) };
}

function extractTransparentFrame(sheetCtx, bounds) {
  const imageData = sheetCtx.getImageData(bounds.sx, bounds.sy, bounds.sw, bounds.sh);
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      if (isChromaGreenPixel(r, g, b, a)) {
        data[index + 3] = 0;
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return null;

  minX = Math.max(0, minX - SELA_FRAME_PADDING);
  minY = Math.max(0, minY - SELA_FRAME_PADDING);
  maxX = Math.min(width - 1, maxX + SELA_FRAME_PADDING);
  maxY = Math.min(height - 1, maxY + SELA_FRAME_PADDING);

  const cleanedCell = document.createElement('canvas');
  cleanedCell.width = width;
  cleanedCell.height = height;
  const cleanedCtx = cleanedCell.getContext('2d');
  cleanedCtx.imageSmoothingEnabled = false;
  cleanedCtx.putImageData(imageData, 0, 0);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = cropWidth;
  frameCanvas.height = cropHeight;
  const frameCtx = frameCanvas.getContext('2d');
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(cleanedCell, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return frameCanvas;
}

function buildAtlasFrameCache(atlas) {
  if (typeof document === 'undefined' || !atlas.image?.naturalWidth) return;
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = atlas.image.naturalWidth;
  sheetCanvas.height = atlas.image.naturalHeight;
  const sheetCtx = sheetCanvas.getContext('2d', { willReadFrequently: true });
  sheetCtx.imageSmoothingEnabled = false;
  sheetCtx.drawImage(atlas.image, 0, 0);

  const cols = atlasColumnCount(atlas);
  atlas.frames = new Map();
  for (let row = 0; row < atlas.rows.length; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const frameCanvas = extractTransparentFrame(sheetCtx, atlasFrameBounds(atlas, col, row));
      if (frameCanvas) atlas.frames.set(atlasFrameKey(row, col), frameCanvas);
    }
  }
}

function makeAtlas(def) {
  const atlas = { ...def, image: null, frames: new Map(), ready: false };
  if (typeof Image !== 'undefined') {
    atlas.image = new Image();
    atlas.image.onload = () => {
      try {
        buildAtlasFrameCache(atlas);
        atlas.ready = atlas.frames.size > 0;
      } catch {
        atlas.ready = false;
      }
    };
    atlas.image.onerror = () => { atlas.ready = false; };
    atlas.image.src = def.src;
  }
  return atlas;
}

function createRuntimeArt() {
  return {
    sela: Object.fromEntries(Object.entries(SELA_SHEETS).map(([key, def]) => [key, makeAtlas(def)])),
    effects: Object.fromEntries(Object.entries(SELA_EFFECT_SHEETS).map(([key, def]) => [key, makeAtlas(def)])),
  };
}

export function createGame(canvas, { onGameOver }) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const bounds = { width: canvas.width, height: canvas.height };
  const art = createRuntimeArt();
  const keys = new Set();

  let heroes = {};
  let enemies = [];
  let floats = []; // floating damage/label text
  let run = createRunStats();
  let cooldowns = createCooldownTracker();
  let floor = 1;
  let clock = 0; // ms of simulated time
  let lastTs = null;
  let running = false;
  let paused = false;
  let spawnAt = 0; // when the next wave should appear (0 = now/none pending)

  const moveOf = (heroId, moveId) => (heroId === 'sela' ? sela : kade).moves.find((m) => m.id === moveId);

  function spawnWave() {
    const count = 2 + Math.floor(floor / 2);
    enemies = [];
    for (let i = 0; i < count; i++) {
      const def = floor >= 3 && i === 0 ? getEnemy('stone_sentry') : getEnemy('gloom_whelp');
      const x = 120 + (i * 150) % (bounds.width - 240);
      const y = 60 + (i % 2) * 60;
      enemies.push(spawnEnemy(def, x, y));
    }
  }

  function addFloat(x, y, text, color) {
    floats.push({ x, y, text, color, life: 800 });
  }

  function start() {
    heroes = {
      sela: spawnHero(sela, bounds.width * 0.4, bounds.height - 60),
      kade: spawnHero(kade, bounds.width * 0.6, bounds.height - 60),
    };
    enemies = [];
    floats = [];
    run = createRunStats();
    cooldowns = createCooldownTracker();
    floor = 1;
    clock = 0;
    lastTs = null;
    spawnAt = 0;
    paused = false;
    running = true;
    spawnWave();
    syncHud();
  }

  function stop() { running = false; }
  function pause() { paused = true; }
  function resume() { paused = false; lastTs = null; }
  function snapshot() { return run.snapshot(); }

  // --- input ----------------------------------------------------------------
  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    keys.add(k);
    if (running && !paused && ATTACK_KEYS[k]) {
      const { hero, move } = ATTACK_KEYS[k];
      tryAttack(heroes[hero], moveOf(hero, move));
      e.preventDefault();
    }
  }
  function onKeyUp(e) { keys.delete(e.key.toLowerCase()); }

  function tryAttack(hero, move) {
    if (!hero || hero.downed) return;
    if (!cooldowns.ready(move.id, clock)) return;
    if (hero.stamina < move.staminaCost) return;
    hero.stamina -= move.staminaCost;
    cooldowns.trigger(move.id, clock, Math.max(move.cooldownMs, MIN_ATTACK_GAP_MS));
    hero.action = { moveId: move.id, startedAt: clock };

    const hits = resolveHeroAttack(hero, move, enemies);
    if (hits.length === 0) {
      addFloat(hero.x, hero.y - hero.radius - 10, 'whiff', '#6b6280');
      return;
    }
    for (const hit of hits) {
      const e = hit.enemy;
      run.recordDamageDealt(hit.dealt);
      addFloat(e.x, e.y - e.radius - 6, hit.isCrit ? `${hit.dealt}!` : `${hit.dealt}`,
        hit.isCrit ? '#ffd97a' : '#e8e0d0');
      if (hit.isCrit) run.recordCrit();
      if (hit.opened) {
        e.staggerUntil = clock + e.def.stats.staggerDurationMs;
        addFloat(e.x, e.y - e.radius - 24, 'OPENED!', '#7b5cff');
      }
      if (hit.killed) {
        const wasStaggered = e.staggered;
        run.recordEnemyDefeated(e.def);
        if (wasStaggered) run.recordTakedown();
      }
    }
    enemies = enemies.filter((e) => e.health > 0);
    if (enemies.length === 0 && spawnAt === 0) {
      run.recordFloorCleared();
      floor += 1;
      addFloat(bounds.width / 2, bounds.height / 2, 'FLOOR CLEAR', '#f5b942');
      spawnAt = clock + 1200;
    }
    syncHud();
  }

  // --- simulation -----------------------------------------------------------
  function heroDir(id) {
    const m = MOVE_KEYS[id];
    let dx = 0, dy = 0;
    if (keys.has(m.left)) dx -= 1;
    if (keys.has(m.right)) dx += 1;
    if (keys.has(m.up)) dy -= 1;
    if (keys.has(m.down)) dy += 1;
    return { dx, dy };
  }

  function nearestHero(enemy) {
    const alive = Object.values(heroes).filter((h) => !h.downed);
    if (alive.length === 0) return null;
    return alive.reduce((best, h) => (distance(enemy, h) < distance(enemy, best) ? h : best));
  }

  function update(dt) {
    clock += dt;
    run.addTime(dt);

    // heroes: move + regen stamina
    for (const h of Object.values(heroes)) {
      if (h.downed) continue;
      const { dx, dy } = heroDir(h === heroes.sela ? 'sela' : 'kade');
      h.moving = Boolean(dx || dy);
      if (dx || dy) moveEntity(h, dx, dy, dt, bounds);
      h.stamina = regenStamina(h.stamina, h.def.stats.maxStamina, h.def.stats.staminaRegen, dt);
    }

    // enemies: recover from stagger, chase, and hit heroes on contact
    for (const e of enemies) {
      if (e.staggered) {
        if (clock >= e.staggerUntil) { e.staggered = false; e.stagger = 0; }
        else continue; // stunned: no movement/attack while opened
      }
      const target = nearestHero(e);
      if (!target) continue;
      const dx = target.x - e.x, dy = target.y - e.y;
      const gap = distance(e, target);
      if (gap > e.radius + target.radius + CONTACT_PAD) {
        moveEntity(e, dx, dy, dt, bounds);
      } else if (clock >= (e.attackAt ?? 0)) {
        const dmg = mitigateDamage(e.def.stats.attackDamage, target.def.stats.defense);
        target.health = Math.max(0, target.health - dmg);
        run.recordDamageTaken(dmg);
        addFloat(target.x, target.y - target.radius - 8, `-${dmg}`, '#ff5c72');
        e.attackAt = clock + ENEMY_ATTACK_GAP_MS;
        if (target.health === 0 && !target.downed) {
          target.downed = true;
          run.recordDeath();
          addFloat(target.x, target.y, 'DOWNED', '#ff5c72');
        }
      }
    }

    // pending wave
    if (spawnAt && clock >= spawnAt) { spawnAt = 0; spawnWave(); }

    // floating text lifetimes
    for (const f of floats) { f.life -= dt; f.y -= dt * 0.02; }
    floats = floats.filter((f) => f.life > 0);

    // both heroes down -> game over
    if (Object.values(heroes).every((h) => h.downed)) {
      running = false;
      onGameOver?.();
    }
    syncHud();
  }

  // --- render ---------------------------------------------------------------
  function drawBar(x, y, w, h, pct, color, bg = '#140d24') {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
    ctx.strokeStyle = '#3a2d5e';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  function columnCount(atlas) {
    return Array.isArray(atlas.columns) ? atlas.columns.length : atlas.columns;
  }

  function columnIndex(atlas, column) {
    if (typeof column === 'number') return column;
    return Array.isArray(atlas.columns) ? atlas.columns.indexOf(column) : -1;
  }

  function rowIndex(atlas, row) {
    if (typeof row === 'number') return row;
    return atlas.rows.indexOf(row);
  }

  function drawAtlasFrame(atlas, frame, x, y, height, { alpha = 1, glow = null, anchor = 'center' } = {}) {
    if (!atlas?.ready || !atlas.frames) return false;
    const cols = columnCount(atlas);
    const rows = atlas.rows.length;
    const col = columnIndex(atlas, frame.column);
    const row = rowIndex(atlas, frame.row);
    if (col < 0 || row < 0 || col >= cols || row >= rows) return false;

    const source = atlas.frames.get(atlasFrameKey(row, col));
    if (!source?.width || !source?.height) return false;

    const drawHeight = height;
    const drawWidth = Math.max(1, Math.round((source.width / source.height) * drawHeight));
    const dx = Math.round(x - drawWidth / 2);
    const dy = anchor === 'bottom'
      ? Math.round(y - drawHeight)
      : Math.round(y - drawHeight / 2);

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.imageSmoothingEnabled = false;
    if (glow) {
      ctx.shadowColor = glow.color;
      ctx.shadowBlur = glow.blur;
    }
    ctx.drawImage(source, dx, dy, drawWidth, drawHeight);
    ctx.restore();
    return { x: dx, y: dy, width: drawWidth, height: drawHeight };
  }

  function heroDirection(hero) {
    if (Math.abs(hero.facing.x) > Math.abs(hero.facing.y)) {
      return hero.facing.x < 0 ? 'left' : 'right';
    }
    return hero.facing.y < 0 ? 'up' : 'down';
  }

  function actionAge(hero) {
    if (!hero.action) return null;
    const age = clock - hero.action.startedAt;
    return age >= 0 ? age : null;
  }

  function currentSelaFrame(hero) {
    const direction = heroDirection(hero);
    const age = actionAge(hero);
    const action = hero.action ? SELA_ACTION_ANIMS[hero.action.moveId] : null;
    if (action && age <= action.durationMs) {
      const frameMs = action.durationMs / action.rows.length;
      const row = action.rows[Math.min(action.rows.length - 1, Math.floor(age / frameMs))];
      return { atlas: art.sela[action.sheet], row, column: direction };
    }

    const row = hero.moving
      ? ['walk_1', 'walk_2', 'walk_3'][Math.floor(clock / 120) % 3]
      : 'idle';
    return { atlas: art.sela.movement, row, column: direction };
  }

  function drawFacingTick(hero) {
    ctx.fillStyle = '#0b0713';
    ctx.fillRect(hero.x + hero.facing.x * 10 - 2, hero.y + hero.facing.y * 10 - 2, 4, 4);
  }

  function drawFallbackHero(hero, hue) {
    ctx.fillStyle = hue;
    ctx.fillRect(hero.x - hero.radius, hero.y - hero.radius, hero.radius * 2, hero.radius * 2);
    drawFacingTick(hero);
  }

  function drawSelaEffect(hero) {
    const age = actionAge(hero);
    const action = hero.action ? SELA_ACTION_ANIMS[hero.action.moveId] : null;
    if (age == null || !action?.effect || age > action.durationMs) return;

    const column = Math.min(3, Math.floor((age / action.durationMs) * 4));
    const x = hero.x + hero.facing.x * 22;
    const y = hero.y + hero.facing.y * 22;
    const drewEffect = drawAtlasFrame(
      art.effects.torchbearer,
      { row: action.effect, column },
      x,
      y,
      SELA_EFFECT_DRAW_SIZE,
      { alpha: 0.82, glow: { color: '#ffd97a', blur: 14 } },
    );
    if (drewEffect) return;

    const pulse = 24 + column * 8;
    const gradient = ctx.createRadialGradient(x, y, 4, x, y, pulse);
    gradient.addColorStop(0, 'rgba(255, 217, 122, 0.75)');
    gradient.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSelaHero(hero, hue) {
    const frame = currentSelaFrame(hero);
    const bob = hero.moving ? Math.sin(clock / 90) * 1.5 : 0;
    const spriteBox = drawAtlasFrame(
      frame.atlas,
      frame,
      hero.x,
      hero.y + hero.radius + 4 + bob,
      HERO_DRAW_HEIGHT,
      { glow: { color: '#f5b942', blur: 6 }, anchor: 'bottom' },
    );
    if (!spriteBox) {
      drawFallbackHero(hero, hue);
      return null;
    }
    return spriteBox;
  }

  function drawHero(id, hero) {
    const hue = id === 'sela' ? '#f5b942' : '#7b5cff';
    ctx.globalAlpha = hero.downed ? 0.35 : 1;
    let spriteBox = null;
    if (id === 'sela') {
      drawSelaEffect(hero);
      spriteBox = drawSelaHero(hero, hue);
    } else {
      drawFallbackHero(hero, hue);
    }

    const barWidth = spriteBox ? HERO_BAR_WIDTH : hero.radius * 2;
    const barX = hero.x - barWidth / 2;
    const barY = spriteBox ? spriteBox.y - 9 : hero.y - hero.radius - 9;
    drawBar(barX, barY, barWidth, 4, hero.health / hero.maxHealth, hue);
    drawBar(barX, barY + 5, barWidth, 2, hero.stamina / hero.def.stats.maxStamina, '#5be3c0');
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.imageSmoothingEnabled = false;

    // floor
    ctx.fillStyle = '#160f28';
    ctx.fillRect(0, 0, bounds.width, bounds.height);
    ctx.strokeStyle = '#221a3b';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= bounds.width; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, bounds.height); ctx.stroke();
    }
    for (let gy = 0; gy <= bounds.height; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(bounds.width, gy); ctx.stroke();
    }
    ctx.lineWidth = 4; ctx.strokeStyle = '#3a2d5e';
    ctx.strokeRect(2, 2, bounds.width - 4, bounds.height - 4);

    // enemies
    for (const e of enemies) {
      ctx.fillStyle = e.staggered ? '#ffd97a' : '#8a8199';
      ctx.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
      ctx.strokeStyle = '#0b0713'; ctx.lineWidth = 2;
      ctx.strokeRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
      drawBar(e.x - e.radius, e.y - e.radius - 8, e.radius * 2, 4, e.health / e.maxHealth, '#ff5c72');
      drawBar(e.x - e.radius, e.y - e.radius - 3, e.radius * 2, 2, e.stagger / e.staggerThreshold, '#7b5cff');
    }

    // heroes
    for (const [id, h] of Object.entries(heroes)) {
      drawHero(id, h);
    }

    // floating text
    ctx.font = '12px "VT323", monospace';
    ctx.textAlign = 'center';
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, f.life / 800);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function syncHud() {
    const s = run.snapshot();
    const set = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
    set('[data-screen="playing"] [data-stat="score"]', s.score);
    set('[data-screen="playing"] [data-stat="floor"]', floor);
  }

  // --- loop -----------------------------------------------------------------
  function frame(ts) {
    if (lastTs == null) lastTs = ts;
    const dt = Math.min(50, ts - lastTs);
    lastTs = ts;
    if (running && !paused) update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Dev/verification helpers: inspect and drive combat deterministically.
  const debug = {
    enemies: () => enemies.map((e) => ({ id: e.def.id, hp: e.health, stagger: e.stagger, staggered: e.staggered })),
    heroes: () => Object.fromEntries(
      Object.entries(heroes).map(([k, h]) => [k, { hp: Math.round(h.health), x: Math.round(h.x), y: Math.round(h.y), downed: h.downed }]),
    ),
    // Move a hero next to the first enemy and fire a move at it.
    hitNearest: (heroId, moveId) => {
      const hero = heroes[heroId];
      const e = enemies[0];
      if (!hero || !e) return null;
      hero.downed = false;
      hero.x = e.x - (hero.radius + e.radius);
      hero.y = e.y;
      hero.stamina = hero.def.stats.maxStamina;
      tryAttack(hero, moveOf(heroId, moveId));
      return { enemyHp: e.health, enemyStagger: e.stagger, staggered: e.staggered, snap: run.snapshot() };
    },
  };

  return { start, stop, pause, resume, snapshot, debug };
}
