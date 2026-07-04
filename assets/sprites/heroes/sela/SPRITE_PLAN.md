# Sela Sprite Sheet Plan

## Chosen Direction

Sela starts from the Torch Guardian concept:

- compact amber torch-guardian
- short amber mantle
- dark travel tunic
- bronze bracers
- sturdy boots
- small lantern-baton
- warm torch glow accents
- practical top-down SNES dungeon adventurer silhouette

## Frame Size Target

Draft target: 48x48 hero frames.

Final sheets should be cleaned into exact, evenly spaced frames before engine integration. The current draft PNGs are concept-to-production bridges, not final atlases.

## Proposed Sela Sprite Sheets

### 1. Movement Sheet

File draft: `drafts/sela-torch-guardian-movement-draft-v1.png`

Purpose:

- idle
- walk cycle
- directional readability

Rows:

1. idle
2. walk step 1
3. walk step 2
4. walk step 3

Columns:

1. down
2. left
3. right
4. up

### 2. Basic Combat Sheet

File draft: `drafts/sela-torch-guardian-combat-draft-v1.png`

Purpose:

- baton jab
- quick close-range light attack
- recovery timing for combat windows

Rows:

1. attack windup
2. baton/light jab impact
3. spin follow-through
4. recovery

Columns:

1. down
2. left
3. right
4. up

### 3. Light Powers Sheet

File draft: `drafts/sela-torch-guardian-light-powers-draft-v1.png`

Purpose:

- Torchbearer reveal
- Anchor beacon plant
- Beam-weaving channel

Rows:

1. torch cast windup
2. torch cast burst
3. beacon plant kneel/reach
4. beam-weaving channel

Columns:

1. down
2. left
3. right
4. up

## Additional Sheets Needed Later

### Hurt And Downed Sheet

Small sheet:

- hurt front
- hurt side
- hurt back
- downed
- revive start
- revive complete

This can be one compact utility sheet rather than one sheet per direction.

### Takedown Assist Sheet

For co-op takedown moments:

- help-call attention pose
- light-stun assist
- partner follow-up pose
- shared final-blow pose

This should stay separate from normal combat because takedown animation timing will be scripted by enemy definitions.

### UI Portrait Sheet

For HUD and dialogue:

- neutral
- strained
- determined
- surprised
- low-health

This does not need to match gameplay frame size.

## Ability Effect Sheets

Character animation and effect animation should be separate.

### Torchbearer Effect Sheet

File draft: ../../effects/sela/drafts/sela-torchbearer-effects-draft-v1.png

Used by Sela's reveal cone:

- cone idle shimmer
- cone pulse
- hidden-rune reveal sparkle
- invisible-platform reveal edge

### Anchor Beacon Effect Sheet

File draft: ../../effects/sela/drafts/sela-anchor-beacon-effects-draft-v1.png

Used by beacon plant:

- beacon seed
- beacon rise
- active beacon pulse
- beacon recall/collapse

### Beam-Weaving Effect Sheet

Used by mirror/prism puzzles:

- short beam start
- straight beam segment
- prism hit sparkle
- sensor activation pulse

### Light-Flash Combat Effect Sheet

Used by combat/takedown:

- flash windup
- flash burst
- stun ring
- enemy weak-point glint

## Integration Notes

Recommended runtime metadata shape:

```json
{
  "image": "assets/sprites/heroes/sela/sela-movement.png",
  "frameWidth": 48,
  "frameHeight": 48,
  "columns": 4,
  "rows": 4,
  "animations": {
    "idle_down": [{ "x": 0, "y": 0, "duration": 200 }],
    "walk_down": [
      { "x": 0, "y": 1, "duration": 100 },
      { "x": 0, "y": 2, "duration": 100 },
      { "x": 0, "y": 3, "duration": 100 }
    ]
  }
}
```

Engine work should load PNG plus JSON. The renderer should never need to know what row means "torch cast"; it should ask for an animation by name.

