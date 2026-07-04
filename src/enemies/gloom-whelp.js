// Gloom Whelp — the basic grunt. Present-layer, tier 1.
//
// Weak, low-armour fodder that the early floors throw at you in packs. Its low
// defense means even chip attacks land, so it's the enemy that teaches players
// their moves actually connect. See design doc §5.

export const gloomWhelp = {
  id: 'gloom_whelp',
  name: 'Gloom Whelp',
  archetype: 'grunt',
  layer: 'present',
  tier: 1,
  description:
    'A knee-high scrap of living dark that skitters at your ankles. Barely armoured ' +
    'and easily put down — but it never comes alone.',
  telegraph: 'Hunches, then pounces with a quick bite.',
  stats: {
    maxHealth: 30,
    defense: 1, // low — every attack visibly connects
    contactDamage: 3,
    attackDamage: 6,
    moveSpeed: 1.0,
    staggerThreshold: 22,
    staggerDurationMs: 1800,
  },
  scoreValue: 60,
  takedown: [
    { hero: 'sela', move: 'sela_flash', prompt: 'STUN', hint: 'Flash it.' },
    { hero: 'kade', move: 'kade_phasestrike', prompt: 'FINISH', hint: 'Put it down.' },
  ],
};

export default gloomWhelp;
