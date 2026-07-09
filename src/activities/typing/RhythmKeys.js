import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { codesMatch } from '../../config/keyCodes.js';

const BEAT_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l'];

/**
 * Timed key presses on rhythm beats — piano practice & motor timing research.
 */
export class RhythmKeys extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    // The beat drives this drill — it must keep pulsing before any keypress.
    this.startOnInput = false;
    this.total = this.cfg.count;
    this.beatIndex = 0;
    this.beatInterval = this.cfg.beatInterval ?? 1000;
    this.beatWindow = this.cfg.beatWindow ?? 350;
    this.nextBeatMs = this.beatInterval;
    this.currentKey = null;
    this.awaitingPress = false;
    this.beatDeadline = 0;
    this._buildUI();
    this._scheduleBeat();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.hintEl = this._el('p', 'adult-drill-hint', 'Press the highlighted key when the beat lands.');
    this.beatEl = this._el('div', 'adult-rhythm-beat', '♪');
    this.keyEl = this._el('div', 'adult-rhythm-key', '—');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.hintEl, this.beatEl, this.keyEl, this.feedbackEl, this.progressEl];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
    this.progressEl.textContent = `Beat 0 / ${this.total}`;
  }

  _pickKey() {
    return BEAT_KEYS[Math.floor(Math.random() * BEAT_KEYS.length)];
  }

  _scheduleBeat() {
    if (this.beatIndex >= this.total) {
      this._finish();
      return;
    }
    this.currentKey = this._pickKey();
    this.keyEl.textContent = this.currentKey.toUpperCase();
    this.awaitingPress = false;
    this.beatEl.classList.remove('adult-rhythm-beat--pulse');
    this.keyboard?.clearHighlight();
    this.progressEl.textContent = `Beat ${this.beatIndex + 1} / ${this.total}`;
  }

  tick(deltaMs) {
    if (this.complete) return;
    this.nextBeatMs -= deltaMs;
    if (this.nextBeatMs <= 0 && !this.awaitingPress) {
      this.awaitingPress = true;
      this.beatDeadline = this.beatWindow;
      this.beatEl.classList.add('adult-rhythm-beat--pulse');
      this.keyboard?.highlightKey(this.currentKey);
      this.sound.playClick();
    }
    if (this.awaitingPress) {
      this.beatDeadline -= deltaMs;
      if (this.beatDeadline <= 0) {
        this.wrong++;
        this.sound.playWrong();
        this._showFeedback('Missed the beat — stay with the rhythm.', true);
        this.beatIndex++;
        this.nextBeatMs = this.beatInterval;
        this._scheduleBeat();
      }
    }
  }

  onKeyDown(event) {
    if (this.complete) return;
    if (event.key === 'Escape') return;
    if (!this.awaitingPress) {
      event.preventDefault();
      return;
    }
    event.preventDefault();

    if (codesMatch(this.currentKey, event)) {
      this.correct++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(this.currentKey);
      this._showFeedback('On beat!');
      this.beatIndex++;
      this.nextBeatMs = this.beatInterval;
      this._scheduleBeat();
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(this.currentKey);
      this._showFeedback(`Press ${this.currentKey.toUpperCase()} on the beat.`, true);
    }
  }
}
