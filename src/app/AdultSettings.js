import { ACTIVITIES, CATEGORIES } from '../config/activityRegistry.js';
import {
  DIFFICULTY_OVERRIDE_OPTIONS,
  ROUND_LENGTH_OPTIONS,
  TIMED_GAMES_OPTIONS,
} from '../config/settingsDefaults.js';
import { createMathProblem } from '../utils/mathGate.js';

const KEYBOARD_OPTIONS = [
  { id: 'auto', label: 'Auto (typing games)' },
  { id: 'always', label: 'Always show' },
  { id: 'never', label: 'Hide on-screen keyboard' },
];

export function renderAdultSettings(app, onBack) {
  const screen = document.createElement('div');
  screen.className = 'screen settings-screen';

  const header = document.createElement('div');
  header.className = 'screen-header';
  header.innerHTML = `
    <h1 class="screen-title">Grown-Up Settings</h1>
    <p class="screen-subtitle">Customize games for your child. Kids won't see this screen.</p>
  `;
  screen.appendChild(header);

  const form = document.createElement('div');
  form.className = 'settings-form';
  const draft = { ...app.settings.getAll() };

  form.appendChild(_section('General', [
    _toggle('Background music', draft.musicEnabled, (v) => { draft.musicEnabled = v; }),
    _toggle('Sound effects', draft.sfxEnabled, (v) => { draft.sfxEnabled = v; }),
    _select('Difficulty', DIFFICULTY_OVERRIDE_OPTIONS, draft.difficultyOverride, (v) => {
      draft.difficultyOverride = v;
    }),
    _select('Round length', ROUND_LENGTH_OPTIONS, draft.roundLength, (v) => {
      draft.roundLength = v;
    }),
    _select('Timed games', TIMED_GAMES_OPTIONS, draft.timedGames, (v) => {
      draft.timedGames = v;
    }),
    _select('On-screen keyboard', KEYBOARD_OPTIONS, draft.showKeyboard ?? 'auto', (v) => {
      draft.showKeyboard = v;
    }),
  ]));

  form.appendChild(_section('Games', [
    _gameToggles(draft, (id, enabled) => {
      draft.enabledActivities[id] = enabled;
    }),
  ]));

  screen.appendChild(form);

  const row = document.createElement('div');
  row.className = 'btn-row';
  row.appendChild(_btn('Cancel', 'btn btn-outline', onBack));
  row.appendChild(_btn('Save Settings', 'btn btn-primary', () => {
    app.settings.update(draft);
    app.sound.setMusicEnabled(draft.musicEnabled !== false);
    app.sound.setSfxEnabled(draft.sfxEnabled !== false);
    app.audioControls.refresh();
    onBack();
  }));
  screen.appendChild(row);

  return screen;
}

export function renderMathGate(_app, onSuccess, onCancel) {
  const screen = document.createElement('div');
  screen.className = 'screen settings-screen';

  let problem = createMathProblem();

  const header = document.createElement('div');
  header.className = 'screen-header';
  header.innerHTML = `
    <h1 class="screen-title">Grown-Up Settings</h1>
    <p class="screen-subtitle">Solve this math problem to continue</p>
  `;
  screen.appendChild(header);

  const prompt = document.createElement('p');
  prompt.className = 'math-gate-question';
  prompt.textContent = `What is ${problem.question}?`;
  screen.appendChild(prompt);

  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'numeric';
  input.className = 'settings-pin-input math-gate-input';
  input.placeholder = '?';
  input.autocomplete = 'off';
  screen.appendChild(input);

  const err = document.createElement('p');
  err.className = 'settings-error';
  screen.appendChild(err);

  const newProblem = () => {
    problem = createMathProblem();
    prompt.textContent = `What is ${problem.question}?`;
    input.value = '';
    err.textContent = '';
    input.focus();
  };

  const tryAnswer = () => {
    const value = parseInt(input.value, 10);
    if (value === problem.answer) {
      onSuccess();
    } else {
      err.textContent = 'Not quite — try again!';
      newProblem();
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryAnswer();
  });

  const row = document.createElement('div');
  row.className = 'btn-row';
  row.appendChild(_btn('Cancel', 'btn btn-outline', onCancel));
  row.appendChild(_btn('Continue', 'btn btn-primary', tryAnswer));
  screen.appendChild(row);

  setTimeout(() => input.focus(), 100);
  return screen;
}

function _section(title, children) {
  const sec = document.createElement('div');
  sec.className = 'settings-section';
  const h = document.createElement('h2');
  h.className = 'settings-section-title';
  h.textContent = title;
  sec.appendChild(h);
  for (const child of children) sec.appendChild(child);
  return sec;
}

function _toggle(label, value, onChange) {
  const row = document.createElement('label');
  row.className = 'settings-row settings-toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.addEventListener('change', () => onChange(input.checked));
  const span = document.createElement('span');
  span.textContent = label;
  row.append(input, span);
  return row;
}

function _select(label, options, value, onChange) {
  const row = document.createElement('label');
  row.className = 'settings-row';
  const lbl = document.createElement('span');
  lbl.className = 'settings-label';
  lbl.textContent = label;
  const select = document.createElement('select');
  select.className = 'settings-select';
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt.id;
    o.textContent = opt.label;
    if (opt.id === value) o.selected = true;
    select.appendChild(o);
  }
  select.addEventListener('change', () => onChange(select.value));
  row.append(lbl, select);
  return row;
}

function _gameToggles(draft, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'settings-games';

  for (const cat of Object.values(CATEGORIES)) {
    const catLabel = document.createElement('div');
    catLabel.className = 'settings-game-category';
    catLabel.textContent = cat.label;
    wrap.appendChild(catLabel);

    for (const activity of Object.values(ACTIVITIES)) {
      if (activity.category !== cat.id) continue;
      const row = document.createElement('label');
      row.className = 'settings-row settings-game-row';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = draft.enabledActivities[activity.id] !== false;
      input.addEventListener('change', () => onChange(activity.id, input.checked));
      const span = document.createElement('span');
      span.textContent = `${activity.icon} ${activity.title}`;
      row.append(input, span);
      wrap.appendChild(row);
    }
  }
  return wrap;
}

function _btn(text, className, onClick) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}
