/**
 * Activity Registry
 * -----------------
 * To add a new game:
 * 1. Create a class in src/activities/typing/ or src/activities/mouse/
 * 2. Add an entry to ACTIVITIES below (unique id, title, icon, category, class loader)
 * 3. Add per-difficulty config to ACTIVITY_CONFIG
 * 4. The game appears automatically in the hub (adults can hide it in Grown-Up Settings)
 */

import { DIFFICULTY_ORDER, resolveTierConfig, tierIndex } from './difficultyTiers.js';

export const CATEGORIES = {
  typing: { id: 'typing', label: 'Typing Games' },
  mouse: { id: 'mouse', label: 'Mouse Games' },
  learn: { id: 'learn', label: 'Lessons' },
};

export const ACTIVITIES = {
  letterPop: {
    id: 'letterPop',
    title: 'Letter Pop',
    icon: '🔤',
    category: 'typing',
    description: 'Press the letter shown on screen',
    class: () => import('../activities/typing/LetterPop.js'),
  },
  wordGarden: {
    id: 'wordGarden',
    title: 'Word Garden',
    icon: '🌻',
    category: 'typing',
    description: 'Type words and short phrases',
    class: () => import('../activities/typing/WordGarden.js'),
  },
  keyExplorer: {
    id: 'keyExplorer',
    title: 'Key Explorer',
    icon: '⌨️',
    category: 'typing',
    description: 'Find keys on the keyboard',
    class: () => import('../activities/typing/KeyExplorer.js'),
  },
  numberTrain: {
    id: 'numberTrain',
    title: 'Number Train',
    icon: '🔢',
    category: 'typing',
    description: 'Type numbers on the number row',
    class: () => import('../activities/typing/NumberTrain.js'),
  },
  sentenceComplete: {
    id: 'sentenceComplete',
    title: 'Sentence Complete',
    icon: '📖',
    category: 'typing',
    description: 'Pick the missing word, then type it',
    class: () => import('../activities/typing/SentenceComplete.js'),
  },
  keyNinja: {
    id: 'keyNinja',
    title: 'Key Ninja',
    icon: '🥷',
    category: 'typing',
    description: 'Press keys to slice flying fruit — like Fruit Ninja!',
    ageGroups: ['growing', 'pro'],
    minDifficulty: 'medium',
    class: () => import('../activities/typing/KeyNinja.js'),
  },
  balloonLetters: {
    id: 'balloonLetters',
    title: 'Balloon Letters',
    icon: '🎈',
    category: 'typing',
    description: 'Press the letter on each balloon as it floats by',
    class: () => import('../activities/typing/BalloonLetters.js'),
  },
  balloonPop: {
    id: 'balloonPop',
    title: 'Balloon Pop',
    icon: '🎈',
    category: 'mouse',
    description: 'Click balloons before they float away',
    class: () => import('../activities/mouse/BalloonPop.js'),
  },
  dragMatch: {
    id: 'dragMatch',
    title: 'Drag & Match',
    icon: '🎯',
    category: 'mouse',
    description: 'Drag shapes to matching buckets',
    class: () => import('../activities/mouse/DragMatch.js'),
  },
  clickCritter: {
    id: 'clickCritter',
    title: 'Click the Critter',
    icon: '🐾',
    category: 'mouse',
    description: 'Click moving animal friends',
    class: () => import('../activities/mouse/ClickCritter.js'),
  },
  colorClick: {
    id: 'colorClick',
    title: 'Color Click',
    icon: '🎨',
    category: 'mouse',
    description: 'Click the color that matches the name',
    class: () => import('../activities/mouse/ColorClick.js'),
  },
  hideNSeek: {
    id: 'hideNSeek',
    title: 'Hide n Seek',
    icon: '🦁',
    category: 'mouse',
    description: 'Find the lion hiding in the field before it catches the sheep',
    class: () => import('../activities/mouse/HideNSeek.js'),
  },
  mazeMouse: {
    id: 'mazeMouse',
    title: 'Maze Mouse',
    icon: '🌀',
    category: 'mouse',
    description: 'Guide your mouse through the maze without touching walls',
    class: () => import('../activities/mouse/MazeMouse.js'),
  },
  homeRowDrill: {
    id: 'homeRowDrill',
    title: 'Home Row Drill',
    icon: '🏠',
    category: 'typing',
    description: 'Practice home row keys with guided drills',
    audiences: ['adult'],
    hubSection: 'learn',
    class: () => import('../activities/typing/HomeRowDrill.js'),
  },
  typingTest: {
    id: 'typingTest',
    title: 'Typing Test',
    icon: '⏱️',
    category: 'typing',
    description: '60-second speed and accuracy benchmark',
    audiences: ['adult'],
    hubSection: 'learn',
    class: () => import('../activities/typing/TypingTest.js'),
  },
  formControls: {
    id: 'formControls',
    title: 'Form Controls',
    icon: '📝',
    category: 'mouse',
    description: 'Checkboxes, radio buttons, and dropdown menus',
    audiences: ['adult'],
    hubSection: 'learn',
    class: () => import('../activities/mouse/FormControls.js'),
  },
};

