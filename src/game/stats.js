// Run statistics — the tally of a single ascent up the tower.
//
// A run-scoped counter the game loop feeds events into. Score is derived from
// the good things players do (kills, takedowns, floors, crits); survival stats
// (deaths, damage taken) are tracked for goals and the end-of-run summary but
// don't reduce score. snapshot() returns a fresh plain object safe to render,
// serialize, or send over the wire.

// Points awarded per event. Tunable in one place.
export const SCORE_RULES = {
  perTakedown: 50,
  perFloor: 500,
  perCrit: 10,
  // enemies contribute their own scoreValue (see recordEnemyDefeated)
};

export function createRunStats() {
  const state = {
    score: 0,
    enemiesDefeated: 0,
    takedowns: 0,
    crits: 0,
    damageDealt: 0,
    damageTaken: 0,
    floorsCleared: 0,
    deaths: 0,
    revives: 0,
    elapsedMs: 0,
  };

  return {
    recordEnemyDefeated(enemy) {
      state.enemiesDefeated += 1;
      state.score += enemy?.scoreValue ?? 0;
    },
    recordTakedown() {
      state.takedowns += 1;
      state.score += SCORE_RULES.perTakedown;
    },
    recordCrit() {
      state.crits += 1;
      state.score += SCORE_RULES.perCrit;
    },
    recordFloorCleared() {
      state.floorsCleared += 1;
      state.score += SCORE_RULES.perFloor;
    },
    recordDamageDealt(amount) {
      state.damageDealt += amount;
    },
    recordDamageTaken(amount) {
      state.damageTaken += amount;
    },
    recordDeath() {
      state.deaths += 1;
    },
    recordRevive() {
      state.revives += 1;
    },
    addTime(ms) {
      state.elapsedMs += ms;
    },
    /** A fresh copy of the current stats — safe to mutate/render/serialize. */
    snapshot() {
      return { ...state };
    },
  };
}
