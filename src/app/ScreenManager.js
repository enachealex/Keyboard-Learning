import { CATEGORIES, getActivityById, getEnabledActivities } from '../config/activityRegistry.js';
import { CHILD_AGE_MIN, CHILD_AGE_MAX, getAgeGroup, isValidChildAge, ageGroupFromNumber } from '../config/ageGroups.js';
import { ADULT_LEVELS, getAdultLevel } from '../config/adultLevels.js';
import { ADULT_LESSONS } from '../config/adultCurriculum.js';
import { getRandomErgonomicsTip } from '../config/ergonomicsTips.js';
import { createActivityCard } from '../components/ActivityCard.js';
import { createStarRating } from '../components/StarRating.js';
import { createMascot } from '../components/Mascot.js';
import { renderAdultSettings, renderMathGate } from './AdultSettings.js';
import { ACCESS_PICTURES } from '../config/accessPictures.js';
import { IS_SCHOOL } from '../config/edition.js';
import { getBand, getPresentation, levelForPoints, pointsToNextLevel, LEVEL_POINT_THRESHOLDS } from '../config/schoolBands.js';
import { renderTeacherScreen } from './TeacherScreen.js';
import { formatPoints } from '../utils/scoring.js';
import { resolveDifficulty } from '../config/settingsResolver.js';
import { makeActivatable } from '../utils/makeActivatable.js';

