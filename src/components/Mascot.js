export function createMascot() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mascot');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.innerHTML = `
    <circle cx="60" cy="60" r="55" fill="#4a90d9"/>
    <circle cx="42" cy="50" r="8" fill="#fff"/>
    <circle cx="78" cy="50" r="8" fill="#fff"/>
    <circle cx="44" cy="50" r="4" fill="#2c3e50"/>
    <circle cx="80" cy="50" r="4" fill="#2c3e50"/>
    <ellipse cx="60" cy="72" rx="18" ry="12" fill="#fff"/>
    <ellipse cx="60" cy="68" rx="8" ry="5" fill="#e74c3c"/>
    <rect x="30" y="88" width="60" height="8" rx="4" fill="#f5a623"/>
    <text x="60" y="110" text-anchor="middle" font-size="10" fill="#fff" font-family="sans-serif">KEY BUDDY</text>
  `;
  return svg;
}
