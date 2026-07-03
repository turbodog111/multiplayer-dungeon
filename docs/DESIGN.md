# The Sundering Spire - Living Design Plan

## Status

This document combines the initial Codex plan with the Mythos/Fable planning spec from `docs/superpowers/specs/2026-07-03-multiplayer-dungeon-design.md`. The original documents remain in the repo as source notes. This file is the working design anchor for gameplay, art, prototype scope, and collaboration.

## High Concept

*The Sundering Spire* is a two-player online co-op dungeon crawler, logic puzzle game, and action combat game with 16-bit SNES-inspired top-down graphics.

Two bound heroes climb a tower where time has broken. One hero belongs to light and the present; the other belongs to shadow and the past. Every floor mixes exploration, combat, and puzzle logic into a single gauntlet. Players should never feel like they are doing identical jobs side by side. They are solving the same crisis from different truths.

## Design Pillars

### Two Complete But Incomplete Heroes

The game is designed for exactly two players. Each hero must feel complete enough to play moment to moment, but incomplete enough that the other hero is necessary for progress.

Asymmetry comes from:

- different abilities
- different information
- different interaction rules
- different combat roles
- different timeline or dimension access
- different responsibilities during enemy takedowns

### Combat And Puzzles Are One Loop

Combat is a major pillar. Puzzles do not pause the game, and enemies are not filler between puzzle rooms. The best encounters should make combat part of the puzzle and make puzzle progress part of the fight.

Examples:

- enemies drawn toward Sela's light beam during a mirror puzzle
- Kade phasing through an Echo layer while Sela defends his present body
- a sentry that can only be defeated through a co-op takedown sequence
- a broken bridge that becomes useful only after a combat encounter creates a rewind target

### The Tower Escalates

The tower structure gives the campaign a clean long-form shape.

- Each floor is a focused gauntlet.
- Every few floors introduce or combine major mechanics.
- Boss floors act as exams for the mechanics learned so far.
- Optional side rooms hide upgrades and secrets.
- Later floors can introduce a rising threat timer or collapsing-tower pressure.

### 16-Bit Readability With Modern Lighting

The target visual style is top-down SNES-era dungeon adventure: readable silhouettes, strong tile shapes, limited but expressive animation, moody palettes, and compact HUD elements.

The modern twist is that lighting is both presentation and gameplay. Sela's torch, Kade's shadows, and the Echo layer must be readable and beautiful without hiding important action.

## Heroes

### Sela, The Lumen

Sela is the light and present hero. Her signature identity is amber.

Core powers:

- Torchbearer: projects light in a cone to reveal hidden runes, invisible platforms, lurking enemies, and room clues.
- Anchor: plants a light beacon that freezes a mechanism in place.
- Beam-weaving: bends light through mirrors and prisms to power puzzle sensors.
- Light combat: uses quick close-range strikes, a light baton, flashes, and beam-based power moves.

Design role:

Sela sees what the tower hides. She makes the room legible, controls light as a resource, and creates the conditions that let Kade move safely.

### Kade, The Echo

Kade is the shadow and past hero. His signature identity is violet.

Core powers:

- Rewind: reverts a single object a few seconds, restoring broken bridges, fallen pillars, reset traps, or shattered dials.
- Phase: steps into the Echo layer, seeing the room as it existed in the past.
- Shadow-step: teleports between shadows not touched by Sela's light.
- Echo combat: uses heavier sweeping strikes, grabs, shadow lunges, and phase strikes.

Design role:

Kade reaches what Sela cannot. He manipulates time, travels through alternate room states, and turns darkness into mobility.

## Combat Model

Combat has three layers.

### Normal Moves

Each hero has basic attacks, movement, dodges, and positioning tools. These are used to survive, chip damage, and create openings.

Sela should feel fast, bright, precise, and close-range. Kade should feel heavier, stranger, and more mobile through shadow.

### Power Moves

Power moves are cooldown or resource-based abilities tied to each hero's identity.

Sela uses light flashes, beam strikes, torch reveals, and anchors. Kade uses rewind, phase strikes, grabs, and shadow movement.

### Co-op Takedown Chains

Important enemies require prompted two-hero takedown sequences. Each enemy type has its own dance.

Example: Stone Sentry

1. Kade shadow-lunges and locks the sentry's arms.
2. Sela lands a timed light stun.
3. Kade finishes by kicking it into a wall or hazard.

This makes enemies into combat puzzles. Learning the bestiary means learning how each monster must be opened, controlled, and finished.

## Puzzle Model

Puzzle trials should grant real upgrades and campaign progress. They should involve logic, communication, timing, combat pressure, and role-specific abilities.

Prototype puzzle targets:

- Blind Beacon: Sela reveals invisible platforms so Kade can cross.
- Mirror Relay: Sela routes a beam while Kade rotates mirrors and protects the path.
- Rewind Lock: Kade restores a broken clue while Sela reveals the symbols.
- Shadow Ladder: Sela paints a route with darkness so Kade can shadow-step.
- Two-Time Bridge: Kade crosses an Echo-layer bridge while Sela protects his present body.

## Campaign Structure

The current campaign shape is 12 to 15 tower floors across 3 acts with 4 major bosses.

Act 1: the tower teaches light, visibility, basic takedowns, and early beam puzzles.

Act 2: time and Echo-layer mechanics become central. Floors split players more often.

