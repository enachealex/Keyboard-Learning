import { Activity } from '../Activity.js';
import { VirtualKeyboard } from '../../components/VirtualKeyboard.js';
import {
  SENTENCE_CLUES_EASY,
  SENTENCE_CLUES_MEDIUM,
  SENTENCE_CLUES_HARD,
} from '../../config/wordLists.js';
import { codesMatch } from '../../config/keyCodes.js';
import { renderCharWord } from '../../utils/wordDisplay.js';

const POOLS = {
  easy: SENTENCE_CLUES_EASY,
  medium: SENTENCE_CLUES_MEDIUM,
  hard: SENTENCE_CLUES_HARD,
};

export class SentenceComplete extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.clues = this._shuffle([...POOLS[this.cfg.pool]]).slice(0, this.cfg.count);
    this.clueIndex = 0;
    this.phase = 'pick';
    this.charIndex = 0;
    this.total = this.clues.reduce((s, c) => s + c.answer.length, 0);
    this._buildUI();
    this._showClue();
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
    this.phaseEl = this._el('div', 'sentence-phase', 'Read the sentence. Pick the missing word!');
    this.sentenceEl = this._el('div', 'sentence-display');
    this.choicesEl = this._el('div', 'word-choices');
    this.typeEl = this._el('div', 'word-display');
    this.typeEl.style.display = 'none';
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');

    this.container.append(
      this.phaseEl,
      this.sentenceEl,
      this.choicesEl,
      this.typeEl,
      this.feedbackEl,
      this.progressEl,
    );

    if (this.cfg.showKeyboard !== false) {
      this.keyboard = new VirtualKeyboard();
      this.keyboard.el.style.display = 'none';
      this.container.appendChild(this.keyboard.el);
    }
  }

  _currentClue() {
    return this.clues[this.clueIndex];
  }

  _showClue() {
    if (this.clueIndex >= this.clues.length) {
      this._finish();
      return;
    }

    this.phase = 'pick';
    this.charIndex = 0;
    this.phaseEl.textContent = 'Read the sentence. Pick the missing word!';
    this.choicesEl.style.display = '';
    this.typeEl.style.display = 'none';
    if (this.keyboard) this.keyboard.el.style.display = 'none';

    const clue = this._currentClue();
    this._renderSentence(clue, null);
    this._renderChoices(clue);
    this.progressEl.textContent = `Sentence ${this.clueIndex + 1} / ${this.clues.length}`;
    this._showFeedback('');
  }

  _renderSentence(clue, fillWord) {
    this.sentenceEl.innerHTML = '';
    for (const part of clue.parts) {
      if (part === null) {
        const blank = document.createElement('span');
        blank.className = fillWord ? 'sentence-filled' : 'sentence-blank';
        blank.textContent = fillWord ?? '______';
        this.sentenceEl.appendChild(blank);
        this.sentenceEl.appendChild(document.createTextNode(' '));
      } else {
        const span = document.createElement('span');
        span.className = 'sentence-part';
        span.textContent = part;
        this.sentenceEl.appendChild(span);
        this.sentenceEl.appendChild(document.createTextNode(' '));
      }
    }
  }

  _renderChoices(clue) {
    this.choicesEl.innerHTML = '';
    const options = this._shuffle([
      clue.answer,
      ...clue.distractors.slice(0, this.cfg.choices - 1),
    ]);

    for (const word of options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'word-choice-btn';
      btn.textContent = word;
      btn.dataset.word = word;
      this.choicesEl.appendChild(btn);
    }
  }

  _startTyping() {
    const clue = this._currentClue();
    this.phase = 'type';
    this.charIndex = 0;
    this.phaseEl.textContent = 'Great choice! Now type the word:';
    this.choicesEl.style.display = 'none';
    this.typeEl.style.display = '';
    if (this.keyboard) {
      this.keyboard.el.style.display = '';
      this.keyboard.clearHighlight();
      this.keyboard.highlightKey(clue.answer[0]);
    }
    this._renderSentence(clue, clue.answer);
    this._renderTypeProgress(clue.answer);
    this._showFeedback('Type the word letter by letter!');
  }

  _renderTypeProgress(word) {
    renderCharWord(this.typeEl, word, this.charIndex, { useWordGroups: false });
  }

  onPointerDown(event) {
    if (this.complete || this.phase !== 'pick') return;
    const btn = event.target.closest('.word-choice-btn');
    if (!btn) return;

    const word = btn.dataset.word;
    const clue = this._currentClue();

    if (word === clue.answer) {
      this.sound.playCorrect();
      btn.classList.add('word-choice-correct');
      this._showFeedback('Correct! Now type it!');
      setTimeout(() => this._startTyping(), 400);
    } else {
      this.wrong++;
      this.sound.playWrong();
      btn.classList.add('word-choice-wrong');
      this._showFeedback('Read again and try another word!', true);
      setTimeout(() => btn.classList.remove('word-choice-wrong'), 400);
    }
  }

  onKeyDown(event) {
    if (this.complete || this.phase !== 'type') return;
    if (event.key === 'Escape') return;
    event.preventDefault();

    const clue = this._currentClue();
    const word = clue.answer;
    const expected = word[this.charIndex];

    if (codesMatch(expected, event)) {
      this.correct++;
      this.charIndex++;
      this.sound.playCorrect();
      this.keyboard?.flashCorrect(expected);

      if (this.charIndex >= word.length) {
        this.clueIndex++;
        this._showFeedback('Sentence complete!');
        setTimeout(() => this._showClue(), 500);
      } else {
        this._renderTypeProgress(word);
        this.keyboard?.highlightKey(word[this.charIndex]);
        this._showFeedback('Keep going!');
      }
    } else {
      this.wrong++;
      this.sound.playWrong();
      this.keyboard?.flashWrong(expected);
      this._showFeedback('Try again!', true);
    }
  }
}
