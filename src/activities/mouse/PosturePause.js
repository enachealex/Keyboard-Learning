import { Activity } from '../Activity.js';
import { pickPostureBreaks } from '../../config/adultResearchContent.js';

/**
 * Guided micro-breaks — prolonged typing posture / motor variability research.
 */
export class PosturePause extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.breaks = pickPostureBreaks(this.cfg.count);
    this.total = this.breaks.length;
    this.round = 0;
    this._buildUI();
    this._showBreak();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.cardEl = this._el('div', 'adult-posture-card');
    this.iconEl = this._el('div', 'adult-posture-icon');
    this.titleEl = this._el('h2', 'adult-posture-title');
    this.bodyEl = this._el('p', 'adult-posture-body');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.doneBtn = document.createElement('button');
    this.doneBtn.type = 'button';
    this.doneBtn.className = 'btn btn-primary';
    this.doneBtn.textContent = 'Done — next break';
    this.doneBtn.addEventListener('click', () => this._completeBreak());
    this.cardEl.append(this.iconEl, this.titleEl, this.bodyEl, this.doneBtn);
    this.container.append(this.cardEl, this.feedbackEl, this.progressEl);
  }

  _showBreak() {
    if (this.round >= this.breaks.length) {
      this._finish();
      return;
    }
    const item = this.breaks[this.round];
    this.iconEl.textContent = item.icon;
    this.titleEl.textContent = item.title;
    this.bodyEl.textContent = item.body;
    this.feedbackEl.textContent = '';
    this.progressEl.textContent = `Break ${this.round + 1} / ${this.total}`;
  }

  _completeBreak() {
    this.correct++;
    this.sound.playClick();
    this._showFeedback('Great — keep varying your posture during long sessions.');
    this.round++;
    setTimeout(() => this._showBreak(), 500);
  }
}
