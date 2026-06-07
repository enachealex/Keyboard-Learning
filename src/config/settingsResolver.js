import { getDifficultyForAge } from './ageGroups.js';
import { getBaseConfig } from './activityRegistry.js';
import { ROUND_LENGTH_OPTIONS } from './settingsDefaults.js';

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export function resolveDifficulty(ageGroupId, settings) {
  const override = settings.difficultyOverride ?? 'auto';
  if (override !== 'auto' && DIFFICULTY_ORDER.includes(override)) {
    return override;
  }
  return getDifficultyForAge(ageGroupId);
}

export function resolveActivityConfig(activityId, difficulty, settings) {
  const base = { ...getBaseConfig(activityId, difficulty) };
  const roundOpt = ROUND_LENGTH_OPTIONS.find((o) => o.id === settings.roundLength)
    ?? ROUND_LENGTH_OPTIONS[1];

  if (typeof base.count === 'number') {
    base.count = Math.max(roundOpt.min, Math.round(base.count * roundOpt.multiplier));
  }
  if (typeof base.target === 'number') {
    base.target = Math.max(roundOpt.min, Math.round(base.target * roundOpt.multiplier));
  }

  const timedMode = settings.timedGames ?? 'auto';
  if (timedMode === 'on' && 'timed' in base) {
    base.timed = true;
    if (!base.timeLimit) base.timeLimit = 30;
    if (base.count > 50) base.count = Math.round(20 * roundOpt.multiplier);
  } else if (timedMode === 'off' && base.timed) {
    base.timed = false;
    if (base.count > 50 || !base.count) {
      base.count = Math.max(roundOpt.min, Math.round(15 * roundOpt.multiplier));
    }
  }

  base.showKeyboard = shouldShowKeyboard(settings);
  return base;
}

export function shouldShowKeyboard(settings) {
  const pref = settings.showKeyboard ?? 'auto';
  if (pref === 'always') return true;
  if (pref === 'never') return false;
  return true;
}
