export class Activity {
  constructor(sound) {
    this.sound = sound;
    this.container = null;
    this.difficulty = 'easy';
    this.correct = 0;
    this.wrong = 0;
    this.total = 0;
    this.complete = false;
    // Timers and motion wait for the player's first input so nobody loses
    // time (or score) before they're ready. Self-running activities
    // (reaction/rhythm drills) set startOnInput = false to run from init.
    this.started = false;
    this.startOnInput = true;
    this.startInput = 'any'; // 'key': only keystrokes start; 'any': pointer too
    this._raf = null;
    this._lastTime = 0;
    this._sessionStartMs = 0;
    this._elapsedMs = 0;
  }

  init(difficulty, container, config = {}) {
    this.difficulty = difficulty;
    this.cfg = config;
    this.container = container;
    this.correct = 0;
    this.wrong = 0;
    this.total = 0;
    this.complete = false;
    this.started = false;
    this._sessionStartMs = performance.now();
    this._elapsedMs = 0;
    this._lastTime = performance.now();
    this._startLoop();
  }

  markStarted(kind = 'any') {
    if (this.started) return;
    if (this.startInput === 'key' && kind !== 'key') return;
    this.started = true;
    if (this.startOnInput) {
      // Elapsed time (and WPM) measure from the first input, not screen load.
      this._sessionStartMs = performance.now();
      this._elapsedMs = 0;
    }
  }

  _markElapsed() {
    if (this._sessionStartMs) {
      this._elapsedMs = performance.now() - this._sessionStartMs;
    }
  }

  getElapsedMs() {
    return this._elapsedMs;
  }

  /** Standard typing WPM: (correct characters / 5) per minute. */
  getWpm() {
    this._markElapsed();
    const minutes = this._elapsedMs / 60000;
    if (minutes <= 0 || this.correct <= 0) return 0;
    return Math.round((this.correct / 5) / minutes);
  }

  _startLoop() {
    const loop = (now) => {
      if (!this.container) return;
      const delta = now - this._lastTime;
      this._lastTime = now;
      // Before the first input the world is frozen: tick still runs (so UI
      // stays live) but no time passes for countdowns, spawns, or motion.
      this.tick(this.started || !this.startOnInput ? delta : 0);
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
    this._markElapsed();
    return {
      stars: this.getStars(),
      correct: this.correct,
      wrong: this.wrong,
      total: this.total,
      accuracy: this.getAccuracy(),
      completion: this.getCompletion(),
      wpm: this.getWpm(),
      elapsedMs: this._elapsedMs,
    };
  }

  _finish() {
    this._markElapsed();
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
      fb.textContent = isError ? `Error: ${msg}` : msg;
      fb.classList.toggle('activity-feedback--error', isError);
      fb.classList.toggle('activity-feedback--success', !isError);
      fb.setAttribute('role', 'status');
      fb.setAttribute('aria-live', 'polite');
    }
  }
}
