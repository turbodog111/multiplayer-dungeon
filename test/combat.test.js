import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeDamage,
  rollCrit,
  resolveAttack,
  applyDamage,
  mitigateDamage,
  effectiveWindup,
  regenStamina,
  spendStamina,
  createCooldownTracker,
  DEFAULT_STAGGER_THRESHOLD,
} from '../src/characters/combat.js';

// --- computeDamage ----------------------------------------------------------

test('computeDamage returns the base when not a crit', () => {
  assert.equal(computeDamage(14, 2.25, false), 14);
});

test('computeDamage multiplies and rounds on a crit', () => {
  // 14 * 2.25 = 31.5 -> 32
  assert.equal(computeDamage(14, 2.25, true), 32);
  // 7 * 2.0 = 14
  assert.equal(computeDamage(7, 2.0, true), 14);
});

test('computeDamage of a zero-damage move is always zero', () => {
  assert.equal(computeDamage(0, 3.0, true), 0);
});

// --- rollCrit ---------------------------------------------------------------

test('rollCrit is true when the roll is below the chance', () => {
  assert.equal(rollCrit(0.15, () => 0.1), true);
});

test('rollCrit is false when the roll meets or exceeds the chance', () => {
  assert.equal(rollCrit(0.15, () => 0.15), false);
  assert.equal(rollCrit(0.15, () => 0.9), false);
});

test('rollCrit never crits at 0 chance and always crits at 1 chance', () => {
  assert.equal(rollCrit(0, () => 0), false);
  assert.equal(rollCrit(1, () => 0.999), true);
});

// --- resolveAttack ----------------------------------------------------------

const critEligibleMove = { id: 'hit', damage: 14, staggerDamage: 12, critEligible: true };
const utilityMove = { id: 'flash', damage: 3, staggerDamage: 22, critEligible: false };
const kadeStats = { critChance: 0.1, critMultiplier: 2.25 };

test('resolveAttack applies a crit for a crit-eligible move when the roll hits', () => {
  const result = resolveAttack(critEligibleMove, kadeStats, () => 0.0);
  assert.equal(result.isCrit, true);
  assert.equal(result.damage, 32); // 14 * 2.25 rounded
  assert.equal(result.staggerDamage, 12);
});

test('resolveAttack deals base damage when the crit roll misses', () => {
  const result = resolveAttack(critEligibleMove, kadeStats, () => 0.99);
  assert.equal(result.isCrit, false);
  assert.equal(result.damage, 14);
});

test('resolveAttack never crits a non-crit-eligible move, even on a guaranteed roll', () => {
  const result = resolveAttack(utilityMove, { critChance: 1, critMultiplier: 5 }, () => 0);
  assert.equal(result.isCrit, false);
  assert.equal(result.damage, 3);
  assert.equal(result.staggerDamage, 22);
});

// --- applyDamage ------------------------------------------------------------

test('applyDamage subtracts from current health', () => {
  assert.equal(applyDamage(90, 14), 76);
});

test('applyDamage clamps at zero (no negative health)', () => {
  assert.equal(applyDamage(10, 32), 0);
});

// --- mitigateDamage ---------------------------------------------------------

test('mitigateDamage subtracts flat defense', () => {
  assert.equal(mitigateDamage(14, 6), 8);
  assert.equal(mitigateDamage(10, 2), 8);
});

test('mitigateDamage never returns negative', () => {
  assert.equal(mitigateDamage(3, 10), 0);
});

// --- effectiveWindup --------------------------------------------------------

test('effectiveWindup shrinks with higher attack speed', () => {
  // 300ms windup at 1.2x attack speed -> 250ms
  assert.equal(effectiveWindup(300, 1.2), 250);
  // baseline attack speed leaves it unchanged
  assert.equal(effectiveWindup(300, 1.0), 300);
});

// --- stamina ----------------------------------------------------------------

test('regenStamina adds regen-per-second scaled by elapsed ms, capped at max', () => {
  // 20/sec for 500ms = +10
  assert.equal(regenStamina(50, 100, 20, 500), 60);
  // caps at max
  assert.equal(regenStamina(95, 100, 20, 1000), 100);
});

test('spendStamina deducts when affordable and reports success', () => {
  assert.deepEqual(spendStamina(100, 16), { ok: true, stamina: 84 });
});

test('spendStamina refuses when the pool is too low and leaves it unchanged', () => {
  assert.deepEqual(spendStamina(10, 16), { ok: false, stamina: 10 });
});

// --- cooldowns --------------------------------------------------------------

test('a fresh cooldown tracker reports every ability ready', () => {
  const cd = createCooldownTracker();
  assert.equal(cd.ready('sela_flash', 1000), true);
  assert.equal(cd.remaining('sela_flash', 1000), 0);
});

test('triggering a cooldown blocks the move until it elapses', () => {
  const cd = createCooldownTracker();
  cd.trigger('sela_flash', 1000, 4000); // fired at t=1000, 4s cooldown
  assert.equal(cd.ready('sela_flash', 1000), false);
  assert.equal(cd.ready('sela_flash', 3000), false);
  assert.equal(cd.remaining('sela_flash', 3000), 2000);
  assert.equal(cd.ready('sela_flash', 5000), true); // exactly elapsed
  assert.equal(cd.remaining('sela_flash', 5000), 0);
});

test('cooldowns are tracked per-move independently', () => {
  const cd = createCooldownTracker();
  cd.trigger('sela_flash', 0, 4000);
  assert.equal(cd.ready('sela_sunbeam', 0), true); // a different move is unaffected
  assert.equal(cd.ready('sela_flash', 0), false);
});

// --- constant ---------------------------------------------------------------

test('exports a default stagger threshold used to open enemies', () => {
  assert.equal(typeof DEFAULT_STAGGER_THRESHOLD, 'number');
  assert.ok(DEFAULT_STAGGER_THRESHOLD > 0);
});
