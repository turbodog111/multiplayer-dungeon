import test from 'node:test';
import assert from 'node:assert/strict';

import { validateCharacter } from '../src/characters/validate.js';
import { CHARACTERS, getCharacter, listCharacters } from '../src/characters/index.js';
import { sela } from '../src/characters/sela.js';
import { kade } from '../src/characters/kade.js';

test('Sela is a valid character definition', () => {
  const result = validateCharacter(sela);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test('Kade is a valid character definition', () => {
  const result = validateCharacter(kade);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test('Sela is the light / present hero', () => {
  assert.equal(sela.id, 'sela');
  assert.equal(sela.element, 'light');
  assert.equal(sela.timeAffinity, 'present');
});

test('Kade is the shadow / past hero', () => {
  assert.equal(kade.id, 'kade');
  assert.equal(kade.element, 'shadow');
  assert.equal(kade.timeAffinity, 'past');
});

test('each hero has grounded normal moves plus power specials', () => {
  for (const hero of [sela, kade]) {
    assert.ok(
      hero.moves.some((m) => m.type === 'normal' && m.kind === 'punch'),
      `${hero.id} should have a punch`,
    );
    assert.ok(
      hero.moves.some((m) => m.type === 'normal' && m.kind === 'kick'),
      `${hero.id} should have a kick`,
    );
    assert.ok(
      hero.moves.some((m) => m.type === 'special'),
      `${hero.id} should have a special`,
    );
  }
});

test('the two heroes have entirely separate movesets (no shared move ids)', () => {
  const selaIds = new Set(sela.moves.map((m) => m.id));
  const shared = kade.moves.filter((m) => selaIds.has(m.id));
  assert.deepEqual(shared, [], 'Sela and Kade must not share move ids');
});

test('every special move is wired to one of the hero\'s own abilities', () => {
  for (const hero of [sela, kade]) {
    const abilityIds = new Set(hero.abilities.map((a) => a.id));
    for (const special of hero.moves.filter((m) => m.type === 'special')) {
      assert.ok(
        abilityIds.has(special.ability),
        `${hero.id} special ${special.id} must reference an owned ability`,
      );
    }
  }
});

test('the registry exposes both heroes by id', () => {
  assert.equal(getCharacter('sela'), sela);
  assert.equal(getCharacter('kade'), kade);
  assert.equal(getCharacter('nobody'), undefined);
  assert.deepEqual(listCharacters().map((c) => c.id).sort(), ['kade', 'sela']);
  assert.equal(CHARACTERS.sela, sela);
});
