import { charToCode } from '../config/keyCodes.js';

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '],
];

export class VirtualKeyboard {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'virtual-keyboard';
    this._keys = new Map();
    this._build();
  }

  _build() {
    for (const row of ROWS) {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      for (const key of row) {
        const keyEl = document.createElement('div');
        keyEl.className = 'kb-key';
        if (key === ' ') {
          keyEl.classList.add('space');
          keyEl.textContent = 'space';
        } else {
          keyEl.textContent = key;
        }
        const code = charToCode(key);
        if (code) this._keys.set(code, keyEl);
        rowEl.appendChild(keyEl);
      }
      this.el.appendChild(rowEl);
    }
  }

  highlightKey(char) {
    this.clearHighlight();
    const code = charToCode(char);
    const keyEl = code ? this._keys.get(code) : null;
    if (keyEl) keyEl.classList.add('highlight');
  }

  clearHighlight() {
    this.el.querySelectorAll('.kb-key').forEach((k) => {
      k.classList.remove('highlight', 'correct', 'wrong');
    });
  }

  flashCorrect(char) {
    const code = charToCode(char);
    const keyEl = code ? this._keys.get(code) : null;
    if (keyEl) {
      keyEl.classList.add('correct');
      setTimeout(() => keyEl.classList.remove('correct'), 300);
    }
  }

  flashWrong(char) {
    const code = charToCode(char);
    const keyEl = code ? this._keys.get(code) : null;
    if (keyEl) {
      keyEl.classList.add('wrong');
      setTimeout(() => keyEl.classList.remove('wrong'), 300);
    }
  }
}
