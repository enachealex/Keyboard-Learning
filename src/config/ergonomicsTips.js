export const ERGONOMICS_TIPS = [
  {
    title: 'Neutral wrists',
    text: 'Keep wrists straight and floating — don’t rest on the desk while typing.',
  },
  {
    title: 'Elbow height',
    text: 'Your keyboard should be at or slightly below elbow height.',
  },
  {
    title: '20-20-20 rule',
    text: 'Every 20 minutes, look at something 20 feet away for 20 seconds.',
  },
  {
    title: 'Short breaks',
    text: 'Take a 30–60 second break every 20–30 minutes of practice.',
  },
  {
    title: 'Screen distance',
    text: 'Keep your monitor about an arm’s length away; top of screen near eye level.',
  },
  {
    title: 'Light touch',
    text: 'Type with light pressure — forceful key strikes cause fatigue.',
  },
  {
    title: 'Home row anchor',
    text: 'Return fingers to the home row after reaching for other keys.',
  },
  {
    title: 'Accuracy first',
    text: 'Slow, accurate practice builds speed faster than rushing with errors.',
  },
];

export function getRandomErgonomicsTip() {
  const idx = Math.floor(Math.random() * ERGONOMICS_TIPS.length);
  return ERGONOMICS_TIPS[idx];
}
