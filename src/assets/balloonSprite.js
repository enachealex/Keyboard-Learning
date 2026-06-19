import balloonUrl from './balloon.png';

/** Hue-rotate offsets from the base red balloon art. */
export const BALLOON_HUES = [0, 198, 118, 52, 268, 28];

export function randomBalloonHue() {
  return BALLOON_HUES[Math.floor(Math.random() * BALLOON_HUES.length)];
}

export function applyBalloonHue(el, hueDeg) {
  el.style.setProperty('--balloon-hue', `${hueDeg}deg`);
}

/**
 * @param {string} className
 * @param {number} width
 * @param {number} height
 * @param {number} hueDeg
 * @returns {{ el: HTMLDivElement, motionEl: HTMLDivElement }}
 */
export function createBalloonSprite(className, width, height, hueDeg) {
  const el = document.createElement('div');
  el.className = className;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  applyBalloonHue(el, hueDeg);

  const motionEl = document.createElement('div');
  motionEl.className = 'balloon-motion';

  const img = document.createElement('img');
  img.src = balloonUrl;
  img.className = 'balloon-sprite-img';
  img.draggable = false;
  img.alt = '';
  motionEl.appendChild(img);
  el.appendChild(motionEl);

  return { el, motionEl };
}
