import { getAllActivities } from '../config/activityRegistry.js';
import { DIFFICULTY_ORDER, getTierLabel } from '../config/difficultyTiers.js';
import {
  SCHOOL_GRADES,
  MAX_ADVANCEMENT_LEVEL,
  getBand,
  difficultyForLevel,
  levelForPoints,
  pointsToNextLevel,
} from '../config/schoolBands.js';
import { formatPoints } from '../utils/scoring.js';
import { starsToString } from '../components/StarRating.js';

/**
 * Teacher dashboard (school edition) — reached through the math gate.
 * Roster management, per-student difficulty, progress, and class files.
 */
export function renderTeacherScreen(app, { onDone, onOpenSettings }) {
  const screen = _el('div', 'screen settings-screen teacher-screen');

  const header = _el('div', 'screen-header');
  header.appendChild(_el('h1', 'screen-title', 'Teacher Dashboard'));
  header.appendChild(_el('p', 'screen-subtitle', 'Manage your class. Students never see this screen.'));
  screen.appendChild(header);

  const status = _el('p', 'settings-hint teacher-status');
  status.setAttribute('role', 'status');

  // --- Add a student ---
  const addSection = _el('div', 'settings-section');
  addSection.appendChild(_el('h2', 'settings-section-title', 'Add a student'));
  const addRow = _el('div', 'teacher-add-row');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.maxLength = 40;
  nameInput.placeholder = 'First name + last initial (e.g. Ava R.)';
  nameInput.className = 'teacher-name-input';
  nameInput.setAttribute('aria-label', 'Student name');
  const gradeSelect = _gradeSelect('3');
  const addBtn = _btn('Add', 'btn btn-primary btn-small', () => {
    const name = nameInput.value.trim();
    if (!name) {
      status.textContent = 'Enter a name to add a student.';
      return;
    }
    app.roster.addStudent(name, gradeSelect.value);
    nameInput.value = '';
    status.textContent = `Added ${name}.`;
    renderList();
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });
  addRow.append(nameInput, gradeSelect, addBtn);
  addSection.appendChild(addRow);
  const addHint = _el('p', 'settings-hint',
    'Use first names or initials only — the class list stays on this computer.');
  addSection.appendChild(addHint);
  screen.appendChild(addSection);

  // --- Class list ---
  const listSection = _el('div', 'settings-section');
  listSection.appendChild(_el('h2', 'settings-section-title', 'Class'));
  const list = _el('div', 'teacher-list');
  listSection.appendChild(list);
  screen.appendChild(listSection);

  function renderList() {
    list.textContent = '';
    const students = app.roster.getStudents();
    if (students.length === 0) {
      list.appendChild(_el('p', 'settings-hint', 'No students yet — add your class above.'));
      return;
    }
    for (const student of students) {
      list.appendChild(studentRow(student));
    }
  }

  function studentRow(student) {
    const row = _el('div', 'teacher-student');
    const segment = app.roster.segmentFor(student.id);
    const band = getBand(student.band);

    const top = _el('div', 'teacher-student-top');
    const who = _el('div', 'teacher-student-who');
    who.appendChild(_el('span', 'teacher-student-name', student.name));
    who.appendChild(_el('span', 'teacher-student-meta',
      `${band.icon} Grade ${student.grade} · ${band.label}`));
    top.appendChild(who);

    const controls = _el('div', 'teacher-student-controls');

    const gradeSel = _gradeSelect(student.grade);
    gradeSel.setAttribute('aria-label', `Grade for ${student.name}`);
    gradeSel.addEventListener('change', () => {
      app.roster.updateStudent(student.id, { grade: gradeSel.value });
      status.textContent = `${student.name} moved to grade ${gradeSel.value}.`;
      renderList();
    });
    controls.appendChild(_labeled('Grade', gradeSel));

    const levelSel = document.createElement('select');
    levelSel.className = 'settings-select';
    levelSel.setAttribute('aria-label', `Level for ${student.name}`);
    for (let n = 1; n <= MAX_ADVANCEMENT_LEVEL; n++) {
      const o = document.createElement('option');
      o.value = String(n);
      o.textContent = `Level ${n} — ${getTierLabel(difficultyForLevel(n))}`;
      if (n === student.level) o.selected = true;
      levelSel.appendChild(o);
    }
    levelSel.addEventListener('change', () => {
      app.roster.updateStudent(student.id, { level: Number(levelSel.value) });
      status.textContent = `${student.name} set to Level ${levelSel.value}.`;
    });
    controls.appendChild(_labeled('Level', levelSel));

    const diffSel = document.createElement('select');
    diffSel.className = 'settings-select';
    diffSel.setAttribute('aria-label', `Difficulty for ${student.name}`);
    const autoOpt = document.createElement('option');
    autoOpt.value = 'auto';
    autoOpt.textContent = 'Auto (from level)';
    diffSel.appendChild(autoOpt);
    for (const tier of DIFFICULTY_ORDER) {
      const o = document.createElement('option');
      o.value = tier;
      o.textContent = getTierLabel(tier);
      diffSel.appendChild(o);
    }
    diffSel.value = student.difficultyOverride ?? 'auto';
    diffSel.addEventListener('change', () => {
      app.roster.updateStudent(student.id, { difficultyOverride: diffSel.value });
      status.textContent = diffSel.value === 'auto'
        ? `${student.name}'s difficulty follows their level again.`
        : `${student.name} pinned to ${getTierLabel(diffSel.value)}.`;
    });
    controls.appendChild(_labeled('Difficulty', diffSel));

    top.appendChild(controls);
    row.appendChild(top);

    // Progress summary + expandable detail
    const total = app.progress.getTotalPoints(segment);
    const toNext = pointsToNextLevel(total, levelForPoints(total));
    const summary = _el('div', 'teacher-student-progress',
      total > 0
        ? `Total: ${formatPoints(total)} pts${toNext != null ? ` · ${formatPoints(toNext)} to next level` : ' · top level reached'}`
        : 'No sessions yet.');
    row.appendChild(summary);

    const actions = _el('div', 'teacher-student-actions');
    const detail = _el('div', 'teacher-student-detail');
    detail.hidden = true;

    actions.appendChild(_btn('Progress', 'btn btn-outline btn-small', () => {
      detail.hidden = !detail.hidden;
      if (!detail.hidden) fillDetail(detail, student, segment);
    }));

    const removeBtn = _btn('Remove', 'btn btn-outline btn-small teacher-remove-btn', () => {
      if (removeBtn.dataset.confirm) {
        app.roster.removeStudent(student.id);
        status.textContent = `Removed ${student.name}.`;
        renderList();
      } else {
        removeBtn.dataset.confirm = '1';
        removeBtn.textContent = 'Really remove?';
        setTimeout(() => {
          delete removeBtn.dataset.confirm;
          removeBtn.textContent = 'Remove';
        }, 3000);
      }
    });
    actions.appendChild(removeBtn);

    row.append(actions, detail);
    return row;
  }

  function fillDetail(detail, student, segment) {
    detail.textContent = '';
    const showStars = getBand(student.band).audience === 'child';
    let any = false;
    for (const activity of getAllActivities()) {
      const best = app.progress.getBestPoints(activity.id, segment);
      if (best <= 0) continue;
      any = true;
      const stars = app.progress.getStars(activity.id, segment);
      const wpm = app.progress.getBestWpm(activity.id, segment);
      const bits = [`${activity.icon} ${activity.title}`, `${formatPoints(best)} pts`];
      if (showStars) bits.push(starsToString(stars));
      if (wpm > 0) bits.push(`${wpm} WPM`);
      detail.appendChild(_el('div', 'teacher-detail-row', bits.join(' · ')));
    }
    if (!any) {
      detail.appendChild(_el('div', 'teacher-detail-row', 'No games played yet.'));
    }
  }

  // --- Class file (export / import) ---
  const fileSection = _el('div', 'settings-section');
  fileSection.appendChild(_el('h2', 'settings-section-title', 'Class file'));
  fileSection.appendChild(_el('p', 'settings-hint',
    'Save this class (students, levels, and scores) to a file, or load one saved on another computer. Importing keeps the higher score when both exist.'));
  const fileRow = _el('div', 'btn-row teacher-file-row');

  fileRow.appendChild(_btn('Export class', 'btn btn-outline btn-small', () => {
    const payload = app.roster.exportClass(app.progress.data);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `key-buddy-class-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = 'Class exported to your downloads.';
  }));

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json,.json';
  importInput.hidden = true;
  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = app.roster.importClass(JSON.parse(reader.result), app.progress);
        if (!result) {
          status.textContent = 'That file is not a Key Buddy class file.';
          return;
        }
        status.textContent = `Imported class: ${result.added} added, ${result.updated} updated.`;
        renderList();
      } catch {
        status.textContent = 'Could not read that file.';
      }
    };
    reader.readAsText(file);
  });
  fileRow.appendChild(importInput);
  fileRow.appendChild(_btn('Import class', 'btn btn-outline btn-small', () => importInput.click()));
  fileSection.appendChild(fileRow);
  screen.appendChild(fileSection);

  screen.appendChild(status);

  const row = _el('div', 'btn-row');
  row.appendChild(_btn('Game Settings', 'btn btn-outline', onOpenSettings));
  row.appendChild(_btn('Done', 'btn btn-primary', onDone));
  screen.appendChild(row);

  renderList();
  return screen;
}

function _gradeSelect(value) {
  const sel = document.createElement('select');
  sel.className = 'settings-select';
  for (const g of SCHOOL_GRADES) {
    const o = document.createElement('option');
    o.value = g;
    o.textContent = g === 'K' ? 'K' : `Grade ${g}`;
    if (g === String(value)) o.selected = true;
    sel.appendChild(o);
  }
  return sel;
}

function _labeled(text, control) {
  const wrap = _el('label', 'teacher-control');
  wrap.appendChild(_el('span', 'teacher-control-label', text));
  wrap.appendChild(control);
  return wrap;
}

function _el(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function _btn(text, className, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}
