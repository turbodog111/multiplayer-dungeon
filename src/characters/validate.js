// Validation for character definitions.
//
// Characters are data (see the design doc, "Data-driven content"). This module
// is the guardrail: it keeps every hero definition well-formed as the team adds
// more of them, so a typo in a data file fails a test instead of the game.

export const ELEMENTS = new Set(['light', 'shadow']);
export const TIME_AFFINITIES = new Set(['present', 'past']);
export const MOVE_TYPES = new Set(['normal', 'special']);

// Every hero must have a line for each of these situations so the combat/UI
// layer always has something to say. Extend this list as new moments appear.
export const REQUIRED_SAYING_CATEGORIES = [
  'idle',
  'attack',
  'callForHelp',
  'takedownAssist',
  'hurt',
  'victory',
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate a character definition.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCharacter(character) {
  const errors = [];

  if (character === null || typeof character !== 'object') {
    return { valid: false, errors: ['character must be an object'] };
  }

  // --- Identity -----------------------------------------------------------
  for (const field of ['id', 'name', 'title']) {
    if (!isNonEmptyString(character[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (!ELEMENTS.has(character.element)) {
    errors.push(`element must be one of: ${[...ELEMENTS].join(', ')}`);
  }
  if (!TIME_AFFINITIES.has(character.timeAffinity)) {
    errors.push(`timeAffinity must be one of: ${[...TIME_AFFINITIES].join(', ')}`);
  }
  if (!HEX_COLOR.test(character.signatureHue ?? '')) {
    errors.push('signatureHue must be a 6-digit hex color (e.g. #f5b942)');
  }

  // --- Combat stats -------------------------------------------------------
  // Each entry: [field, predicate, message]. Keeps the block short as it grows.
  const STAT_RULES = [
    ['maxHealth', (v) => typeof v === 'number' && v > 0, 'must be a number > 0'],
    ['moveSpeed', (v) => typeof v === 'number' && v > 0, 'must be a number > 0'],
    ['critChance', (v) => typeof v === 'number' && v >= 0 && v <= 1, 'must be a number between 0 and 1'],
    ['critMultiplier', (v) => typeof v === 'number' && v >= 1, 'must be a number >= 1'],
    ['defense', (v) => typeof v === 'number' && v >= 0, 'must be a number >= 0'],
    ['maxStamina', (v) => typeof v === 'number' && v > 0, 'must be a number > 0'],
    ['staminaRegen', (v) => typeof v === 'number' && v >= 0, 'must be a number >= 0 (per second)'],
    ['attackSpeed', (v) => typeof v === 'number' && v > 0, 'must be a number > 0 (windup multiplier)'],
    ['reviveTimeMs', (v) => typeof v === 'number' && v >= 0, 'must be a number >= 0'],
  ];
  const stats = character.stats;
  if (stats === null || typeof stats !== 'object') {
    errors.push('stats must be an object (maxHealth, moveSpeed, critChance, critMultiplier, defense, maxStamina, staminaRegen, attackSpeed, reviveTimeMs)');
  } else {
    for (const [field, ok, msg] of STAT_RULES) {
      if (!ok(stats[field])) errors.push(`stats.${field} ${msg}`);
    }
  }

  // --- Traits -------------------------------------------------------------
  const traits = character.traits;
  if (traits === null || typeof traits !== 'object') {
    errors.push('traits must be an object');
  } else {
    if (!isNonEmptyString(traits.summary)) {
      errors.push('traits.summary must be a non-empty string');
    }
    if (!isNonEmptyString(traits.voice)) {
      errors.push('traits.voice must be a non-empty string');
    }
    if (!Array.isArray(traits.personality) || traits.personality.length === 0) {
      errors.push('traits.personality must be a non-empty array');
    } else if (!traits.personality.every(isNonEmptyString)) {
      errors.push('traits.personality must contain only non-empty strings');
    }
  }

  // --- Abilities ----------------------------------------------------------
  const abilityIds = new Set();
  if (!Array.isArray(character.abilities) || character.abilities.length === 0) {
    errors.push('abilities must be a non-empty array');
  } else {
    for (const ability of character.abilities) {
      if (!isNonEmptyString(ability?.id)) {
        errors.push('every ability needs a non-empty id');
        continue;
      }
      if (abilityIds.has(ability.id)) {
        errors.push(`duplicate ability id: ${ability.id}`);
      }
      abilityIds.add(ability.id);
      if (!isNonEmptyString(ability.name)) {
        errors.push(`ability ${ability.id} needs a name`);
      }
      if (!isNonEmptyString(ability.description)) {
        errors.push(`ability ${ability.id} needs a description`);
      }
      if (typeof ability.cooldownMs !== 'number' || ability.cooldownMs < 0) {
        errors.push(`ability ${ability.id} cooldown must be a number >= 0`);
      }
    }
  }

  // --- Moves --------------------------------------------------------------
  const moveIds = new Set();
  if (!Array.isArray(character.moves) || character.moves.length === 0) {
    errors.push('moves must be a non-empty array');
  } else {
    for (const move of character.moves) {
      if (!isNonEmptyString(move?.id)) {
        errors.push('every move needs a non-empty id');
        continue;
      }
      if (moveIds.has(move.id)) {
        errors.push(`duplicate move id: ${move.id}`);
      }
      moveIds.add(move.id);
      if (!isNonEmptyString(move.name)) {
        errors.push(`move ${move.id} needs a name`);
      }
      if (!MOVE_TYPES.has(move.type)) {
        errors.push(`move ${move.id} type must be one of: ${[...MOVE_TYPES].join(', ')}`);
      }
      if (typeof move.damage !== 'number' || move.damage < 0) {
        errors.push(`move ${move.id} damage must be a number >= 0`);
      }
      if (typeof move.staggerDamage !== 'number' || move.staggerDamage < 0) {
        errors.push(`move ${move.id} staggerDamage must be a number >= 0`);
      }
      if (typeof move.critEligible !== 'boolean') {
        errors.push(`move ${move.id} critEligible must be a boolean`);
      }
      if (typeof move.staminaCost !== 'number' || move.staminaCost < 0) {
        errors.push(`move ${move.id} staminaCost must be a number >= 0`);
      }
      // A special move draws on one of the hero's abilities and has a cooldown.
      if (move.type === 'special') {
        if (!isNonEmptyString(move.ability)) {
          errors.push(`special move ${move.id} must name the ability it draws on`);
        } else if (!abilityIds.has(move.ability)) {
          errors.push(`special move ${move.id} references unknown ability: ${move.ability}`);
        }
        if (typeof move.cooldownMs !== 'number' || move.cooldownMs < 0) {
          errors.push(`special move ${move.id} cooldownMs must be a number >= 0`);
        }
      }
    }

    const hasPunch = character.moves.some((m) => m.type === 'normal' && m.kind === 'punch');
    const hasKick = character.moves.some((m) => m.type === 'normal' && m.kind === 'kick');
    const hasSpecial = character.moves.some((m) => m.type === 'special');
    if (!hasPunch) errors.push('must include at least one normal punch move');
    if (!hasKick) errors.push('must include at least one normal kick move');
    if (!hasSpecial) errors.push('must include at least one special move');
  }

  // --- Sayings ------------------------------------------------------------
  const sayings = character.sayings;
  if (sayings === null || typeof sayings !== 'object') {
    errors.push('sayings must be an object');
  } else {
    for (const category of REQUIRED_SAYING_CATEGORIES) {
      const lines = sayings[category];
      if (!Array.isArray(lines) || lines.length === 0) {
        errors.push(`sayings.${category} must be a non-empty array`);
      } else if (!lines.every(isNonEmptyString)) {
        errors.push(`sayings.${category} must contain only non-empty strings`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
