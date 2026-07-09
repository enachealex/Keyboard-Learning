import { ACTIVITIES, CATEGORIES } from '../config/activityRegistry.js';
import { AGE_GROUPS } from '../config/ageGroups.js';
import {
  DIFFICULTY_OVERRIDE_OPTIONS,
  ROUND_LENGTH_OPTIONS,
  TIMED_GAMES_OPTIONS,
} from '../config/settingsDefaults.js';
import { createMathProblem } from '../utils/mathGate.js';
import { applyUiPreferences, REDUCE_MOTION_OPTIONS, TEXT_SCALE_OPTIONS, THEME_OPTIONS } from '../utils/uiPreferences.js';
import {
  ACCESS_PICTURES,
  MIN_CODE_LENGTH,
  MAX_CODE_LENGTH,
  getPicture,
  isValidCode,
} from '../config/accessPictures.js';

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

  const access = _accessSection(app);
  form.appendChild(access.element);

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
    if (!access.commit()) {
      access.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
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

export function renderMathGate(_app, onSuccess, onCancel, options = {}) {
  const screen = document.createElement('div');
  screen.className = 'screen settings-screen';

  let problem = createMathProblem();

  const header = document.createElement('div');
  header.className = 'screen-header';
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = options.title ?? 'Parent Settings';
  const subtitle = document.createElement('p');
  subtitle.className = 'screen-subtitle';
  subtitle.textContent = 'Solve this math problem to continue';
  header.append(title, subtitle);
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

/**
 * Teacher-facing builder for the kid-friendly picture access code.
 * Returns the section element plus commit(), which validates and persists on
 * Save (and returns false to block the save if an enabled code is incomplete).
 */
function _accessSection(app) {
  const draft = { enabled: app.access.isEnabled(), code: app.access.getCode() };

  const hint = document.createElement('p');
  hint.className = 'settings-hint';
  hint.textContent =
    'Students tap this picture code to open the app, and enter it each time it launches. '
    + 'Write the pictures on the board for your class. This is a simple gate to keep the app '
    + 'school-only — not a secure password.';

  const error = document.createElement('p');
  error.className = 'settings-error';
  error.setAttribute('role', 'alert');

  const builder = document.createElement('div');
  builder.className = 'access-builder';

  const currentLabel = document.createElement('p');
  currentLabel.className = 'settings-label';
  currentLabel.textContent = 'Current code (order matters):';

  const current = document.createElement('div');
  current.className = 'access-current';

  const renderCurrent = () => {
    current.textContent = '';
    if (draft.code.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'access-current-empty';
      empty.textContent = 'No pictures picked yet.';
      current.appendChild(empty);
      return;
    }
    draft.code.forEach((id, i) => {
      const pic = getPicture(id);
      const chip = document.createElement('span');
      chip.className = 'access-current-chip';
      const num = document.createElement('span');
      num.className = 'access-current-num';
      num.textContent = `${i + 1}`;
      const emoji = document.createElement('span');
      emoji.className = 'access-current-emoji';
      emoji.textContent = pic ? pic.emoji : '?';
      chip.append(num, emoji);
      current.appendChild(chip);
    });
  };

  const controls = document.createElement('div');
  controls.className = 'btn-row access-builder-controls';
  controls.appendChild(_btn('Undo', 'btn btn-outline btn-small', () => {
    error.textContent = '';
    draft.code.pop();
    renderCurrent();
  }));
  controls.appendChild(_btn('Clear', 'btn btn-outline btn-small', () => {
    error.textContent = '';
    draft.code = [];
    renderCurrent();
  }));

  const pickerLabel = document.createElement('p');
  pickerLabel.className = 'settings-hint';
  pickerLabel.textContent = `Tap pictures to build the code (${MIN_CODE_LENGTH}–${MAX_CODE_LENGTH} pictures).`;

  const picker = document.createElement('div');
  picker.className = 'access-picker';
  for (const pic of ACCESS_PICTURES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'access-pick-btn';
    btn.setAttribute('aria-label', `Add ${pic.label}`);
    const emoji = document.createElement('span');
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = pic.emoji;
    btn.appendChild(emoji);
    btn.addEventListener('click', () => {
      error.textContent = '';
      if (draft.code.length >= MAX_CODE_LENGTH) {
        error.textContent = `A code can have at most ${MAX_CODE_LENGTH} pictures.`;
        return;
      }
      draft.code.push(pic.id);
      renderCurrent();
    });
    picker.appendChild(btn);
  }

  builder.append(currentLabel, current, controls, pickerLabel, picker);

  const toggle = _toggle('Require picture code to open the app', draft.enabled, (v) => {
    draft.enabled = v;
    builder.style.display = v ? '' : 'none';
    if (!v) error.textContent = '';
  });

  builder.style.display = draft.enabled ? '' : 'none';
  renderCurrent();

  const section = _section('School access code', [hint, toggle, builder, error]);

  const commit = () => {
    if (!draft.enabled) {
      app.access.disable();
      return true;
    }
    if (!isValidCode(draft.code)) {
      error.textContent = `Pick at least ${MIN_CODE_LENGTH} pictures for the code.`;
      return false;
    }
    app.access.setCode(draft.code);
    return true;
  };

  return { element: section, commit };
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
