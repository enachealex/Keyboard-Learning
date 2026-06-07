export class Activity {
  constructor(sound) {
    this.sound = sound;
    this.container = null;
    this.difficulty = 'easy';
    this.correct = 0;
    this.wrong = 0;
    this.total = 0;
    this.complete = false;
    this._raf = null;
    this._lastTime = 0;
  }

  init(difficulty, container, config = {}) {
    this.difficulty = difficulty;
    this.cfg = config;
    this.container = container;
    this.correct = 0;
    this.wrong = 0;
    this.total = 0;
    this.complete = false;
    this._lastTime = performance.now();
    this._startLoop();
  }

  _startLoop() {
    const loop = (now) => {
      if (!this.container) return;
      const delta = now - this._lastTime;
      this._lastTime = now;
      this.tick(delta);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  tick(_deltaMs) {}

  onKeyDown(_event) {}

  onPointerDown(_event) {}
  onPointerMove(_event) {}
  onPointerUp(_event) {}

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this.container = null;
  }

  getAccuracy() {
    const attempts = this.correct + this.wrong;
    if (attempts === 0) return 100;
    return Math.round((this.correct / attempts) * 100);
  }

  getCompletion() {
    if (this.total === 0) return 100;
    return Math.round((this.correct / this.total) * 100);
  }

  getStars() {
    const accuracy = this.getAccuracy();
    const completion = this.getCompletion();
    const score = (accuracy + completion) / 2;
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 40) return 1;
    return 0;
  }

  getScore() {
    return {
      stars: this.getStars(),
      correct: this.correct,
      wrong: this.wrong,
      total: this.total,
      accuracy: this.getAccuracy(),
      completion: this.getCompletion(),
    };
  }

  _finish() {
    this.complete = true;
    this.sound.playComplete();
  }

  _el(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  _showFeedback(msg, isError = false) {
    const fb = this.container.querySelector('.activity-feedback');
    if (fb) {
      fb.textContent = msg;
      fb.style.color = isError ? 'var(--danger)' : 'var(--accent)';
    }
  }
}
