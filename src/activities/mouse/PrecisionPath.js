import { Activity } from '../Activity.js';
import { PRECISION_PATH_SETS } from '../../config/adultResearchContent.js';

/**
 * Follow a precise pointer path — fine motor control / handwriting motor research.
 */
export class PrecisionPath extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const sets = PRECISION_PATH_SETS[this.cfg.pool] ?? PRECISION_PATH_SETS.easy;
    this.paths = this._shuffle([...sets]).slice(0, this.cfg.count);
    this.pathIndex = 0;
    this.waypointIndex = 0;
    this.total = this.paths.reduce((sum, p) => sum + p.length, 0);
    this.hitRadius = this.cfg.hitRadius ?? 28;
    this._buildUI();
    this._loadPath();
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
    this.hintEl = this._el('p', 'adult-drill-hint', 'Move the cursor through each dot in order — stay smooth and steady.');
    this.wrap = this._el('div', 'adult-precision-wrap');
    this.trackEl = this._el('div', 'adult-precision-track');
    this.dot = this._el('div', 'adult-precision-dot');
    this.wrap.append(this.trackEl, this.dot);
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.hintEl, this.wrap, this.feedbackEl, this.progressEl);

    this.wrap.addEventListener('pointermove', (e) => this._onPointerMove(e));
    this.wrap.addEventListener('pointerleave', () => this._hideDot());
  }

  _loadPath() {
    if (this.pathIndex >= this.paths.length) {
      this._finish();
      return;
    }
    this.waypoints = this.paths[this.pathIndex];
    this.waypointIndex = 0;
    this.trackEl.innerHTML = '';
    this._markers = [];

    for (let i = 0; i < this.waypoints.length; i++) {
      const wp = this.waypoints[i];
      const marker = this._el('div', 'adult-precision-marker');
      marker.style.left = `${wp.x}%`;
      marker.style.top = `${wp.y}%`;
      if (i === 0) marker.classList.add('adult-precision-marker--active');
      else if (i < this.waypoints.length - 1) marker.classList.add('adult-precision-marker--mid');
      else marker.classList.add('adult-precision-marker--end');
      marker.textContent = i === 0 ? '▶' : (i === this.waypoints.length - 1 ? '★' : '·');
      this.trackEl.appendChild(marker);
      this._markers.push(marker);
    }

    this.progressEl.textContent = `Path ${this.pathIndex + 1} / ${this.paths.length}`;
    this._hideDot();
  }

  _hideDot() {
    this.dot.style.opacity = '0';
  }

  _onPointerMove(event) {
    if (this.complete) return;
    const rect = this.wrap.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      this._hideDot();
      return;
    }
    this.dot.style.opacity = '1';
    this.dot.style.left = `${x}px`;
    this.dot.style.top = `${y}px`;

    const wp = this.waypoints[this.waypointIndex];
    const wpX = (wp.x / 100) * rect.width;
    const wpY = (wp.y / 100) * rect.height;
    const dist = Math.hypot(x - wpX, y - wpY);

    if (dist <= this.hitRadius) {
      this.correct++;
      this.sound.playPop();
      this._markers[this.waypointIndex]?.classList.remove('adult-precision-marker--active');
      this._markers[this.waypointIndex]?.classList.add('adult-precision-marker--done');
      this.waypointIndex++;

      if (this.waypointIndex >= this.waypoints.length) {
        this.pathIndex++;
        this._showFeedback('Path complete!');
        setTimeout(() => this._loadPath(), 400);
      } else {
        this._markers[this.waypointIndex]?.classList.add('adult-precision-marker--active');
      }
    }
  }
}
