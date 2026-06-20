export const AGE_GROUPS = {
  young: {
    id: 'young',
    label: 'Little Learners',
    ages: '4–6',
    minAge: 3,
    maxAge: 6,
    icon: '🐣',
    difficulty: 'easy',
    description: 'Big buttons, single letters, easy clicking',
  },
  growing: {
    id: 'growing',
    label: 'Growing Typists',
    ages: '7–9',
    minAge: 7,
    maxAge: 9,
    icon: '🌱',
    difficulty: 'medium',
    description: 'Words, home-row keys, guided mouse games',
  },
  pro: {
    id: 'pro',
    label: 'Keyboard Pros',
    ages: '10–12',
    minAge: 10,
    maxAge: 14,
    icon: '🚀',
    difficulty: 'hard',
    description: 'Timed challenges, phrases, precision mouse skills',
  },
};

export const CHILD_AGE_MIN = 3;
export const CHILD_AGE_MAX = 14;

export function getDifficultyForAge(ageGroupId) {
  return AGE_GROUPS[ageGroupId]?.difficulty ?? 'easy';
}

export function getAgeGroup(ageGroupId) {
  return AGE_GROUPS[ageGroupId] ?? AGE_GROUPS.young;
}

/** Map a child's age (years) to the matching play group. */
export function ageGroupFromNumber(age) {
  const n = Math.round(Number(age));
  if (Number.isNaN(n)) return 'young';
  if (n <= AGE_GROUPS.young.maxAge) return 'young';
  if (n <= AGE_GROUPS.growing.maxAge) return 'growing';
  return 'pro';
}

export function isValidChildAge(age) {
  const n = Math.round(Number(age));
  return !Number.isNaN(n) && n >= CHILD_AGE_MIN && n <= CHILD_AGE_MAX;
}
