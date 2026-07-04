// Combat math — pure, deterministic helpers the game loop and netcode build on.
//
// Everything here is a plain function (plus one small stateful cooldown tracker)
// so it is trivial to test and safe to run identically on both clients and the
// authoritative server. Randomness is injected, never global, so a seeded RNG
// can keep two players in sync.

// When an enemy's stagger meter reaches this, it is "opened" — vulnerable to a
// co-op takedown. Individual enemies may override it in their own data later;
// heroes' move staggerDamage values are tuned against this baseline.
export const DEFAULT_STAGGER_THRESHOLD = 40;

/**
 * Final damage for a hit.
 * @param {number} baseDamage   the move's base damage
 * @param {number} critMultiplier attacker's crit multiplier (>= 1)
 * @param {boolean} isCrit       whether this hit crit
 * @returns {number} rounded damage
 */
export function computeDamage(baseDamage, critMultiplier, isCrit) {
  if (!isCrit) return baseDamage;
  return Math.round(baseDamage * critMultiplier);
}

/**
 * Roll whether a hit crits.
 * @param {number} critChance in [0, 1]
 * @param {() => number} rng   returns a float in [0, 1); defaults to Math.random
 * @returns {boolean}
 */
export function rollCrit(critChance, rng = Math.random) {
  return rng() < critChance;
}

/**
 * Resolve a single attack into its damage, crit flag, and stagger contribution.
 * A move that is not crit-eligible can never crit, regardless of the roll.
 * @param {object} move          a hero move (damage, staggerDamage, critEligible)
 * @param {object} attackerStats { critChance, critMultiplier }
 * @param {() => number} rng     injected RNG for determinism
 * @returns {{ damage: number, isCrit: boolean, staggerDamage: number }}
 */
export function resolveAttack(move, attackerStats, rng = Math.random) {
  const isCrit = move.critEligible
    ? rollCrit(attackerStats.critChance, rng)
    : false;
  return {
    damage: computeDamage(move.damage, attackerStats.critMultiplier, isCrit),
    isCrit,
    staggerDamage: move.staggerDamage,
  };
}

/**
 * Subtract damage from health, clamped so it never goes below zero.
 * @returns {number} new health
 */
export function applyDamage(currentHealth, amount) {
  return Math.max(0, currentHealth - amount);
}

/**
 * Reduce incoming damage by the defender's flat defense (never below 0).
 * @returns {number} damage that actually lands
 */
export function mitigateDamage(rawDamage, defense) {
  return Math.max(0, rawDamage - defense);
}

/**
 * A move's real wind-up after the attacker's attackSpeed. Higher attackSpeed =
 * shorter wind-up. Rounded to whole milliseconds.
 * @returns {number} milliseconds
 */
export function effectiveWindup(windupMs, attackSpeed) {
  return Math.round(windupMs / attackSpeed);
}

/**
 * Regenerate stamina over an elapsed span, capped at max.
 * @param {number} current       current stamina
 * @param {number} max           max stamina
 * @param {number} regenPerSec   stamina restored per second
 * @param {number} elapsedMs     time passed since last tick
 * @returns {number} new stamina
 */
export function regenStamina(current, max, regenPerSec, elapsedMs) {
  return Math.min(max, current + (regenPerSec * elapsedMs) / 1000);
}

/**
 * Attempt to spend stamina on a move.
 * @returns {{ ok: boolean, stamina: number }} ok=false leaves stamina unchanged
 */
export function spendStamina(current, cost) {
  if (current < cost) return { ok: false, stamina: current };
  return { ok: true, stamina: current - cost };
}

/**
 * Track per-move cooldowns against an externally-supplied clock (`now` in ms).
 * Time is passed in rather than read from a global clock so the same tracker
 * runs deterministically on both clients and the server.
 */
export function createCooldownTracker() {
  // moveId -> timestamp (ms) at which the move becomes ready again
  const readyAt = new Map();

  return {
    /** Start a cooldown of `cooldownMs` for `moveId`, fired at `now`. */
    trigger(moveId, now, cooldownMs) {
      readyAt.set(moveId, now + cooldownMs);
    },
    /** Is `moveId` off cooldown at time `now`? */
    ready(moveId, now) {
      return now >= (readyAt.get(moveId) ?? 0);
    },
    /** Milliseconds remaining on `moveId`'s cooldown at time `now` (0 if ready). */
    remaining(moveId, now) {
      return Math.max(0, (readyAt.get(moveId) ?? 0) - now);
    },
  };
}
