/** Shrink word-display text until it fits the container width. */
export function fitWordDisplay(el) {
  if (!el) return;

  const fit = () => {
    const maxWidth = el.clientWidth;
    if (maxWidth <= 0) return;

    el.style.fontSize = '';
    let size = parseFloat(getComputedStyle(el).fontSize);
    const minSize = 14;

    while (el.scrollWidth > maxWidth && size > minSize) {
      size -= 2;
      el.style.fontSize = `${size}px`;
    }
  };

  requestAnimationFrame(() => {
    fit();
    requestAnimationFrame(fit);
  });
}

/**
 * Render per-character typing progress with optional word grouping for wrapping.
 * @param {HTMLElement} el
 * @param {string} text
 * @param {number} charIndex
 * @param {{ spaceGlyph?: string, useWordGroups?: boolean, spanClass?: (i: number, ch: string, state: string) => string }} options
 */
export function renderCharWord(el, text, charIndex, options = {}) {
  const {
    spaceGlyph = '␣',
    useWordGroups = true,
    spanClass = null,
  } = options;

  el.innerHTML = '';
  let group = null;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const state = i < charIndex ? 'typed' : i === charIndex ? 'current' : 'remaining';
    const span = document.createElement('span');

    if (spanClass) {
      span.className = spanClass(i, ch, state);
    } else {
      span.className = state;
    }

    span.textContent = ch === ' ' ? spaceGlyph : ch;

    if (useWordGroups && ch !== ' ') {
      if (!group) {
        group = document.createElement('span');
        group.className = 'word-display__word';
        el.appendChild(group);
      }
      group.appendChild(span);
    } else {
      group = null;
      el.appendChild(span);
    }
  }

  fitWordDisplay(el);
}
