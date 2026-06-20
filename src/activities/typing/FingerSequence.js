import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { FINGER_SEQUENCE_POOLS } from '../../config/adultResearchContent.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

/**
 * Sequential finger patterns — motor sequence learning (PLOS ONE typing studies).
 */
export class FingerSequence extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const pool = FINGER_SEQUENCE_POOLS[this.cfg.pool] ?? FINGER_SEQUENCE_POOLS.easy;
    this.sequences = this._shuffle([...pool]).slice(0, this.cfg.count);
    this.seqIndex = 0;
    this.charIndex = 0;
    this.total = this.sequences.reduce((sum, s) => sum + s.length, 0);
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
    this.hintEl = this._el('p', 'adult-drill-hint', 'Repeat each pattern exactly — build sequential muscle memory.');
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
    const ch = this._currentText()[0];
    if (ch) this.keyboard?.highlightKey(ch);
    this.progressEl.textContent = `Pattern ${this.seqIndex + 1} / ${this.sequences.length}`;
  }

  _renderSequence() {
    renderCharWord(this.promptEl, this._currentText(), this.charIndex);
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
        this.seqIndex++;
        this._showFeedback('Pattern complete!');
        setTimeout(() => this._showSequence(), 350);
      } else {
        this._renderSequence();
        this.keyboard?.highlightKey(text[this.charIndex]);
        this._showFeedback('Good!');
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Match the pattern — use the right finger.', true);
    }
  }
}
