import { Activity } from '../Activity.js';
import { COLORS } from '../../config/wordLists.js';

export class ColorClick extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    this.palette = COLORS.slice(0, cfg.colors);
    this.total = cfg.count;
    this.target = null;
    this.shuffleTimer = 0;
    this._buildUI();
    this._nextRound();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.promptEl = this._el('div', 'activity-prompt');
    this.promptEl.style.fontSize = '2rem';
    this.field = this._el('div', 'color-click-field');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.promptEl, this.field, this.feedbackEl, this.progressEl);
  }

  _renderButtons() {
    this.field.innerHTML = '';
    const shuffled = [...this.palette].sort(() => Math.random() - 0.5);
    for (const color of shuffled) {
      const btn = this._el('button', 'color-click-btn');
      btn.style.background = color.hex;
      btn.dataset.color = color.name;
      btn.setAttribute('aria-label', color.name);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this._handlePick(color.name, btn);
      });
      this.field.appendChild(btn);
    }
  }

  _nextRound() {
    if (this.correct >= this.total) {
      this._finish();
      return;
    }
    this.target = this.palette[Math.floor(Math.random() * this.palette.length)];
    this.promptEl.textContent = `Click ${this.target.name}!`;
    this.promptEl.style.color = this.target.hex;
    this._renderButtons();
    this._updateProgress();
  }

  _updateProgress() {
    this.progressEl.textContent = `${this.correct} / ${this.total}`;
  }

  tick(deltaMs) {
    if (this.complete || !this.cfg.shuffleMs) return;
    this.shuffleTimer += deltaMs;
    if (this.shuffleTimer >= this.cfg.shuffleMs) {
      this.shuffleTimer = 0;
      this._renderButtons();
    }
  }

  _handlePick(name, btn) {
    if (this.complete) return;
    if (name === this.target.name) {
      this.correct++;
      this.sound.playCorrect();
      btn.classList.add('color-click-correct');
      this._showFeedback('Correct color!');
      setTimeout(() => this._nextRound(), 350);
    } else {
      this.wrong++;
      this.sound.playWrong();
      btn.classList.add('color-click-wrong');
      this._showFeedback(`Find ${this.target.name}!`, true);
      setTimeout(() => btn.classList.remove('color-click-wrong'), 400);
    }
    this._updateProgress();
  }

  onPointerDown() {}
}
