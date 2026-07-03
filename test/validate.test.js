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
    traits: {
      summary: 'A stand-in hero for tests.',
      voice: 'Plain and direct.',
      personality: ['brave', 'curious'],
    },
    abilities: [
      { id: 'torch', name: 'Torch', description: 'Lights the way.', cooldownMs: 0 },
    ],
    moves: [
      { id: 'jab', name: 'Jab', type: 'normal', kind: 'punch', damage: 4 },
      { id: 'kick', name: 'Kick', type: 'normal', kind: 'kick', damage: 6 },
      { id: 'flash', name: 'Flash', type: 'special', kind: 'power', damage: 12, ability: 'torch' },
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
