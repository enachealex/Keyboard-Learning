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
];

export function getLessonById(id) {
  return ADULT_LESSONS.find((l) => l.id === id) ?? null;
}
