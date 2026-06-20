/**
 * Content for adult lessons inspired by keyboard/mouse learning research.
 * See adultCurriculum.js lesson descriptions for article references.
 */

/** Motor sequence patterns (sequential finger tapping studies). */
export const FINGER_SEQUENCE_POOLS = {
  easy: ['asdf', 'jkl;', 'fdsa', 'lkj'],
  medium: ['asdfj', 'fjdkl', 'sadf', 'jklas'],
  hard: ['asdfjk', 'fjdklsa', 'asdfjkl', 'lkjfdsa'],
};

/** Short melodic key patterns (therapeutic keyboard music playing). */
export const MELODY_PATTERN_POOLS = {
  easy: ['asas', 'dfdf', 'jkjk', 'lklk'],
  medium: ['asdf', 'ghjk', 'fdsa', 'kjhg'],
  hard: ['asdfgh', 'hjklas', 'asdfjkl', 'lkjhgfds'],
};

/** Ergonomic workstation scenarios (VDT / office ergonomics training). */
export const ERGONOMICS_SCENARIOS = [
  {
    prompt: 'Where should the top of your monitor sit?',
    options: ['At or slightly below eye level', 'On the floor', 'Above your head'],
    correct: 0,
    tip: 'Keep the screen top near eye level to reduce neck flexion.',
  },
  {
    prompt: 'How should your wrists rest while typing?',
    options: ['Neutral — not bent up or down', 'Bent sharply upward', 'Resting on the desk edge'],
    correct: 0,
    tip: 'Neutral wrists reduce strain during long typing sessions.',
  },
  {
    prompt: 'Where should your mouse be placed?',
    options: ['Close to the keyboard, same height', 'Far to the side on a low shelf', 'Behind the monitor'],
    correct: 0,
    tip: 'Keep the mouse near the keyboard to limit shoulder reach.',
  },
  {
    prompt: 'What helps during long tablet or laptop typing?',
    options: ['Small posture changes and micro-breaks', 'Locking elbows in one position', 'Typing faster to finish sooner'],
    correct: 0,
    tip: 'Motor variability and breaks reduce discomfort during prolonged typing.',
  },
  {
    prompt: 'How should your chair support you?',
    options: ['Feet flat, thighs parallel to floor', 'Feet dangling, leaning forward', 'Slouching with no back support'],
    correct: 0,
    tip: 'Stable seating supports neutral spine and shoulder posture.',
  },
  {
    prompt: 'Best approach when you make a typing error?',
    options: ['Pause, Backspace, and correct the letter', 'Keep going and ignore mistakes', 'Delete the whole document'],
    correct: 0,
    tip: 'Self-correction while typing improves accuracy over time.',
  },
  {
    prompt: 'Keyboard height should allow…',
    options: ['Elbows near 90° with relaxed shoulders', 'Arms fully extended and raised', 'Wrists pressed against the desk'],
    correct: 0,
    tip: 'Relaxed shoulders and elbows reduce upper-body strain.',
  },
  {
    prompt: 'For fine motor keyboard practice, what helps learning?',
    options: ['Varied finger movements with feedback', 'Only pressing one key repeatedly', 'Typing with eyes closed always'],
    correct: 0,
    tip: 'Varied, coordinated finger movements build motor skill.',
  },
];

export function pickErgoScenarios(count) {
  const pool = [...ERGONOMICS_SCENARIOS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Words that balance left- and right-hand keys (bimanual typing research). */
export const BIMANUAL_WORD_POOLS = {
  easy: ['sad lad', 'dad had', 'gal lag', 'fan pan', 'map cap'],
  medium: ['glass flag', 'happy path', 'label math', 'plant half'],
  hard: ['parallel flag', 'algebra plant', 'shall happy', 'path flag glass'],
};

/** Thumb-zone friendly entry drills (touch-screen character entry research). */
export const THUMB_ENTRY_POOLS = {
  easy: ['bm', 'nm', 'cv', 'mb', 'on', 'an'],
  medium: ['bench', 'moon', 'cabin', 'name', 'come', 'move'],
  hard: ['movement', 'common', 'combine', 'number', 'mobile', 'column'],
};

/** Micro-break prompts (prolonged typing / motor variability research). */
export const POSTURE_BREAKS = [
  {
    title: 'Neck roll',
    body: 'Slowly roll your head side to side. Keep shoulders relaxed.',
    icon: '🔄',
  },
  {
    title: 'Shoulder shrug',
    body: 'Raise both shoulders, hold for 3 seconds, then release. Repeat twice.',
    icon: '⬆️',
  },
  {
    title: 'Wrist circles',
    body: 'Circle both wrists gently. Keep wrists neutral — not pressed on the desk edge.',
    icon: '👐',
  },
  {
    title: 'Stand & reach',
    body: 'Stand up, reach arms overhead, then let arms drop loosely.',
    icon: '🧘',
  },
  {
    title: '20-20-20 break',
    body: 'Look at something about 20 feet away for 20 seconds to rest your eyes.',
    icon: '👀',
  },
  {
    title: 'Finger stretch',
    body: 'Spread fingers wide, hold for 5 seconds, then relax your hands.',
    icon: '🖐️',
  },
  {
    title: 'Elbow reset',
    body: 'Let arms hang at your sides, then bend elbows to about 90° with relaxed shoulders.',
    icon: '🦾',
  },
];

export function pickPostureBreaks(count) {
  const pool = [...POSTURE_BREAKS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Pointer waypoint paths — fine motor control (handwriting / drawing research). */
export const PRECISION_PATH_SETS = {
  easy: [
    [{ x: 8, y: 50 }, { x: 30, y: 50 }, { x: 50, y: 30 }, { x: 70, y: 50 }, { x: 92, y: 50 }],
    [{ x: 8, y: 30 }, { x: 25, y: 70 }, { x: 50, y: 30 }, { x: 75, y: 70 }, { x: 92, y: 30 }],
  ],
  medium: [
    [{ x: 6, y: 50 }, { x: 20, y: 20 }, { x: 40, y: 80 }, { x: 60, y: 20 }, { x: 80, y: 80 }, { x: 94, y: 50 }],
    [{ x: 6, y: 70 }, { x: 25, y: 30 }, { x: 45, y: 70 }, { x: 65, y: 30 }, { x: 85, y: 70 }, { x: 94, y: 40 }],
  ],
  hard: [
    [{ x: 5, y: 50 }, { x: 15, y: 15 }, { x: 35, y: 85 }, { x: 50, y: 15 }, { x: 65, y: 85 }, { x: 85, y: 15 }, { x: 95, y: 50 }],
    [{ x: 5, y: 25 }, { x: 20, y: 75 }, { x: 35, y: 25 }, { x: 50, y: 75 }, { x: 65, y: 25 }, { x: 80, y: 75 }, { x: 95, y: 50 }],
  ],
};

export const LEFT_HAND_KEYS = new Set([
  'q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b',
]);

export function handForChar(ch) {
  const c = ch.toLowerCase();
  if (c === ' ') return 'space';
  if (LEFT_HAND_KEYS.has(c)) return 'left';
  return 'right';
}
