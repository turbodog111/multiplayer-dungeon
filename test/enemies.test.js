import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateEnemy,
  ENEMY_LAYERS,
  TAKEDOWN_HEROES,
} from '../src/enemies/validate.js';
import { ENEMIES, getEnemy, listEnemies } from '../src/enemies/index.js';
import { CHARACTERS } from '../src/characters/index.js';

function makeValidEnemy() {
  return {
    id: 'dummy',
    name: 'Training Dummy',
    archetype: 'brute',
    layer: 'present',
    tier: 1,
    description: 'A stand-in enemy for tests.',
    stats: {
      maxHealth: 50,
      defense: 4,
      contactDamage: 5,
      attackDamage: 10,
      moveSpeed: 0.8,
      staggerThreshold: 40,
      staggerDurationMs: 2500,
    },
    scoreValue: 100,
    takedown: [
      { hero: 'kade', move: 'kade_grab', prompt: 'GRAB' },
      { hero: 'sela', move: 'sela_flash', prompt: 'LIGHT-STUN' },
      { hero: 'kade', move: 'kade_phasestrike', prompt: 'FINISH' },
    ],
  };
}

// --- validator --------------------------------------------------------------

test('a fully-formed enemy is valid', () => {
  const result = validateEnemy(makeValidEnemy());
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test('rejects an unknown layer', () => {
  const e = makeValidEnemy();
  e.layer = 'future';
  const result = validateEnemy(e);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((m) => m.includes('layer')));
  assert.deepEqual([...ENEMY_LAYERS].sort(), ['both', 'echo', 'present']);
});

test('rejects a tier below 1 or non-integer', () => {
  const e = makeValidEnemy();
  e.tier = 0;
  assert.equal(validateEnemy(e).valid, false);
  e.tier = 1.5;
  assert.equal(validateEnemy(e).valid, false);
});

test('rejects non-positive maxHealth', () => {
  const e = makeValidEnemy();
  e.stats.maxHealth = 0;
  const result = validateEnemy(e);
  assert.ok(result.errors.some((m) => m.includes('maxHealth')));
});

test('rejects a non-positive staggerThreshold', () => {
  const e = makeValidEnemy();
  e.stats.staggerThreshold = 0;
  const result = validateEnemy(e);
  assert.ok(result.errors.some((m) => m.includes('staggerThreshold')));
});

test('rejects a negative scoreValue', () => {
  const e = makeValidEnemy();
  e.scoreValue = -10;
  const result = validateEnemy(e);
  assert.ok(result.errors.some((m) => m.includes('scoreValue')));
});

test('requires a non-empty takedown chain', () => {
  const e = makeValidEnemy();
  e.takedown = [];
  const result = validateEnemy(e);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((m) => m.includes('takedown')));
});

test('rejects a takedown step with an unknown hero', () => {
  const e = makeValidEnemy();
  e.takedown[0].hero = 'gandalf';
  const result = validateEnemy(e);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((m) => m.includes('hero')));
  assert.deepEqual([...TAKEDOWN_HEROES].sort(), ['kade', 'sela']);
});

test('rejects a takedown step missing its prompt', () => {
  const e = makeValidEnemy();
  delete e.takedown[1].prompt;
  const result = validateEnemy(e);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((m) => m.includes('prompt')));
});

// --- the actual bestiary ----------------------------------------------------

test('every bestiary enemy is valid', () => {
  for (const enemy of listEnemies()) {
    const result = validateEnemy(enemy);
    assert.deepEqual(result.errors, [], `${enemy.id} should be valid`);
  }
});

test('the registry exposes enemies by id', () => {
  assert.equal(getEnemy('stone_sentry').id, 'stone_sentry');
  assert.equal(getEnemy('nobody'), undefined);
  assert.ok(listEnemies().length >= 3);
  assert.equal(ENEMIES.wraith.name, 'Wraith');
});

test('every takedown step references a move the named hero actually owns', () => {
  for (const enemy of listEnemies()) {
    for (const step of enemy.takedown) {
      const hero = CHARACTERS[step.hero];
      assert.ok(hero, `${enemy.id} names unknown hero ${step.hero}`);
      const owns = hero.moves.some((m) => m.id === step.move);
      assert.ok(owns, `${enemy.id} takedown uses ${step.move}, which ${step.hero} does not have`);
    }
  }
});

test('enemies get harder by tier (health rises with tier across the bestiary)', () => {
  const byTier = [...listEnemies()].sort((a, b) => a.tier - b.tier);
  assert.ok(
    byTier[0].stats.maxHealth < byTier[byTier.length - 1].stats.maxHealth,
    'the lowest-tier enemy should be frailer than the highest-tier one',
  );
});
