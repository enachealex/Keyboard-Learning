import { ACTIVITIES } from './activityRegistry.js';

export const DIFFICULTY_OVERRIDE_OPTIONS = [
  { id: 'auto', label: 'Auto (match age group)' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export const ROUND_LENGTH_OPTIONS = [
  { id: 'short', label: 'Short', multiplier: 0.6, min: 3 },
  { id: 'normal', label: 'Normal', multiplier: 1, min: 3 },
  { id: 'long', label: 'Long', multiplier: 1.5, min: 3 },
];

export const TIMED_GAMES_OPTIONS = [
  { id: 'auto', label: 'Auto (based on age)' },
  { id: 'on', label: 'Timed games on' },
  { id: 'off', label: 'Timed games off' },
];

export function createDefaultSettings() {
  const enabledActivities = {};
  for (const id of Object.keys(ACTIVITIES)) {
    enabledActivities[id] = true;
  }
  return {
    soundEnabled: true,
    difficultyOverride: 'auto',
    roundLength: 'normal',
    timedGames: 'auto',
    showKeyboard: 'auto', // auto | always | never
    enabledActivities,
  };
}
