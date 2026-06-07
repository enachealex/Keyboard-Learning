import { Activity } from '../Activity.js';
import { COLORS } from '../../config/wordLists.js';

export class DragMatch extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    const cfg = this.cfg;
    this.colors = COLORS.slice(0, cfg.count);
    this.total = cfg.count;
    this.dragging = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this._buildUI();
  }

  _buildUI() {
    this.container.innerHTML = '';
    const area = this._el('div', 'drag-match-area');

    const itemsCol = this._el('div', 'drag-items');
    const zonesCol = this._el('div', 'drop-zones');

    this.shuffled = this._shuffle([...this.colors]);

    for (const color of this.shuffled) {
      const item = this._el('div', 'drag-item');
      item.textContent = color.emoji;
      item.style.background = color.hex;
      item.dataset.color = color.name;
      item.addEventListener('pointerdown', (e) => this._onDragStart(e, item));
      itemsCol.appendChild(item);
    }

    const zoneOrder = this._shuffle([...this.colors]);
    for (const color of zoneOrder) {
      const zone = this._el('div', 'drop-zone');
      zone.textContent = color.name;
      zone.dataset.color = color.name;
      zone.style.borderColor = color.hex;
      zonesCol.appendChild(zone);
    }

    area.append(itemsCol, zonesCol);
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(area, this.feedbackEl, this.progressEl);
    this._updateProgress();
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _updateProgress() {
    this.progressEl.textContent = `Matched: ${this.correct} / ${this.total}`;
  }

  _onDragStart(event, item) {
    if (this.complete || item.classList.contains('placed')) return;
    event.preventDefault();
    item.setPointerCapture(event.pointerId);
    this.dragging = item;
    const rect = item.getBoundingClientRect();
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;
    item.classList.add('dragging');
    item.style.left = `${event.clientX - this.offsetX}px`;
    item.style.top = `${event.clientY - this.offsetY}px`;
  }

  onPointerMove(event) {
    if (!this.dragging) return;
    this.dragging.style.left = `${event.clientX - this.offsetX}px`;
    this.dragging.style.top = `${event.clientY - this.offsetY}px`;

    document.querySelectorAll('.drop-zone').forEach((z) => z.classList.remove('hover'));
    const zone = this._zoneAt(event.clientX, event.clientY);
    if (zone && !zone.classList.contains('filled')) zone.classList.add('hover');
  }

  onPointerUp(event) {
    if (!this.dragging) return;
    const item = this.dragging;
    item.classList.remove('dragging');
    item.style.left = '';
    item.style.top = '';
    item.releasePointerCapture(event.pointerId);

    const zone = this._zoneAt(event.clientX, event.clientY);
    document.querySelectorAll('.drop-zone').forEach((z) => z.classList.remove('hover'));

    if (zone && !zone.classList.contains('filled') && zone.dataset.color === item.dataset.color) {
      zone.classList.add('filled');
      zone.textContent = item.textContent;
      zone.style.background = item.style.background;
      item.classList.add('placed');
      this.correct++;
      this.sound.playCorrect();
      this._showFeedback('Match!');

      if (this.correct >= this.total) this._finish();
    } else if (zone) {
      this.wrong++;
      this.sound.playWrong();
      this._showFeedback('Wrong bucket — try again!', true);
    }

    this.dragging = null;
    this._updateProgress();
  }

  _zoneAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el?.closest('.drop-zone') ?? null;
  }
}
