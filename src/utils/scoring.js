/**
 * Round points — one formula for every game so scores are comparable
 * across retries of the same activity.
 *
 * Effort (each correct answer) is the base; accuracy and completion scale
 * it; typing speed adds a bonus. Retrying with better accuracy or speed
 * always yields more points, which makes the personal best a fair goal.
 */
export function computePoints(score) {
  if (!score) return 0;
  const correct = score.correct ?? 0;
  const accuracy = Math.max(0, Math.min(100, score.accuracy ?? 0));
  const completion = Math.max(0, Math.min(100, score.completion ?? 0));
  // Cap the speed bonus so burst input (or key-mash games where WPM is
  // meaningless) can't dwarf the accuracy-driven base.
  const wpm = Math.min(120, Math.max(0, score.wpm ?? 0));

  const base = correct * 10;
  const quality = 0.5 + (accuracy / 100) * 0.5 + (completion / 100) * 0.25;
  const speedBonus = wpm * 5;

  return Math.max(0, Math.round(base * quality + speedBonus));
}

export function formatPoints(points) {
  return (points ?? 0).toLocaleString('en-US');
}
