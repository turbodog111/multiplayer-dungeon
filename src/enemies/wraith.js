// Wraith — an Echo-layer skirmisher. Tier 2.
//
// Exists only in the past (echo layer): intangible to Sela, so she can't damage
// it — she can only PIN it with light. Kade must phase in to land the killing
// blows. Fast and fragile, but deadly if ignored. See design doc §3, §5.

export const wraith = {
  id: 'wraith',
  name: 'Wraith',
  archetype: 'skirmisher',
  layer: 'echo',
  tier: 2,
  description:
    'A tatter of someone the tower forgot. It flickers at the edge of the present, ' +
    'untouchable until Sela\'s light nails its shadow down — then Kade, phased into ' +
    'the past, can cut it apart.',
  telegraph: 'Flickers out of sight, then lunges from the nearest patch of dark.',
  stats: {
    maxHealth: 35, // fragile...
    defense: 0,
    contactDamage: 4,
    attackDamage: 14, // ...but hits hard and fast
    moveSpeed: 1.3,
    staggerThreshold: 25, // opens quickly once pinned
    staggerDurationMs: 2000,
  },
  scoreValue: 150,
  takedown: [
    { hero: 'sela', move: 'sela_sunbeam', prompt: 'PIN', hint: 'Nail its shadow with the beam.' },
    { hero: 'kade', move: 'kade_phasestrike', prompt: 'STRIKE', hint: 'Phase in — only you can hit it.' },
  ],
};

export default wraith;
