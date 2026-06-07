export function createStarRating(count, animate = false) {
  const el = document.createElement('div');
  el.className = 'star-rating';
  for (let i = 0; i < 3; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '★';
    if (i < count) {
      if (animate) {
        setTimeout(() => star.classList.add('filled'), i * 200);
      } else {
        star.classList.add('filled');
      }
    }
    el.appendChild(star);
  }
  return el;
}

export function starsToString(count) {
  if (count === 0) return '';
  return '★'.repeat(count) + '☆'.repeat(3 - count);
}
