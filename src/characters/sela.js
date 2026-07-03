// Sela, the Lumen — the light / present hero.
//
// Data-only definition (validated by ../characters/validate.js). Sela sees and
// reveals: she is slower and light-bound, but nothing hidden stays hidden once
// she shines. In combat she opens enemies up for Kade and lands bright,
// close-range finishers. See the design doc, section 2.

export const sela = {
  id: 'sela',
  name: 'Sela',
  title: 'the Lumen',

  element: 'light',
  timeAffinity: 'present',
  signatureHue: '#f5b942', // warm amber — identity only, not a combat rule
  pronouns: 'she/her',

  traits: {
    summary:
      'The last keeper of the light. Sela anchors the pair in the here-and-now: ' +
      'quick to act, quick to reassure, and the only one who can force the dark ' +
      'to give up what it hides. Where Kade broods on what was, Sela pushes toward ' +
      'what is — sometimes faster than is wise.',
    voice:
      'Warm, bright, and encouraging. Speaks in the present tense and in light ' +
      'metaphors (spark, glow, dawn, kindling). Cracks a quick joke to steady her ' +
      'partner, then gets decisive when it counts.',
    combatRole:
      'Reveal & set-up. Lights hidden threats, stuns and staggers to open the ' +
      'window for Kade, then follows up with fast close-range strikes.',
    personality: [
      'warm',
      'decisive',
      'protective',
      'optimistic',
      'impatient',
      'quick-witted',
    ],
  },

  // Unique powers (see design doc §2). Special moves below draw on these.
  abilities: [
    {
      id: 'torchbearer',
      name: 'Torchbearer',
      description:
        'Projects a cone of light that reveals hidden runes, invisible platforms, ' +
        'and lurking enemies. Darkness hides threats from both players until she lights them.',
      cooldownMs: 0, // sustained/held, not a cooldown power
    },
    {
      id: 'anchor',
      name: 'Anchor',
      description:
        'Plants a standing light-beacon that freezes a mechanism in place — holding ' +
        'a gate open or stopping a rotating room — while she moves away.',
      cooldownMs: 8000,
    },
    {
      id: 'beamweave',
      name: 'Beam-weaving',
      description:
        'Bends a beam of light off mirrors and prisms to strike distant switches or ' +
        'enemies. Kade must keep the beam-path clear while she routes it.',
      cooldownMs: 6000,
    },
  ],

  // Moves: grounded normals for brawling + opening enemies up, plus power specials.
  // Kade shares NONE of these ids — the two heroes fight with different moves.
  moves: [
    {
      id: 'sela_jab',
      name: 'Sunlit Jab',
      type: 'normal',
      kind: 'punch',
      damage: 4,
      windupMs: 120,
      description: 'A fast, bright one-two to the face. Cheap and spammable to chip health.',
    },
    {
      id: 'sela_spinkick',
      name: 'Solar Spin-Kick',
      type: 'normal',
      kind: 'kick',
      damage: 7,
      windupMs: 300,
      description: 'A wheeling kick that knocks a lone enemy back and buys space.',
    },
    {
      id: 'sela_dash',
      name: 'Radiant Dash',
      type: 'normal',
      kind: 'dodge',
      damage: 0,
      windupMs: 0,
      description: 'A short burst of speed through and past an enemy — her main way to reposition.',
    },
    {
      id: 'sela_flash',
      name: 'Light-Flash',
      type: 'special',
      kind: 'power',
      ability: 'torchbearer',
      damage: 3,
      cooldownMs: 4000,
      staggers: true,
      description:
        'A blinding burst that stuns enemies in front of her — the classic "open the window" ' +
        'move that sets up Kade\'s takedown strike.',
    },
    {
      id: 'sela_sunbeam',
      name: 'Sunbeam',
      type: 'special',
      kind: 'power',
      ability: 'beamweave',
      damage: 12,
      cooldownMs: 6000,
      description:
        'A focused lance of light, bounced off prisms to hit a switch or a foe Kade has pinned.',
    },
    {
      id: 'sela_beacon_slam',
      name: 'Beacon Slam',
      type: 'special',
      kind: 'power',
      ability: 'anchor',
      damage: 9,
      cooldownMs: 8000,
      staggers: true,
      description:
        'Drives a light-beacon into the ground, pinning a staggered enemy in place for the finisher.',
    },
  ],

  // Barks / dialogue. Every REQUIRED category must be present and non-empty.
  sayings: {
    idle: [
      'Stay close. The dark moves when we don\'t.',
      'I\'ve got light for both of us.',
      'Whatever\'s up there, we walk into it together.',
    ],
    attack: [
      'Rise and shine!',
      'Eyes open — hit them!',
      'Into the light with you.',
    ],
    callForHelp: [
      'Kade — I\'ve got it pinned, hit it NOW!',
      'Window\'s open, don\'t waste it!',
      'I can\'t finish this one — your move!',
    ],
    takedownAssist: [
      'Holding it steady — go!',
      'It\'s blind! Strike!',
      'Now, Kade — while it can\'t see!',
    ],
    hurt: [
      'Ngh — that one had teeth.',
      'I\'m still lit, I\'m still standing.',
      'Don\'t you dare put my light out.',
    ],
    victory: [
      'And the dark blinks first.',
      'Told you. Together.',
      'One more floor closer to dawn.',
    ],
    // Extra, non-required flavor categories (validator ignores unknown keys):
    revived: [
      'You pulled me back. I owe you one.',
      'Not done yet. Not by a long shot.',
    ],
    lowHealth: [
      'My light\'s guttering — cover me!',
      'I can\'t take another like that.',
    ],
  },
};

export default sela;
