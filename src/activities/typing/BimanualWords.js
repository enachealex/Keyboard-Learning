import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import {
  BIMANUAL_WORD_POOLS,
  handForChar,
} from '../../config/adultResearchContent.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

/**
 * Type words using both hands — bimanual keyboard coordination research.
 */
export class BimanualWords extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const pool = BIMANUAL_WORD_POOLS[this.cfg.pool] ?? BIMANUAL_WORD_POOLS.easy;
    this.words = this._shuffle([...pool]).slice(0, this.cfg.count);
    this.wordIndex = 0;
    this.charIndex = 0;
    this.total = this.words.reduce((sum, w) => sum + w.replace(/\s/g, '').length, 0);
    this._buildUI();
    this._showWord();
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
    this.hintEl = this._el('p', 'adult-drill-hint', 'Blue = left hand · Orange = right hand · Use both hands evenly.');
    this.legendEl = this._el('div', 'adult-bimanual-legend', '◀ Left hand    Right hand ▶');
    this.promptEl = this._el('div', 'word-display adult-bimanual-display');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.hintEl, this.legendEl, this.promptEl, this.feedbackEl, this.progressEl];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
  }

  _currentWord() {
    return this.words[this.wordIndex] ?? '';
  }

  _showWord() {
    if (this.wordIndex >= this.words.length) {
      this._finish();
      return;
    }
    this.charIndex = 0;
    this._renderWord();
    const word = this._currentWord();
    while (this.charIndex < word.length && word[this.charIndex] === ' ') this.charIndex++;
    const ch = word[this.charIndex];
    if (ch) this.keyboard?.highlightKey(ch);
    this.progressEl.textContent = `Word ${this.wordIndex + 1} / ${this.words.length}`;
  }

  _renderWord() {
    const word = this._currentWord();
    renderCharWord(this.promptEl, word, this.charIndex, {
      spanClass: (_i, ch, state) => {
        const hand = handForChar(ch);
        const classes = ['adult-bimanual-char', state];
        if (hand === 'left') classes.push('adult-bimanual-char--left');
        else if (hand === 'right') classes.push('adult-bimanual-char--right');
        return classes.join(' ');
      },
    });
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const word = this._currentWord();
    while (this.charIndex < word.length && word[this.charIndex] === ' ') {
      this.charIndex++;
      this.correct++;
    }
    const expected = word[this.charIndex];
    if (!expected) return;

    if (codesMatch(expected, event)) {
      this.correct++;
      this.charIndex++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);

      if (this.charIndex >= word.length) {
        this.wordIndex++;
        this._showFeedback('Nice — both hands!');
        setTimeout(() => this._showWord(), 350);
      } else {
        while (this.charIndex < word.length && word[this.charIndex] === ' ') {
          this.charIndex++;
          this.correct++;
        }
        this._renderWord();
        const next = word[this.charIndex];
        if (next) this.keyboard?.highlightKey(next);
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Use the highlighted hand for this letter.', true);
    }
  }
}
