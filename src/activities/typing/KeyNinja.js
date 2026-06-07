import { Activity } from '../Activity.js';
import { codesMatch } from '../../config/keyCodes.js';
import { KEY_NINJA_MEDIUM, KEY_NINJA_HARD } from '../../config/wordLists.js';

const POOLS = { medium: KEY_NINJA_MEDIUM, hard: KEY_NINJA_HARD };

const FRUIT_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c', '#e91e63',
];

export class KeyNinja extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const tier = difficulty === 'hard' ? 'hard' : 'medium';
    this.pool = POOLS[tier] ?? POOLS.medium;
    this.keys = [];
    this.spawnTimer = 0;
    this.timeLeft = this.cfg.timeLimit;
    this.total = 99;
    this._buildUI();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.field = this._el('div', 'ninja-field');
    this.slashLine = this._el('div', 'ninja-slash-line');
    this.field.appendChild(this.slashLine);
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.timerBar = this._el('div', 'timer-bar');
    this.timerFill = this._el('div', 'timer-fill');
    this.timerBar.appendChild(this.timerFill);
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.field, this.feedbackEl, this.timerBar, this.progressEl);
    this._showFeedback('Press the key on each fruit before it falls!');
    this._updateProgress();
  }

  _spawnKey() {
    if (this.keys.length >= this.cfg.maxAir) return;

    const fieldW = this.field.clientWidth || 600;
    const size = this.cfg.size;
    const char = this.pool[Math.floor(Math.random() * this.pool.length)];
    const x = Math.random() * (fieldW - size - 20) + 10;
    const color = FRUIT_COLORS[Math.floor(Math.random() * FRUIT_COLORS.length)];

    const el = this._el('div', 'ninja-fruit');
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${x}px`;
    el.style.bottom = `${-size}px`;
    el.style.background = `linear-gradient(145deg, ${color}, ${color}cc)`;

    const label = this._el('span', 'ninja-fruit-key', char);
    el.appendChild(label);
    this.field.appendChild(el);

    const launch = this.cfg.launchSpeed + Math.random() * 2;
    this.keys.push({
      el,
      char,
      x,
      y: -size,
      vx: (Math.random() - 0.5) * this.cfg.drift,
      vy: launch,
      gravity: this.cfg.gravity,
      size,
      sliced: false,
    });
  }

  tick(deltaMs) {
    if (this.complete) return;
    const dt = deltaMs / 16;

    this.timeLeft -= deltaMs / 1000;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.total = this.correct;
      this._finish();
      return;
    }

    this.spawnTimer += deltaMs;
    if (this.spawnTimer >= this.cfg.spawnRate) {
      this.spawnTimer = 0;
      this._spawnKey();
      if (Math.random() < this.cfg.burstChance) {
        setTimeout(() => this._spawnKey(), 120);
      }
    }

    const fieldH = this.field.clientHeight || 380;
    for (let i = this.keys.length - 1; i >= 0; i--) {
      const k = this.keys[i];
      if (k.sliced) continue;

      k.vy -= k.gravity * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.el.style.left = `${k.x}px`;
      k.el.style.bottom = `${k.y}px`;
      k.el.style.transform = `rotate(${k.vx * 4}deg)`;

      if (k.y < -k.size - 20) {
        k.el.remove();
        this.keys.splice(i, 1);
        this.wrong++;
        this._updateProgress();
        this._showFeedback('Missed one!', true);
        if (this.wrong >= this.cfg.maxMiss) {
          this.total = this.correct;
          this._finish();
        }
      }
    }

    this._updateProgress();
  }

  _updateProgress() {
    this.progressEl.textContent =
      `Sliced: ${this.correct} · Missed: ${this.wrong} / ${this.cfg.maxMiss} · Time: ${Math.ceil(this.timeLeft)}s`;
    this.timerFill.style.width = `${(this.timeLeft / this.cfg.timeLimit) * 100}%`;
  }

  _sliceKey(keyObj) {
    if (keyObj.sliced || this.complete) return;
    keyObj.sliced = true;
    keyObj.el.classList.add('ninja-sliced');
    this.correct++;
    this.sound.playPop();
    this._showFeedback('Sliced!');

    setTimeout(() => {
      keyObj.el.remove();
      const idx = this.keys.indexOf(keyObj);
      if (idx >= 0) this.keys.splice(idx, 1);
    }, 250);
    this._updateProgress();
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const airborne = this.keys.filter((k) => !k.sliced && k.y > 20);
    const match = airborne.find((k) => codesMatch(k.char, event));

    if (match) {
      this._sliceKey(match);
    } else if (airborne.length > 0) {
      this.wrong++;
      this.sound.playWrong();
      this._showFeedback('Wrong key!', true);
    }
  }
}
