# Multiplayer Dungeon — Planning Doc

**Working title:** *The Sundering Spire* (alt: *Two Torches*, *Echoes of the Keep*)
**Date:** 2026-07-03
**Type:** Two-player online co-op — dungeon / logic / puzzle / action, 16-bit SNES retro
**Repo:** [github.com/turbodog111/multiplayer-dungeon](https://github.com/turbodog111/multiplayer-dungeon) (collaborating with a friend; you have write access)
**Status:** Ideation / planning (not yet a build spec)

---

## 1. Vision & Pillars

A two-player **online co-op** dungeon-crawler built as a vertical **tower** you ascend together. Every floor blends **logic puzzles** and **co-op combat** into one continuous gauntlet — you don't "finish a puzzle then fight"; the puzzle *opens the fight* and the fight *feeds the next puzzle*. Neither player can win alone: the whole game is engineered so each hero is helpless in exactly the places the other is strong.

**Design pillars:**

1. **Two halves of one player.** Asymmetric powers mean each hero can *only* do certain things. Progress is impossible without genuine cooperation and communication.
2. **Combat is co-op choreography, not parallel.** Enemies aren't beaten by whoever swings enough — each one has a two-hero **takedown sequence**. The game prompts each player's move and when to call the partner in, so you're always doing *different* things together, not the same thing side by side. Every monster demands its own dance.
3. **The tower escalates.** Higher = harder. New mechanics layer in, enemies get meaner, and boss floors gate your ascent.
4. **Suspense & atmosphere.** 16-bit lighting, timeline shifts, and "what's on the next floor?" dread. The tower should feel alive and watching.
5. **Story that earns the climb.** An original narrative (see §7) gives the ascent stakes and a reason the two heroes are bound together.

---

## 2. The Two Heroes & Their Powers

The core of the design. Two attuned guardians, opposite in every way, forced to climb together.

### Hero A — **Sela, the Lumen** (Light / Present)
- **Signature hue: amber** (visual identity only — not a combat rule).
- **Torchbearer** — projects light in a cone; reveals hidden floor runes, invisible platforms, and lurking enemies. Darkness hides threats from *both* players until she lights them.
- **Anchor** — can plant a light-beacon that freezes a mechanism in place (hold a gate open, stop a rotating room) while she's away.
- **Beam-weaving** — light bends off mirrors/prisms; puzzles require her to route a beam while Kade keeps the path clear.

### Hero B — **Kade, the Echo** (Shadow / Past)
- **Signature hue: violet** (visual identity only — not a combat rule).
- **Rewind** — reverts a single object a few seconds (re-raise a fallen pillar, un-break a bridge, reset a trap). Timing-critical; the object's *present* and *past* states differ.
- **Phase** — steps into the **Echo layer** (the room as it was in the past). Can walk through walls that are rubble in the present but solid in the past — and vice versa.
- **Shadow-step** — short teleport between two shadows Sela's light *doesn't* touch. Directly couples the two players: where she shines determines where he can move.

**Why asymmetry works here:** Sela sees but is slow and light-bound; Kade moves and manipulates time but is blind in the dark and can't reveal anything himself. Every puzzle is a negotiation between what she can see and what he can reach.

---

## 3. The Co-op Takedown Combat System

The signature mechanic. You don't beat a monster by out-damaging it solo — you beat it by performing a **choreographed two-hero sequence**, where each hero contributes *different* moves and the game prompts who does what, when. Think tag-team wrestling finisher meets rhythm-timing, wrapped around each hero's unique powers.

### The three layers of a fight

**1. Normal moves (free, always available).** Each hero has grounded basics used to chip health, stagger, dodge, and create openings — and the two heroes' basics are *different*, fitting their style:
- **Sela** — fast, close jabs and a light-baton (quick punches, a spin-kick, a short dash).
- **Kade** — heavier, sweeping strikes (kicks, a grab, a shadow-lunge).

These aren't just filler — a lot of a fight is normal-move brawling to whittle an enemy down and set up the opening for a takedown.

**2. Power moves (cooldown specials, tied to §2 abilities).** Sela's light-flash/beam, Kade's rewind/phase-strike. Situational, and the *ingredients* the takedown chains are built from.

**3. Co-op takedown chains (the finisher).** Once an enemy is staggered/opened, a scripted two-hero sequence closes it out. Example against a **Stone Sentry**:
- Prompt on Kade's screen: **"GRAB!"** — he shadow-lunges and locks the Sentry's arms.
- Prompt fires on Sela's screen: **"HELP — Kade needs you! LIGHT-STUN now!"** — she flashes its eyes; it reels.
- Prompt on Kade: **"FINISH — kick!"** — he boots it into the wall. Down.

Each step has a **timing window** and only appears for the hero who must act, with a clear "**call for help**" signal pinging the partner. Miss the window and the enemy recovers — you reset and re-open it.

### Different moves for every monster

The chain is **unique per enemy type** — the sequence, the order, and which hero leads all change. Learning a monster *is* learning its takedown dance, which makes the bestiary a puzzle layer on top of the action:
- **Wraith** — Sela must *pin it with light* first (it's intangible to Kade in shadow), then Kade phases in to land the only blows that hurt it.
- **Bramble Hulk** — Kade rewinds its own smashed pillar-arm back into a raised position, Sela lures it to swing, it shatters its own arm, then both pile on.
- **Twin Stalkers** — two enemies that must be taken down in the *same* window; heroes split, each solos a normal-move opener, then trigger a synced finish.

So there's no universal combo — moves are separate, hero-specific, and power-driven, exactly as you wanted.

### Why it's genuinely co-op
Neither hero can complete a takedown alone — the chains *require* the partner's specific move at a specific moment. The prompts + call-for-help system means it plays great even without voice chat, and timing/coordination — not raw stats — is what wins fights.

---

## 4. Tower Structure

The dungeon is a **tower you climb**, floor by floor. Higher = harder.

- **Floors as levels.** Each floor is a self-contained gauntlet: a themed set of interlocking puzzle-combat rooms ending in a stairwell up. No backtracking down (adds pressure); optional side-rooms hide upgrades.
- **Escalation.** Early floors teach one mechanic cleanly (just light + color combat). Middle floors combine (beams + timeline phasing + split enemies). Top floors stack everything under time pressure.
- **Puzzles gate combat, combat gates puzzles.** Example floor flow: solve a beam-routing puzzle → it opens a chamber → an enemy wave cleared via co-op takedowns → the fight drops a rewind-able pillar → Kade rewinds it to bridge a gap → boss door.
- **Boss floors.** Every ~3–4 floors, a boss that weaponizes the floor's mechanic (see §5).
- **Checkpoints** at each floor's start; a wipe restarts the current floor, not the tower.
- **Rising threat:** an optional "the tower is collapsing behind you" timer on later floors for suspense — reach the stairs before the dark catches up.

**Suggested arc (draft):** 12–15 floors, 3 acts, 4 bosses. MVP proves 1 floor (see §8).

---

## 5. Puzzle & Boss Catalog

### Puzzle ideas (tagged by difficulty)
1. **Blind Beacon** *(easy)* — Kade must cross a dark pit of invisible platforms; only Sela's light reveals them. She can't cross (too slow, gaps too wide); he can't see. Pure trust puzzle.
2. **Mirror Relay** *(easy–med)* — Sela routes a light beam through prisms to a sensor while Kade physically rotates the prisms and holds off the enemies drawn to the light.
3. **Two-Time Bridge** *(med)* — A bridge is intact in the past, collapsed in the present. Kade phases to the past to walk it; while phased his present-body is defenseless, so Sela must fend off the guardians swarming it and time a takedown to buy him the crossing.
4. **Pressure Duet** *(med)* — Two plates must be held simultaneously, but they're on opposite ends and enemies keep spawning. Requires split-timing and color-correct defense.
5. **Rewind Lock** *(med)* — A sequence combination is shown only for a second before shattering; Kade rewinds the shattered dial to re-read it while Sela lights the room to expose the symbols.
6. **Shadow Ladder** *(med–hard)* — Kade shadow-steps upward through shadows that only exist where Sela *blocks* her own light against pillars — she paints his path with darkness.
7. **Echo Ambush** *(hard)* — Enemies exist only in the Echo layer, so only Kade's phased strikes reach them; but every second in the Echo drains him, and Sela must open present-side pressure gates to pull him out in time.
8. **Gauntlet Chain** *(hard)* — Three different enemies must be taken down back-to-back with no reset time between them, each needing its own co-op takedown sequence. A combat-combo memory test: you have to recall and execute three separate "dances" under pressure.
9. **Collapsing Clockwork** *(hard)* — A rotating floor puzzle where Sela anchors segments in place with beacons while Kade rewinds the ones that fell, building a path in real time under a timer.
10. **The Sundered Door** *(floor finale)* — Combines beam-routing, a color-split enemy wave, a rewind bridge, and a phase-crossing — a mini-exam of everything the floor taught.

Bosses are extended, multi-phase takedown choreographies: each phase teaches a new co-op sequence, and the fight escalates by demanding you chain them faster.
- **The Sentinel** *(Act 1)* — a colossal golem invulnerable while lit. Sela must *withhold* her light so Kade can find the seam in darkness and pry it open, then she blinds it for his finisher — inverting her usual "light everything" instinct. Teaches that powers can hurt as well as help.
- **The Echo Twin** *(Act 2)* — exists in both timelines at once, out of phase. Its two copies must be staggered within a shared window or it heals; Kade opens the past copy, Sela the present, then a synced takedown lands on both.
- **The Warden of Steps** *(Act 3)* — *changes its takedown sequence every phase*, so the prompts you learned stop working and you must read and execute a brand-new dance mid-fight under pressure. An adaptation-endurance test.
- **The Unwound** *(final)* — the antagonist (see §7); forces every mechanic in sequence — light, rewind, phase, and a full multi-step takedown chain — ending on a shared, timed final blow only both heroes can land together.

---

## 6. Retro Art & Audio Direction

- **Style:** 16-bit SNES, top-down (A Link to the Past era). Rich palette, moody lighting, detailed 32×32 tiles.
- **Lighting as a mechanic** — dynamic light/shadow is central (Sela's torch), so a real-time 2D lighting layer (radial gradients + shadow masks over the tilemap) is a first-class art *and* gameplay system.
- **Readable tells & prompts** — enemies telegraph their takedown windows with clear wind-up animations and flashes, and the co-op prompt UI (whose move, when, "call for help") is a first-class HUD element designed to work without voice chat. Accessibility: prompts use icons + text + audio cues, not color alone (colorblind-safe). Sela's warm/amber and Kade's cool/violet palettes are purely for hero identity, not a combat rule.
- **Timeline visual shift** — the Echo layer is a desaturated, cracked, "ghost" version of the room with a subtle scanline/chromatic wobble to sell "the past."
- **Sprites:** two hero sprite sheets (walk/attack/power per direction), a bestiary of ~8–10 enemy types × 2 colors, 4 bosses, tile sets per act (stone keep → clockwork → void-touched summit).
- **Audio:** SNES-style chiptune/orchestral hybrid; tense ascending motif that layers instruments as you climb. Distinct stingers for color-mismatch damage, rewind, and phase. Boss themes.
- **UI:** minimalist pixel HUD — two hearts bars, power-cooldown pips, current-color indicator, floor number.

---

## 7. Story (Original)

> *(Written fresh — deliberately avoids Tears of the Kingdom's plot, characters, and specific ideas. Shared DNA only in "quality of an epic co-op ascent.")*

**The world of Vantia** was kept in balance by the **Spindle** — a colossal tower at the world's heart where the machinery of *time itself* is wound. For an age, two orders tended it: the **Lumen**, keepers of the present and the light, and the **Echo**, keepers of memory and the past. Light and shadow, wound together, kept time flowing true.

Then came **the Unwound** — once the tower's greatest keeper, now a hollow thing that tried to *stop* time to escape a grief it could not outlive. It shattered the Spindle's mechanism, split the two orders, and froze the tower mid-collapse: a structure eternally falling and never landing, its floors scattered across warped slivers of past and present. The world outside began to *unwind* — days repeating, the dead half-returning, the sky cracking.

**Sela**, the last Lumen, and **Kade**, the last Echo, are strangers bound by the tower's dying magic: neither can leave, and neither can climb without the other. Light needs shadow to move; shadow needs light to see. They ascend the Spindle floor by floor to reach the summit and *rewind the Unwound's undoing* before Vantia forgets itself entirely.

As they climb, fragments of the past (Kade's domain) and glimpses of the present-outside (Sela's) reveal the Unwound's story — and a twist: the grief it fled was the loss of *its own* bound partner, generations ago. The heroes are climbing toward a mirror of what they'll become if the tower breaks them. The finale asks whether they repair the Spindle, free the Unwound, or find a third way — a choice the two players make *together* (a shared final decision, mechanically requiring both).

**Themes:** cooperation as survival, light and memory needing each other, grief and letting time move forward. Enough plot to motivate floors and bosses; light enough not to gate the action.

---

## 8. Tech Architecture

Online, two devices, so networking is the one real engineering decision. Comparing the three options as requested:

| Option | How it works | Pros | Cons | Best when |
|---|---|---|---|---|
| **A. Vanilla JS + Canvas + Node WebSocket server** *(recommended)* | HTML5 Canvas rendering (matches your Asteroids/Pac-Man stack); a small authoritative Node.js `ws` server holds game state and relays inputs. | Matches your existing toolset; authoritative server prevents desync/cheating; easy to reason about; simple hosting (Render/Fly/Railway free tiers). | You host & pay for a server; ~real-time sync needs care (interpolation). | You want control, simplicity, and consistency with your other repos. |
| **B. WebRTC peer-to-peer** | Browsers connect directly; a tiny signaling server only does the initial handshake, then P2P. | No game server to host/pay for; lowest latency; scales trivially (each pair is independent). | Harder to build/debug (ICE/NAT, connection drops); no authoritative referee (trust issues); still need a signaling server. | You want lowest cost/latency and are OK with more networking complexity. |
| **C. Phaser + Colyseus (or Socket.IO)** | Phaser handles rendering/physics/animation; Colyseus provides room-based authoritative multiplayer. | Batteries included — lighting, tilemaps, state sync mostly solved; fast to a polished feel. | Heavier deps than your usual vanilla approach; framework lock-in; more to learn. | You want to move fast and don't mind a bigger dependency footprint. |

**Recommendation:** **Option A** for the MVP. It matches your proven vanilla-Canvas workflow, gives an authoritative server (important because puzzle *and* combat state must stay in lock-step between two players), and keeps hosting cheap and simple. Revisit Phaser only if the real-time lighting + physics load proves painful in raw Canvas.

**Shared architecture regardless of choice:**
- **Room-code join flow** — Player 1 hosts, gets a 4–6 char code; Player 2 enters it. No accounts for MVP.
- **Authoritative state** (A/C) — server owns the tilemap, enemy positions/colors, puzzle states, and both heroes' positions; clients send inputs, render server snapshots with interpolation.
- **Deterministic sim** — tick-based (e.g. 20–30 Hz server tick) so the two clients never diverge on puzzle logic.
- **Reconnect grace** — if a player drops, pause the floor and hold the room open ~60s so they can rejoin (co-op is unplayable solo).
- **Latency handling** — client-side prediction for your own hero; interpolation for your partner and enemies.

---

## 9. MVP Scope & Roadmap

**Vertical slice first — prove the fun before building 15 floors.**

**Phase 0 — Connection spine**
- Two browsers join a room by code via the Node WS server; both see two hero sprites moving in a shared room, synced. *No gameplay yet — just proves netcode.*

**Phase 1 — One playable floor (the MVP)**
- One 16-bit floor with: Sela's torch + lighting, Kade's rewind, one enemy type with a full co-op takedown chain (normal moves + prompted two-hero finisher), and **two puzzles** (Blind Beacon + Mirror Relay) leading to a stairwell.
- Goal: a 5–10 minute slice that already feels like the real game.

**Phase 2 — Vertical depth**
- Add phasing/timeline mechanic + Echo layer, 3–4 more floors, more enemy types (each with its own takedown chain), the first boss (the Sentinel).

**Phase 3 — Full tower**
- Remaining floors, all 4 bosses, the story beats/cutscenes, audio pass, the collapsing-tower timer, and the shared final choice.

**Phase 4 — Polish & stretch (see §10).**

---

## 10. Open Questions & Stretch Ideas

**Open questions to resolve before/at build time:**
- Real-time action combat, or semi-turn/tick-based? (Affects netcode difficulty a lot.)
- How punishing is a wipe — restart floor, or lose a "life" resource across the tower run?
- Voice-chat assumed, or must the game provide in-game ping/callout tools for the asymmetric info? *(Strongly recommend built-in pings so it's playable without external voice.)*
- Session length target — one sitting (~30–45 min) or save-and-resume across floors?

**Stretch ideas:**
- **Level editor** — build & share custom floors (fits your browser-game portfolio nicely).
- **Procedural floors** — remixable room templates for replayability between hand-crafted boss floors.
- **Third character / 3-player** mode with a new color and power (big scope — post-1.0).
- **Spectator mode** — a third browser watches the run.
- **Cosmetic unlocks** — palette swaps for the heroes earned by clearing bosses.
- **Speedrun / no-hit modes** for the completionists.

---

## 11. Collaboration & Workflow

Two developers building different gameplay aspects in parallel. The architecture is deliberately modular so we rarely edit the same files at the same time.

**Systems as ownership boundaries** — each is a self-contained module behind a small interface, so two people can build simultaneously:
- **Netcode & server** — rooms, join-by-code, authoritative state, sync.
- **Rendering & lighting** — Canvas, tilemap, the dynamic light/shadow layer.
- **Combat** — normal moves, power moves, and the takedown-chain engine.
- **Puzzles** — mechanic scripts: beams, rewind, phasing, pressure plates.
- **Enemies & bosses** — AI plus each enemy's takedown-chain definition.
- **Level / tower** — floor layouts, progression, checkpoints.
- **Story / UI / audio** — HUD, prompts, cutscene beats, sound.

**Interfaces first.** Before building a system, agree on the tiny interface it exposes (e.g. combat exposes `startTakedown(enemyId)`; puzzles emit `onSolved(puzzleId)`; the tower listens for `onFloorCleared()`). Modules integrate through these, not by reaching into each other's internals.

**Data-driven content.** Enemies, takedown chains, puzzles, and floor layouts live in **data files (JSON)**, not hardcoded logic. Adding a monster or floor is a new data file — content work that almost never collides with engine code, so the two of you can add content freely without merge conflicts.

**Git workflow.** `main` always stays runnable. Work happens on **feature branches** named by system/task (`feat/combat-takedowns`, `feat/lighting`, `feat/netcode-rooms`), one concern per branch, merged via **pull request**. This gives a natural review point and keeps the two of you from clobbering each other's work. Claude will push its work the same way — feature branch + PR — unless told otherwise.

---

## Summary of Locked Decisions
- **Genre:** two-player online co-op dungeon/puzzle/action, ascending tower.
- **Co-op model:** asymmetric powers (Sela/Light/Present + Kade/Shadow/Past) — neither playable alone.
- **Combat:** co-op takedown choreography — each enemy has a prompted two-hero move sequence; heroes have *different* normal moves (punch/kick/dodge) plus power-based specials, unique per hero and per monster. No universal combo.
- **Structure:** tower of escalating floors, bosses every few floors, puzzles+combat integrated.
- **Timelines:** past/present phasing is a core mechanic and story engine, used for suspense.
- **Art:** 16-bit SNES, top-down, lighting-driven.
- **Story:** original — *The Sundering Spire*, two bound keepers repairing shattered time.
- **Tech:** recommend Vanilla JS + Canvas + Node WebSocket (options B/C documented).
- **First build target:** one-floor vertical slice.
