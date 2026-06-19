import { createMascot } from './Mascot.js';
import {
  setDesktopInputBypass,
  shouldShowDesktopOnlyMessage,
  watchDesktopOnlyMessage,
} from '../utils/inputCapability.js';

const MESSAGE =
  'This game requires a keyboard and mouse! Please visit on a desktop to play.';

export function createDesktopOnlyGate() {
  const overlay = document.createElement('div');
  overlay.className = 'desktop-only-gate';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'desktop-only-title');
  overlay.hidden = true;

  const card = document.createElement('div');
  card.className = 'desktop-only-gate__card';

  const brand = document.createElement('div');
  brand.className = 'desktop-only-gate__brand';
  brand.appendChild(createMascot({ hideWordmark: true }));

  const wordmark = document.createElement('p');
  wordmark.className = 'brand-wordmark';
  wordmark.textContent = 'KEY BUDDY';
  brand.appendChild(wordmark);

  card.appendChild(brand);

  const title = document.createElement('h1');
  title.id = 'desktop-only-title';
  title.className = 'desktop-only-gate__title';
  title.textContent = 'Key Buddy';

  const text = document.createElement('p');
  text.className = 'desktop-only-gate__message';
  text.textContent = MESSAGE;

  const icons = document.createElement('p');
  icons.className = 'desktop-only-gate__icons';
  icons.textContent = '⌨️ 🖱️';

  const bypass = document.createElement('button');
  bypass.type = 'button';
  bypass.className = 'desktop-only-gate__bypass';
  bypass.textContent = 'I have a keyboard and mouse';
  bypass.addEventListener('click', () => {
    setDesktopInputBypass();
    sync();
  });

  card.append(title, text, icons, bypass);
  overlay.appendChild(card);

  let unwatch = null;

  function sync() {
    const show = shouldShowDesktopOnlyMessage();
    overlay.hidden = !show;
    document.body.classList.toggle('desktop-only-blocked', show);
  }

  return {
    element: overlay,
    mount(parent) {
      parent.appendChild(overlay);
      sync();
      unwatch = watchDesktopOnlyMessage(sync);
      window.addEventListener('resize', sync);
      window.addEventListener('orientationchange', sync);
    },
    destroy() {
      unwatch?.();
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      overlay.remove();
      document.body.classList.remove('desktop-only-blocked');
    },
  };
}
