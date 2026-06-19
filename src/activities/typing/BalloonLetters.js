import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { LETTERS_EASY, LETTERS_MEDIUM, LETTERS_HARD } from '../../config/wordLists.js';
import { codesMatch } from '../../config/keyCodes.js';
import { createBalloonSprite, randomBalloonHue } from '../../assets/balloonSprite.js';
import {
  createBalloonMotion,
  spawnPopBurst,
  updateDriftingBalloon,
} from '../../assets/balloonMotion.js';

const POOLS = { easy: LETTERS_EASY, medium: LETTERS_MEDIUM, hard: LETTERS_HARD };

export class BalloonLetters extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.pool = [...POOLS[this.cfg.pool]];
    this.balloons = [];
    this.spawnTimer = 0;
    this.timeLeft = this.cfg.timed ? this.cfg.timeLimit : 0;
    this.total = this.cfg.timed ? 99 : (this.cfg.target ?? 15);
    this._buildUI();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.field = this._el('div', 'balloon-letter-field');
    const edge = this._el('div', 'balloon-letter-edge');
    edge.appendChild(this._el('span', 'balloon-letter-edge-label', 'Pop before they cross!'));
    this.field.appendChild(edge);
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');

    const parts = [this.field, this.feedbackEl];
    if (this.cfg.timed) {
      this.timerBar = this._el('div', 'timer-bar');
      this.timerFill = this._el('div', 'timer-fill');
      this.timerBar.appendChild(this.timerFill);
      parts.push(this.timerBar);
    }
    parts.push(this.progressEl);

    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }

    this.container.append(...parts);
    this._showFeedback('Press the letter on each balloon!');
    this._updateProgress();
  }

  _spawnBalloon() {
    if (this.balloons.length >= this.cfg.maxAir) return;

    const fieldH = this.field.clientHeight || 320;
    const size = this.cfg.size;
    const char = this.pool[Math.floor(Math.random() * this.pool.length)];
    const y = Math.random() * (fieldH - size - 40) + 20;

    const { el, motionEl } = createBalloonSprite('balloon-letter', size, size * 1.45, randomBalloonHue());
    el.style.left = `${-size - 10}px`;
    el.style.top = `${y}px`;

    const label = this._el('span', 'balloon-letter-char', char);
    motionEl.appendChild(label);
    this.field.appendChild(el);

    this.balloons.push({
      el,
      motionEl,
      char,
      x: -size - 10,
      y,
      speed: this.cfg.speed + Math.random() * 0.4,
      size,
      ...createBalloonMotion({ swayAmp: 8 + Math.random() * 10 }),
    });
  }

  _updateProgress() {
    if (this.cfg.timed) {
      this.progressEl.textContent =
        `Popped: ${this.correct} · Missed: ${this.wrong} · Time: ${Math.ceil(this.timeLeft)}s`;
      if (this.timerFill) {
        this.timerFill.style.width = `${(this.timeLeft / this.cfg.timeLimit) * 100}%`;
      }
    } else {
      this.progressEl.textContent =
        `Popped: ${this.correct} / ${this.total} · Missed: ${this.wrong} / ${this.cfg.maxMiss}`;
    }
  }

  tick(deltaMs) {
    if (this.complete) return;
    const fieldW = this.field.clientWidth || 600;

    if (this.cfg.timed) {
      this.timeLeft -= deltaMs / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.total = this.correct;
        this._finish();
        return;
      }
    }

    this.spawnTimer += deltaMs;
    if (this.spawnTimer >= this.cfg.spawnRate) {
      this.spawnTimer = 0;
      this._spawnBalloon();
    }

    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      updateDriftingBalloon(b, deltaMs);

      if (b.x > fieldW + 20) {
        b.el.remove();
        this.balloons.splice(i, 1);
        this.wrong++;
        this._showFeedback('It got away!', true);
        this._checkEnd();
      }
    }

    this._updateProgress();
  }

  _checkEnd() {
    if (this.cfg.timed) return;
    if (this.correct >= this.total) {
      this._finish();
    } else if (this.wrong >= this.cfg.maxMiss) {
      this._finish();
    }
  }

  _popBalloon(balloon) {
    balloon.el.classList.add('balloon-letter-popped');
    spawnPopBurst(this.field, balloon.el);
    this.correct++;
    this.sound.playPop();
    this._showFeedback('Pop!');

    const idx = this.balloons.indexOf(balloon);
    if (idx >= 0) this.balloons.splice(idx, 1);
    setTimeout(() => balloon.el.remove(), 280);

    if (!this.cfg.timed) this._checkEnd();
    this._updateProgress();
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const matches = this.balloons
      .filter((b) => codesMatch(b.char, event))
      .sort((a, b) => b.x - a.x);

    if (matches.length > 0) {
      const target = matches[0];
      this.keyboard?.flashCorrect(target.char);
      this._popBalloon(target);
    } else if (this.balloons.length > 0) {
      this.sound.playWrong();
      this.keyboard?.flashWrong(this.balloons[0].char);
      this._showFeedback('Look at the balloon letters!', true);
    }
  }
}
