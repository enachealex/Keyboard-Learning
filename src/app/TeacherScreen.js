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
import { validateSchoolCode, decodeTeacherId } from '../school/schoolCode.js';
import { getStoredLicense, activateWebSchool } from './webSchool.js';

const TABS = [
  { id: 'students', label: 'Students' },
  { id: 'learning', label: 'Learning' },
  { id: 'settings', label: 'Settings' },
];

// Remembered across re-renders so passing the gate again lands where you were.
let activeTab = 'students';

/**
 * Teacher dashboard (school edition) — reached through the math gate.
 * Three tabs: Students (roster), Learning (word lists, math, games),
 * Settings (license, class file, game settings).
 */
export function renderTeacherScreen(app, { onDone, onOpenSettings }) {
  const screen = _el('div', 'screen settings-screen teacher-screen');

  const header = _el('div', 'screen-header');
  header.appendChild(_el('h1', 'screen-title', 'Teacher Dashboard'));
  header.appendChild(_el('p', 'screen-subtitle', 'Manage your class. Students never see this screen.'));
  screen.appendChild(header);

  // --- Tabs ---
  const tabBar = _el('div', 'adult-hub-tabs teacher-tabs');
  tabBar.setAttribute('role', 'tablist');
  tabBar.setAttribute('aria-label', 'Dashboard sections');
  const tabButtons = new Map();
  for (const tab of TABS) {
    const btn = _btn(tab.label, 'adult-hub-tab', () => {
      app.sound.playClick();
      activeTab = tab.id;
      status.textContent = '';
      renderTab();
    });
    btn.setAttribute('role', 'tab');
    tabButtons.set(tab.id, btn);
    tabBar.appendChild(btn);
  }
  screen.appendChild(tabBar);

  const status = _el('p', 'settings-hint teacher-status');
  status.setAttribute('role', 'status');
  screen.appendChild(status);

  const body = _el('div', 'teacher-tab-body');
  screen.appendChild(body);

  function renderTab() {
    for (const [id, btn] of tabButtons) {
      btn.classList.toggle('adult-hub-tab--active', id === activeTab);
      btn.setAttribute('aria-selected', id === activeTab ? 'true' : 'false');
    }
    body.textContent = '';
    if (activeTab === 'students') buildStudentsTab();
    else if (activeTab === 'learning') buildLearningTab();
    else buildSettingsTab();
  }

  // ===== Students tab =====

  let studentList = null;

  function buildStudentsTab() {
    const section = _el('div', 'settings-section');
    section.appendChild(_el('h2', 'settings-section-title', 'Class'));
    section.appendChild(_el('p', 'settings-hint',
      'Use first names or initials only — the class list stays on this computer.'));
    studentList = _el('div', 'teacher-list');
    section.appendChild(studentList);
    const actions = _el('div', 'btn-row teacher-file-row');
    actions.appendChild(_btn('＋ Add a student', 'btn btn-primary btn-small', openAddStudentModal));
    section.appendChild(actions);
    body.appendChild(section);
    renderList();
  }

  function renderList() {
    if (!studentList) return;
    studentList.textContent = '';
    const students = app.roster.getStudents();
    if (students.length === 0) {
      studentList.appendChild(_el('p', 'settings-hint', 'No students yet — tap “Add a student” to build your class.'));
      return;
    }
    for (const student of students) {
      studentList.appendChild(studentRow(student));
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
    for (const game of app.teacherContent.getCustomGames()) {
      const best = app.progress.getBestPoints(`custom:${game.id}`, segment);
      if (best <= 0) continue;
      any = true;
      detail.appendChild(_el('div', 'teacher-detail-row',
        `${game.icon} ${game.name} · ${formatPoints(best)} pts`));
    }
    if (!any) {
      detail.appendChild(_el('div', 'teacher-detail-row', 'No games played yet.'));
    }
  }

  // --- Add-a-student modal ---

  const backdrop = _el('div', 'teacher-modal-backdrop');
  backdrop.hidden = true;
  screen.appendChild(backdrop);

  let modalForm = null;
  let modalNameInput = null;
  let lastGrade = '3';

  function openAddStudentModal() {
    buildModalForm();
    backdrop.hidden = false;
    modalNameInput.focus();
  }

  function buildModalForm() {
    backdrop.textContent = '';
    modalForm = _el('div', 'teacher-modal');
    modalForm.setAttribute('role', 'dialog');
    modalForm.setAttribute('aria-modal', 'true');
    modalForm.setAttribute('aria-label', 'Add a student');

    modalForm.appendChild(_el('h2', 'settings-section-title', 'Add a student'));
    modalForm.appendChild(_el('p', 'settings-hint',
      'Use first names or initials only — the class list stays on this computer.'));

    modalNameInput = document.createElement('input');
    modalNameInput.type = 'text';
    modalNameInput.maxLength = 40;
    modalNameInput.placeholder = 'First name + last initial (e.g. Ava R.)';
    modalNameInput.className = 'teacher-name-input';
    modalNameInput.setAttribute('aria-label', 'Student name');
    modalForm.appendChild(modalNameInput);

    const gradeSel = _gradeSelect(lastGrade);
    gradeSel.setAttribute('aria-label', 'Grade');
    modalForm.appendChild(_labeled('Grade', gradeSel));

    const addedMsg = _el('p', 'settings-hint teacher-modal-msg');
    addedMsg.setAttribute('role', 'status');
    modalForm.appendChild(addedMsg);

    const actions = _el('div', 'teacher-modal-actions');
    const addBtn = _btn('Add student', 'btn btn-primary btn-small', () => {
      const name = modalNameInput.value.trim();
      if (!name) {
        addedMsg.textContent = 'Enter a name first.';
        return;
      }
      app.roster.addStudent(name, gradeSel.value);
      lastGrade = gradeSel.value;
      modalNameInput.value = '';
      addedMsg.textContent = `Added ${name} — add another or close.`;
      renderList();
      modalNameInput.focus();
    });
    actions.appendChild(addBtn);
    actions.appendChild(_btn('Close', 'btn btn-outline btn-small', requestModalClose));
    modalForm.appendChild(actions);

    modalNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });

    backdrop.appendChild(modalForm);
  }

  /** Close, but confirm first if a name is half-typed. */
  function requestModalClose() {
    if (modalNameInput?.value.trim()) {
      showCancelConfirm();
    } else {
      closeModal();
    }
  }

  function showCancelConfirm() {
    // Keep the form node (and its values) aside; show the confirm instead.
    modalForm.remove();
    const confirm = _el('div', 'teacher-modal');
    confirm.setAttribute('role', 'alertdialog');
    confirm.setAttribute('aria-modal', 'true');
    confirm.setAttribute('aria-label', 'Cancel adding a student');
    confirm.appendChild(_el('p', 'teacher-modal-confirm-text',
      'Are you sure you would like to cancel adding a Student?'));
    const actions = _el('div', 'teacher-modal-actions');
    actions.appendChild(_btn('Yes', 'btn btn-primary btn-small', closeModal));
    actions.appendChild(_btn('No', 'btn btn-outline btn-small', () => {
      confirm.remove();
      backdrop.appendChild(modalForm);
      modalNameInput.focus();
    }));
    confirm.appendChild(actions);
    backdrop.appendChild(confirm);
    actions.querySelector('button').focus();
  }

  function closeModal() {
    backdrop.hidden = true;
    backdrop.textContent = '';
    modalForm = null;
    modalNameInput = null;
    body.querySelector('.teacher-file-row button')?.focus();
  }

  backdrop.addEventListener('click', (e) => {
    // Outside click closes the form (with the dirty-check); while the
    // confirm is up an explicit Yes/No is required.
    if (e.target === backdrop && modalForm?.isConnected) requestModalClose();
  });
  backdrop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalForm?.isConnected) {
      e.stopPropagation();
      requestModalClose();
    }
  });

  // ===== Learning tab =====

  function buildLearningTab() {
    // --- Word lists ---
    const listsSection = _el('div', 'settings-section');
    listsSection.appendChild(_el('h2', 'settings-section-title', 'Word lists'));
    listsSection.appendChild(_el('p', 'settings-hint',
      "Paste this week's spelling or vocabulary words — one per line. The list in use feeds Word Garden, Typing Test, Fix & Type, and any of your games set to use it."));
    const listsWrap = _el('div', 'teacher-list');
    listsSection.appendChild(listsWrap);

    function renderWordLists() {
      listsWrap.textContent = '';
      const lists = app.teacherContent.getWordLists();
      const activeId = app.teacherContent.getActiveWordList()?.id ?? null;
      if (lists.length === 0) {
        listsWrap.appendChild(_el('p', 'settings-hint', 'No word lists yet — games use the built-in words.'));
      }
      for (const list of lists) {
        const row = _el('div', 'teacher-wordlist');
        const info = _el('div', 'teacher-wordlist-info');
        info.appendChild(_el('span', 'teacher-student-name', list.name));
        info.appendChild(_el('span', 'teacher-student-meta',
          `${list.words.length} words · ${list.words.slice(0, 4).join(', ')}${list.words.length > 4 ? '…' : ''}`));
        row.appendChild(info);
        const actions = _el('div', 'teacher-student-actions');
        if (list.id === activeId) {
          const btn = _btn('In use ✓', 'btn btn-primary btn-small', () => {
            app.teacherContent.setActiveWordList(null);
            status.textContent = 'Games use the built-in words again.';
            renderWordLists();
          });
          btn.setAttribute('aria-pressed', 'true');
          actions.appendChild(btn);
        } else {
          actions.appendChild(_btn('Use this list', 'btn btn-outline btn-small', () => {
            app.teacherContent.setActiveWordList(list.id);
            status.textContent = `Games now use "${list.name}".`;
            renderWordLists();
          }));
        }
        actions.appendChild(_btn('Delete', 'btn btn-outline btn-small', () => {
          app.teacherContent.removeWordList(list.id);
          status.textContent = `Deleted "${list.name}".`;
          renderWordLists();
        }));
        row.appendChild(actions);
        listsWrap.appendChild(row);
      }
    }

    const listAddWrap = _el('div', 'teacher-add-col');
    const listNameInput = document.createElement('input');
    listNameInput.type = 'text';
    listNameInput.maxLength = 40;
    listNameInput.placeholder = 'List name (e.g. Week 12 Spelling)';
    listNameInput.className = 'teacher-name-input';
    listNameInput.setAttribute('aria-label', 'Word list name');
    const listWordsInput = document.createElement('textarea');
    listWordsInput.rows = 5;
    listWordsInput.placeholder = 'One word or phrase per line\nbecause\nthrough\nfriend';
    listWordsInput.className = 'teacher-textarea';
    listWordsInput.setAttribute('aria-label', 'Words, one per line');
    listAddWrap.append(listNameInput, listWordsInput,
      _btn('Add list', 'btn btn-primary btn-small', () => {
        const list = app.teacherContent.addWordList(listNameInput.value.trim() || 'Word list', listWordsInput.value);
        if (!list) {
          status.textContent = 'Could not add that list — check it has typeable words (letters, numbers, basic punctuation).';
          return;
        }
        listNameInput.value = '';
        listWordsInput.value = '';
        status.textContent = `Added "${list.name}" with ${list.words.length} words — now in use.`;
        renderWordLists();
      }));
    listsSection.appendChild(listAddWrap);
    body.appendChild(listsSection);
    renderWordLists();

    // --- Math Facts settings ---
    const mathSection = _el('div', 'settings-section');
    mathSection.appendChild(_el('h2', 'settings-section-title', 'Math Facts Sprint'));
    const mathWrap = _el('div', 'teacher-math');
    mathSection.appendChild(mathWrap);

    function renderMath() {
      mathWrap.textContent = '';
      const saved = app.teacherContent.getMathSettings();
      const customize = document.createElement('label');
      customize.className = 'settings-row settings-toggle';
      const customizeInput = document.createElement('input');
      customizeInput.type = 'checkbox';
      customizeInput.checked = saved != null;
      const customizeText = document.createElement('span');
      customizeText.textContent = 'Customize problems (otherwise grade-level defaults apply)';
      customize.append(customizeInput, customizeText);
      mathWrap.appendChild(customize);
      customizeInput.addEventListener('change', () => {
        app.teacherContent.setMathSettings(customizeInput.checked
          ? { ops: { add: true, sub: true }, maxSum: 20, maxFactor: 10, focusTable: null }
          : null);
        status.textContent = customizeInput.checked
          ? 'Math Facts now uses your settings.'
          : 'Math Facts back to grade-level defaults.';
        renderMath();
      });
      if (!saved) return;

      const update = (partial) => {
        app.teacherContent.setMathSettings({ ...app.teacherContent.getMathSettings(), ...partial });
        renderMath();
      };

      const opsRow = _el('div', 'teacher-math-ops');
      const opDefs = [['add', 'Addition'], ['sub', 'Subtraction'], ['mul', 'Multiplication'], ['div', 'Division']];
      for (const [key, label] of opDefs) {
        const lab = document.createElement('label');
        lab.className = 'settings-row settings-toggle teacher-math-op';
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = Boolean(saved.ops[key]);
        box.addEventListener('change', () => update({ ops: { ...saved.ops, [key]: box.checked } }));
        const span = document.createElement('span');
        span.textContent = label;
        lab.append(box, span);
        opsRow.appendChild(lab);
      }
      mathWrap.appendChild(opsRow);

      const controls = _el('div', 'teacher-student-controls');
      controls.appendChild(_labeled('Answers up to', _optionSelect(
        [[10, 'Up to 10'], [20, 'Up to 20'], [50, 'Up to 50'], [100, 'Up to 100']],
        saved.maxSum, (v) => update({ maxSum: Number(v) }))));
      controls.appendChild(_labeled('Times tables up to', _optionSelect(
        [[5, 'Up to ×5'], [10, 'Up to ×10'], [12, 'Up to ×12']],
        saved.maxFactor, (v) => update({ maxFactor: Number(v) }))));
      const focusOptions = [['', 'Off — mixed practice']];
      for (let n = 2; n <= 12; n++) focusOptions.push([n, `The ×${n} table`]);
      controls.appendChild(_labeled('Focus drill', _optionSelect(
        focusOptions, saved.focusTable ?? '', (v) => update({ focusTable: v === '' ? null : Number(v) }))));
      mathWrap.appendChild(controls);
    }
    body.appendChild(mathSection);
    renderMath();

    // --- Teacher-built games ---
    const gamesSection = _el('div', 'settings-section');
    gamesSection.appendChild(_el('h2', 'settings-section-title', 'My games'));
    gamesSection.appendChild(_el('p', 'settings-hint',
      'Build your own typing game from the same settings the built-in games use. Enabled games appear on every student’s home screen.'));
    const gamesWrap = _el('div', 'teacher-list');
    const gameFormWrap = _el('div');
    gamesSection.append(gamesWrap, gameFormWrap);

    function renderGames() {
      gamesWrap.textContent = '';
      const games = app.teacherContent.getCustomGames();
      if (games.length === 0) {
        gamesWrap.appendChild(_el('p', 'settings-hint', 'No games yet.'));
      }
      for (const game of games) {
        const row = _el('div', 'teacher-wordlist');
        const info = _el('div', 'teacher-wordlist-info');
        info.appendChild(_el('span', 'teacher-student-name', `${game.icon} ${game.name}`));
        const bits = [game.mode === 'letters' ? 'Single keys' : 'Type words'];
        bits.push(game.timed ? `${game.timeLimit}s timed` : `${game.count} rounds`);
        bits.push(game.useActiveList ? 'uses active word list' : `${game.words.length} own words`);
        info.appendChild(_el('span', 'teacher-student-meta', bits.join(' · ')));
        row.appendChild(info);

        const actions = _el('div', 'teacher-student-actions');
        const onOff = document.createElement('label');
        onOff.className = 'settings-row settings-toggle teacher-game-toggle';
        const onOffInput = document.createElement('input');
        onOffInput.type = 'checkbox';
        onOffInput.checked = game.enabled;
        onOffInput.setAttribute('aria-label', `${game.name} visible to students`);
        onOffInput.addEventListener('change', () => {
          app.teacherContent.setCustomGameEnabled(game.id, onOffInput.checked);
          status.textContent = onOffInput.checked ? `"${game.name}" is on students' screens.` : `"${game.name}" hidden.`;
        });
        const onOffText = document.createElement('span');
        onOffText.textContent = 'On';
        onOff.append(onOffInput, onOffText);
        actions.appendChild(onOff);
        actions.appendChild(_btn('Edit', 'btn btn-outline btn-small', () => showGameForm(game)));
        actions.appendChild(_btn('Delete', 'btn btn-outline btn-small', () => {
          app.teacherContent.removeCustomGame(game.id);
          status.textContent = `Deleted "${game.name}".`;
          renderGames();
        }));
        row.appendChild(actions);
        gamesWrap.appendChild(row);
      }
      if (app.teacherContent.canAddCustomGame()) {
        gamesWrap.appendChild(_btn('+ New game', 'btn btn-outline btn-small', () => showGameForm(null)));
      }
    }

    function showGameForm(game) {
      gameFormWrap.textContent = '';
      const form = _el('div', 'teacher-game-form');
      form.appendChild(_el('h3', 'settings-section-title', game ? `Edit "${game.name}"` : 'New game'));

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.maxLength = 24;
      nameInput.placeholder = 'Game name';
      nameInput.className = 'teacher-name-input';
      nameInput.value = game?.name ?? '';
      nameInput.setAttribute('aria-label', 'Game name');
      form.appendChild(nameInput);

      const icons = ['⭐', '📚', '🔤', '🧠', '🚀', '🎯', '🌈', '✏️', '🏆', '🎮'];
      let chosenIcon = game?.icon ?? icons[0];
      const iconRow = _el('div', 'teacher-icon-row');
      for (const icon of icons) {
        const btn = _btn(icon, 'teacher-icon-btn', () => {
          chosenIcon = icon;
          iconRow.querySelectorAll('.teacher-icon-btn').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
        btn.setAttribute('aria-label', `Icon ${icon}`);
        if (icon === chosenIcon) btn.classList.add('selected');
        iconRow.appendChild(btn);
      }
      form.appendChild(_labeled('Icon', iconRow));

      const controls = _el('div', 'teacher-student-controls');
      const modeSel = _optionSelect(
        [['words', 'Type whole words'], ['letters', 'Press single keys']],
        game?.mode ?? 'words', () => {});
      controls.appendChild(_labeled('How it plays', modeSel));
      const countInput = _numberInput(game?.count ?? 10, 3, 50);
      controls.appendChild(_labeled('Rounds', countInput));
      const timeInput = _numberInput(game?.timeLimit ?? 60, 15, 180);
      controls.appendChild(_labeled('Seconds (if timed)', timeInput));
      form.appendChild(controls);

      const timedToggle = _formToggle('Timed — race the clock instead of a fixed number of rounds', game?.timed ?? false);
      const keyboardToggle = _formToggle('Show the on-screen keyboard', game?.showKeyboard !== false);
      const useListToggle = _formToggle('Use the active word list (otherwise the words below)', game?.useActiveList ?? false);
      form.append(timedToggle.row, keyboardToggle.row, useListToggle.row);

      const wordsInput = document.createElement('textarea');
      wordsInput.rows = 4;
      wordsInput.placeholder = 'Own words — one per line (at least 3)';
      wordsInput.className = 'teacher-textarea';
      wordsInput.value = (game?.words ?? []).join('\n');
      wordsInput.setAttribute('aria-label', 'Game words, one per line');
      form.appendChild(wordsInput);

      const btnRow = _el('div', 'btn-row teacher-file-row');
      btnRow.appendChild(_btn('Save game', 'btn btn-primary btn-small', () => {
        const saved = app.teacherContent.saveCustomGame({
          id: game?.id,
          name: nameInput.value,
          icon: chosenIcon,
          mode: modeSel.value,
          useActiveList: useListToggle.input.checked,
          words: wordsInput.value.split('\n'),
          count: Number(countInput.value),
          timed: timedToggle.input.checked,
          timeLimit: Number(timeInput.value),
          showKeyboard: keyboardToggle.input.checked,
          enabled: game?.enabled ?? true,
        });
        if (!saved) {
          status.textContent = 'Could not save — a game needs a name and at least 3 words (or the active word list).';
          return;
        }
        status.textContent = `Saved "${saved.name}".`;
        gameFormWrap.textContent = '';
        renderGames();
      }));
      btnRow.appendChild(_btn('Cancel', 'btn btn-outline btn-small', () => {
        gameFormWrap.textContent = '';
      }));
      form.appendChild(btnRow);

      gameFormWrap.appendChild(form);
      nameInput.focus();
    }

    body.appendChild(gamesSection);
    renderGames();
  }

  // ===== Settings tab =====

  function buildSettingsTab() {
    // --- License ---
    const licSection = _el('div', 'settings-section');
    licSection.appendChild(_el('h2', 'settings-section-title', 'Your license'));
    const licWrap = _el('div', 'teacher-license');
    licSection.appendChild(licWrap);

    function renderLicense() {
      licWrap.textContent = '';
      const code = getStoredLicense();
      if (code) {
        const id = decodeTeacherId(code);
        licWrap.appendChild(_el('p', 'teacher-license-line',
          `${code}${id != null ? ` · Teacher ID #${id}` : ''}`));
        licWrap.appendChild(_el('p', 'settings-hint',
          'Your personal code identifies you — exported class files carry it so your data is attributable to you.'));
      } else {
        licWrap.appendChild(_el('p', 'settings-hint',
          'No license code recorded on this computer. Enter the code from your purchase email:'));
      }
      const row = _el('div', 'teacher-add-row');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'teacher-name-input';
      input.placeholder = 'KB-XXXX-XXXX-XXXX';
      input.maxLength = 20;
      input.spellcheck = false;
      input.setAttribute('aria-label', 'License code');
      row.appendChild(input);
      row.appendChild(_btn(code ? 'Replace code' : 'Save code', 'btn btn-outline btn-small', () => {
        const value = input.value.trim().toUpperCase();
        if (!validateSchoolCode(value)) {
          status.textContent = 'That code doesn’t look right — check it against your purchase email.';
          return;
        }
        activateWebSchool(value);
        status.textContent = `License saved — Teacher ID #${decodeTeacherId(value)}.`;
        renderLicense();
      }));
      licWrap.appendChild(row);
    }
    body.appendChild(licSection);
    renderLicense();

    // --- Class file (export / import) ---
    const fileSection = _el('div', 'settings-section');
    fileSection.appendChild(_el('h2', 'settings-section-title', 'Class file'));
    fileSection.appendChild(_el('p', 'settings-hint',
      'Save this class (students, levels, and scores) to a file, or load one saved on another computer. Importing keeps the higher score when both exist.'));
    const fileRow = _el('div', 'btn-row teacher-file-row');

    fileRow.appendChild(_btn('Export class', 'btn btn-outline btn-small', () => {
      const payload = app.roster.exportClass(app.progress.data, app.teacherContent);
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
          const result = app.roster.importClass(JSON.parse(reader.result), app.progress, app.teacherContent);
          if (!result) {
            status.textContent = 'That file is not a Key Buddy class file.';
            return;
          }
          status.textContent = `Imported class: ${result.added} added, ${result.updated} updated.`;
        } catch {
          status.textContent = 'Could not read that file.';
        }
      };
      reader.readAsText(file);
    });
    fileRow.appendChild(importInput);
    fileRow.appendChild(_btn('Import class', 'btn btn-outline btn-small', () => importInput.click()));
    fileSection.appendChild(fileRow);
    body.appendChild(fileSection);

    // --- Game settings ---
    const gsSection = _el('div', 'settings-section');
    gsSection.appendChild(_el('h2', 'settings-section-title', 'Game settings'));
    gsSection.appendChild(_el('p', 'settings-hint',
      'Difficulty, round length, timers, sounds, and which games are available.'));
    const gsRow = _el('div', 'btn-row teacher-file-row');
    gsRow.appendChild(_btn('Open Game Settings', 'btn btn-outline btn-small', onOpenSettings));
    gsSection.appendChild(gsRow);
    body.appendChild(gsSection);
  }

  const row = _el('div', 'btn-row');
  row.appendChild(_btn('Done', 'btn btn-primary', onDone));
  screen.appendChild(row);

  renderTab();
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

function _optionSelect(options, value, onChange) {
  const sel = document.createElement('select');
  sel.className = 'settings-select';
  for (const [val, label] of options) {
    const o = document.createElement('option');
    o.value = String(val);
    o.textContent = label;
    if (String(val) === String(value)) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

function _numberInput(value, min, max) {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.className = 'settings-select teacher-number-input';
  return input;
}

function _formToggle(label, checked) {
  const row = document.createElement('label');
  row.className = 'settings-row settings-toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  const span = document.createElement('span');
  span.textContent = label;
  row.append(input, span);
  return { row, input };
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