export const ACTIVITY_CONFIG = {
  letterPop: {
    easy: { count: 8, timed: false, pool: 'easy' },
    medium: { count: 10, timed: false, pool: 'medium' },
    hard: { count: 99, timed: true, timeLimit: 30, pool: 'hard' },
  },
  wordGarden: {
    easy: { count: 5, pool: 'easy' },
    medium: { count: 8, pool: 'medium' },
    hard: { count: 5, pool: 'hard' },
  },
  keyExplorer: {
    easy: { count: 8, pool: 'easy' },
    medium: { count: 6, pool: 'medium' },
    hard: { count: 16, pool: 'hard' },
  },
  numberTrain: {
    easy: { count: 8, digits: '1-5', timed: false },
    medium: { count: 12, digits: '0-9', timed: false },
    hard: { count: 99, digits: '0-9', timed: true, timeLimit: 30 },
  },
  sentenceComplete: {
    easy: { count: 5, choices: 3, pool: 'easy' },
    medium: { count: 6, choices: 4, pool: 'medium' },
    hard: { count: 5, choices: 5, pool: 'hard' },
  },
  keyNinja: {
    medium: {
      timeLimit: 60, spawnRate: 900, maxAir: 3, size: 64,
      launchSpeed: 7, gravity: 0.14, drift: 2.5, maxMiss: 6, burstChance: 0.25,
    },
    hard: {
      timeLimit: 60, spawnRate: 550, maxAir: 5, size: 52,
      launchSpeed: 9, gravity: 0.17, drift: 4, maxMiss: 4, burstChance: 0.45,
    },
  },
  balloonLetters: {
    easy: { spawnRate: 2200, size: 72, speed: 1.8, maxAir: 2, timed: false, target: 12, maxMiss: 5, pool: 'easy' },
    medium: { spawnRate: 1600, size: 60, speed: 2.8, maxAir: 3, timed: false, target: 15, maxMiss: 7, pool: 'medium' },
    hard: { spawnRate: 1100, size: 50, speed: 4.2, maxAir: 4, timed: true, timeLimit: 45, maxMiss: 99, pool: 'hard' },
  },
  balloonPop: {
    easy: { spawnRate: 2000, size: 80, speed: 0.3, timed: false, maxMiss: 5, target: 15 },
    medium: { spawnRate: 1500, size: 60, speed: 0.6, timed: false, maxMiss: 8, target: 15 },
    hard: { spawnRate: 1000, size: 45, speed: 1.0, timed: true, timeLimit: 45, maxMiss: 99, target: 99 },
  },
  dragMatch: {
    easy: { count: 3 },
    medium: { count: 5 },
    hard: { count: 8 },
  },
  clickCritter: {
    easy: { count: 8, move: false, size: 64, speed: 0 },
    medium: { count: 12, move: true, size: 56, speed: 0.5 },
    hard: { count: 15, move: true, size: 40, speed: 1.2, doubleClick: true },
  },
  colorClick: {
    easy: { count: 8, colors: 3, shuffleMs: 0 },
    medium: { count: 12, colors: 5, shuffleMs: 0 },
    hard: { count: 15, colors: 6, shuffleMs: 3000 },
  },
  hideNSeek: {
    easy: { count: 6, hideSpots: 5, peekMs: 2200, hideMs: 2800, maxSneak: 4 },
    medium: { count: 8, hideSpots: 7, peekMs: 1600, hideMs: 2200, maxSneak: 3 },
    hard: { count: 10, hideSpots: 8, peekMs: 1100, hideMs: 1700, maxSneak: 2 },
  },
  mazeMouse: {
    easy: { count: 2, cellSize: 36, pool: 'easy' },
    medium: { count: 3, cellSize: 28, pool: 'medium' },
    hard: { count: 3, cellSize: 22, pool: 'hard' },
  },
  homeRowDrill: {
    easy: { count: 6, pool: 'easy' },
    medium: { count: 8, pool: 'medium' },
    hard: { count: 10, pool: 'hard' },
  },
  typingTest: {
    easy: { timeLimit: 60, pool: 'easy' },
    medium: { timeLimit: 60, pool: 'medium' },
    hard: { timeLimit: 60, pool: 'hard' },
  },
  formControls: {
    easy: { count: 6 },
    medium: { count: 9 },
    hard: { count: 12 },
  },
};

export function getAllActivities() {
  return Object.values(ACTIVITIES);
}

export function getActivityById(id) {
  return ACTIVITIES[id] ?? null;
}

export function getBaseConfig(activityId, difficulty) {
  return resolveTierConfig(ACTIVITY_CONFIG[activityId], difficulty);
}

export function getEnabledActivities(settings, context = {}) {
  const enabled = settings.enabledActivities ?? {};
  const {
    audience = 'child',
    segmentId = null,
    difficulty = null,
    hubSection = null,
  } = context;

  return getAllActivities().filter((a) => {
    if (enabled[a.id] === false) return false;
    if (a.audiences && !a.audiences.includes(audience)) return false;
    if (hubSection === 'learn' && a.hubSection !== 'learn') return false;
    if (hubSection === 'practice' && a.hubSection === 'learn') return false;
    if (audience === 'child' && a.ageGroups && segmentId && !a.ageGroups.includes(segmentId)) {
      return false;
    }
    if (a.minDifficulty && difficulty) {
      const need = tierIndex(a.minDifficulty);
      const have = tierIndex(difficulty);
      if (have < need) return false;
    }
    return true;
  });
}
