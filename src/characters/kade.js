// Kade, the Echo — the shadow / past hero.
//
// Data-only definition (validated by ../characters/validate.js). Kade moves and
// manipulates time. In combat he's the finisher: slower and tankier than Sela,
// hits HARD through the openings she makes. Combat math is in ./combat.js.
// See design doc §2.
//
// Balance sketch: heavy finisher. High HP + high defense, low speed, crits
// RARELY (10%) but for a brutal x2.25. Slower stamina and revive than Sela.

export const kade = {
  id: 'kade',
  name: 'Kade',
  title: 'the Echo',

  element: 'shadow',
  timeAffinity: 'past',
  signatureHue: '#7b5cff', // cool violet — identity only, not a combat rule
  pronouns: 'he/him',

  stats: {
    maxHealth: 115, // tankier than Sela
    defense: 6, // shrugs off more per hit
    moveSpeed: 0.9, // slower than Sela
    critChance: 0.1, // crits rarely...
    critMultiplier: 2.25, // ...but hits like a truck
    maxStamina: 95, // smaller pool
    staminaRegen: 16, // per second — recovers slowly
    attackSpeed: 0.9, // windup multiplier — swings heavy and slow
    reviveTimeMs: 3500, // slower to revive than Sela
  },

  traits: {
    summary:
      'The last keeper of memory. Kade carries the weight of everything the tower ' +
      'used to be, and it makes him careful, quiet, and hard to rattle. He does the ' +
      'reaching, the rewinding, and the killing blow — but only ever through the ' +
      'openings Sela makes. Left alone in the dark, he is nearly helpless, and he ' +
      'knows it. That is why he stays.',
    voice:
      'Low, dry, and sparing with words. Speaks in the past tense and in memory ' +
      'metaphors (echo, ash, rewind, what-was). Deadpan humor. Rarely raises his ' +
      'voice — when he does, it matters.',
    combatRole:
      'Follow-up & finish. Waits for Sela\'s stun or pin, then phases in and lands ' +
      'the heavy, decisive strikes that actually put enemies down.',
    personality: ['quiet', 'patient', 'wry', 'haunted', 'loyal', 'cautious'],
  },

  abilities: [
    {
      id: 'rewind',
      name: 'Rewind',
      description:
        'Reverts a single object a few seconds — re-raising a fallen pillar, un-breaking ' +
        'a bridge, resetting a sprung trap. Timing-critical: past and present states differ.',
      cooldownMs: 7000,
    },
    {
      id: 'phase',
      name: 'Phase',
      description:
        'Steps into the Echo layer — the room as it was in the past. He can walk through ' +
        'walls that are rubble now but stood then, and vice versa. Draining to hold.',
      cooldownMs: 9000,
    },
    {
      id: 'shadowstep',
      name: 'Shadow-step',
      description:
        'Teleports between two shadows Sela\'s light does not touch. Where she shines ' +
        'decides where he can go — the two powers are chained together.',
      cooldownMs: 5000,
    },
  ],

  // Heavier, slower normals than Sela; specials hit hard for the finish. Shares
  // NO move ids with Sela.
  moves: [
    {
      id: 'kade_backhand', name: 'Ash Backhand', type: 'normal', kind: 'punch',
      damage: 6, staggerDamage: 5, critEligible: true, windupMs: 220, cooldownMs: 0, staminaCost: 12,
      description: 'A heavy backhand that lands harder than Sela\'s jab but swings slower.',
    },
    {
      id: 'kade_sweep', name: 'Shadow Sweep', type: 'normal', kind: 'kick',
      damage: 8, staggerDamage: 10, critEligible: true, windupMs: 360, cooldownMs: 1100, staminaCost: 20,
      description: 'A low sweeping kick that trips grounded enemies and knocks them prone.',
    },
    {
      id: 'kade_grab', name: 'Echo Grab', type: 'normal', kind: 'grab',
      damage: 2, staggerDamage: 15, critEligible: false, windupMs: 250, cooldownMs: 1500, staminaCost: 14,
      description: 'Seizes and holds an enemy in place — the setup half of many takedown chains.',
    },
    {
      id: 'kade_phasestrike', name: 'Phase-Strike', type: 'special', kind: 'power', ability: 'phase',
      damage: 14, staggerDamage: 12, critEligible: true, windupMs: 350, cooldownMs: 6000, staminaCost: 0,
      description: 'Phases behind a stunned enemy and lands the heavy hit only he can — the answer to Light-Flash.',
    },
    {
      id: 'kade_rewind_gambit', name: 'Rewind Gambit', type: 'special', kind: 'power', ability: 'rewind',
      damage: 11, staggerDamage: 8, critEligible: true, windupMs: 600, cooldownMs: 7000, staminaCost: 0,
      description: 'Rewinds an enemy\'s own broken weapon back into place, then turns it against them.',
    },
    {
      id: 'kade_shadow_lunge', name: 'Shadow Lunge', type: 'special', kind: 'power', ability: 'shadowstep',
      damage: 7, staggerDamage: 6, critEligible: true, windupMs: 200, cooldownMs: 5000, staminaCost: 0,
      description: 'Steps out of a shadow Sela has cast and strikes from the blind side. Repositions and damages.',
    },
  ],

  sayings: {
    idle: ['Higher we go, worse it remembers.', 'I\'ve got your back. Watch my dark.', 'Something up there was alive, once.'],
    attack: ['Down you go.', 'I remember how this ends.', 'Hold still.'],
    callForHelp: ['Sela — I can\'t see it. Light it up.', 'Blind here. Give me something.', 'Your light, now — or I lose it.'],
    takedownAssist: ['Got it held. Do your part.', 'Pinned. Finish, or I will.', 'It\'s not going anywhere. Go.'],
    hurt: ['Felt that. In both times.', 'Still here. Barely.', 'That\'ll leave an echo.'],
    victory: ['One less thing to remember.', 'It\'s over. For now.', 'Quiet again. Good.'],
    revived: ['You reached back and pulled. Thank you.', 'Not my time. Not yet.'],
    lowHealth: ['I\'m fading — don\'t lose me in the dark.', 'One more hit and I\'m an echo myself.'],
    critLanded: ['That one landed in both times.', 'Stay down.'],
  },
};

export default kade;
