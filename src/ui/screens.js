// Screen state machine — which menu/screen is showing, and the legal moves
// between them. Pure logic (no DOM) so it's testable and the same rules drive
// the real UI. The HTML front-end (app.js) subscribes and renders accordingly.

export const SCREENS = {
  TITLE: 'title',
  CONTROLS: 'controls',
  PLAYING: 'playing',
  PAUSED: 'paused',
  SUMMARY: 'summary',
};

// event -> target screen, per current screen. The special target '@back' pops
// to whichever screen opened the controls (title or paused).
const TRANSITIONS = {
  [SCREENS.TITLE]: { PLAY: SCREENS.PLAYING, OPEN_CONTROLS: SCREENS.CONTROLS },
  [SCREENS.CONTROLS]: { BACK: '@back' },
  [SCREENS.PLAYING]: { PAUSE: SCREENS.PAUSED, GAME_OVER: SCREENS.SUMMARY },
  [SCREENS.PAUSED]: {
    RESUME: SCREENS.PLAYING,
    OPEN_CONTROLS: SCREENS.CONTROLS,
    RESTART: SCREENS.PLAYING,
    QUIT: SCREENS.TITLE,
  },
  [SCREENS.SUMMARY]: { CONTINUE: SCREENS.TITLE, RETRY: SCREENS.PLAYING },
};

export function createScreenMachine(initial = SCREENS.TITLE) {
  let current = initial;
  let controlsReturn = SCREENS.TITLE; // where BACK from controls should land
  const subscribers = new Set();

  function can(event) {
    return Boolean(TRANSITIONS[current] && event in TRANSITIONS[current]);
  }

  function send(event) {
    if (!can(event)) return current; // invalid event: no-op

    // Remember where we opened controls from, so BACK returns there.
    if (event === 'OPEN_CONTROLS') controlsReturn = current;

    let target = TRANSITIONS[current][event];
    if (target === '@back') target = controlsReturn;

    current = target;
    for (const fn of subscribers) fn(current);
    return current;
  }

  return {
    get state() {
      return current;
    },
    can,
    send,
    /** Register a listener called with the new screen on every change. */
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
