/**
 * Best-effort check: does this device/viewport suit keyboard + mouse play?
 *
 * Browsers cannot reliably detect attached hardware before the user interacts.
 * We use viewport size + pointer/hover media queries as a practical proxy.
 */

const NARROW_MQ = '(max-width: 768px)';
const TOUCH_PRIMARY_MQ = '(pointer: coarse) and (hover: none)';
const BYPASS_KEY = 'keybuddy-desktop-input-bypass';

export function isDesktopInputBypassed() {
  try {
    return sessionStorage.getItem(BYPASS_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDesktopInputBypass() {
  try {
    sessionStorage.setItem(BYPASS_KEY, '1');
  } catch {
    // sessionStorage unavailable
  }
}

export function shouldShowDesktopOnlyMessage() {
  if (isDesktopInputBypassed()) return false;
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const narrow = window.matchMedia(NARROW_MQ).matches;
  const touchPrimary = window.matchMedia(TOUCH_PRIMARY_MQ).matches;
  return narrow || touchPrimary;
}

/** Human-readable reason for grown-ups (optional detail). */
export function getInputCapabilityHint() {
  if (typeof window === 'undefined' || !window.matchMedia) return '';
  const parts = [];
  if (window.matchMedia(NARROW_MQ).matches) parts.push('small screen');
  if (window.matchMedia(TOUCH_PRIMARY_MQ).matches) parts.push('touch-first device');
  return parts.join(', ');
}

export function watchDesktopOnlyMessage(onChange) {
  const mqs = [NARROW_MQ, TOUCH_PRIMARY_MQ].map((q) => window.matchMedia(q));
  const handler = () => onChange(shouldShowDesktopOnlyMessage());
  for (const mq of mqs) {
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
  }
  return () => {
    for (const mq of mqs) {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    }
  };
}
