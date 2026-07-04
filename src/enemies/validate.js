// Validation for enemy definitions.
//
// Enemies are data, like heroes. Each carries combat stats and a co-op takedown
// chain — the ordered two-hero sequence that actually defeats it. This validator
// keeps every enemy well-formed; a cross-check that takedown moves exist on the
// named heroes lives in the enemy tests (it needs the character data).

export const ENEMY_LAYERS = new Set(['present', 'echo', 'both']);
export const TAKEDOWN_HEROES = new Set(['sela', 'kade']);

const STAT_RULES = [
  ['maxHealth', (v) => typeof v === 'number' && v > 0, 'must be a number > 0'],
  ['defense', (v) => typeof v === 'number' && v >= 0, 'must be a number >= 0'],
  ['contactDamage', (v) => typeof v === 'number' && v >= 0, 'must be a number >= 0'],
  ['attackDamage', (v) => typeof v === 'number' && v >= 0, 'must be a number >= 0'],
  ['moveSpeed', (v) => typeof v === 'number' && v > 0, 'must be a number > 0'],
  ['staggerThreshold', (v) => typeof v === 'number' && v > 0, 'must be a number > 0'],
  ['staggerDurationMs', (v) => typeof v === 'number' && v >= 0, 'must be a number >= 0'],
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate an enemy definition.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEnemy(enemy) {
  const errors = [];

  if (enemy === null || typeof enemy !== 'object') {
    return { valid: false, errors: ['enemy must be an object'] };
  }

  for (const field of ['id', 'name', 'archetype', 'description']) {
    if (!isNonEmptyString(enemy[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (!ENEMY_LAYERS.has(enemy.layer)) {
    errors.push(`layer must be one of: ${[...ENEMY_LAYERS].join(', ')}`);
  }
  if (!Number.isInteger(enemy.tier) || enemy.tier < 1) {
    errors.push('tier must be an integer >= 1');
  }
  if (!Number.isInteger(enemy.scoreValue) || enemy.scoreValue < 0) {
    errors.push('scoreValue must be an integer >= 0');
  }

  // --- Stats --------------------------------------------------------------
  const stats = enemy.stats;
  if (stats === null || typeof stats !== 'object') {
    errors.push('stats must be an object');
  } else {
    for (const [field, ok, msg] of STAT_RULES) {
      if (!ok(stats[field])) errors.push(`stats.${field} ${msg}`);
    }
  }

  // --- Takedown chain -----------------------------------------------------
  if (!Array.isArray(enemy.takedown) || enemy.takedown.length === 0) {
    errors.push('takedown must be a non-empty array of steps');
  } else {
    enemy.takedown.forEach((step, i) => {
      if (!step || typeof step !== 'object') {
        errors.push(`takedown step ${i} must be an object`);
        return;
      }
      if (!TAKEDOWN_HEROES.has(step.hero)) {
        errors.push(`takedown step ${i}: hero must be one of ${[...TAKEDOWN_HEROES].join(', ')}`);
      }
      if (!isNonEmptyString(step.move)) {
        errors.push(`takedown step ${i}: move must be a non-empty string`);
      }
      if (!isNonEmptyString(step.prompt)) {
        errors.push(`takedown step ${i}: prompt must be a non-empty string`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
