import { ACTIVITIES, CATEGORIES } from '../config/activityRegistry.js';
import { AGE_GROUPS } from '../config/ageGroups.js';
import {
  DIFFICULTY_OVERRIDE_OPTIONS,
  ROUND_LENGTH_OPTIONS,
  TIMED_GAMES_OPTIONS,
} from '../config/settingsDefaults.js';
import { createMathProblem } from '../utils/mathGate.js';
import { applyUiPreferences, REDUCE_MOTION_OPTIONS, TEXT_SCALE_OPTIONS, THEME_OPTIONS } from '../utils/uiPreferences.js';

const KEYBOARD_OPTIONS = [
  { id: 'auto', label: 'Auto (typing games)' },
  { id: 'always', label: 'Always show' },
  { id: 'never', label: 'Hide on-screen keyboard' },
];

const CHILD_AGE_GROUP_OPTIONS = Object.values(AGE_GROUPS).map((g) => ({
  id: g.id,
  label: `${g.label} (ages ${g.ages})`,
}));

export function renderAdultSettings(app, onBack) {
  const screen = document.createElement('div');
  screen.className = 'screen settings-screen';

  const header = document.createElement('div');
  header.className = 'screen-header';
  header.innerHTML = `
    <h1 class="screen-title">Parent Settings</h1>
    <p class="screen-subtitle">Customize games for your child. Kids won't see this screen.</p>
  `;
  screen.appendChild(header);

  const form = document.createElement('div');
  form.className = 'settings-form';
  const profile = app.profile;
  const draft = { ...app.settings.getAll() };
  const draftProfile = { ageGroup: profile.getAgeGroup() ?? 'young' };
  const childAge = profile.getChildAge();

  const childSectionChildren = [];
  if (childAge != null) {
    const ageNote = document.createElement('p');
    ageNote.className = 'settings-hint';
    ageNote.textContent = `Your child entered age ${childAge}.`;
    childSectionChildren.push(ageNote);
  }
  childSectionChildren.push(
    _select('Age group', CHILD_AGE_GROUP_OPTIONS, draftProfile.ageGroup, (v) => {
      draftProfile.ageGroup = v;
    }),
  );
  const groupHint = document.createElement('p');
  groupHint.className = 'settings-hint';
  groupHint.textContent = 'Override the group chosen from your child\'s age if needed.';
  childSectionChildren.push(groupHint);

  form.appendChild(_section('Child profile', childSectionChildren));

  form.appendChild(_section('Display & accessibility', [
    _select('Theme', THEME_OPTIONS, draft.theme ?? 'auto', (v) => { draft.theme = v; }),
    _select('Text size', TEXT_SCALE_OPTIONS, draft.textScale ?? 'normal', (v) => { draft.textScale = v; }),
    _select('Motion', REDUCE_MOTION_OPTIONS, draft.reduceMotion ?? 'auto', (v) => { draft.reduceMotion = v; }),
    _toggle('High contrast', draft.highContrast ?? false, (v) => { draft.highContrast = v; }),
  ]));

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
  row.appendChild(_btn('Save Settings', 'btn btn-primary', () => {
    app.profile.setAgeGroup(draftProfile.ageGroup);
    app.settings.update(draft);
    applyUiPreferences(draft);
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
    <h1 class="screen-title">Parent Settings</h1>
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
  input.setAttribute('data-autofocus', 'true');
  input.setAttribute('aria-label', 'Math answer');
  input.setAttribute('aria-describedby', 'math-gate-error');
  screen.appendChild(input);

  const err = document.createElement('p');
  err.className = 'settings-error';
  err.id = 'math-gate-error';
  err.setAttribute('role', 'alert');
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
