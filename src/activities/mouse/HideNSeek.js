import { Activity } from '../Activity.js';

const ALL_HIDE_SPOTS = [
  { id: 'oak', object: '🌳', label: 'Oak tree', x: 6, y: 18, size: 'large' },
  { id: 'pine', object: '🌲', label: 'Pine tree', x: 78, y: 12, size: 'large' },
  { id: 'bush', object: '🌿', label: 'Bush', x: 42, y: 28, size: 'small' },
  { id: 'rock', object: '🪨', label: 'Rock', x: 22, y: 52, size: 'small' },
  { id: 'hay', object: '🛖', label: 'Hay shed', x: 62, y: 48, size: 'medium' },
  { id: 'crate', object: '📦', label: 'Crate', x: 12, y: 68, size: 'small' },
  { id: 'log', object: '🪵', label: 'Log pile', x: 48, y: 62, size: 'medium' },
  { id: 'tractor', object: '🚜', label: 'Tractor', x: 82, y: 58, size: 'medium' },
];

export class HideNSeek extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.total = this.cfg.count;
    this.spots = ALL_HIDE_SPOTS.slice(0, this.cfg.hideSpots);
    this.activeSpotId = null;
    this.phase = 'hidden';
    this.phaseTimer = 0;
    this.sneakSteps = 0;
    this.lionEl = null;
    this._buildUI();
    this._startRound();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.field = this._el('div', 'hide-field');

    const decor = this._el('div', 'hide-decor');
    decor.innerHTML = '<span class="hide-cloud">☁️</span><span class="hide-cloud hide-cloud-2">☁️</span>';
    this.field.appendChild(decor);

    const meadow = this._el('div', 'hide-meadow');
    for (const spot of this.spots) {
      const el = this._el('div', `hide-spot hide-spot-${spot.size}`);
      el.style.left = `${spot.x}%`;
      el.style.top = `${spot.y}%`;
      el.dataset.spotId = spot.id;

      const object = this._el('div', 'hide-object');
      object.textContent = spot.object;
      object.title = spot.label;

      const lion = this._el('div', 'hide-lion');
      lion.textContent = '🦁';
      lion.dataset.role = 'lion';

      el.append(lion, object);
      el.addEventListener('pointerdown', (e) => this._onSpotClick(e, spot.id));
      meadow.appendChild(el);
    }
    this.field.appendChild(meadow);

    const sheepPen = this._el('div', 'sheep-pen');
    sheepPen.innerHTML = '<div class="sheep-fence"></div><div class="sheep-group">🐑🐑🐑</div>';
    this.field.appendChild(sheepPen);

    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.sneakEl = this._el('div', 'hide-sneak-meter');
    this.container.append(this.field, this.feedbackEl, this.sneakEl, this.progressEl);
    this._updateProgress();
  }

  _startRound() {
    if (this.correct >= this.total) {
      this._finish();
      return;
    }

    this.phase = 'hidden';
    this.phaseTimer = 0;
    this.sneakSteps = 0;
    this._hideAllLions();
    this._pickSpot();
    this._showFeedback('Find the lion before it reaches the sheep!');
    this._updateSneakMeter();
    this._updateProgress();
  }

  _pickSpot(excludeId) {
    const pool = this.spots.filter((s) => s.id !== excludeId);
    const spot = pool[Math.floor(Math.random() * pool.length)] ?? this.spots[0];
    this.activeSpotId = spot.id;
    this.lionEl = this.field.querySelector(`[data-spot-id="${spot.id}"] .hide-lion`);
    this.field.querySelectorAll('.hide-spot').forEach((el) => {
      el.classList.toggle('active-spot', el.dataset.spotId === spot.id);
    });
  }

  _hideAllLions() {
    this.field.querySelectorAll('.hide-lion').forEach((lion) => {
      lion.classList.remove('peeking', 'caught');
    });
    this.field.querySelectorAll('.hide-spot').forEach((el) => {
      el.classList.remove('active-spot', 'lion-sneaking');
    });
  }

  tick(deltaMs) {
    if (this.complete || !this.lionEl) return;

    this.phaseTimer += deltaMs;
    const peekMs = this.cfg.peekMs;
    const hideMs = this.cfg.hideMs;

    if (this.phase === 'hidden' && this.phaseTimer >= hideMs) {
      this.phase = 'peeking';
      this.phaseTimer = 0;
      this.lionEl.classList.add('peeking');
      this._showFeedback('There it is — click the lion!');
    } else if (this.phase === 'peeking' && this.phaseTimer >= peekMs) {
      this.phase = 'hidden';
      this.phaseTimer = 0;
      this.lionEl.classList.remove('peeking');
      this._missedPeek();
    }
  }

  _missedPeek() {
    this.sneakSteps++;
    this._updateSneakMeter();
    this.field.querySelector(`[data-spot-id="${this.activeSpotId}"]`)
      ?.classList.add('lion-sneaking');

    if (this.sneakSteps >= this.cfg.maxSneak) {
      this.wrong++;
      this.sound.playWrong();
      this._showFeedback('The lion reached the sheep! Try again.', true);
      this.field.querySelector('.sheep-group')?.classList.add('sheep-scared');
      setTimeout(() => {
        this.field.querySelector('.sheep-group')?.classList.remove('sheep-scared');
        this._startRound();
      }, 900);
    } else {
      this._showFeedback('It hid again — keep watching!', true);
      setTimeout(() => this._relocateLion(), 400);
    }
  }

  _relocateLion() {
    const prev = this.activeSpotId;
    this.lionEl?.classList.remove('peeking');
    this._pickSpot(prev);
    this.phase = 'hidden';
    this.phaseTimer = 0;
    this.field.querySelectorAll('.hide-spot').forEach((el) => {
      el.classList.remove('lion-sneaking');
    });
  }

  _onSpotClick(event, spotId) {
    if (this.complete) return;
    const lion = event.target.closest('.hide-lion');

    if (lion && lion.classList.contains('peeking') && spotId === this.activeSpotId) {
      this._catchLion(lion);
      return;
    }

    if (!lion) {
      this.sound.playWrong();
      this._showFeedback('Not there — watch for the lion!', true);
    }
  }

  _catchLion(lion) {
    lion.classList.remove('peeking');
    lion.classList.add('caught');
    this.correct++;
    this.sound.playPop();
    this._showFeedback('You caught the lion! The sheep are safe!');

    setTimeout(() => {
      this._hideAllLions();
      this._startRound();
    }, 700);
    this._updateProgress();
  }

  _updateSneakMeter() {
    const left = this.cfg.maxSneak - this.sneakSteps;
    this.sneakEl.textContent = left > 0
      ? `🦁 Sneak steps until sheep: ${left}`
      : '';
  }

  _updateProgress() {
    this.progressEl.textContent = `Caught: ${this.correct} / ${this.total}`;
  }
}
