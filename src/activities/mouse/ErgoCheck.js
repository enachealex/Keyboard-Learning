import { Activity } from '../Activity.js';
import { pickErgoScenarios } from '../../config/adultResearchContent.js';

/**
 * Workstation ergonomics choices — office VDT ergonomics training research.
 */
export class ErgoCheck extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.scenarios = pickErgoScenarios(this.cfg.count);
    this.total = this.scenarios.length;
    this.round = 0;
    this._buildUI();
    this._showScenario();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.promptEl = this._el('div', 'activity-prompt adult-ergo-prompt');
    this.optionsEl = this._el('div', 'adult-ergo-options');
    this.tipEl = this._el('p', 'adult-ergo-tip');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.promptEl, this.optionsEl, this.tipEl, this.feedbackEl, this.progressEl);
  }

  _showScenario() {
    if (this.round >= this.scenarios.length) {
      this._finish();
      return;
    }
    const scenario = this.scenarios[this.round];
    this.promptEl.textContent = scenario.prompt;
    this.tipEl.textContent = '';
    this.feedbackEl.textContent = '';
    this.optionsEl.innerHTML = '';
    this.progressEl.textContent = `Question ${this.round + 1} / ${this.total}`;

    scenario.options.forEach((label, index) => {
      const btn = this._el('button', 'adult-ergo-option btn btn-outline');
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => this._pick(index, scenario));
      this.optionsEl.appendChild(btn);
    });
  }

  _pick(index, scenario) {
    if (index === scenario.correct) {
      this.correct++;
      this.sound.playCorrect();
      this.tipEl.textContent = `✓ ${scenario.tip}`;
      this._showFeedback('Correct!');
      this.round++;
      setTimeout(() => this._showScenario(), 700);
    } else {
      this.wrong++;
      this.sound.playWrong();
      this._showFeedback('Not quite — try another answer.', true);
    }
  }
}
