import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { THUMB_ENTRY_POOLS } from '../../config/adultResearchContent.js';
import { codesMatch } from '../../config/keyCodes.js';

const PHONE_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  [' '],
];

/**
 * Touch-style thumb typing drills — touch-screen character entry research.
 */
export class ThumbType extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const pool = THUMB_ENTRY_POOLS[this.cfg.pool] ?? THUMB_ENTRY_POOLS.easy;
    this.entries = this._shuffle([...pool]).slice(0, this.cfg.count);
    this.entryIndex = 0;
    this.charIndex = 0;
    this.total = this.entries.reduce((sum, s) => sum + s.length, 0);
    this._buildUI();
    this._showEntry();
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.hintEl = this._el('p', 'adult-drill-hint', 'Type on the phone layout — practice thumb-friendly mobile entry.');
    this.phoneEl = this._el('div', 'adult-thumb-phone');
    this._buildPhoneKeys();
    this.targetEl = this._el('div', 'adult-thumb-target');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.hintEl, this.phoneEl, this.targetEl, this.feedbackEl, this.progressEl];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
    this._phoneKeys = new Map();
    this.phoneEl.querySelectorAll('.adult-thumb-key').forEach((el) => {
      this._phoneKeys.set(el.dataset.key, el);
    });
  }

  _buildPhoneKeys() {
    for (const row of PHONE_ROWS) {
      const rowEl = this._el('div', 'adult-thumb-row');
      for (const key of row) {
        const keyEl = this._el('div', 'adult-thumb-key');
        keyEl.dataset.key = key;
        keyEl.textContent = key === ' ' ? 'space' : key;
        if (key === ' ') keyEl.classList.add('adult-thumb-key--space');
        rowEl.appendChild(keyEl);
      }
      this.phoneEl.appendChild(rowEl);
    }
  }

  _currentText() {
    return this.entries[this.entryIndex] ?? '';
  }

  _highlightPhone(char) {
    this.phoneEl.querySelectorAll('.adult-thumb-key').forEach((k) => {
      k.classList.remove('adult-thumb-key--active');
    });
    const keyEl = this._phoneKeys.get(char === ' ' ? ' ' : char.toLowerCase());
    if (keyEl) keyEl.classList.add('adult-thumb-key--active');
  }

  _showEntry() {
    if (this.entryIndex >= this.entries.length) {
      this._finish();
      return;
    }
    this.charIndex = 0;
    const text = this._currentText();
    this.targetEl.textContent = `Type: ${text}`;
    const ch = text[0];
    if (ch) {
      this._highlightPhone(ch);
      this.keyboard?.highlightKey(ch);
    }
    this.progressEl.textContent = `Entry ${this.entryIndex + 1} / ${this.entries.length}`;
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const text = this._currentText();
    const expected = text[this.charIndex];
    if (!expected) return;

    if (codesMatch(expected, event)) {
      this.correct++;
      this.charIndex++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);

      if (this.charIndex >= text.length) {
        this.entryIndex++;
        this._showFeedback('Entry complete!');
        setTimeout(() => this._showEntry(), 350);
      } else {
        const next = text[this.charIndex];
        this._highlightPhone(next);
        this.keyboard?.highlightKey(next);
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Match the highlighted phone key.', true);
    }
  }
}
