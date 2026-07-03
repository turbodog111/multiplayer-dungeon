// Character registry — the single place the rest of the game loads heroes from.
//
// Add a new hero by importing its definition and adding it to CHARACTERS. Keep
// definitions data-only; behavior lives in the systems that consume them.

import { sela } from './sela.js';
import { kade } from './kade.js';

export const CHARACTERS = {
  [sela.id]: sela,
  [kade.id]: kade,
};

/** Look up a character by id. Returns undefined if there is no such hero. */
export function getCharacter(id) {
  return CHARACTERS[id];
}

/** All characters as an array (order not guaranteed). */
export function listCharacters() {
  return Object.values(CHARACTERS);
}

export { sela, kade };
