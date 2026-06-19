/** Inline Key Buddy logo — graphic only; text lives inside SVG paths, not selectable HTML. */
export const KEY_BUDDY_LOGO_MARKUP = `
<svg class="mascot-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <circle cx="60" cy="55" r="52" fill="#4a90d9"/>
  <circle cx="44" cy="46" r="7" fill="#3d4852"/>
  <circle cx="76" cy="46" r="7" fill="#3d4852"/>
  <circle cx="46" cy="44" r="2.2" fill="#fff"/>
  <circle cx="78" cy="44" r="2.2" fill="#fff"/>
  <ellipse cx="60" cy="64" rx="18" ry="10" fill="#fff"/>
  <ellipse cx="60" cy="61" rx="8.5" ry="4.5" fill="#e74c3c"/>
  <rect x="35" y="76" width="50" height="7" rx="3.5" fill="#f5a623"/>
  <defs>
    <path id="mascot-arc" d="M 22 92 Q 60 108 98 92" fill="none"/>
  </defs>
  <text
    font-family="var(--font-display), 'Fredoka One', 'Segoe UI', sans-serif"
    font-size="10.5"
    font-weight="700"
    fill="#fff"
    letter-spacing="0.6"
  >
    <textPath href="#mascot-arc" startOffset="50%" text-anchor="middle">KEY BUDDY</textPath>
  </text>
</svg>`;

export function createMascot() {
  const wrap = document.createElement('div');
  wrap.className = 'mascot';
  wrap.innerHTML = KEY_BUDDY_LOGO_MARKUP;
  return wrap;
}
