import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { ADULT_WORD_POOLS } from '../../config/adultWordLists.js';
import { codesMatch } from '../../config/keyCodes.js';
import { fitWordDisplay } from '../../utils/wordDisplay.js';

/**
 * Type words with mandatory Backspace self-correction — digital writing research.
 */
export class FixAndType extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const pool = ADULT_WORD_POOLS[this.cfg.pool] ?? ADULT_WORD_POOLS.easy;
    this.words = this._shuffle([...pool]).slice(0, this.cfg.count);
    this.wordIndex = 0;
    this.charIndex = 0;
    this.typed = '';
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
    this.hintEl = this._el('p', 'adult-drill-hint', 'Type each word. Use Backspace to fix mistakes before continuing.');
    this.targetEl = this._el('div', 'adult-fix-target');
    this.inputEl = this._el('div', 'word-display adult-fix-display');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.hintEl, this.targetEl, this.inputEl, this.feedbackEl, this.progressEl];
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
    this.typed = '';
    this.charIndex = 0;
    const word = this._currentWord();
    this.targetEl.textContent = `Type: ${word}`;
    this._renderTyped();
    const ch = word[0];
    if (ch && ch !== ' ') this.keyboard?.highlightKey(ch);
    this.progressEl.textContent = `Word ${this.wordIndex + 1} / ${this.words.length}`;
  }

  _renderTyped() {
    const word = this._currentWord();
    this.inputEl.innerHTML = '';
    for (let i = 0; i < word.length; i++) {
      const span = document.createElement('span');
      const typedCh = this.typed[i];
      if (typedCh == null) {
        span.className = i === this.typed.length ? 'current' : 'remaining';
        span.textContent = word[i] === ' ' ? '␣' : word[i];
      } else if (typedCh === word[i]) {
        span.className = 'typed';
        span.textContent = typedCh === ' ' ? '␣' : typedCh;
      } else {
        span.className = 'adult-fix-error';
        span.textContent = typedCh === ' ' ? '␣' : typedCh;
      }
      this.inputEl.appendChild(span);
    }
    fitWordDisplay(this.inputEl);
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const word = this._currentWord();
    const expected = word[this.typed.length];

    if (event.key === 'Backspace') {
      if (this.typed.length > 0) {
        this.typed = this.typed.slice(0, -1);
        this._renderTyped();
        const next = word[this.typed.length];
        if (next && next !== ' ') this.keyboard?.highlightKey(next);
        this._showFeedback('Fixed — keep typing.');
      }
      return;
    }

    if (!expected) return;

    if (expected === ' ' && event.key === ' ') {
      this.typed += ' ';
      this.correct++;
      this.sound.playCorrect();
      this._advanceWord(word);
      return;
    }

    if (codesMatch(expected, event)) {
      this.typed += expected;
      this.correct++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);
      this._advanceWord(word);
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Wrong key — press Backspace, then try again.', true);
    }
  }

  _advanceWord(word) {
    if (this.typed.length >= word.length) {
      this.wordIndex++;
      this._showFeedback('Word complete!');
      setTimeout(() => this._showWord(), 350);
    } else {
      this._renderTyped();
      const next = word[this.typed.length];
      if (next && next !== ' ') this.keyboard?.highlightKey(next);
    }
  }
}
