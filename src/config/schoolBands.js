import { DIFFICULTY_ORDER } from './difficultyTiers.js';

/**
 * School bands — Elementary / Middle / High.
 *
 * The band controls two things:
 *  1. Difficulty progression: each student has an advancement level (1–5)
 *     that maps onto the shared difficulty ladder. Levels rise from points
 *     (or a teacher can set them), so a struggling 10th grader starts gentle
 *     without ever being told they're "behind."
 *  2. Verbiage: everything a student reads is written for their age.
 *     Elementary keeps the playful mascot voice. Middle and High use a
 *     respectful, progress-framed voice — no baby talk, no "Oops!", and
 *     misses read as resets, not failures.
 */
export const SCHOOL_BANDS = {
  elementary: {
    id: 'elementary',
    label: 'Elementary',
    icon: '🎈',
    grades: ['K', '1', '2', '3', '4', '5'],
    /** Which activity set the student sees (child games vs. training drills). */
    audience: 'child',
    presentation: 'playful',
  },
  middle: {
    id: 'middle',
    label: 'Middle School',
    icon: '⚡',
    grades: ['6', '7', '8'],
    audience: 'adult',
    presentation: 'focused',
  },
  high: {
    id: 'high',
    label: 'High School',
    icon: '🎯',
    grades: ['9', '10', '11', '12'],
    audience: 'adult',
    presentation: 'focused',
  },
};

export const SCHOOL_GRADES = Object.values(SCHOOL_BANDS).flatMap((b) => b.grades);

export const MAX_ADVANCEMENT_LEVEL = 5;

/** Lifetime points needed to reach each advancement level (index = level - 1). */
export const LEVEL_POINT_THRESHOLDS = [0, 1500, 4000, 8000, 14000];

export function bandForGrade(grade) {
  for (const band of Object.values(SCHOOL_BANDS)) {
    if (band.grades.includes(String(grade))) return band.id;
  }
  return 'elementary';
}

export function getBand(bandId) {
  return SCHOOL_BANDS[bandId] ?? SCHOOL_BANDS.elementary;
}

/**
 * Starting level when a student is added. Everyone begins gently — younger
 * elementary kids at the very start, everyone else one step up. Teachers
 * and earned points move it from there.
 */
export function defaultLevelForGrade(grade) {
  return ['K', '1', '2'].includes(String(grade)) ? 1 : 2;
}

/** Advancement level (1–5) → difficulty tier on the shared ladder. */
export function difficultyForLevel(level) {
  const idx = Math.max(0, Math.min(MAX_ADVANCEMENT_LEVEL, Math.round(level || 1)) - 1);
  return DIFFICULTY_ORDER[idx] ?? 'simple';
}

/** Highest level earned by lifetime points. */
export function levelForPoints(totalPoints) {
  let level = 1;
  for (let i = 0; i < LEVEL_POINT_THRESHOLDS.length; i++) {
    if (totalPoints >= LEVEL_POINT_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** Points still needed for the next level, or null at the top. */
export function pointsToNextLevel(totalPoints, currentLevel) {
  const next = LEVEL_POINT_THRESHOLDS[currentLevel];
  if (next == null) return null;
  return Math.max(0, next - totalPoints);
}

/**
 * Band verbiage. The playful voice is for young kids; the focused voice is
 * deliberately written so a teenager who finds mouse and keyboard hard never
 * reads anything that sounds like it was meant for a six-year-old.
 */
const PRESENTATIONS = {
  playful: {
    hubTitle: 'Choose a Game',
    hubTypingLabel: 'Typing Games',
    hubMouseLabel: 'Mouse Games',
    resultsTitle: 'Round Complete!',
    levelLabel: (n) => `Level ${n}`,
    levelUp: (n) => `⭐ Level up! You reached Level ${n}!`,
    newBest: '🎉 New high score!',
    bestLine: (best) => `High score: ${best} — can you beat it?`,
    messages: [
      'Amazing work!',
      'You are a superstar!',
      'Keep practicing — you are doing great!',
      'Fantastic job!',
      'Wow, impressive!',
    ],
    showMascot: true,
    showStars: true,
    showWpm: false,
  },
  focused: {
    hubTitle: 'Training Hub',
    hubTypingLabel: 'Keyboard Training',
    hubMouseLabel: 'Mouse Skills',
    resultsTitle: 'Session Complete',
    levelLabel: (n) => `Level ${n}`,
    levelUp: (n) => `Advanced to Level ${n}.`,
    newBest: 'New personal best!',
    bestLine: (best) => `Personal best: ${best}`,
    messages: [
      'Solid run.',
      'Good session — progress logged.',
      'Your consistency is building.',
      'Clean reps. Keep going.',
      'That counts — every session stacks.',
    ],
    showMascot: false,
    showStars: false,
    showWpm: true,
  },
};

export function getPresentation(bandId) {
  const band = getBand(bandId);
  return PRESENTATIONS[band.presentation] ?? PRESENTATIONS.playful;
}
