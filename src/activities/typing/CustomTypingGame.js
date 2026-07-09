import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

/**
 * Teacher-built typing game (school edition). One engine, two modes,
 * fully driven by the game definition a teacher saved in the dashboard:
 *
 *   mode 'words'   — type each word/phrase from the game's word list
 *   mode 'letters' — a single character appears; press its key
 *
 * config: { mode, words, count, timed, timeLimit, showKeyboard }
 */
export class CustomTypingGame extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    this.mode = cfg.mode === 'letters' ? 'letters' : 'words';
    this.pool = this._buildPool(cfg.words ?? []);
    this.count = cfg.count ?? 10;
    this.timed = Boolean(cfg.timed);
    this.timeLeft = this.timed ? (cfg.timeLimit ?? 60) : 0;

    this.queue = this._shuffle([...this.pool]);
    this.itemIndex = 0;
    this.charIndex = 0;
    this.current = null;

    if (this.mode === 'words') {
      this.total = this.timed ? 0 : this._plannedChars();
    } else {
      this.total = this.timed ? 0 : this.count;
    }

    this._buildUI();
    this._next();
  }

  _buildPool(words) {
    if (this.cfg.mode === 'letters') {
      // Letters mode drills the unique characters that make up the words.
      const chars = new Set();
      for (const word of words) {
        for (const ch of word) {
          if (ch !== ' ') chars.add(ch);
        }
      }
      return chars.size > 0 ? [...chars] : ['a', 's', 'd', 'f', 'j', 'k', 'l'];
    }
    return words.length > 0 ? words : ['practice', 'typing', 'keyboard'];
  }

  _plannedChars() {
    let sum = 0;
    for (let i = 0; i < this.count; i++) {
      sum += this.queue[i % this.queue.length].length;
    }
    return sum;
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
    this.displayEl = this.mode === 'words'
      ? this._el('div', 'word-display')
      : this._el('div', 'activity-prompt');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.displayEl, this.feedbackEl, this.progressEl];
    if (this.timed) {
      this.timerBar = this._el('div', 'timer-bar');
      this.timerFill = this._el('div', 'timer-fill');
      this.timerBar.appendChild(this.timerFill);
      parts.splice(2, 0, this.timerBar);
    }
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
    this._updateProgress();
  }

  _itemAt(index) {
    if (index >= this.queue.length) {
      this.queue.push(...this._shuffle([...this.pool]));
    }
    return this.queue[index];
  }

  _next() {
    if (!this.timed && this.itemIndex >= this.count) {
      this._finish();
      return;
    }
    this.current = this._itemAt(this.itemIndex);
    this.charIndex = 0;
    this._render();
  }

  _render() {
    if (this.mode === 'words') {
      renderCharWord(this.displayEl, this.current, this.charIndex);
      this.keyboard?.highlightKey(this.current[this.charIndex]);
    } else {
      this.displayEl.textContent = this.current;
      this.keyboard?.highlightKey(this.current);
    }
    this._updateProgress();
  }

  _updateProgress() {
    if (this.timed) {
      const done = this.mode === 'words' ? this.itemIndex : this.correct;
      this.progressEl.textContent = `Done: ${done} · Time: ${Math.ceil(this.timeLeft)}s`;
      if (this.timerFill) {
        this.timerFill.style.width = `${(this.timeLeft / (this.cfg.timeLimit ?? 60)) * 100}%`;
      }
    } else {
      const label = this.mode === 'words' ? 'Word' : 'Key';
      const current = Math.min((this.mode === 'words' ? this.itemIndex : this.correct) + 1, this.count);
      this.progressEl.textContent = `${label} ${current} / ${this.count}`;
    }
  }

  tick(deltaMs) {
    if (!this.timed || this.complete) return;
    this.timeLeft -= deltaMs / 1000;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.total = this.correct;
      this._finish();
      return;
    }
    this._updateProgress();
  }

  onKeyDown(event) {
    if (this.complete || this.current == null) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const expected = this.mode === 'words' ? this.current[this.charIndex] : this.current;

    if (codesMatch(expected, event)) {
      this.correct++;
      if (this.timed) this.total = this.correct;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);

      if (this.mode === 'words') {
        this.charIndex++;
        if (this.charIndex >= this.current.length) {
          this.itemIndex++;
          this._showFeedback('Nice!');
          this._next();
        } else {
          this._render();
        }
      } else {
        this.itemIndex++;
        this._showFeedback('Nice!');
        this._next();
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Try again!', true);
    }
  }
}
