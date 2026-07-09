import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { WORDS_EASY, WORDS_MEDIUM, PHRASES_HARD } from '../../config/wordLists.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

const POOLS = { easy: WORDS_EASY, medium: WORDS_MEDIUM, hard: PHRASES_HARD };

export class WordGarden extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    // Teacher word lists (school edition) take priority over built-in pools.
    const pool = cfg.customWords?.length ? cfg.customWords : POOLS[cfg.pool];
    this.words = this._shuffle([...pool]).slice(0, cfg.count);
    this.wordIndex = 0;
    this.charIndex = 0;
    this.total = this.words.reduce((s, w) => s + w.length, 0);
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
    this.wordEl = this._el('div', 'word-display');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.wordEl, this.feedbackEl, this.progressEl];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
  }

  _showWord() {
    if (this.wordIndex >= this.words.length) {
      this._finish();
      return;
    }
    const word = this.words[this.wordIndex];
    this.charIndex = 0;
    this._renderWord(word);
    this.keyboard?.highlightKey(word[0]);
    this.progressEl.textContent = `Word ${this.wordIndex + 1} / ${this.words.length}`;
  }

  _renderWord(word) {
    renderCharWord(this.wordEl, word, this.charIndex);
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const word = this.words[this.wordIndex];
    const expected = word[this.charIndex];

    if (codesMatch(expected, event)) {
      this.correct++;
      this.charIndex++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);

      if (this.charIndex >= word.length) {
        this.wordIndex++;
        this._showFeedback('Word complete!');
        setTimeout(() => this._showWord(), 400);
      } else {
        this._renderWord(word);
        this.keyboard?.highlightKey(word[this.charIndex]);
        this._showFeedback('Nice!');
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Try again!', true);
    }
  }
}
