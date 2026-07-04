// The playable room — real-time loop, input, and canvas rendering.
//
// This is the browser glue on top of the tested engine (game/engine.js) and
// combat math (characters/combat.js). Two heroes you move and attack with;
// enemies that chase and hit back; abilities that visibly damage and stagger
// them. Placeholder art (rectangles), real mechanics.

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

export function createGame(canvas, { onGameOver }) {
  const ctx = canvas.getContext('2d');
  const bounds = { width: canvas.width, height: canvas.height };
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

  function render() {
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
      const hue = id === 'sela' ? '#f5b942' : '#7b5cff';
      ctx.globalAlpha = h.downed ? 0.35 : 1;
      ctx.fillStyle = hue;
      ctx.fillRect(h.x - h.radius, h.y - h.radius, h.radius * 2, h.radius * 2);
      // facing tick
      ctx.fillStyle = '#0b0713';
      ctx.fillRect(h.x + h.facing.x * 10 - 2, h.y + h.facing.y * 10 - 2, 4, 4);
      drawBar(h.x - h.radius, h.y - h.radius - 9, h.radius * 2, 4, h.health / h.maxHealth, hue);
      drawBar(h.x - h.radius, h.y - h.radius - 4, h.radius * 2, 2, h.stamina / h.def.stats.maxStamina, '#5be3c0');
      ctx.globalAlpha = 1;
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

  // Dev/verification helpers — inspect and drive combat deterministically.
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
