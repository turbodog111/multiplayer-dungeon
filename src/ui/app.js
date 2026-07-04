// Front-end wiring for The Sundering Spire.
//
// Connects the tested screen machine to the DOM menus and to the real-time game
// (game.js). Screen transitions drive the game: entering PLAYING fresh starts a
// run; from PAUSED it resumes; leaving to title/summary stops it.

import { createScreenMachine, SCREENS } from './screens.js';
import { createGame } from './game.js';
import { evaluateGoals, TOWER_GOALS } from '../game/goals.js';

const machine = createScreenMachine();
const canvas = document.getElementById('game-canvas');
const game = createGame(canvas, {
  onGameOver: () => machine.send('GAME_OVER'),
});

// Dev handle - lets tooling drive/inspect the game. Harmless in production.
window.__spire = { machine, game };

// --- screen switching -------------------------------------------------------
const screens = [...document.querySelectorAll('.screen')];
let previous = machine.state;

function showScreen(name) {
  for (const el of screens) el.classList.toggle('is-active', el.dataset.screen === name);
}

machine.subscribe((state) => {
  showScreen(state);
  if (state === SCREENS.PLAYING) {
    if (previous === SCREENS.PAUSED) game.resume();
    else game.start();
  } else if (state === SCREENS.PAUSED) {
    game.pause();
  } else if (state === SCREENS.SUMMARY) {
    paintSummary();
    game.stop();
  } else if (state === SCREENS.TITLE) {
    game.stop();
  }
  previous = state;
});

// Wire every [data-event] button to the machine.
for (const btn of document.querySelectorAll('[data-event]')) {
  btn.addEventListener('click', () => machine.send(btn.dataset.event));
}

// --- keyboard: Esc pauses/resumes, Enter plays from the title ---------------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (machine.state === SCREENS.PLAYING) machine.send('PAUSE');
    else if (machine.state === SCREENS.PAUSED) machine.send('RESUME');
  } else if (e.key === 'Enter' && machine.state === SCREENS.TITLE) {
    machine.send('PLAY');
  }
});

// --- end-of-run summary -----------------------------------------------------
function paintSummary() {
  const s = game.snapshot();
  const scoreEl = document.querySelector('[data-screen="summary"] [data-stat="score"]');
  if (scoreEl) scoreEl.textContent = s.score;

  const grid = document.querySelector('[data-goals]');
  grid.innerHTML = '';
  for (const g of evaluateGoals(TOWER_GOALS, s)) {
    const el = document.createElement('div');
    el.className = 'goal';
    el.innerHTML = `
      <div class="goal-head">
        <span>${g.name}</span>
        <span class="${g.done ? 'goal-done' : ''}">${g.done ? 'done' : `${g.current}/${g.target}`}</span>
      </div>
      <div class="goal-desc">${g.description}</div>
      <div class="goal-track"><div class="goal-bar" style="width:${Math.round(g.progress * 100)}%"></div></div>`;
    grid.appendChild(el);
  }
}
