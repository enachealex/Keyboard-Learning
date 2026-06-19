import popBurstUrl from './pop-burst.png';

/**
 * Gentle floating motion — sway, bob, and tilt like real balloons on a string.
 */
export function createBalloonMotion(overrides = {}) {
  return {
    phase: Math.random() * Math.PI * 2,
    phase2: Math.random() * Math.PI * 2,
    swayAmp: 10 + Math.random() * 16,
    swayFreq: 0.7 + Math.random() * 0.55,
    bobAmp: 4 + Math.random() * 8,
    rotAmp: 5 + Math.random() * 7,
    rotFreq: 0.45 + Math.random() * 0.35,
    breatheAmp: 0.02 + Math.random() * 0.025,
    time: 0,
    ...overrides,
  };
}

function applyMotionTransform(motionEl, rot, scale) {
  motionEl.style.transform = `rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
}

/** Rising balloons (Balloon Pop). */
export function updateRisingBalloon(balloon, deltaMs, fieldW, size) {
  const dt = deltaMs / 1000;
  balloon.time += dt;
  balloon.y += balloon.speed * (deltaMs / 16);

  const sway = Math.sin(balloon.time * balloon.swayFreq + balloon.phase) * balloon.swayAmp;
  const bob = Math.sin(balloon.time * balloon.swayFreq * 1.6 + balloon.phase2) * balloon.bobAmp;
  const rot = Math.sin(balloon.time * balloon.rotFreq + balloon.phase) * balloon.rotAmp;
  const scale = 1 + Math.sin(balloon.time * 2 + balloon.phase2) * balloon.breatheAmp;

  const x = Math.max(0, Math.min(fieldW - size, balloon.x + sway));

  balloon.el.style.left = `${x}px`;
  balloon.el.style.bottom = `${balloon.y + bob}px`;
  applyMotionTransform(balloon.motionEl, rot, scale);
}

/** Left-to-right balloons (Balloon Letters). */
export function updateDriftingBalloon(balloon, deltaMs) {
  const dt = deltaMs / 1000;
  balloon.time += dt;
  balloon.x += balloon.speed * (deltaMs / 16);

  const bob = Math.sin(balloon.time * balloon.swayFreq + balloon.phase) * balloon.swayAmp;
  const sway = Math.sin(balloon.time * balloon.swayFreq * 0.85 + balloon.phase2) * (balloon.swayAmp * 0.35);
  const rot = Math.sin(balloon.time * balloon.rotFreq + balloon.phase) * balloon.rotAmp;
  const scale = 1 + Math.sin(balloon.time * 1.7 + balloon.phase2) * balloon.breatheAmp;

  balloon.el.style.left = `${balloon.x + sway}px`;
  balloon.el.style.top = `${balloon.y + bob}px`;
  applyMotionTransform(balloon.motionEl, rot, scale);
}

/** Starburst pop sprite when a balloon pops. */
export function spawnPopBurst(field, balloonEl) {
  const fieldRect = field.getBoundingClientRect();
  const rect = balloonEl.getBoundingClientRect();
  const hue = balloonEl.style.getPropertyValue('--balloon-hue') || '0deg';
  const size = Math.max(rect.width, rect.height) * 1.15;

  const burst = document.createElement('div');
  burst.className = 'balloon-pop-sprite';
  burst.style.left = `${rect.left - fieldRect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top - fieldRect.top + rect.height * 0.38}px`;
  burst.style.width = `${size}px`;
  burst.style.height = `${size}px`;
  burst.style.setProperty('--balloon-hue', hue);

  const img = document.createElement('img');
  img.src = popBurstUrl;
  img.className = 'balloon-pop-sprite-img';
  img.draggable = false;
  img.alt = '';
  burst.appendChild(img);

  field.appendChild(burst);
  requestAnimationFrame(() => burst.classList.add('balloon-pop-sprite--active'));
  setTimeout(() => burst.remove(), 480);
}
