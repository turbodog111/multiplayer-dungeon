import test from 'node:test';
import assert from 'node:assert/strict';

import {
  spawnHero,
  spawnEnemy,
  moveEntity,
  distance,
  enemiesInRange,
  resolveHeroAttack,
  ATTACK_RANGE,
} from '../src/game/engine.js';
import { sela } from '../src/characters/index.js';
import { getEnemy } from '../src/enemies/index.js';

const BOUNDS = { width: 720, height: 420 };

// --- movement ---------------------------------------------------------------

test('moveEntity moves in the given direction scaled by dt', () => {
  const h = spawnHero(sela, 100, 100);
  moveEntity(h, 1, 0, 1000, BOUNDS); // full second to the right
  // Sela moveSpeed 1.15 * BASE_SPEED — she should have moved a positive amount
  assert.ok(h.x > 100, 'should move right');
  assert.equal(h.y, 100, 'no vertical movement');
});

test('moveEntity keeps the entity inside the room walls', () => {
  const h = spawnHero(sela, 100, 100);
  moveEntity(h, -1, 0, 100000, BOUNDS); // huge push left
  assert.ok(h.x >= h.radius, 'clamped to the left wall, not past it');
});

test('a diagonal move is normalized (not faster than a straight move)', () => {
  const straight = spawnHero(sela, 100, 100);
  const diagonal = spawnHero(sela, 100, 100);
  moveEntity(straight, 1, 0, 500, BOUNDS);
  moveEntity(diagonal, 1, 1, 500, BOUNDS);
  const dStraight = straight.x - 100;
  const dDiag = distance({ x: 100, y: 100 }, diagonal);
  assert.ok(Math.abs(dStraight - dDiag) < 0.001, 'diagonal speed equals straight speed');
});

// --- range ------------------------------------------------------------------

test('enemiesInRange returns only living enemies within reach', () => {
  const hero = spawnHero(sela, 100, 100);
  const near = spawnEnemy(getEnemy('stone_sentry'), 130, 100);
  const far = spawnEnemy(getEnemy('stone_sentry'), 500, 100);
  const dead = spawnEnemy(getEnemy('stone_sentry'), 110, 100);
  dead.health = 0;

  const inRange = enemiesInRange(hero, [near, far, dead], ATTACK_RANGE);
  assert.ok(inRange.includes(near));
  assert.ok(!inRange.includes(far), 'far enemy excluded');
  assert.ok(!inRange.includes(dead), 'dead enemy excluded');
});

// --- attacks actually hurt enemies -----------------------------------------

const noCrit = () => 0.99;
const alwaysCrit = () => 0.0;

test('a hero attack damages an in-range enemy (mitigated by its defense)', () => {
  const hero = spawnHero(sela, 100, 100);
  const enemy = spawnEnemy(getEnemy('stone_sentry'), 130, 100); // defense 8
  const beam = sela.moves.find((m) => m.id === 'sela_sunbeam'); // 12 dmg
  const before = enemy.health;

  const [hit] = resolveHeroAttack(hero, beam, [enemy], noCrit);
  assert.equal(hit.dealt, 12 - 8); // mitigated by defense 8 -> 4
  assert.equal(enemy.health, before - 4);
  assert.equal(hit.isCrit, false);
});

test('an out-of-range enemy takes no damage', () => {
  const hero = spawnHero(sela, 100, 100);
  const enemy = spawnEnemy(getEnemy('stone_sentry'), 600, 100);
  const before = enemy.health;
  const hits = resolveHeroAttack(hero, sela.moves[0], [enemy], noCrit);
  assert.deepEqual(hits, []);
  assert.equal(enemy.health, before);
});

test('a crit deals more, and lethal damage flags the enemy as killed', () => {
  const hero = spawnHero(sela, 100, 100);
  const enemy = spawnEnemy(getEnemy('stone_sentry'), 130, 100);
  enemy.health = 5; // one good hit from death
  const beam = sela.moves.find((m) => m.id === 'sela_sunbeam'); // 12 dmg, crit-eligible
  const [hit] = resolveHeroAttack(hero, beam, [enemy], alwaysCrit);
  assert.equal(hit.isCrit, true);
  assert.equal(enemy.health, 0);
  assert.equal(hit.killed, true);
});

test('stagger accumulates and opens the enemy once the threshold is passed', () => {
  const hero = spawnHero(sela, 100, 100);
  const enemy = spawnEnemy(getEnemy('stone_sentry'), 130, 100); // staggerThreshold 40
  const flash = sela.moves.find((m) => m.id === 'sela_flash'); // staggerDamage 22

  let [hit] = resolveHeroAttack(hero, flash, [enemy], noCrit);
  assert.equal(hit.opened, false); // 22 < 40
  assert.equal(enemy.stagger, 22);

  [hit] = resolveHeroAttack(hero, flash, [enemy], noCrit);
  assert.equal(enemy.stagger >= enemy.staggerThreshold, true);
  assert.equal(hit.opened, true); // crossed 40 -> opened
  assert.equal(enemy.staggered, true);
});
