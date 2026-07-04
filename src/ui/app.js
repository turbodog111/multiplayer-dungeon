// Front-end wiring for The Sundering Spire shell.
//
// This file is glue: it connects the tested logic modules (screen machine, run
// stats, goals, character/enemy data) to the DOM. All rules live in those
// modules; here we only read events and paint the result.

import { createScreenMachine, SCREENS } from './screens.js';
import { createRunStats } from '../game/stats.js';
import { evaluateGoals, TOWER_GOALS } from '../game/goals.js';
import { sela, kade } from '../characters/index.js';
import { getEnemy } from '../enemies/index.js';

const machine = createScreenMachine();

// --- run state (recreated each time a run starts) ---------------------------
let run = createRunStats();
// Live hero health for the sandbox HUD (real game loop will own this later).
let health = { sela: sela.stats.maxHealth, kade: kade.stats.maxHealth };
let floor = 1;

function startFreshRun() {
  run = createRunStats();
  health = { sela: sela.stats.maxHealth, kade: kade.stats.maxHealth };
  floor = 1;
  paintPlaying();
}

// --- screen switching -------------------------------------------------------
const screens = [...document.querySelectorAll('.screen')];

function showScreen(name) {
  for (const el of screens) {
    el.classList.toggle('is-active', el.dataset.screen === name);
  }
  if (name === SCREENS.SUMMARY) paintSummary();
}

machine.subscribe(showScreen);

// Wire every [data-event] button to send its event to the machine.
for (const btn of document.querySelectorAll('[data-event]')) {
  btn.addEventListener('click', () => machine.send(btn.dataset.event));
}

// Starting or retrying a run resets the sandbox.
document.querySelector('[data-event="PLAY"]').addEventListener('click', startFreshRun);
document.querySelector('[data-event="RETRY"]').addEventListener('click', startFreshRun);
document.querySelector('[data-event="RESTART"]').addEventListener('click', startFreshRun);

// --- keyboard: Esc pauses/resumes, Enter plays from the title ---------------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (machine.state === SCREENS.PLAYING) machine.send('PAUSE');
    else if (machine.state === SCREENS.PAUSED) machine.send('RESUME');
  } else if (e.key === 'Enter' && machine.state === SCREENS.TITLE) {
    machine.send('PLAY');
    startFreshRun();
  }
});

// --- the prototype sandbox: fire real stat events ---------------------------
const SIM = {
  hit() {
    const dmg = 8;
    run.recordDamageDealt(dmg);
  },
  crit() {
    run.recordDamageDealt(32);
    run.recordCrit();
  },
  takedown() {
    // A full co-op takedown: felled enemy + the takedown bonus.
    run.recordEnemyDefeated(getEnemy('stone_sentry'));
    run.recordTakedown();
  },
  hurt() {
    const dmg = 14;
    run.recordDamageTaken(dmg);
    health.sela = Math.max(0, health.sela - dmg);
  },
  floor() {
    run.recordFloorCleared();
    floor = Math.min(12, floor + 1);
  },
  down() {
    run.recordDeath();
    health.sela = 0;
    machine.send('GAME_OVER');
  },
};

for (const btn of document.querySelectorAll('[data-sim]')) {
  btn.addEventListener('click', () => {
    SIM[btn.dataset.sim]?.();
    paintPlaying();
  });
}

// --- painting ---------------------------------------------------------------
function setText(sel, value) {
  for (const el of document.querySelectorAll(sel)) el.textContent = value;
}

function paintPlaying() {
  const s = run.snapshot();
  setText('[data-stat="score"]', s.score);
  setText('[data-stat="enemiesDefeated"]', s.enemiesDefeated);
  setText('[data-stat="takedowns"]', s.takedowns);
  setText('[data-stat="damageDealt"]', s.damageDealt);
  setText('[data-stat="crits"]', s.crits);
  setText('[data-stat="floor"]', floor);

  const pct = (id) => `${Math.round((health[id] / (id === 'sela' ? sela : kade).stats.maxHealth) * 100)}%`;
  document.querySelector('[data-hp="sela"]').style.width = pct('sela');
  document.querySelector('[data-hp="kade"]').style.width = pct('kade');
}

function paintSummary() {
  const s = run.snapshot();
  setText('[data-screen="summary"] [data-stat="score"]', s.score);
  const grid = document.querySelector('[data-goals]');
  grid.innerHTML = '';
  for (const g of evaluateGoals(TOWER_GOALS, s)) {
    const el = document.createElement('div');
    el.className = 'goal';
    el.innerHTML = `
      <div class="goal-head">
        <span>${g.name}</span>
        <span class="${g.done ? 'goal-done' : ''}">${g.done ? '✓ done' : `${g.current}/${g.target}`}</span>
      </div>
      <div class="goal-desc">${g.description}</div>
      <div class="goal-track"><div class="goal-bar" style="width:${Math.round(g.progress * 100)}%"></div></div>`;
    grid.appendChild(el);
  }
}

// initial paint
paintPlaying();