export class ScreenManager {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById('screen-root') ?? document.getElementById('app');
    this.screen = 'welcome';
    this.selectedActivity = null;
    this.lastScore = null;
    this._pendingAdultLevel = null;
    this._adultTab = 'learn';
  }

  get ageGroupId() {
    return this.app.profile.getAgeGroup();
  }

  get adultLevelId() {
    return this.app.profile.getAdultLevel();
  }

  get skillSegmentId() {
    return this.app.profile.getSkillSegmentId();
  }

  _activityContext(hubSection = null) {
    const profile = this.app.profile;
    const audience = profile.getAudience() ?? 'child';
    const segmentId = profile.getSkillSegmentId();
    const difficulty = resolveDifficulty(segmentId, this.app.settings.getAll(), audience);
    return { audience, segmentId, difficulty, hubSection };
  }

  _settingsBackScreen() {
    if (IS_SCHOOL) return 'teacher';
    if (this.app.profile.hasActiveProfile()) return 'hub';
    return 'welcome';
  }

  restoreFromSession() {
    const session = this.app.session.getAll();
    const profile = this.app.profile;

    if (session.adultTab) this._adultTab = session.adultTab;
    if (session.selectedActivityId) {
      this.selectedActivity = getActivityById(session.selectedActivityId);
    }

    let screen = session.screen ?? 'welcome';
    if (screen === 'activity') screen = 'hub';

    if (screen === 'hub' && !profile.hasActiveProfile()) {
      screen = profile.isAdult() ? 'adult-level' : (profile.getAudience() === 'child' ? 'age' : 'welcome');
    }
    if (screen === 'age' && profile.isAdult()) {
      screen = profile.hasAdultLevel() ? 'hub' : 'adult-level';
    }
    if (screen === 'adult-level' && profile.isChild() && profile.hasAgeGroup()) {
      screen = 'hub';
    }
    if (screen === 'results') {
      if (session.lastScore) this.lastScore = session.lastScore;
      else screen = profile.hasActiveProfile() ? 'hub' : 'welcome';
    }
    // Never restore into Parent Settings — the math gate must be re-passed.
    if (screen === 'settings-gate' || screen === 'settings') {
      screen = profile.hasActiveProfile() ? 'hub' : 'welcome';
    }

    this.show(screen);
  }

  goHome() {
    if (this.app.currentActivity) this.app.stopActivity(false);
    this.show('welcome');
  }

  getNavState(screen) {
    switch (screen) {
      case 'access-lock':
      case 'access-teacher-gate':
      case 'student-picker':
        return { showBack: false, showHome: false, showA11y: true, backAction: null };
      case 'teacher-gate':
      case 'teacher':
        return {
          showBack: true,
          showHome: false,
          showA11y: true,
          backAction: () => this.show('student-picker'),
        };
      case 'welcome':
        return { showBack: false, showHome: false, showA11y: true, backAction: null };
      case 'age':
      case 'adult-level':
        return {
          showBack: true,
          showHome: true,
          showA11y: true,
          backAction: () => this.show('welcome'),
        };
      case 'hub':
        return {
          showBack: true,
          showHome: true,
          showA11y: true,
          backAction: () => this.show('welcome'),
        };
      case 'activity':
        return {
          showBack: true,
          showHome: true,
          showA11y: false,
          backAction: () => this.app.stopActivity(),
        };
      case 'results':
        return {
          showBack: true,
          showHome: true,
          showA11y: true,
          backAction: () => this.show('hub'),
        };
      case 'settings-gate':
      case 'settings':
        return {
          showBack: true,
          showHome: true,
          showA11y: false,
          backAction: () => this.show(this._settingsBackScreen()),
        };
      default:
        return { showBack: false, showHome: false, showA11y: false, backAction: null };
    }
  }

  _persistSession(screen) {
    const session = this.app.session;
    const persistScreen = session.screenForPersistence(screen);
    if (!session.canPersistScreen(persistScreen)) return;

    session.update({
      screen: persistScreen,
      adultTab: this._adultTab,
      selectedActivityId: this.selectedActivity?.id ?? null,
      lastScore: screen === 'results' ? this.lastScore : null,
    });
  }

  show(screen) {
    // The school edition has no parent/adult welcome — home is the class list.
    if (IS_SCHOOL && screen === 'welcome') screen = 'student-picker';
    if (screen === 'welcome') this._pendingAdultLevel = null;
    this.screen = screen;
    this._persistSession(screen);
    this.root.innerHTML = '';
    this.app.syncChrome(screen);
    switch (screen) {
      case 'access-lock': this._renderAccessLock(); break;
      case 'access-teacher-gate': this._renderAccessTeacherGate(); break;
      case 'student-picker': this._renderStudentPicker(); break;
      case 'teacher-gate': this._renderTeacherGate(); break;
      case 'teacher': this._renderTeacher(); break;
      case 'welcome': this._renderWelcome(); break;
      case 'age': this._renderAgePicker(); break;
      case 'adult-level': this._renderAdultLevelPicker(); break;
      case 'hub': this._renderHub(); break;
      case 'activity': this._renderActivityShell(); break;
      case 'results': this._renderResults(); break;
      case 'settings-gate': this._renderSettingsGate(); break;
      case 'settings': this._renderSettings(); break;
    }
    this._focusScreen();
  }

  _focusScreen() {
    requestAnimationFrame(() => {
      const preferred = this.root.querySelector('[data-autofocus]');
      const fallback = this.root.querySelector(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
      );
      (preferred ?? fallback)?.focus();
    });
  }

  openAdultSettings() {
    if (this.app.profile.getAudience() !== 'child') return;
    this.show('settings-gate');
  }

  _renderWelcome() {
    const screen = this._screenEl('screen', 'screen--center', 'welcome-screen');
    const card = this._el('div', 'welcome-card');
    const profile = this.app.profile;

    const mascot = createMascot({ hideWordmark: true });
    mascot.classList.add('welcome-mascot');
    card.appendChild(mascot);

    const header = this._el('div', 'welcome-header');
    header.appendChild(this._el('h1', 'welcome-title', 'KEY BUDDY'));
    header.appendChild(this._el('p', 'welcome-subtitle', 'Fun games to learn typing and mouse skills!'));
    card.appendChild(header);

    if (profile.isChild() && profile.hasAgeGroup()) {
      const age = getAgeGroup(this.ageGroupId);
      const agePart = profile.getChildAge() != null ? `Age ${profile.getChildAge()} · ` : '';
      const badge = this._el('p', 'welcome-age-badge', `${age.icon} ${agePart}${age.label}`);
      card.appendChild(badge);
    }
    if (profile.isAdult() && profile.hasAdultLevel()) {
      const level = getAdultLevel(this.adultLevelId);
      const badge = this._el('p', 'welcome-age-badge', `${level.icon} ${level.label} · ${level.difficultyLabel}`);
      card.appendChild(badge);
    }

    const actions = this._el('div', 'welcome-actions');
    actions.appendChild(this._btn('For My Child', 'btn btn-primary btn-large welcome-cta', () => {
      this.app.sound.unlock();
      this.app.sound.playClick();
      this.app.profile.setAudience('child');
      if (profile.hasAgeGroup()) {
        this.show('hub');
      } else {
        this.show('age');
      }
    }));
    actions.appendChild(this._btn('For Adults', 'btn btn-secondary btn-large welcome-secondary', () => {
      this.app.sound.unlock();
      this.app.sound.playClick();
      this.app.profile.setAudience('adult');
      if (profile.hasAdultLevel()) {
        this.show('hub');
      } else {
        this.show('adult-level');
      }
    }));
    card.appendChild(actions);

    screen.appendChild(card);
    this.root.appendChild(screen);
  }

  _renderAccessLock() {
    const code = this.app.access.getCode();
    if (code.length === 0) {
      // Gate somehow enabled without a code — fail open rather than lock out.
      this.app.enterFromAccessLock();
      return;
    }

    const screen = this._screenEl('screen', 'screen--center', 'access-lock-screen');

    const mascot = createMascot({ hideWordmark: true });
    mascot.classList.add('welcome-mascot');
    screen.appendChild(mascot);

    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', 'Tap Your Picture Code!'));
    header.appendChild(this._el('p', 'screen-subtitle', 'Tap your pictures in the right order to start playing.'));
    screen.appendChild(header);

    const progress = this._el('div', 'access-progress');
    progress.setAttribute('aria-hidden', 'true');
    const dots = code.map(() => {
      const dot = this._el('span', 'access-dot');
      progress.appendChild(dot);
      return dot;
    });
    screen.appendChild(progress);

    const feedback = this._el('p', 'activity-feedback access-feedback');
    feedback.setAttribute('role', 'status');
    screen.appendChild(feedback);

    const grid = this._el('div', 'access-grid');
    let attempt = [];
    let locked = false;

    const updateDots = () => {
      dots.forEach((dot, i) => dot.classList.toggle('access-dot--filled', i < attempt.length));
    };
    const resetAttempt = () => {
      attempt = [];
      updateDots();
    };

    const onCorrect = () => {
      locked = true;
      feedback.textContent = 'Yay! Let\'s play!';
      this.app.sound.playComplete();
      setTimeout(() => this.app.enterFromAccessLock(), 650);
    };
    const onWrong = () => {
      locked = true;
      feedback.textContent = 'Oops! Try again.';
      this.app.sound.playWrong();
      screen.classList.add('access-shake');
      setTimeout(() => {
        screen.classList.remove('access-shake');
        resetAttempt();
        feedback.textContent = '';
        locked = false;
      }, 700);
    };

    for (const pic of ACCESS_PICTURES) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'access-tile';
      tile.setAttribute('aria-label', pic.label);
      const emoji = this._el('span', 'access-tile-emoji', pic.emoji);
      emoji.setAttribute('aria-hidden', 'true');
      tile.appendChild(emoji);
      tile.addEventListener('click', () => {
        if (locked) return;
        this.app.sound.unlock();
        this.app.sound.playPop();
        tile.classList.add('access-tile--tapped');
        setTimeout(() => tile.classList.remove('access-tile--tapped'), 180);
        attempt.push(pic.id);
        updateDots();
        if (attempt.length === code.length) {
          if (this.app.access.verify(attempt)) onCorrect();
          else onWrong();
        }
      });
      grid.appendChild(tile);
    }
    screen.appendChild(grid);

    const teacherRow = this._el('div', 'access-teacher-row');
    teacherRow.appendChild(this._btn('👩‍🏫 Teacher', 'btn btn-outline btn-small access-teacher-btn', () => {
      this.show('access-teacher-gate');
    }));
    screen.appendChild(teacherRow);

    this.root.appendChild(screen);
  }

  _renderAccessTeacherGate() {
    const screen = renderMathGate(
      this.app,
      () => this.app.enterFromAccessLock(),
      () => this.show('access-lock'),
    );
    this.root.appendChild(screen);
  }

  _renderStudentPicker() {
    const screen = this._screenEl('screen', 'screen--center', 'student-picker-screen');

    const mascot = createMascot({ hideWordmark: true });
    mascot.classList.add('welcome-mascot');
    screen.appendChild(mascot);

    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', "Who's playing today?"));
    screen.appendChild(header);

    const students = this.app.roster.getStudents();
    if (students.length === 0) {
      screen.appendChild(this._el('p', 'screen-subtitle',
        'No class is set up on this computer yet. Teachers: tap the button below to add your students.'));
    } else {
      header.appendChild(this._el('p', 'screen-subtitle', 'Tap your name to start.'));
      const grid = this._el('div', 'student-grid');
      for (const student of students) {
        const band = getBand(student.band);
        const btn = this._btn('', 'student-btn', () => {
          this.app.sound.unlock();
          this.app.sound.playClick();
          this.app.roster.setActive(student.id);
          this.show('hub');
        });
        btn.appendChild(this._el('span', 'student-btn-name', student.name));
        btn.appendChild(this._el('span', 'student-btn-meta', `${band.icon} Grade ${student.grade}`));
        btn.setAttribute('aria-label', `${student.name}, grade ${student.grade}`);
        grid.appendChild(btn);
      }
      screen.appendChild(grid);
    }

    const teacherRow = this._el('div', 'access-teacher-row');
    teacherRow.appendChild(this._btn('👩‍🏫 Teacher', 'btn btn-outline btn-small access-teacher-btn', () => {
      this.show('teacher-gate');
    }));
    screen.appendChild(teacherRow);

    this.root.appendChild(screen);
  }

  _renderTeacherGate() {
    const screen = renderMathGate(
      this.app,
      () => this.show('teacher'),
      () => this.show('student-picker'),
    );
    this.root.appendChild(screen);
  }

  _renderTeacher() {
    const screen = renderTeacherScreen(this.app, {
      onDone: () => this.show('student-picker'),
      onOpenSettings: () => this.show('settings'),
    });
    this.root.appendChild(screen);
  }

  _renderSettingsGate() {
    const screen = renderMathGate(
      this.app,
      () => this.show('settings'),
      () => this.show(this._settingsBackScreen()),
    );
    this.root.appendChild(screen);
  }

  _renderSettings() {
    const screen = renderAdultSettings(this.app, () => this.show(this._settingsBackScreen()));
    this.root.appendChild(screen);
  }

  _renderAgePicker() {
    const screen = this._screenEl('screen', 'screen--center', 'child-age-screen');
    screen.appendChild(createMascot());

    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', 'How old are you?'));
    header.appendChild(this._el('p', 'screen-subtitle', 'Type your age in numbers — we\'ll pick the right games!'));

    const form = this._el('div', 'child-age-form');
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = String(CHILD_AGE_MIN);
    input.max = String(CHILD_AGE_MAX);
    input.className = 'child-age-input';
    input.placeholder = 'Age';
    input.autocomplete = 'off';
    input.setAttribute('data-autofocus', 'true');
    input.setAttribute('aria-label', 'Your age in years');
    input.setAttribute('aria-describedby', 'child-age-error');
    const storedAge = this.app.profile.getChildAge();
    if (storedAge != null) input.value = String(storedAge);

    const preview = this._el('p', 'child-age-preview');
    const error = this._el('p', 'settings-error child-age-error');
    error.id = 'child-age-error';

    const updatePreview = () => {
      error.textContent = '';
      const raw = input.value.trim();
      if (!raw) {
        preview.textContent = '';
        return;
      }
      if (!isValidChildAge(raw)) {
        preview.textContent = '';
        error.textContent = `Please enter an age between ${CHILD_AGE_MIN} and ${CHILD_AGE_MAX}.`;
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      input.setAttribute('aria-invalid', 'false');
      const group = getAgeGroup(ageGroupFromNumber(raw));
      preview.textContent = `${group.icon} Ages ${group.ages} — ${group.label}`;
    };

    input.addEventListener('input', updatePreview);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submitChildAge(input, error);
    });

    form.append(input, preview, error);
    screen.append(header, form);
    updatePreview();

    const row = this._el('div', 'btn-row');
    row.appendChild(this._btn('Continue!', 'btn btn-primary', () => {
      this._submitChildAge(input, error);
    }));
    screen.append(row);
    this.root.appendChild(screen);
    setTimeout(() => input.focus(), 100);
  }

  _submitChildAge(input, errorEl) {
    const raw = input.value.trim();
    if (!isValidChildAge(raw)) {
      errorEl.textContent = `Please enter an age between ${CHILD_AGE_MIN} and ${CHILD_AGE_MAX}.`;
      return;
    }
    this.app.sound.playClick();
    this.app.profile.setChildAge(raw);
    this.show('hub');
  }

  _renderAdultLevelPicker() {
    const screen = this._screenEl('screen', 'screen--center', 'adult-level-screen');
    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', 'Choose your level'));
    header.appendChild(this._el('p', 'screen-subtitle', 'Pick the skill level that fits you best. You can change this anytime.'));

    const grid = this._el('div', 'adult-level-grid');
    const preselect = this._pendingAdultLevel ?? this.adultLevelId;

    for (const level of Object.values(ADULT_LEVELS)) {
      const btn = this._el('div', 'adult-level-btn');
      if (level.id === preselect) btn.classList.add('selected');
      btn.appendChild(this._el('div', 'adult-level-icon', level.icon));
      const body = this._el('div', 'adult-level-body');
      body.appendChild(this._el('div', 'adult-level-name', level.label));
      body.appendChild(this._el('div', 'adult-level-tier', level.difficultyLabel));
      body.appendChild(this._el('div', 'adult-level-desc', level.description));
      btn.appendChild(body);
      makeActivatable(btn, () => {
        this.app.sound.playClick();
        this._pendingAdultLevel = level.id;
        grid.querySelectorAll('.adult-level-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      }, `${level.label}, ${level.difficultyLabel}`);
      grid.appendChild(btn);
    }

    const row = this._el('div', 'btn-row');
    row.appendChild(this._btn('Continue', 'btn btn-primary', () => {
      const chosen = this._pendingAdultLevel ?? preselect ?? 'beginner';
      this.app.profile.setAdultLevel(chosen);
      this._pendingAdultLevel = null;
      this.show('hub');
    }));

    screen.append(header, grid, row);
    this.root.appendChild(screen);
  }

  _renderHub() {
    if (IS_SCHOOL) {
      const student = this.app.roster.getActive();
      if (!student) {
        this.show('student-picker');
        return;
      }
      this._renderStudentHub(student);
      return;
    }
    const profile = this.app.profile;
    if (profile.isAdult()) {
      if (!profile.hasAdultLevel()) {
        this.show('adult-level');
        return;
      }
      this._renderAdultHub();
      return;
    }

    if (!profile.hasAgeGroup()) {
      this.show('age');
      return;
    }

    this._renderChildHub();
  }

  _renderChildHub() {
    const screen = this._screenEl('screen', 'hub-screen');
    const age = getAgeGroup(this.ageGroupId);

    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', 'Choose a Game'));

    const ageBar = this._el('div', 'age-bar');
    const childAge = this.app.profile.getChildAge();
    const ageLabel = childAge != null
      ? `${age.icon} Age ${childAge} — ${age.label}`
      : `${age.icon} Ages ${age.ages} — ${age.label}`;
    const ageInfo = this._el('span', 'age-bar-text', ageLabel);
    const changeBtn = this._btn('Change', 'btn btn-outline btn-small', () => this.show('age'));
    changeBtn.classList.add('btn-small');
    ageBar.append(ageInfo, changeBtn);
    header.appendChild(ageBar);

    const typingSection = this._hubSection(CATEGORIES.typing.label, 'typing');
    const mouseSection = this._hubSection(CATEGORIES.mouse.label, 'mouse');

    const row = this._el('div', 'btn-row');
    row.appendChild(this._btn('Parent Settings', 'btn btn-outline btn-small', () => this.openAdultSettings()));
    screen.append(header, typingSection, mouseSection, row);
    this.root.appendChild(screen);
  }

  _renderAdultHub() {
    const screen = this._screenEl('screen', 'hub-screen adult-hub-screen');
    const level = getAdultLevel(this.adultLevelId);

    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', 'Training Hub'));

    const levelBar = this._el('div', 'age-bar');
    const levelInfo = this._el('span', 'age-bar-text', `${level.icon} ${level.label} · ${level.difficultyLabel}`);
    const changeBtn = this._btn('Change', 'btn btn-outline btn-small', () => {
      this._pendingAdultLevel = this.adultLevelId;
      this.show('adult-level');
    });
    changeBtn.classList.add('btn-small');
    levelBar.append(levelInfo, changeBtn);
    header.appendChild(levelBar);

    const tip = getRandomErgonomicsTip();
    const tipCard = this._el('div', 'ergonomics-tip');
    tipCard.appendChild(this._el('p', 'ergonomics-tip__title', `💡 ${tip.title}`));
    tipCard.appendChild(this._el('p', 'ergonomics-tip__text', tip.text));

    const tabs = this._el('div', 'adult-hub-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Training sections');
    const tabDefs = [
      { id: 'learn', label: 'Learn' },
      { id: 'practice', label: 'Practice' },
      { id: 'progress', label: 'My Progress' },
    ];
    for (const tab of tabDefs) {
      const btn = this._btn(tab.label, 'adult-hub-tab', () => {
        this.app.sound.playClick();
        this._adultTab = tab.id;
        this.show('hub');
      });
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', this._adultTab === tab.id ? 'true' : 'false');
      if (this._adultTab === tab.id) btn.classList.add('adult-hub-tab--active');
      tabs.appendChild(btn);
    }

    const body = this._el('div', 'adult-hub-body');
    if (this._adultTab === 'learn') {
      body.appendChild(this._renderAdultLearnSection());
    } else if (this._adultTab === 'practice') {
      body.appendChild(this._hubSection('Keyboard Training', 'typing', 'practice'));
      body.appendChild(this._hubSection('Mouse Skills', 'mouse', 'practice'));
    } else {
      body.appendChild(this._renderAdultProgressSection());
    }

    screen.append(header, tipCard, tabs, body);
    this.root.appendChild(screen);
  }

  _renderAdultLearnSection() {
    const section = this._el('div', 'hub-section');
    section.appendChild(this._el('h2', 'hub-section-title', 'Lessons'));
    const list = this._el('div', 'adult-lesson-list');
    const ctx = this._activityContext('learn');

    for (const lesson of ADULT_LESSONS) {
      const activity = getActivityById(lesson.id);
      if (!activity) continue;
      const enabled = getEnabledActivities(this.app.settings.getAll(), ctx)
        .some((a) => a.id === lesson.id);
      if (!enabled) continue;

      const done = this.app.progress.isLessonComplete(lesson.id, this.skillSegmentId);
      const card = this._el('div', 'adult-lesson-card');
      if (done) card.classList.add('adult-lesson-card--done');

      const icon = this._el('div', 'adult-lesson-icon', lesson.icon);
      const body = this._el('div', 'adult-lesson-body');
      body.appendChild(this._el('div', 'adult-lesson-title', lesson.title));
      body.appendChild(this._el('div', 'adult-lesson-desc', lesson.description));
      if (done) body.appendChild(this._el('div', 'adult-lesson-badge', '✓ Completed'));

      card.append(icon, body);
      makeActivatable(card, () => {
        this.app.sound.playClick();
        this.selectedActivity = activity;
        this.app.startActivity(activity);
      }, `${lesson.title}. ${lesson.description}${done ? '. Completed' : ''}`);
      list.appendChild(card);
    }

    if (!list.children.length) {
      list.appendChild(this._el('p', 'hub-empty', 'No lessons available at this level.'));
    }

    section.appendChild(list);
    return section;
  }

  _renderAdultProgressSection() {
    const section = this._el('div', 'hub-section adult-progress-panel');
    const summary = this.app.progress.getAdultProgressSummary(this.skillSegmentId);

    section.appendChild(this._el('h2', 'hub-section-title', 'My Progress'));

    const stats = this._el('div', 'adult-progress-stats');
    stats.appendChild(this._progressStat('Lessons completed', `${summary.lessonsCompleted} / ${summary.lessonsTotal}`));
    stats.appendChild(this._progressStat('Best typing test', summary.bestTestWpm > 0
      ? `${summary.bestTestWpm} WPM · ${summary.bestTestAccuracy}% accuracy`
      : 'Not taken yet'));
    section.appendChild(stats);

    if (summary.typingHistory.length > 0) {
      section.appendChild(this._el('h3', 'adult-progress-subtitle', 'Recent typing tests'));
      const hist = this._el('ul', 'adult-progress-history');
      for (const entry of summary.typingHistory) {
        const date = new Date(entry.date).toLocaleDateString();
        const li = this._el('li', 'adult-progress-history-item', `${date}: ${entry.wpm} WPM · ${entry.accuracy}%`);
        hist.appendChild(li);
      }
      section.appendChild(hist);
    }

    return section;
  }

  _progressStat(label, value) {
    const row = this._el('div', 'adult-progress-stat');
    row.appendChild(this._el('span', 'adult-progress-stat-label', label));
    row.appendChild(this._el('span', 'adult-progress-stat-value', value));
    return row;
  }

  _hubSection(title, category, hubSection = null, opts = {}) {
    const section = this._el('div', 'hub-section');
    section.appendChild(this._el('h2', 'hub-section-title', title));
    const grid = this._el('div', 'activity-grid');

    const ctx = opts.ctx ?? this._activityContext(hubSection);
    const segmentId = opts.segmentId ?? this.skillSegmentId;
    const showStars = opts.showStars ?? true;

    const activities = getEnabledActivities(this.app.settings.getAll(), ctx)
      .filter((a) => a.category === category);

    if (activities.length === 0) {
      const emptyMsg = ctx.audience === 'adult'
        ? 'No activities enabled at this level. Try a different skill level.'
        : 'No games enabled. Ask a grown-up to turn games on in Settings.';
      const empty = this._el('p', 'hub-empty', emptyMsg);
      section.appendChild(empty);
      return section;
    }

    for (const activity of activities) {
      const progress = {
        stars: opts.segmentId
          ? this.app.progress.getStars(activity.id, segmentId)
          : this.app.progress.getBestStars(activity.id, segmentId),
        bestPoints: this.app.progress.getBestPoints(activity.id, segmentId),
        showStars,
      };
      grid.appendChild(createActivityCard(activity, progress, () => {
        this.app.sound.playClick();
        this.selectedActivity = activity;
        this.app.startActivity(activity);
      }));
    }

    section.appendChild(grid);
    return section;
  }

  _renderStudentHub(student) {
    const band = getBand(student.band);
    const pres = getPresentation(student.band);
    const segment = this.app.roster.segmentFor(student.id);
    const classes = ['screen', 'hub-screen'];
    if (!pres.showMascot) classes.push('adult-hub-screen');
    const screen = this._screenEl(...classes);

    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', pres.hubTitle));

    const bar = this._el('div', 'age-bar');
    bar.appendChild(this._el('span', 'age-bar-text',
      `${band.icon} ${student.name} · Grade ${student.grade} · ${pres.levelLabel(student.level)}`));
    bar.appendChild(this._btn('Switch player', 'btn btn-outline btn-small', () => {
      this.app.roster.setActive(null);
      this.show('student-picker');
    }));
    header.appendChild(bar);

    // Points progress toward the next advancement level.
    const total = this.app.progress.getTotalPoints(segment);
    const earned = levelForPoints(total);
    const toNext = pointsToNextLevel(total, earned);
    const nextLevel = earned + 1;
    const prog = this._el('div', 'student-level-bar');
    const label = toNext != null && nextLevel > student.level
      ? `${formatPoints(total)} pts · ${formatPoints(toNext)} to ${pres.levelLabel(nextLevel)}`
      : `${formatPoints(total)} pts earned`;
    prog.appendChild(this._el('span', 'student-level-text', label));
    const track = this._el('div', 'student-level-track');
    const fill = this._el('div', 'student-level-fill');
    const floor = LEVEL_POINT_THRESHOLDS[earned - 1] ?? 0;
    const ceil = LEVEL_POINT_THRESHOLDS[earned] ?? null;
    const pct = ceil != null ? Math.min(100, ((total - floor) / (ceil - floor)) * 100) : 100;
    fill.style.width = `${Math.max(0, pct)}%`;
    track.appendChild(fill);
    prog.appendChild(track);
    header.appendChild(prog);

    const ctx = {
      audience: band.audience,
      segmentId: segment,
      difficulty: this.app.studentDifficulty(student),
      hubSection: null,
    };
    const opts = { ctx, segmentId: segment, showStars: pres.showStars };
    const typingSection = this._hubSection(pres.hubTypingLabel, 'typing', null, opts);
    const mouseSection = this._hubSection(pres.hubMouseLabel, 'mouse', null, opts);

    screen.append(header, typingSection, mouseSection);
    this.root.appendChild(screen);
  }

  _renderActivityShell() {
    const screen = this._screenEl('screen activity-screen');
    const profile = this.app.profile;
    const topbar = this._el('div', 'activity-topbar');
    const info = this._el('div', 'activity-info');

    if (profile.isAdult()) {
      const level = getAdultLevel(this.adultLevelId);
      info.textContent = `${this.selectedActivity?.icon} ${this.selectedActivity?.title} · ${level.label}`;
    } else {
      const age = getAgeGroup(this.ageGroupId);
      info.textContent = `${this.selectedActivity?.icon} ${this.selectedActivity?.title} · Ages ${age.ages}`;
    }

    topbar.appendChild(info);

    const area = this._el('div', 'activity-area');
    area.id = 'activity-area';
    screen.append(topbar, area);
    this.root.appendChild(screen);
    return area;
  }

  getActivityContainer() {
    return document.getElementById('activity-area');
  }

  showResults(score) {
    this.lastScore = score;
    this.show('results');
  }

  _renderResults() {
    const screen = this._screenEl('screen', 'screen--center');
    const score = this.lastScore ?? {};
    const student = IS_SCHOOL ? this.app.roster.getActive() : null;

    // The band (or web audience) decides the voice: playful for young kids,
    // respectful and progress-framed for everyone older.
    let pres;
    let noteText;
    if (student) {
      const band = getBand(student.band);
      pres = getPresentation(student.band);
      noteText = `${band.icon} ${student.name} · Grade ${student.grade} · ${pres.levelLabel(student.level)}`;
    } else if (this.app.profile.isAdult()) {
      pres = getPresentation('high');
      const level = getAdultLevel(this.adultLevelId);
      noteText = `${level.icon} ${level.label} · ${level.difficultyLabel}`;
    } else {
      pres = getPresentation('elementary');
      const age = getAgeGroup(this.ageGroupId);
      noteText = `${age.icon} Great work for ages ${age.ages}!`;
    }

    if (pres.showMascot) screen.appendChild(createMascot());

    const parts = [this._el('h1', 'screen-title', pres.resultsTitle)];

    if (score.wpm && pres.showWpm) {
      parts.push(this._el('p', 'adult-results-wpm', `${score.wpm} WPM`));
    }
    if (pres.showStars) {
      parts.push(createStarRating(score.stars ?? 0, true));
    }

    if (score.points != null) {
      parts.push(this._el('p', 'results-points', `Score: ${formatPoints(score.points)} pts`));
      if (score.isNewBest) {
        const best = this._el('p', 'results-best results-best--new', pres.newBest);
        best.setAttribute('role', 'status');
        parts.push(best);
      } else if (score.bestPoints > 0) {
        parts.push(this._el('p', 'results-best', pres.bestLine(formatPoints(score.bestPoints))));
      }
      if (score.levelUp) {
        const lvl = this._el('p', 'results-levelup', pres.levelUp(score.levelUp));
        lvl.setAttribute('role', 'status');
        parts.push(lvl);
      }
    }

    const msg = this._el('p', 'results-message',
      `${pres.messages[Math.floor(Math.random() * pres.messages.length)]} Accuracy: ${score.accuracy ?? 0}%`);

    const row = this._el('div', 'btn-row');
    row.appendChild(this._btn('Play Again', 'btn btn-primary', () => {
      this.app.startActivity(this.selectedActivity);
    }));
    row.appendChild(this._btn('All Games', 'btn btn-outline', () => {
      this.show('hub');
    }));

    parts.push(msg, this._el('p', 'results-age', noteText), row);
    screen.append(...parts);
    this.root.appendChild(screen);
  }

  _screenEl(...classes) {
    const el = document.createElement('div');
    el.className = classes.length ? classes.join(' ') : 'screen';
    return el;
  }

  _el(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  _btn(text, className, onClick) {
    const btn = document.createElement('button');
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }
}
