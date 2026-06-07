import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { LETTERS_EASY, LETTERS_MEDIUM, LETTERS_HARD } from '../../config/wordLists.js';
import { codesMatch } from '../../config/keyCodes.js';

const POOLS = { easy: LETTERS_EASY, medium: LETTERS_MEDIUM, hard: LETTERS_HARD };

export class LetterPop extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    this.pool = [...POOLS[cfg.pool]];
    this.remaining = cfg.timed ? 99 : cfg.count;
    this.total = cfg.timed ? 0 : cfg.count;
    this.current = null;
    this.timeLeft = cfg.timed ? cfg.timeLimit : 0;
    this._buildUI();
    this._nextLetter();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.promptEl = this._el('div', 'activity-prompt');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
    }

    if (this.cfg.timed) {
      this.timerBar = this._el('div', 'timer-bar');
      this.timerFill = this._el('div', 'timer-fill');
      this.timerBar.appendChild(this.timerFill);
      const parts = [this.promptEl, this.feedbackEl, this.timerBar, this.progressEl];
      if (this.keyboard) parts.push(this.keyboard.el);
      this.container.append(...parts);
    } else {
      const parts = [this.promptEl, this.feedbackEl, this.progressEl];
      if (this.keyboard) parts.push(this.keyboard.el);
      this.container.append(...parts);
    }
  }

  _nextLetter() {
    if (!this.cfg.timed && this.correct >= this.cfg.count) {
      this._finish();
      return;
    }
    const idx = Math.floor(Math.random() * this.pool.length);
    this.current = this.pool[idx];
    this.promptEl.textContent = this.current;
    this.promptEl.classList.remove('shake');
    this.keyboard?.highlightKey(this.current);
    this._updateProgress();
  }

  _updateProgress() {
    if (this.cfg.timed) {
      this.progressEl.textContent = `Popped: ${this.correct} · Time: ${Math.ceil(this.timeLeft)}s`;
      const pct = (this.timeLeft / this.cfg.timeLimit) * 100;
      if (this.timerFill) this.timerFill.style.width = `${pct}%`;
    } else {
      this.progressEl.textContent = `${this.correct} / ${this.cfg.count}`;
    }
  }

  tick(deltaMs) {
    if (!this.cfg.timed || this.complete) return;
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
    if (this.complete || !this.current) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    if (codesMatch(this.current, event)) {
      this.correct++;
      if (this.cfg.timed) this.total = this.correct;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(this.current);
      this._showFeedback('Great job!');
      this._nextLetter();
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(this.current);
      this.promptEl.classList.add('shake');
      this._showFeedback('Try again!', true);
      setTimeout(() => this.promptEl.classList.remove('shake'), 400);
    }
  }
}
