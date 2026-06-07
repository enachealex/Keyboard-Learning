import { Activity } from '../Activity.js';

const BALLOON_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

export class BalloonPop extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    this.balloons = [];
    this.missed = 0;
    this.spawnTimer = 0;
    this.timeLeft = cfg.timed ? cfg.timeLimit : 0;
    this.total = cfg.timed ? 99 : (cfg.target ?? 15);
    this._buildUI();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.field = this._el('div', 'balloon-field');
    const ceiling = this._el('div', 'balloon-ceiling');
    ceiling.appendChild(this._el('span', 'balloon-ceiling-label', 'Pop before they cross the line!'));
    this.field.appendChild(ceiling);
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');

    if (this.cfg.timed) {
      this.timerBar = this._el('div', 'timer-bar');
      this.timerFill = this._el('div', 'timer-fill');
      this.timerBar.appendChild(this.timerFill);
      this.container.append(this.field, this.feedbackEl, this.timerBar, this.progressEl);
    } else {
      this.container.append(this.field, this.feedbackEl, this.progressEl);
    }
    this._updateProgress();
  }

  _spawnBalloon() {
    const size = this.cfg.size;
    const fieldW = this.field.clientWidth || 600;
    const x = Math.random() * (fieldW - size);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const el = this._el('div', 'balloon');
    el.style.width = `${size}px`;
    el.style.height = `${size * 1.2}px`;
    el.style.left = `${x}px`;
    el.style.bottom = '-80px';
    el.style.background = color;
    el.textContent = '🎈';
    this.field.appendChild(el);
    this.balloons.push({ el, x, y: -80, speed: this.cfg.speed + Math.random() * 0.3 });
  }

  _updateProgress() {
    if (this.cfg.timed) {
      this.progressEl.textContent = `Popped: ${this.correct} · Time: ${Math.ceil(this.timeLeft)}s`;
      if (this.timerFill) {
        this.timerFill.style.width = `${(this.timeLeft / this.cfg.timeLimit) * 100}%`;
      }
    } else {
      this.progressEl.textContent = `Popped: ${this.correct} · Missed: ${this.missed} / ${this.cfg.maxMiss}`;
    }
  }

  tick(deltaMs) {
    if (this.complete) return;

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

    const fieldH = this.field.clientHeight || 350;
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      b.y += b.speed * (deltaMs / 16);
      b.el.style.bottom = `${b.y}px`;

      if (b.y > fieldH + 80) {
        b.el.remove();
        this.balloons.splice(i, 1);
        this.missed++;
        this._updateProgress();
        if (!this.cfg.timed && this.missed >= this.cfg.maxMiss) {
          this.total = this.correct + this.missed;
          this._finish();
        }
      }
    }

    this._updateProgress();
  }

  onPointerDown(event) {
    if (this.complete) return;
    const target = event.target.closest('.balloon');
    if (!target || target.classList.contains('popped')) return;

    target.classList.add('popped');
    this.correct++;
    this.sound.playPop();
    this._showFeedback('Pop!');

    const idx = this.balloons.findIndex((b) => b.el === target);
    if (idx >= 0) this.balloons.splice(idx, 1);
    setTimeout(() => target.remove(), 300);

    const winCount = this.cfg.target ?? 15;
    if (!this.cfg.timed && this.correct >= winCount) {
      this.total = winCount;
      this._finish();
    }
    this._updateProgress();
  }
}
