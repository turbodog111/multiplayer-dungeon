import test from 'node:test';
import assert from 'node:assert/strict';

import { createRunStats } from '../src/game/stats.js';
import { evaluateGoal, evaluateGoals, TOWER_GOALS } from '../src/game/goals.js';
import { getEnemy } from '../src/enemies/index.js';

// --- RunStats ---------------------------------------------------------------

test('a fresh run starts at all zeros', () => {
  const run = createRunStats();
  const s = run.snapshot();
  assert.equal(s.score, 0);
  assert.equal(s.enemiesDefeated, 0);
  assert.equal(s.takedowns, 0);
  assert.equal(s.damageDealt, 0);
  assert.equal(s.floorsCleared, 0);
  assert.equal(s.deaths, 0);
  assert.equal(s.elapsedMs, 0);
});

test('defeating an enemy counts it and adds its score value', () => {
  const run = createRunStats();
  run.recordEnemyDefeated(getEnemy('bramble_hulk')); // scoreValue 300
  const s = run.snapshot();
  assert.equal(s.enemiesDefeated, 1);
  assert.equal(s.score, 300);
});

test('takedowns, floors, and crits each add to the score', () => {
  const run = createRunStats();
  run.recordTakedown(); // +50
  run.recordFloorCleared(); // +500
  run.recordCrit(); // +10
  const s = run.snapshot();
  assert.equal(s.takedowns, 1);
  assert.equal(s.floorsCleared, 1);
  assert.equal(s.crits, 1);
  assert.equal(s.score, 560);
});

test('damage dealt and taken accumulate without affecting score', () => {
  const run = createRunStats();
  run.recordDamageDealt(32);
  run.recordDamageDealt(8);
  run.recordDamageTaken(14);
  const s = run.snapshot();
  assert.equal(s.damageDealt, 40);
  assert.equal(s.damageTaken, 14);
  assert.equal(s.score, 0);
});

test('deaths, revives, and time are tracked', () => {
  const run = createRunStats();
  run.recordDeath();
  run.recordRevive();
  run.addTime(1500);
  run.addTime(500);
  const s = run.snapshot();
  assert.equal(s.deaths, 1);
  assert.equal(s.revives, 1);
  assert.equal(s.elapsedMs, 2000);
});

test('snapshot is a copy — mutating it does not change the run', () => {
  const run = createRunStats();
  const s = run.snapshot();
  s.score = 9999;
  assert.equal(run.snapshot().score, 0);
});

// --- Goals ------------------------------------------------------------------

test('an atLeast goal is done when the metric meets the target', () => {
  const goal = { id: 'g', name: 'G', metric: 'takedowns', target: 3, mode: 'atLeast', description: '' };
  assert.equal(evaluateGoal(goal, { takedowns: 2 }).done, false);
  assert.equal(evaluateGoal(goal, { takedowns: 3 }).done, true);
});

test('an atLeast goal reports fractional progress', () => {
  const goal = { id: 'g', name: 'G', metric: 'score', target: 1000, mode: 'atLeast', description: '' };
  assert.equal(evaluateGoal(goal, { score: 250 }).progress, 0.25);
  assert.equal(evaluateGoal(goal, { score: 5000 }).progress, 1); // capped at 1
});

test('an atMost goal (e.g. no deaths) is done while at or below target', () => {
  const goal = { id: 'g', name: 'G', metric: 'deaths', target: 0, mode: 'atMost', description: '' };
  assert.equal(evaluateGoal(goal, { deaths: 0 }).done, true);
  assert.equal(evaluateGoal(goal, { deaths: 1 }).done, false);
});

test('evaluateGoals maps the full goal list against a snapshot', () => {
  const run = createRunStats();
  run.recordFloorCleared();
  const results = evaluateGoals(TOWER_GOALS, run.snapshot());
  assert.equal(results.length, TOWER_GOALS.length);
  for (const r of results) {
    assert.ok('id' in r && 'done' in r && 'current' in r && 'target' in r);
  }
});

test('the tower goal set is non-empty and each goal targets a real stat', () => {
  assert.ok(TOWER_GOALS.length >= 3);
  const validMetrics = new Set(Object.keys(createRunStats().snapshot()));
  for (const goal of TOWER_GOALS) {
    assert.ok(validMetrics.has(goal.metric), `goal ${goal.id} targets unknown metric ${goal.metric}`);
    assert.ok(['atLeast', 'atMost'].includes(goal.mode));
  }
});
