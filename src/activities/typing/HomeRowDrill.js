import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { HOME_ROW_POOLS } from '../../config/adultWordLists.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

const FINGER_HINT = 'Left: A S D F · Right: J K L ;';

export class HomeRowDrill extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const pool = HOME_ROW_POOLS[this.cfg.pool] ?? HOME_ROW_POOLS.easy;
    this.sequences = this._shuffle([...pool]).slice(0, this.cfg.count);
    this.seqIndex = 0;
    this.charIndex = 0;
    this.total = this.sequences.reduce((sum, s) => sum + s.replace(/\s/g, '').length, 0);
    this._buildUI();
    this._showSequence();
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
    this.hintEl = this._el('p', 'adult-drill-hint', FINGER_HINT);
    this.promptEl = this._el('div', 'word-display adult-drill-display');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.hintEl, this.promptEl, this.feedbackEl, this.progressEl];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
  }

  _currentText() {
    return this.sequences[this.seqIndex] ?? '';
  }

  _showSequence() {
    if (this.seqIndex >= this.sequences.length) {
      this._finish();
      return;
    }
    this.charIndex = 0;
    this._renderSequence();
    const ch = this._nextExpectedChar();
    if (ch && ch !== ' ') this.keyboard?.highlightKey(ch);
    this.progressEl.textContent = `Drill ${this.seqIndex + 1} / ${this.sequences.length}`;
  }

  _nextExpectedChar() {
    const text = this._currentText();
    while (this.charIndex < text.length && text[this.charIndex] === ' ') {
      this.charIndex++;
    }
    return text[this.charIndex];
  }

  _renderSequence() {
    renderCharWord(this.promptEl, this._currentText(), this.charIndex);
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const expected = this._nextExpectedChar();
    if (!expected) return;

    if (codesMatch(expected, event)) {
      this.correct++;
      this.charIndex++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);

      const next = this._nextExpectedChar();
      if (!next) {
        this.seqIndex++;
        this._showFeedback('Drill complete!');
        setTimeout(() => this._showSequence(), 350);
      } else {
        this._renderSequence();
        if (next !== ' ') this.keyboard?.highlightKey(next);
        this._showFeedback('Good!');
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Try again — keep wrists neutral.', true);
    }
  }
}
