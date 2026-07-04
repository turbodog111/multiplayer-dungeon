# The Sundering Spire

A two-player asymmetric dungeon crawler / puzzle combat prototype.

Playable GitHub Pages build:

https://turbodog111.github.io/multiplayer-dungeon/

## Current Prototype

The current Pages build is a same-keyboard real-time combat test harness. It merges the playable room from PR #4 with the first Sela Torch Guardian draft art: Sela now draws from the generated movement, combat, and Light-Flash sheets while Kade and enemies still use readable placeholder shapes.

This build proves the browser renderer, the room loop, movement, stamina, enemy chasing, damage, stagger openings, floor waves, scoring, pause/summary screens, and a first runtime sprite pipeline before the online WebSocket server exists.

## Run Locally

```sh
npm start
```

Then open http://localhost:5173.

## Prototype Controls

Sela:

- Move: `WASD`
- Jab: `J`
- Spin kick: `K`
- Light-Flash: `U`

Kade:

- Move: arrow keys
- Backhand: `,`
- Sweep: `.`
- Phase-Strike: `/`

Prototype objective: survive the room, clear enemy waves, open stagger windows, and push the score as high as you can with both heroes alive.

Design docs:

- `docs/DESIGN.md` - combined living design plan
- `docs/INITIAL_GAME_PLAN.md` - initial Codex planning pass
- `docs/superpowers/specs/2026-07-03-multiplayer-dungeon-design.md` - Mythos/Fable planning pass

Art docs:

- `assets/sprites/heroes/sela/SPRITE_PLAN.md` - Sela sheet breakdown and cleanup targets
- `assets/sprites/heroes/sela/sela-draft.animations.json` - draft hero animation manifest
- `assets/sprites/effects/sela/sela-effects-draft.animations.json` - draft light/effect manifest
