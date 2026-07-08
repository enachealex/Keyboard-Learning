import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { ADULT_WORD_POOLS } from '../../config/adultWordLists.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

export class TypingTest extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const pool = ADULT_WORD_POOLS[this.cfg.pool] ?? ADULT_WORD_POOLS.easy;
    this.words = this._shuffle([...pool]);
    this.wordIndex = 0;
    this.charIndex = 0;
    this.timeLeft = this.cfg.timeLimit ?? 60;
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
    this.timerEl = this._el('div', 'adult-test-timer');
    this.wordEl = this._el('div', 'word-display adult-test-display');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.statsEl = this._el('div', 'adult-test-live', 'Type the words shown. Spaces count.');
    this.timerBar = this._el('div', 'timer-bar');
    this.timerFill = this._el('div', 'timer-fill');
    this.timerBar.appendChild(this.timerFill);
    const parts = [this.timerEl, this.wordEl, this.feedbackEl, this.statsEl, this.timerBar];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
    this._updateTimer();
  }

  _currentWord() {
    if (this.wordIndex >= this.words.length) {
      this.words.push(...this._shuffle([...ADULT_WORD_POOLS[this.cfg.pool] ?? ADULT_WORD_POOLS.easy]));
    }
    return this.words[this.wordIndex];
  }

  _showWord() {
    const word = this._currentWord();
    this.charIndex = 0;
    this._renderWord(word);
    const ch = word[0];
    if (ch) this.keyboard?.highlightKey(ch);
  }

  _renderWord(word) {
    renderCharWord(this.wordEl, word, this.charIndex);
  }

  _updateTimer() {
    const limit = this.cfg.timeLimit ?? 60;
    this.timerEl.textContent = this.started
      ? `${Math.ceil(this.timeLeft)}s remaining`
      : `${Math.ceil(this.timeLeft)}s — timer starts when you type`;
    const pct = (this.timeLeft / limit) * 100;
    this.timerFill.style.width = `${pct}%`;
    const liveWpm = this.getWpm();
    this.statsEl.textContent = `Accuracy: ${this.getAccuracy()}% · Live WPM: ${liveWpm}`;
  }

  tick(deltaMs) {
    if (this.complete) return;
    this.timeLeft -= deltaMs / 1000;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this._finish();
      return;
    }
    this._updateTimer();
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const word = this._currentWord();
    const expected = word[this.charIndex];

    if (codesMatch(expected, event)) {
      this.correct++;
      this.charIndex++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);

      if (this.charIndex >= word.length) {
        this.wordIndex++;
        this._showWord();
      } else {
        this._renderWord(word);
        this.keyboard?.highlightKey(word[this.charIndex]);
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Error — keep going!', true);
    }
    this._updateTimer();
  }
}
