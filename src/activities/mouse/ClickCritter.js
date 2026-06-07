import { Activity } from '../Activity.js';
import { CRITTERS } from '../../config/wordLists.js';

export class ClickCritter extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    this.total = cfg.count;
    this.critters = [];
    this.lastClickTime = 0;
    this._buildUI();
    this._spawnBatch();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.field = this._el('div', 'critter-field');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.field, this.feedbackEl, this.progressEl);
    this._updateProgress();
  }

  _spawnBatch() {
    const needed = this.total - this.correct - this.critters.length;
    const pool = [...CRITTERS];
    for (let i = 0; i < Math.min(needed, 4); i++) {
      this._spawnCritter(pool[i % pool.length]);
    }
  }

  _spawnCritter(emoji) {
    const fieldW = this.field.clientWidth || 600;
    const fieldH = this.field.clientHeight || 350;
    const size = this.cfg.size;
    const el = this._el('div', 'critter');
    el.textContent = emoji;
    el.style.fontSize = `${size * 0.6}px`;
    const x = Math.random() * (fieldW - size);
    const y = Math.random() * (fieldH - size);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.field.appendChild(el);

    const critter = {
      el,
      x,
      y,
      vx: this.cfg.move ? (Math.random() - 0.5) * this.cfg.speed * 2 : 0,
      vy: this.cfg.move ? (Math.random() - 0.5) * this.cfg.speed * 2 : 0,
      size,
    };
    this.critters.push(critter);
  }

  _updateProgress() {
    this.progressEl.textContent = `Caught: ${this.correct} / ${this.total}`;
  }

  tick(deltaMs) {
    if (this.complete) return;
    const fieldW = this.field.clientWidth || 600;
    const fieldH = this.field.clientHeight || 350;

    for (const c of this.critters) {
      if (c.el.classList.contains('clicked')) continue;
      c.x += c.vx * (deltaMs / 16);
      c.y += c.vy * (deltaMs / 16);
      if (c.x <= 0 || c.x >= fieldW - c.size) c.vx *= -1;
      if (c.y <= 0 || c.y >= fieldH - c.size) c.vy *= -1;
      c.el.style.left = `${c.x}px`;
      c.el.style.top = `${c.y}px`;
    }
  }

  onPointerDown(event) {
    if (this.complete) return;
    const target = event.target.closest('.critter');
    if (!target || target.classList.contains('clicked')) return;

    const now = performance.now();
    if (this.cfg.doubleClick) {
      if (now - this.lastClickTime < 400) {
        this._catchCritter(target);
      } else {
        this._showFeedback('Double-click!', true);
        this.lastClickTime = now;
      }
    } else {
      this._catchCritter(target);
    }
  }

  _catchCritter(target) {
    target.classList.add('clicked');
    this.correct++;
    this.sound.playPop();
    this._showFeedback('Got it!');

    const idx = this.critters.findIndex((c) => c.el === target);
    if (idx >= 0) this.critters.splice(idx, 1);
    setTimeout(() => target.remove(), 400);

    if (this.correct >= this.total) {
      this._finish();
    } else {
      this._spawnBatch();
    }
    this._updateProgress();
  }
}
