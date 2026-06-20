import { Activity } from '../Activity.js';

const FORM_OPTIONS = [
  { label: 'Email updates', type: 'checkbox' },
  { label: 'Weekly digest', type: 'checkbox' },
  { label: 'Desktop', type: 'radio', group: 'device' },
  { label: 'Laptop', type: 'radio', group: 'device' },
  { label: 'Tablet', type: 'radio', group: 'device' },
];

const DROPDOWN_OPTIONS = ['Beginner', 'Familiar', 'Intermediate', 'Experienced', 'Expert'];

export class FormControls extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.total = this.cfg.count;
    this.round = 0;
    this._buildUI();
    this._nextRound();
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.promptEl = this._el('div', 'activity-prompt adult-form-prompt');
    this.formEl = this._el('div', 'adult-form-panel');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.promptEl, this.formEl, this.feedbackEl, this.progressEl);
  }

  _nextRound() {
    if (this.round >= this.total) {
      this._finish();
      return;
    }
    this.roundType = this._pickRoundType();
    this._renderRound();
    this.progressEl.textContent = `Step ${this.round + 1} / ${this.total}`;
    this.feedbackEl.textContent = '';
  }

  _pickRoundType() {
    const types = ['checkbox', 'radio', 'dropdown'];
    return types[this.round % types.length];
  }

  _renderRound() {
    this.formEl.innerHTML = '';
    if (this.roundType === 'checkbox') {
      this.promptEl.textContent = 'Check the box below';
      const opt = FORM_OPTIONS[Math.floor(Math.random() * 2)];
      const row = this._el('label', 'adult-form-row');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'adult-form-checkbox';
      row.append(input, document.createTextNode(` ${opt.label}`));
      input.addEventListener('change', () => {
        if (input.checked) this._roundSuccess();
      });
      this.formEl.appendChild(row);
      return;
    }

    if (this.roundType === 'radio') {
      const radios = FORM_OPTIONS.filter((o) => o.type === 'radio');
      const target = radios[Math.floor(Math.random() * radios.length)];
      this._targetLabel = target.label;
      this.promptEl.textContent = `Select: ${target.label}`;
      const group = this._el('fieldset', 'adult-form-fieldset');
      for (const opt of radios) {
        const row = this._el('label', 'adult-form-row');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'device';
        input.value = opt.label;
        row.append(input, document.createTextNode(` ${opt.label}`));
        input.addEventListener('change', () => {
          if (input.value === target.label) this._roundSuccess();
          else this._roundWrong();
        });
        group.appendChild(row);
      }
      this.formEl.appendChild(group);
      return;
    }

    const target = DROPDOWN_OPTIONS[Math.floor(Math.random() * DROPDOWN_OPTIONS.length)];
    this._targetLabel = target;
    this.promptEl.textContent = `Choose: ${target}`;
    const select = document.createElement('select');
    select.className = 'adult-form-select';
    for (const opt of DROPDOWN_OPTIONS) {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    }
    select.addEventListener('change', () => {
      if (select.value === target) this._roundSuccess();
      else this._roundWrong();
    });
    this.formEl.appendChild(select);
  }

  _roundSuccess() {
    this.correct++;
    this.sound.playCorrect();
    this._showFeedback('Correct!');
    this.round++;
    setTimeout(() => this._nextRound(), 400);
  }

  _roundWrong() {
    this.wrong++;
    this.sound.playWrong();
    this._showFeedback(`Try again — select "${this._targetLabel}".`, true);
  }
}
