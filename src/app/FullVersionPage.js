import { FAMILY_PAYMENT_URL, FAMILY_PRICE, purchaseMailto } from '../config/fullVersion.js';

/**
 * Full Version purchase page (free web edition + Free Edition desktop).
 * The flow: buy → license code arrives by email → enter it in Parent
 * Settings → Desktop license → update downloads enabled.
 *
 * Inside the desktop app external navigation is blocked by design, so
 * the buy button hands off to the system browser via the preload bridge.
 */
export function renderFullVersionPage(app, { onSchools }) {
  const screen = _el('div', 'screen schools-screen fullver-screen');

  const header = _el('div', 'screen-header');
  header.appendChild(_el('h1', 'screen-title', 'Get the Full Version'));
  header.appendChild(_el('p', 'screen-subtitle',
    'The Free Edition keeps working forever. The full version keeps it growing — update downloads are enabled as new games and features ship.'));
  screen.appendChild(header);

  // How it works
  const how = _el('div', 'schools-how');
  how.appendChild(_el('h2', 'hub-section-title', 'How it works'));
  const steps = _el('div', 'schools-steps');
  const STEPS = [
    ['1', 'Buy the Family package', 'Checkout happens on a secure Stripe payment page.'],
    ['2', 'Get your license code', 'Your personal code arrives by email, usually within a day.'],
    ['3', 'Enter it in the app', 'Parent Settings → Desktop license. Updates are enabled from then on.'],
  ];
  for (const [n, title, text] of STEPS) {
    const step = _el('div', 'schools-step');
    step.appendChild(_el('div', 'schools-step__number', n));
    step.appendChild(_el('h3', 'schools-step__title', title));
    step.appendChild(_el('p', 'schools-step__text', text));
    steps.appendChild(step);
  }
  how.appendChild(steps);
  screen.appendChild(how);

  // Packages
  const grid = _el('div', 'fullver-packages');

  const family = _el('div', 'fullver-package fullver-package--primary');
  family.appendChild(_el('h3', 'fullver-package__name', 'Family'));
  family.appendChild(_el('p', 'fullver-package__price', `${FAMILY_PRICE} · one-time`));
  const perks = _el('ul', 'fullver-package__perks');
  for (const perk of [
    'A personal license code for your household',
    'Update downloads enabled — every new game and feature',
    'All progress and settings carry over',
    'Yours for good: no subscription, the code never expires',
  ]) {
    perks.appendChild(_el('li', null, perk));
  }
  family.appendChild(perks);
  family.appendChild(buildBuyCta());
  grid.appendChild(family);

  const schools = _el('div', 'fullver-package');
  schools.appendChild(_el('h3', 'fullver-package__name', 'Schools'));
  schools.appendChild(_el('p', 'fullver-package__price', 'Per-teacher licensing'));
  const sPerks = _el('ul', 'fullver-package__perks');
  for (const perk of [
    'Class rosters and student sign-in',
    'Teacher dashboard, word lists, and custom games',
    'Quotes and purchase orders welcome',
  ]) {
    sPerks.appendChild(_el('li', null, perk));
  }
  schools.appendChild(sPerks);
  const quoteBtn = _btn('See school options', 'btn btn-outline', onSchools);
  schools.appendChild(quoteBtn);
  grid.appendChild(schools);

  screen.appendChild(grid);

  const fineprint = _el('p', 'schools-fineprint');
  fineprint.textContent = 'Already bought? Your license code is in your email — enter it in the app under Parent Settings → Desktop license. One code covers your household’s computers.';
  screen.appendChild(fineprint);

  return screen;
}

function buildBuyCta() {
  const wrap = _el('div', 'fullver-cta');

  // Desktop app: external links are blocked in-window by design — hand
  // off to the system browser, where the purchase completes.
  if (window.keyBuddyDesktop) {
    wrap.appendChild(_btn(`Continue in your browser — ${FAMILY_PRICE}`, 'btn btn-primary btn-large', () => {
      window.keyBuddyDesktop.openFullVersionPage?.();
    }));
    wrap.appendChild(_hint('Opens keybuddy.thejumpvault.com to complete your purchase.'));
    return wrap;
  }

  if (FAMILY_PAYMENT_URL) {
    const buy = _el('a', 'btn btn-primary btn-large', `Buy Family — ${FAMILY_PRICE}`);
    buy.href = FAMILY_PAYMENT_URL;
    wrap.appendChild(buy);
    wrap.appendChild(_hint('Secure checkout by Stripe. Your license code follows by email.'));
  } else {
    const buy = _el('a', 'btn btn-primary btn-large', `Buy by email — ${FAMILY_PRICE}`);
    buy.href = purchaseMailto();
    wrap.appendChild(buy);
    wrap.appendChild(_hint('Card checkout is coming online — for now we reply with your payment link within a day.'));
  }
  return wrap;
}

function _hint(text) {
  return _el('p', 'fullver-cta__hint', text);
}

function _el(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function _btn(text, className, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}
