/** Ordered lessons shown in the adult Learn tab. */

export const ADULT_LESSONS = [
  {
    id: 'homeRowDrill',
    title: 'Home Row Drill',
    description: 'Learn finger placement and practice ASDF · JKL;',
    icon: '🏠',
    category: 'typing',
  },
  {
    id: 'fingerSequence',
    title: 'Finger Sequences',
    description: 'Repeat patterns to build sequential motor memory',
    icon: '🔁',
    category: 'typing',
  },
  {
    id: 'melodyKeys',
    title: 'Melody Keys',
    description: 'Play short melodies — keyboard music finger training',
    icon: '🎹',
    category: 'typing',
  },
  {
    id: 'rhythmKeys',
    title: 'Rhythm Keys',
    description: 'Press keys on the beat for timing and coordination',
    icon: '🎵',
    category: 'typing',
  },
  {
    id: 'bimanualWords',
    title: 'Bimanual Words',
    description: 'Type with both hands — balanced left and right patterns',
    icon: '🤝',
    category: 'typing',
  },
  {
    id: 'thumbType',
    title: 'Thumb Type',
    description: 'Touch-screen style entry on a phone keyboard layout',
    icon: '📱',
    category: 'typing',
  },
  {
    id: 'fixAndType',
    title: 'Fix & Type',
    description: 'Self-correct typos with Backspace while you write',
    icon: '⌫',
    category: 'typing',
  },
  {
    id: 'quickResponse',
    title: 'Quick Response',
    description: 'Reaction-time drills when the GO signal appears',
    icon: '⚡',
    category: 'typing',
  },
  {
    id: 'typingTest',
    title: 'Typing Test',
    description: '60-second speed and accuracy benchmark',
    icon: '⏱️',
    category: 'typing',
  },
  {
    id: 'formControls',
    title: 'Form Controls',
    description: 'Checkboxes, radio buttons, and dropdown menus',
    icon: '📝',
    category: 'mouse',
  },
  {
    id: 'ergoCheck',
    title: 'Ergo Check',
    description: 'Pick healthy monitor, keyboard, and mouse setups',
    icon: '🪑',
    category: 'mouse',
  },
  {
    id: 'posturePause',
    title: 'Posture Pause',
    description: 'Micro-breaks for neck, wrists, and shoulders',
    icon: '🧘',
    category: 'mouse',
  },
  {
    id: 'precisionPath',
    title: 'Precision Path',
    description: 'Guide the cursor through careful movement paths',
    icon: '✏️',
    category: 'mouse',
  },
];

export function getLessonById(id) {
  return ADULT_LESSONS.find((l) => l.id === id) ?? null;
}
