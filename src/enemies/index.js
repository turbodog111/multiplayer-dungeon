// Enemy registry — the single place the game loads the bestiary from.
//
// Add an enemy by importing its definition and adding it to ENEMIES. Keep
// definitions data-only; AI/behavior lives in the systems that consume them.

import { stoneSentry } from './stone-sentry.js';
import { wraith } from './wraith.js';
import { brambleHulk } from './bramble-hulk.js';

export const ENEMIES = {
  [stoneSentry.id]: stoneSentry,
  [wraith.id]: wraith,
  [brambleHulk.id]: brambleHulk,
};

/** Look up an enemy by id. Returns undefined if there is no such enemy. */
export function getEnemy(id) {
  return ENEMIES[id];
}

/** All enemies as an array (order not guaranteed). */
export function listEnemies() {
  return Object.values(ENEMIES);
}

export { stoneSentry, wraith, brambleHulk };