Act 3: floors combine light, shadow, rewind, phasing, combat chains, and time pressure.

Finale: the players confront the Unwound and make a shared final decision.

## Story Frame

The world of Vantia was held in balance by the Spindle, a tower where time itself is wound. The Lumen order guarded light and the present. The Echo order guarded memory and the past.

The Unwound shattered the Spindle to stop time and escape grief. Now the tower is eternally collapsing, and the world outside is forgetting itself.

Sela and Kade are the last bound keepers. They climb the tower because neither light nor shadow can repair time alone.

## Art Direction

### Sprite Goals

Hero sprites should begin as concept sheets, then be cleaned into exact production atlases.

First production target for each hero:

- facing down idle and walk
- facing left idle and walk
- facing right idle and walk
- facing up idle and walk
- one normal attack per direction
- one power pose per direction
- hurt and downed frames

Initial frame size target: 32x32 or 48x48 after testing readability in the canvas prototype.

### Tile Goals

The first floor needs:

- stone floor
- tower walls
- dark pits
- stairs
- mirror or prism objects
- light sensors
- sealed gates
- Echo-layer platforms
- enemy telegraph markers

### Palette Goals

Sela is warm amber and gold. Kade is violet and cool gray. The tower base should use stone, teal shadows, deep blue darkness, and small warm highlights. Color should support identity but must not be the only gameplay signal.

## Technical Direction

### Long-Term Target

The recommended long-term architecture is vanilla JavaScript, Canvas, and an authoritative Node WebSocket server.

Reasons:

- browser-first and easy to share
- good match for a custom pixel-art engine
- server authority keeps puzzle and combat state synchronized
- room-code joining supports two-player co-op without accounts
- modular enough for two developers and multiple AI agents

### Current GitHub Pages Prototype

GitHub Pages can host only static files from this repository. It cannot run the future authoritative WebSocket server.

Therefore the first Pages build is a local browser prototype:

- single browser
- same-keyboard two-hero testing
- Canvas rendering
- mocked combat and puzzle interactions
- no real networking yet

This is still valuable because it lets everyone test the look, controls, camera, light readability, and first gameplay loop before the online server exists.

## First Playable Slice

The first real vertical slice should prove:

- two heroes in one tower floor
- Sela's light cone
- Kade's shadow or Echo mobility
- one enemy with a co-op takedown
- one light or mirror puzzle
- one gate or stairwell objective
- a mood that already feels like *The Sundering Spire*

## Collaboration Workflow

`main` should stay runnable. Work should happen on feature branches once the repo is beyond bootstrap.

Recommended ownership boundaries:

- graphics, renderer, lighting, and sprite pipeline
- combat, enemy definitions, and takedown-chain engine
- puzzles and floor scripting
- networking and room synchronization
- story, UI, audio, and progression

Content should become data-driven as soon as practical. Floors, enemies, takedown chains, and puzzles should move toward JSON definitions so collaborators can add content without editing engine internals.

## Differences And Architectural Tensions To Resolve

### Static Pages Demo Versus Online Co-op Architecture

Claude's plan correctly recommends a Node WebSocket server for the real online co-op game. GitHub Pages cannot host that server. The current Pages build should be treated as a local test harness, not the final multiplayer architecture.

Resolution: keep the Pages prototype static for fast testing, then add a separate server package when online co-op work begins.

### Broad Dungeon Premise Versus Fixed Tower Structure

The initial Codex plan left the campaign open as a broader dungeon crawler with layered worlds. Claude's plan commits to an ascending tower, the Spindle, and floor-based progression.

Resolution: adopt the tower as the campaign structure because it gives clearer escalation, bosses, and deployment-friendly prototype scope.

### Warden/Seer Role Sketches Versus Sela/Kade Characters

The initial Codex plan used provisional Warden and Seer roles. Claude's plan names the actual heroes Sela and Kade, with stronger light/present and shadow/past identities.

Resolution: Sela and Kade replace Warden and Seer as the primary heroes. The old role language remains useful as design DNA: Sela inherits the Seer's hidden-truth role; Kade inherits some of the Warden's tactical control through grabs, strikes, and object manipulation.

### General Layered Worlds Versus Past/Present Mechanics

The initial plan listed many possible layers: spirit world, hidden logic layer, dream world, and past/future. Claude's plan chooses present and Echo-past as the core.

Resolution: lock present and Echo-past for MVP. Save spirit, dream, or logic-layer variants for later floors only if they support the Spindle story.

### Combat Pressure Versus Choreographed Takedowns

The initial plan emphasized combat as pressure around puzzles. Claude's plan makes co-op takedown chains the signature combat mechanic.

Resolution: use both. Normal combat creates pressure and openings; takedown chains are the memorable enemy-specific finishers.

### Concept Sprite Charts Versus Engine-Ready Atlases

Image generation can quickly explore Sela and Kade's look, but generated sheets are not automatically production-ready because frame spacing, proportions, transparency, and pose consistency need cleanup.

Resolution: use generated sheets for visual direction, then redraw or extract exact 32x32/48x48 frames into production atlases later.

### Direct Pushes Versus Feature Branch Workflow

Early bootstrap work has gone directly to `main` to get the repo and Pages prototype alive. The collaboration plan recommends branches and pull requests once active development begins.

Resolution: after this Pages bootstrap, use feature branches for larger changes, especially combat, networking, and renderer rewrites.
