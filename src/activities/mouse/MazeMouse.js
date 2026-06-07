import { Activity } from '../Activity.js';
import { MAZE_POOLS } from '../../config/mazes.js';

const CELL = { WALL: '#', PATH: '.', START: 'S', FINISH: 'F' };

export class MazeMouse extends Activity {
  init(difficulty, container, config) {
    super.init(difficulty, container, config);
    this.total = this.cfg.count;
    this.cellSize = this.cfg.cellSize;
    this.pool = this._shuffle([...MAZE_POOLS[this.cfg.pool]]);
    this.mazeIndex = 0;
    this.grid = [];
    this.startCell = null;
    this.finishCell = null;
    this.active = false;
    this.onPath = false;
    this._buildUI();
    this._loadMaze(this.pool[this.mazeIndex % this.pool.length]);
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
    this.hintEl = this._el('div', 'maze-hint', 'Move your mouse from START to FINISH without touching the walls!');
    this.wrap = this._el('div', 'maze-wrap');
    this.gridEl = this._el('div', 'maze-grid');
    this.dot = this._el('div', 'maze-dot');
    this.wrap.append(this.gridEl, this.dot);
    this.feedbackEl = this._el('div', 'activity-feedback');
    this.progressEl = this._el('div', 'activity-progress');
    this.container.append(this.hintEl, this.wrap, this.feedbackEl, this.progressEl);

    this.wrap.addEventListener('pointermove', (e) => this._onPointerMove(e));
    this.wrap.addEventListener('pointerleave', () => this._hideDot());
  }

  _loadMaze(rows) {
    this.grid = rows.map((row) => row.split(''));
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.active = false;
    this.onPath = false;

    this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, ${this.cellSize}px)`;
    this.gridEl.style.gridTemplateRows = `repeat(${this.rows}, ${this.cellSize}px)`;
    this.gridEl.innerHTML = '';

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const ch = this.grid[r][c];
        const cell = this._el('div', 'maze-cell');
        if (ch === CELL.WALL) {
          cell.classList.add('maze-wall');
        } else {
          cell.classList.add('maze-path');
          if (ch === CELL.START) {
            cell.classList.add('maze-start');
            cell.textContent = '▶';
            this.startCell = { r, c };
          } else if (ch === CELL.FINISH) {
            cell.classList.add('maze-finish');
            cell.textContent = '⭐';
            this.finishCell = { r, c };
          }
        }
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        this.gridEl.appendChild(cell);
      }
    }

    this._hideDot();
    this._updateProgress();
    this._showFeedback('Go to the green START square!');
  }

  _cellAt(clientX, clientY) {
    const rect = this.gridEl.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left) / this.cellSize);
    const row = Math.floor((clientY - rect.top) / this.cellSize);
    if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) return null;
    return { r: row, c: col, ch: this.grid[row][col] };
  }

  _moveDot(clientX, clientY) {
    const rect = this.wrap.getBoundingClientRect();
    this.dot.style.display = 'block';
    this.dot.style.left = `${clientX - rect.left}px`;
    this.dot.style.top = `${clientY - rect.top}px`;
  }

  _hideDot() {
    this.dot.style.display = 'none';
  }

  _onPointerMove(event) {
    if (this.complete) return;
    event.preventDefault();
    this._moveDot(event.clientX, event.clientY);

    const cell = this._cellAt(event.clientX, event.clientY);
    if (!cell) return;

    const { r, c, ch } = cell;

    if (ch === CELL.WALL) {
      if (this.active) {
        this._hitWall();
      }
      return;
    }

    if (!this.active) {
      if (ch === CELL.START || this._isStartAdjacent(r, c)) {
        this.active = true;
        this.onPath = true;
        this._showFeedback('Stay on the path!');
      }
      return;
    }

    if (ch === CELL.FINISH) {
      this._reachFinish();
      return;
    }

    this.onPath = true;
  }

  _isStartAdjacent(r, c) {
    if (!this.startCell) return false;
    const dr = Math.abs(r - this.startCell.r);
    const dc = Math.abs(c - this.startCell.c);
    return dr + dc <= 1;
  }

  _hitWall() {
    this.wrong++;
    this.active = false;
    this.onPath = false;
    this.sound.playWrong();
    this.wrap.classList.add('maze-shake');
    this._showFeedback('Oops — wall! Back to START.', true);
    setTimeout(() => this.wrap.classList.remove('maze-shake'), 400);
  }

  _reachFinish() {
    if (!this.active) return;
    this.correct++;
    this.active = false;
    this.sound.playCorrect();
    this._showFeedback('You made it through!');

    if (this.correct >= this.total) {
      setTimeout(() => this._finish(), 500);
      return;
    }

    this.mazeIndex++;
    setTimeout(() => {
      this._loadMaze(this.pool[this.mazeIndex % this.pool.length]);
      this._showFeedback('Next maze — find START!');
    }, 700);
    this._updateProgress();
  }

  _updateProgress() {
    this.progressEl.textContent = `Mazes completed: ${this.correct} / ${this.total}`;
  }

  onPointerMove(event) {
    this._onPointerMove(event);
  }
}
