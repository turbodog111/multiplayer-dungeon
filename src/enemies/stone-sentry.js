// Stone Sentry — the tutorial brute. Present-layer, tier 1.
//
// A slow, armoured golem: high defense, low speed. Teaches the basic three-step
// takedown (Kade holds, Sela stuns, Kade finishes). See design doc §3, §5.

export const stoneSentry = {
  id: 'stone_sentry',
  name: 'Stone Sentry',
  archetype: 'brute',
  layer: 'present',
  tier: 1,
  description:
    'A hulking guardian of hewn stone. It hits hard but slowly, and its stone hide ' +
    'shrugs off chip damage — you have to open it up and finish it, not whittle it down.',
  telegraph: 'Raises both fists overhead before a slow, ground-cracking slam.',
  stats: {
    maxHealth: 60,
    defense: 8, // heavy armour — punishes chip damage, rewards takedowns
    contactDamage: 6,
    attackDamage: 12,
    moveSpeed: 0.7,
    staggerThreshold: 40, // matches the baseline; opens after a stun + a hit or two
    staggerDurationMs: 2500,
  },
  scoreValue: 100,
  takedown: [
    { hero: 'kade', move: 'kade_grab', prompt: 'GRAB', hint: 'Lock its arms.' },
    { hero: 'sela', move: 'sela_flash', prompt: 'LIGHT-STUN', hint: 'Blind it while it\'s held.' },
    { hero: 'kade', move: 'kade_phasestrike', prompt: 'FINISH', hint: 'Phase behind and drop it.' },
  ],
};

export default stoneSentry;
