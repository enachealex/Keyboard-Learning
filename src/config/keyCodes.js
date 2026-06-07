const CHAR_TO_CODE = {
  ' ': 'Space',
  '.': 'Period',
  ',': 'Comma',
  '!': 'Digit1',
  '?': 'Slash',
  ';': 'Semicolon',
  "'": 'Quote',
  '-': 'Minus',
  '=': 'Equal',
};

for (let i = 0; i < 26; i++) {
  const lower = String.fromCharCode(97 + i);
  const upper = String.fromCharCode(65 + i);
  const code = `Key${upper}`;
  CHAR_TO_CODE[lower] = code;
  CHAR_TO_CODE[upper] = code;
}

for (let i = 0; i < 10; i++) {
  CHAR_TO_CODE[String(i)] = `Digit${i}`;
}

export function charToCode(char) {
  return CHAR_TO_CODE[char] ?? null;
}

export function codesMatch(char, event) {
  const expected = charToCode(char);
  if (!expected) return event.key === char;
  return event.code === expected;
}
