/**
 * Five-tier difficulty scale for adult learners.
 * Child mode still uses easy / medium / hard via age groups.
 */

export const DIFFICULTY_TIERS = {
  simple: {
    id: 'simple',
    label: 'Simple',
    configBase: 'easy',
    modifier: {
      count: 0.65,
      target: 0.65,
      speed: 0.75,
      spawnRate: 1.25,
      size: 1.12,
      launchSpeed: 0.85,
      drift: 0.85,
      timed: false,
    },
  },
  easy: {
    id: 'easy',
    label: 'Easy',
    configBase: 'easy',
    modifier: {},
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    configBase: 'medium',
    modifier: {},
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    configBase: 'hard',
    modifier: {},
  },
  veryHard: {
    id: 'veryHard',
    label: 'Very Hard',
    configBase: 'hard',
    modifier: {
      count: 1.2,
      target: 1.15,
      speed: 1.2,
      spawnRate: 0.82,
      size: 0.88,
      launchSpeed: 1.15,
      gravity: 1.1,
      drift: 1.2,
      maxMiss: 0.85,
      timeLimit: 0.85,
    },
  },
};

/** Full adult scale — includes Simple and Very Hard. */
export const DIFFICULTY_ORDER = ['simple', 'easy', 'medium', 'hard', 'veryHard'];

/** Child age groups map to these three tiers only. */
export const CHILD_DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export function getTierLabel(tierId) {
  return DIFFICULTY_TIERS[tierId]?.label ?? tierId;
}

export function tierIndex(tierId) {
  const idx = DIFFICULTY_ORDER.indexOf(tierId);
  return idx >= 0 ? idx : 0;
}

function applyModifier(config, modifier) {
  const next = { ...config };

  if (typeof modifier.count === 'number' && typeof next.count === 'number') {
    next.count = Math.max(3, Math.round(next.count * modifier.count));
  }
  if (typeof modifier.target === 'number' && typeof next.target === 'number') {
    next.target = Math.max(3, Math.round(next.target * modifier.target));
  }
  if (typeof modifier.speed === 'number' && typeof next.speed === 'number') {
    next.speed = next.speed * modifier.speed;
  }
  if (typeof modifier.spawnRate === 'number' && typeof next.spawnRate === 'number') {
    next.spawnRate = Math.round(next.spawnRate * modifier.spawnRate);
  }
  if (typeof modifier.size === 'number' && typeof next.size === 'number') {
    next.size = Math.round(next.size * modifier.size);
  }
  if (typeof modifier.launchSpeed === 'number' && typeof next.launchSpeed === 'number') {
    next.launchSpeed = next.launchSpeed * modifier.launchSpeed;
  }
  if (typeof modifier.gravity === 'number' && typeof next.gravity === 'number') {
    next.gravity = next.gravity * modifier.gravity;
  }
  if (typeof modifier.drift === 'number' && typeof next.drift === 'number') {
    next.drift = next.drift * modifier.drift;
  }
  if (typeof modifier.maxMiss === 'number' && typeof next.maxMiss === 'number' && next.maxMiss < 90) {
    next.maxMiss = Math.max(1, Math.round(next.maxMiss * modifier.maxMiss));
  }
  if (typeof modifier.timeLimit === 'number' && typeof next.timeLimit === 'number') {
    next.timeLimit = Math.max(15, Math.round(next.timeLimit * modifier.timeLimit));
  }
  if (modifier.timed === false) {
    next.timed = false;
  }

  return next;
}

/**
 * Resolve activity config for a difficulty tier, including Simple and Very Hard.
 */
export function resolveTierConfig(activityConfigs, tierId) {
  const tier = DIFFICULTY_TIERS[tierId];
  if (!tier) {
    const fallback = DIFFICULTY_TIERS.easy;
    const base = activityConfigs?.[fallback.configBase] ?? {};
    return { ...base };
  }

  const base = activityConfigs?.[tier.configBase] ?? {};
  if (!base || Object.keys(base).length === 0) {
    return {};
  }

  return applyModifier({ ...base }, tier.modifier);
}
