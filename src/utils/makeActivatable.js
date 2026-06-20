/** Keyboard + click parity for non-button interactive elements. */
export function makeActivatable(element, onActivate, label) {
  element.setAttribute('role', 'button');
  if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
  if (label) element.setAttribute('aria-label', label);

  element.addEventListener('click', onActivate);
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  });
}
