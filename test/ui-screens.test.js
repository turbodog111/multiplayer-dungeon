import test from 'node:test';
import assert from 'node:assert/strict';

import { createScreenMachine, SCREENS } from '../src/ui/screens.js';

test('a new machine starts on the title screen', () => {
  const m = createScreenMachine();
  assert.equal(m.state, SCREENS.TITLE);
});

test('Play starts the game', () => {
  const m = createScreenMachine();
  assert.equal(m.send('PLAY'), SCREENS.PLAYING);
  assert.equal(m.state, SCREENS.PLAYING);
});

test('controls opened from the title returns to the title', () => {
  const m = createScreenMachine();
  m.send('OPEN_CONTROLS');
  assert.equal(m.state, SCREENS.CONTROLS);
  assert.equal(m.send('BACK'), SCREENS.TITLE);
});

test('pausing and resuming a game', () => {
  const m = createScreenMachine();
  m.send('PLAY');
  assert.equal(m.send('PAUSE'), SCREENS.PAUSED);
  assert.equal(m.send('RESUME'), SCREENS.PLAYING);
});

test('controls opened from the pause menu returns to the pause menu', () => {
  const m = createScreenMachine();
  m.send('PLAY');
  m.send('PAUSE');
  m.send('OPEN_CONTROLS');
  assert.equal(m.state, SCREENS.CONTROLS);
  assert.equal(m.send('BACK'), SCREENS.PAUSED); // remembers where it came from
});

test('quitting from the pause menu returns to the title', () => {
  const m = createScreenMachine();
  m.send('PLAY');
  m.send('PAUSE');
  assert.equal(m.send('QUIT'), SCREENS.TITLE);
});

test('a game can end and be retried', () => {
  const m = createScreenMachine();
  m.send('PLAY');
  assert.equal(m.send('GAME_OVER'), SCREENS.SUMMARY);
  assert.equal(m.send('RETRY'), SCREENS.PLAYING);
});

test('an event that is invalid for the current screen is a no-op', () => {
  const m = createScreenMachine();
  assert.equal(m.send('RESUME'), SCREENS.TITLE); // RESUME means nothing on the title
  assert.equal(m.state, SCREENS.TITLE);
});

test('can() reports whether an event is valid on the current screen', () => {
  const m = createScreenMachine();
  assert.equal(m.can('PLAY'), true);
  assert.equal(m.can('RESUME'), false);
  m.send('PLAY');
  assert.equal(m.can('PAUSE'), true);
  assert.equal(m.can('PLAY'), false);
});

test('subscribers are notified on every state change', () => {
  const m = createScreenMachine();
  const seen = [];
  m.subscribe((s) => seen.push(s));
  m.send('PLAY');
  m.send('PAUSE');
  assert.deepEqual(seen, [SCREENS.PLAYING, SCREENS.PAUSED]);
});
