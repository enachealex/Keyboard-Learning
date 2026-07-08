import { starsToString } from './StarRating.js';
import { formatPoints } from '../utils/scoring.js';

export function createActivityCard(activity, progress, onClick) {
  const { stars = 0, bestPoints = 0, showStars = true } = progress ?? {};

  const card = document.createElement('div');
  card.className = 'activity-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  const starText = starsToString(stars);
  const bestText = bestPoints > 0 ? `Best score: ${formatPoints(bestPoints)} points.` : 'Not played yet.';
  card.setAttribute(
    'aria-label',
    `${activity.title}. ${activity.description}. ${showStars ? `Stars: ${starText}. ` : ''}${bestText}`,
  );

  const icon = document.createElement('div');
  icon.className = 'activity-card-icon';
  icon.textContent = activity.icon;
  icon.setAttribute('aria-hidden', 'true');

  const title = document.createElement('div');
  title.className = 'activity-card-title';
  title.textContent = activity.title;

  card.append(icon, title);

  if (showStars) {
    const starsEl = document.createElement('div');
    starsEl.className = 'activity-card-stars';
    starsEl.textContent = starText;
    starsEl.setAttribute('aria-hidden', 'true');
    card.appendChild(starsEl);
  }

  const best = document.createElement('div');
  best.className = 'activity-card-best';
  best.textContent = bestPoints > 0 ? `Best: ${formatPoints(bestPoints)}` : '—';
  best.setAttribute('aria-hidden', 'true');
  card.appendChild(best);

  card.addEventListener('click', onClick);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });

  return card;
}
