// Bramble Hulk — a present-layer heavy. Tier 3.
//
// A thorn-wound giant with a huge health pool and a wooden pillar-arm. The
// takedown is a puzzle: Kade rewinds its own smashed arm back into a raised
// position, Sela lures the swing, it shatters its arm on the wall, then Kade
// sweeps it down. See design doc §3, §5.

export const brambleHulk = {
  id: 'bramble_hulk',
  name: 'Bramble Hulk',
  archetype: 'brute',
  layer: 'present',
  tier: 3,
  description:
    'A slab of muscle and thornwood the tower grew to guard its stairs. Enormous ' +
    'health, a devastating pillar-arm, and no interest in fighting fair — so you ' +
    'turn its own arm against it.',
  telegraph: 'Winds its pillar-arm far back — a huge, slow horizontal sweep is coming.',
  stats: {
    maxHealth: 120, // a real wall of HP
    defense: 5,
    contactDamage: 10,
    attackDamage: 20, // its sweep hurts
    moveSpeed: 0.6,
    staggerThreshold: 55, // takes real setup to open
    staggerDurationMs: 3000,
  },
  scoreValue: 300,
  takedown: [
    { hero: 'kade', move: 'kade_rewind_gambit', prompt: 'REWIND ARM', hint: 'Raise its broken arm back up.' },
    { hero: 'sela', move: 'sela_sunbeam', prompt: 'LURE', hint: 'Bait the swing into the wall.' },
    { hero: 'kade', move: 'kade_sweep', prompt: 'FINISH', hint: 'Sweep the staggered giant down.' },
  ],
};

export default brambleHulk;
