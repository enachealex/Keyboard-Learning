import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import { KEY_EXPLORER_KEYS } from '../../config/wordLists.js';
import { codesMatch } from '../../config/keyCodes.js';

export class KeyExplorer extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    const pool = KEY_EXPLORER_KEYS[difficulty];
    this.keys = this._shuffle([...pool]).slice(0, cfg.count);
    this.index = 0;
    this.total = this.keys.length;
    this._buildUI();
    this._showKey();
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
    this.promptEl = this._el('div', 'activity-prompt');
    this.promptEl.style.fontSize = '1.5rem';
    this.promptEl.textContent = 'Find this key on your keyboard!';
    this.keyEl = this._el('div', 'activity-prompt');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    const parts = [this.promptEl, this.keyEl, this.feedbackEl, this.progressEl];
    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      parts.push(this.keyboard.el);
    }
    this.container.append(...parts);
  }

  _showKey() {
    if (this.index >= this.keys.length) {
      this._finish();
      return;
    }
    const key = this.keys[this.index];
    this.current = key;
    this.keyEl.textContent = key === ' ' ? 'SPACE' : key;
    this.keyEl.classList.remove('shake');
    this.keyboard?.highlightKey(key);
    this.progressEl.textContent = `${this.index + 1} / ${this.keys.length}`;
  }

  onKeyDown(event) {
    if (this.complete || !this.current) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    if (codesMatch(this.current, event)) {
      this.correct++;
      this.index++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(this.current);
      this._showFeedback('Found it!');
      setTimeout(() => this._showKey(), 300);
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(this.current);
      this.keyEl.classList.add('shake');
      this._showFeedback('Look for the highlighted key!', true);
      setTimeout(() => this.keyEl.classList.remove('shake'), 400);
    }
  }
}
