import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { MELODY_PATTERN_POOLS } from '../../config/adultResearchContent.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

/**
 * Melodic key patterns with auditory feedback — therapeutic keyboard music playing.
 */
export class MelodyKeys extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const pool = MELODY_PATTERN_POOLS[this.cfg.pool] ?? MELODY_PATTERN_POOLS.easy;
    this.patterns = this._shuffle([...pool]).slice(0, this.cfg.count);
    this.patternIndex = 0;
    this.charIndex = 0;
    this.total = this.patterns.reduce((sum, s) => sum + s.length, 0);
    this._buildUI();
    this._showPattern();
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
    this.hintEl = this._el('p', 'adult-drill-hint', 'Play each melody on the keys — listen and match the rhythm.');
    this.titleEl = this._el('div', 'adult-melody-title', '♪ Melody Keys');
    this.promptEl = this._el('div', 'word-display adult-melody-display');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.hintEl, this.titleEl, this.promptEl, this.feedbackEl, this.progressEl];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
  }

  _currentText() {
    return this.patterns[this.patternIndex] ?? '';
  }

  _showPattern() {
    if (this.patternIndex >= this.patterns.length) {
      this._finish();
      return;
    }
    this.charIndex = 0;
    this._renderPattern();
    const ch = this._currentText()[0];
    if (ch) this.keyboard?.highlightKey(ch);
    this.progressEl.textContent = `Melody ${this.patternIndex + 1} / ${this.patterns.length}`;
    this.sound.playClick();
  }

  _renderPattern() {
    renderCharWord(this.promptEl, this._currentText(), this.charIndex, {
      useWordGroups: false,
      spaceGlyph: '',
      spanClass: (_i, _ch, state) => `adult-melody-note ${state}`,
    });
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
      this.sound.playPop();
      this.keyboard?.flashCorrect(expected);

      if (this.charIndex >= text.length) {
        this.patternIndex++;
        this.sound.playSuccess();
        this._showFeedback('Nice melody!');
        setTimeout(() => this._showPattern(), 400);
      } else {
        this._renderPattern();
        this.keyboard?.highlightKey(text[this.charIndex]);
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Try the next note in the melody.', true);
    }
  }
}
