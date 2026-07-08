import { Activity } from '../Activity.js';
import { codesMatch } from '../../config/keyCodes.js';

const RESPONSE_KEYS = ['f', 'j', 'k', 'd', 's'];

/**
 * Visual cue → key press reaction training — probe reaction time research.
 */
export class QuickResponse extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    // Reaction rounds run from init — the whole point is not to press early.
    this.startOnInput = false;
    this.total = this.cfg.count;
    this.round = 0;
    this.phase = 'wait';
    this.waitMs = 0;
    this.targetKey = null;
    this.tooEarly = false;
    this._buildUI();
    this._startRound();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.hintEl = this._el('p', 'adult-drill-hint', 'Wait for GO, then press the shown key as fast as you can.');
    this.signalEl = this._el('div', 'adult-reaction-signal', 'Get ready…');
    this.keyEl = this._el('div', 'adult-reaction-key', '—');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.hintEl, this.signalEl, this.keyEl, this.feedbackEl, this.progressEl);
  }

  _startRound() {
    if (this.round >= this.total) {
      this._finish();
      return;
    }
    this.phase = 'wait';
    this.tooEarly = false;
    this.targetKey = RESPONSE_KEYS[Math.floor(Math.random() * RESPONSE_KEYS.length)];
    this.keyEl.textContent = this.targetKey.toUpperCase();
    this.signalEl.textContent = 'Wait…';
    this.signalEl.className = 'adult-reaction-signal adult-reaction-signal--wait';
    this.waitMs = 800 + Math.random() * (this.cfg.maxDelay ?? 1800);
    this.progressEl.textContent = `Trial ${this.round + 1} / ${this.total}`;
  }

  tick(deltaMs) {
    if (this.complete || this.phase !== 'wait') return;
    this.waitMs -= deltaMs;
    if (this.waitMs <= 0) {
      this.phase = 'go';
      this.signalEl.textContent = 'GO!';
      this.signalEl.className = 'adult-reaction-signal adult-reaction-signal--go';
      this.goStartMs = performance.now();
    }
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    if (this.phase === 'wait') {
      this.wrong++;
      this.sound.playWrong();
      this._showFeedback('Too early — wait for GO.', true);
      this.waitMs = 600 + Math.random() * 800;
      return;
    }

    if (this.phase !== 'go') return;

    if (codesMatch(this.targetKey, event)) {
      this.correct++;
      const ms = Math.round(performance.now() - this.goStartMs);
      this.sound.playCorrect();
      this._showFeedback(`Great! ${ms} ms`);
      this.round++;
      setTimeout(() => this._startRound(), 600);
    } else {
      this.wrong++;
      this.sound.playWrong();
      this._showFeedback(`Press ${this.targetKey.toUpperCase()}`, true);
    }
  }
}
