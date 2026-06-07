export const AGE_GROUPS = {
  young: {
    id: 'young',
    label: 'Little Learners',
    ages: '4–6',
    icon: '🐣',
    difficulty: 'easy',
    description: 'Big buttons, single letters, easy clicking',
  },
  growing: {
    id: 'growing',
    label: 'Growing Typists',
    ages: '7–9',
    icon: '🌱',
    difficulty: 'medium',
    description: 'Words, home-row keys, guided mouse games',
  },
  pro: {
    id: 'pro',
    label: 'Keyboard Pros',
    ages: '10–12',
    icon: '🚀',
    difficulty: 'hard',
    description: 'Timed challenges, phrases, precision mouse skills',
  },
};

export function getDifficultyForAge(ageGroupId) {
  return AGE_GROUPS[ageGroupId]?.difficulty ?? 'easy';
}

export function getAgeGroup(ageGroupId) {
  return AGE_GROUPS[ageGroupId] ?? AGE_GROUPS.young;
}
