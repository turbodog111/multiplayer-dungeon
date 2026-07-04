// Game engine — pure simulation helpers for the playable room.
//
// Movement, range checks, and attack resolution all live here as plain functions
// operating on entity objects, so the same logic is unit-tested and (later) runs
// identically on the authoritative server. The browser layer (ui/game.js) owns
// the render loop and input; it calls into these.

import { resolveAttack, mitigateDamage } from '../characters/combat.js';

export const BASE_SPEED = 120; // px/sec at moveSpeed 1.0
export const ATTACK_RANGE = 48; // melee reach in px (added to target radius)
const HERO_RADIUS = 16;
const ENEMY_RADIUS = 20;

let nextId = 1;
function makeId(prefix) {
  return `${prefix}_${nextId++}`;
}

/** Spawn a hero runtime entity from a character definition. */
export function spawnHero(def, x, y) {
  return {
    id: makeId(def.id),
    kind: 'hero',
    def,
    x, y,
    radius: HERO_RADIUS,
    facing: { x: 0, y: 1 },
    health: def.stats.maxHealth,
    maxHealth: def.stats.maxHealth,
    stamina: def.stats.maxStamina,
    downed: false,
  };
}

/** Spawn an enemy runtime entity from an enemy definition. */
export function spawnEnemy(def, x, y) {
  return {
    id: makeId(def.id),
    kind: 'enemy',
    def,
    x, y,
    radius: ENEMY_RADIUS,
    health: def.stats.maxHealth,
    maxHealth: def.stats.maxHealth,
    stagger: 0,
    staggerThreshold: def.stats.staggerThreshold,
    staggered: false,
    staggerUntil: 0, // wall-clock ms; set by the loop when opened
  };
}

/** Euclidean distance between two {x,y} points. */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Move an entity by a (possibly diagonal) direction, normalized so diagonals
 * aren't faster, scaled by the entity's moveSpeed and the elapsed time, then
 * clamped inside the room. Mutates and returns the entity.
 */
export function moveEntity(entity, dirX, dirY, dtMs, bounds) {
  const len = Math.hypot(dirX, dirY);
  if (len > 0) {
    const nx = dirX / len;
    const ny = dirY / len;
    entity.facing = { x: nx, y: ny };
    const speed = BASE_SPEED * (entity.def.stats.moveSpeed ?? 1);
    const dist = (speed * dtMs) / 1000;
    entity.x += nx * dist;
    entity.y += ny * dist;
  }
  const r = entity.radius;
  entity.x = Math.max(r, Math.min(bounds.width - r, entity.x));
  entity.y = Math.max(r, Math.min(bounds.height - r, entity.y));
  return entity;
}

/** Living enemies within `range` (plus the enemy's own radius) of the origin. */
export function enemiesInRange(origin, enemies, range) {
  return enemies.filter(
    (e) => e.health > 0 && distance(origin, e) <= range + e.radius,
  );
}

/**
 * Resolve a hero's attack against a list of enemies. Applies mitigated damage
 * and stagger to every enemy in range and returns a hit report per enemy.
 * @returns {Array<{enemy, dealt, isCrit, killed, opened}>}
 */
export function resolveHeroAttack(hero, move, enemies, rng = Math.random) {
  const targets = enemiesInRange(hero, enemies, ATTACK_RANGE);
  return targets.map((enemy) => {
    const atk = resolveAttack(move, hero.def.stats, rng);
    const dealt = mitigateDamage(atk.damage, enemy.def.stats.defense);
    enemy.health = Math.max(0, enemy.health - dealt);

    const wasOpen = enemy.staggered;
    enemy.stagger += atk.staggerDamage;
    let opened = false;
    if (!wasOpen && enemy.stagger >= enemy.staggerThreshold) {
      enemy.staggered = true;
      opened = true;
    }

    return { enemy, dealt, isCrit: atk.isCrit, killed: enemy.health === 0, opened };
  });
}
