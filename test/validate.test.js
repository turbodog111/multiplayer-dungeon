import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateCharacter,
  ELEMENTS,
  TIME_AFFINITIES,
  REQUIRED_SAYING_CATEGORIES,
} from '../src/characters/validate.js';

// A minimal, fully-valid character used as a baseline. Individual tests clone
// this and break one thing to prove that specific rule is enforced.
function makeValidCharacter() {
  return {
    id: 'tester',
    name: 'Tester',
    title: 'the Example',
    element: 'light',
    timeAffinity: 'present',
    signatureHue: '#f5b942',
    stats: {
      maxHealth: 100,
      moveSpeed: 1.0,
      critChance: 0.15,
      critMultiplier: 2.0,
      defense: 2,
      maxStamina: 100,
      staminaRegen: 20,
      attackSpeed: 1.0,
      reviveTimeMs: 3000,
    },
    traits: {
      summary: 'A stand-in hero for tests.',
      voice: 'Plain and direct.',
      personality: ['brave', 'curious'],
    },
    abilities: [
      { id: 'torch', name: 'Torch', description: 'Lights the way.', cooldownMs: 0 },
    ],
    moves: [
      { id: 'jab', name: 'Jab', type: 'normal', kind: 'punch', damage: 4, staggerDamage: 3, critEligible: true, staminaCost: 8 },
      { id: 'kick', name: 'Kick', type: 'normal', kind: 'kick', damage: 6, staggerDamage: 5, critEligible: true, staminaCost: 14 },
      { id: 'flash', name: 'Flash', type: 'special', kind: 'power', damage: 12, staggerDamage: 8, critEligible: false, ability: 'torch', cooldownMs: 4000, staminaCost: 0 },
    ],
    sayings: Object.fromEntries(
      REQUIRED_SAYING_CATEGORIES.map((cat) => [cat, [`${cat} line`]]),
    ),
  };
}

test('a fully-formed character is valid with no errors', () => {
  const result = validateCharacter(makeValidCharacter());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects an empty id', () => {
  const c = makeValidCharacter();
  c.id = '';
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('id')));
});

test('rejects an element outside the allowed set', () => {
  const c = makeValidCharacter();
  c.element = 'plasma';
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('element')));
  // sanity: the allowed set is what we expect
  assert.deepEqual([...ELEMENTS].sort(), ['light', 'shadow']);
});

test('rejects a timeAffinity outside the allowed set', () => {
  const c = makeValidCharacter();
  c.timeAffinity = 'future';
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('timeAffinity')));
  assert.deepEqual([...TIME_AFFINITIES].sort(), ['past', 'present']);
});

test('rejects a signatureHue that is not a hex color', () => {
  const c = makeValidCharacter();
  c.signatureHue = 'amber';
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('signatureHue')));
});

test('rejects empty personality traits', () => {
  const c = makeValidCharacter();
  c.traits.personality = [];
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('personality')));
});

test('rejects an ability with a negative cooldown', () => {
  const c = makeValidCharacter();
  c.abilities[0].cooldownMs = -100;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('cooldown')));
});

test('rejects duplicate move ids', () => {
  const c = makeValidCharacter();
  c.moves[1].id = 'jab'; // collide with the first move
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('duplicate')));
});

test('rejects a move with an invalid type', () => {
  const c = makeValidCharacter();
  c.moves[0].type = 'ultimate';
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('type')));
});

test('requires at least one normal punch move', () => {
  const c = makeValidCharacter();
  c.moves = c.moves.filter((m) => m.kind !== 'punch');
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('punch')));
});

test('requires at least one normal kick move', () => {
  const c = makeValidCharacter();
  c.moves = c.moves.filter((m) => m.kind !== 'kick');
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('kick')));
});

test('requires at least one special move', () => {
  const c = makeValidCharacter();
  c.moves = c.moves.filter((m) => m.type !== 'special');
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('special')));
});

test('a special move must reference an existing ability', () => {
  const c = makeValidCharacter();
  c.moves.find((m) => m.type === 'special').ability = 'nonexistent';
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('ability')));
});

test('requires every mandatory saying category to be present and non-empty', () => {
  const c = makeValidCharacter();
  const dropped = REQUIRED_SAYING_CATEGORIES[0];
  delete c.sayings[dropped];
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes(dropped)));
});

// --- Combat stats -----------------------------------------------------------

test('requires a stats block', () => {
  const c = makeValidCharacter();
  delete c.stats;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('stats')));
});

test('rejects a non-positive maxHealth', () => {
  const c = makeValidCharacter();
  c.stats.maxHealth = 0;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('maxHealth')));
});

test('rejects a non-positive moveSpeed', () => {
  const c = makeValidCharacter();
  c.stats.moveSpeed = -1;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('moveSpeed')));
});

test('rejects a critChance outside 0..1', () => {
  const c = makeValidCharacter();
  c.stats.critChance = 1.5;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('critChance')));
});

test('rejects a critMultiplier below 1', () => {
  const c = makeValidCharacter();
  c.stats.critMultiplier = 0.5;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('critMultiplier')));
});

test('rejects a move with negative staggerDamage', () => {
  const c = makeValidCharacter();
  c.moves[0].staggerDamage = -3;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('staggerDamage')));
});

test('rejects a move whose critEligible is not a boolean', () => {
  const c = makeValidCharacter();
  c.moves[0].critEligible = 'yes';
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('critEligible')));
});

test('rejects a special move with a negative cooldown', () => {
  const c = makeValidCharacter();
  const special = c.moves.find((m) => m.type === 'special');
  special.cooldownMs = -500;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('cooldown')));
});

test('rejects negative defense', () => {
  const c = makeValidCharacter();
  c.stats.defense = -1;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('defense')));
});

test('rejects a non-positive maxStamina', () => {
  const c = makeValidCharacter();
  c.stats.maxStamina = 0;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('maxStamina')));
});

test('rejects a non-positive attackSpeed', () => {
  const c = makeValidCharacter();
  c.stats.attackSpeed = 0;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('attackSpeed')));
});

test('rejects a move with negative staminaCost', () => {
  const c = makeValidCharacter();
  c.moves[0].staminaCost = -5;
  const result = validateCharacter(c);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('staminaCost')));
});
