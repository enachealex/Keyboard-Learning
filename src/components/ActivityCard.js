import { starsToString } from './StarRating.js';

export function createActivityCard(activity, bestStars, onClick) {
  const card = document.createElement('div');
  card.className = 'activity-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  const starText = starsToString(bestStars);
  card.setAttribute(
    'aria-label',
    `${activity.title}. ${activity.description}. Best score: ${starText}`,
  );

  const icon = document.createElement('div');
  icon.className = 'activity-card-icon';
  icon.textContent = activity.icon;
  icon.setAttribute('aria-hidden', 'true');

  const title = document.createElement('div');
  title.className = 'activity-card-title';
  title.textContent = activity.title;

  const stars = document.createElement('div');
  stars.className = 'activity-card-stars';
  stars.textContent = starText;
  stars.setAttribute('aria-hidden', 'true');

  card.append(icon, title, stars);

  card.addEventListener('click', onClick);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  });

  return card;
}
