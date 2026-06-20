import { DIFFICULTY_TIERS } from './difficultyTiers.js';

export const ADULT_LEVELS = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    icon: '📘',
    difficulty: 'simple',
    difficultyLabel: DIFFICULTY_TIERS.simple.label,
    description: 'New to keyboards and mice — learn the basics',
  },
  familiar: {
    id: 'familiar',
    label: 'Familiar',
    icon: '👋',
    difficulty: 'easy',
    difficultyLabel: DIFFICULTY_TIERS.easy.label,
    description: 'Know the layout but want guided practice',
  },
  intermediate: {
    id: 'intermediate',
    label: 'Intermediate',
    icon: '⚡',
    difficulty: 'medium',
    difficultyLabel: DIFFICULTY_TIERS.medium.label,
    description: 'Comfortable typing — build speed and accuracy',
  },
  experienced: {
    id: 'experienced',
    label: 'Experienced',
    icon: '🎯',
    difficulty: 'hard',
    difficultyLabel: DIFFICULTY_TIERS.hard.label,
    description: 'Regular computer user refining your skills',
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    icon: '🏆',
    difficulty: 'veryHard',
    difficultyLabel: DIFFICULTY_TIERS.veryHard.label,
    description: 'Advanced drills and timed challenges',
  },
};

export const ADULT_LEVEL_IDS = Object.keys(ADULT_LEVELS);

export function getDifficultyForAdultLevel(levelId) {
  return ADULT_LEVELS[levelId]?.difficulty ?? 'simple';
}

export function getAdultLevel(levelId) {
  return ADULT_LEVELS[levelId] ?? ADULT_LEVELS.beginner;
}
