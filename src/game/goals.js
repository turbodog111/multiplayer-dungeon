// Goals — the objectives a run is measured against.
//
// A goal is data: a metric (a key in a RunStats snapshot), a target, and a mode
// ('atLeast' or 'atMost'). evaluateGoal is a pure function so the HUD, the
// end-of-run screen, and achievement checks all agree on what's done.

/**
 * Evaluate one goal against a stats snapshot.
 * @returns {{ id, name, description, current, target, mode, done, progress }}
 */
export function evaluateGoal(goal, snapshot) {
  const current = snapshot[goal.metric] ?? 0;
  const done = goal.mode === 'atMost'
    ? current <= goal.target
    : current >= goal.target;

  let progress;
  if (goal.mode === 'atMost') {
    progress = done ? 1 : 0;
  } else {
    progress = goal.target <= 0 ? 1 : Math.min(1, current / goal.target);
  }

  return {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    current,
    target: goal.target,
    mode: goal.mode,
    done,
    progress,
  };
}

/** Evaluate a list of goals against a snapshot. */
export function evaluateGoals(goals, snapshot) {
  return goals.map((goal) => evaluateGoal(goal, snapshot));
}

// The default objective set for a full ascent of the Sundering Spire.
export const TOWER_GOALS = [
  {
    id: 'summit',
    name: 'Reach the Summit',
    description: 'Clear all 12 floors of the Spire.',
    metric: 'floorsCleared',
    target: 12,
    mode: 'atLeast',
  },
  {
    id: 'flawless',
    name: 'Flawless Ascent',
    description: 'Reach the top without a single death.',
    metric: 'deaths',
    target: 0,
    mode: 'atMost',
  },
  {
    id: 'executioner',
    name: 'Executioner',
    description: 'Land 25 co-op takedowns in a single run.',
    metric: 'takedowns',
    target: 25,
    mode: 'atLeast',
  },
  {
    id: 'spire_record',
    name: 'Spire Record',
    description: 'Score 5,000 points in a single ascent.',
    metric: 'score',
    target: 5000,
    mode: 'atLeast',
  },
];
