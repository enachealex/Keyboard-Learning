import { Activity } from '../Activity.js';
import { makeMathProblem } from '../../utils/mathProblems.js';

/**
 * Math Facts Sprint — a problem appears, the student types the answer on
 * the number row and presses Enter. Number-key practice + math-fact
 * fluency in one. Generation bounds come from the teacher's math settings
 * (school edition) or the difficulty defaults.
 */
export class MathFacts extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.total = this.cfg.count ?? 10;
    this.round = 0;
    this.typed = '';
    this.problem = null;
    this._buildUI();
    this._nextProblem();
  }

  _settings() {
    return {
      ops: this.cfg.ops ?? { add: true, sub: false, mul: false, div: false },
      maxSum: this.cfg.maxSum ?? 20,
      maxFactor: this.cfg.maxFactor ?? 10,
      focusTable: this.cfg.focusTable ?? null,
    };
  }

  _buildUI() {
    this.container.innerHTML = '';
    this.hintEl = this._el('p', 'adult-drill-hint', 'Type the answer, then press Enter.');
    this.problemEl = this._el('div', 'math-facts-problem');
    this.answerEl = this._el('div', 'math-facts-answer');
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.hintEl, this.problemEl, this.answerEl, this.feedbackEl, this.progressEl);
  }

  _nextProblem() {
    if (this.round >= this.total) {
      this._finish();
      return;
    }
    this.problem = makeMathProblem(this._settings());
    this.typed = '';
    this._render();
  }

  _render() {
    this.problemEl.textContent = `${this.problem.text} =`;
    this.answerEl.textContent = this.typed === '' ? '?' : this.typed;
    this.answerEl.classList.toggle('math-facts-answer--empty', this.typed === '');
    this.progressEl.textContent = `Problem ${this.round + 1} / ${this.total}`;
  }

  onKeyDown(event) {
    if (this.complete || !this.problem) return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    if (event.key >= '0' && event.key <= '9') {
      if (this.typed.length < 4) {
        this.typed += event.key;
        this._render();
      }
      return;
    }

    if (event.key === 'Backspace') {
      this.typed = this.typed.slice(0, -1);
      this._render();
      return;
    }

    if (event.key === 'Enter') {
      if (this.typed === '') return;
      if (Number(this.typed) === this.problem.answer) {
        this.correct++;
        this.round++;
        this.sound.playCorrect();
        this._showFeedback('Correct!');
        this._nextProblem();
      } else {
        this.wrong++;
        this.typed = '';
        this.sound.playWrong();
        this.answerEl.classList.add('shake');
        setTimeout(() => this.answerEl.classList.remove('shake'), 400);
        this._showFeedback('Not quite — try that one again.', true);
        this._render();
      }
    }
  }
}
