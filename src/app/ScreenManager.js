import { CATEGORIES, getActivityById, getEnabledActivities } from '../config/activityRegistry.js';
import { CHILD_AGE_MIN, CHILD_AGE_MAX, getAgeGroup, isValidChildAge, ageGroupFromNumber } from '../config/ageGroups.js';
import { ADULT_LEVELS, getAdultLevel } from '../config/adultLevels.js';
import { ADULT_LESSONS } from '../config/adultCurriculum.js';
import { getRandomErgonomicsTip } from '../config/ergonomicsTips.js';
import { createActivityCard } from '../components/ActivityCard.js';
import { createStarRating } from '../components/StarRating.js';
import { createMascot } from '../components/Mascot.js';
import { renderAdultSettings, renderMathGate } from './AdultSettings.js';
import { resolveDifficulty } from '../config/settingsResolver.js';
import { makeActivatable } from '../utils/makeActivatable.js';

const CHILD_MESSAGES = [
  'Amazing work!',
  'You are a superstar!',
  'Keep practicing — you are doing great!',
  'Fantastic job!',
  'Wow, impressive!',
];

const ADULT_MESSAGES = [
  'Solid session!',
  'Nice progress — keep it up!',
  'Your accuracy is improving!',
  'Well done!',
  'Great focus!',
];

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
    if (screen === 'settings-gate' || screen === 'settings') {
      if (profile.getAudience() !== 'child') {
        screen = profile.hasActiveProfile() ? 'hub' : 'welcome';
      }
    }

    this.show(screen);
  }

  goHome() {
    if (this.app.currentActivity) this.app.stopActivity(false);
    this.show('welcome');
  }

  getNavState(screen) {
    switch (screen) {
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
    if (screen === 'welcome') this._pendingAdultLevel = null;
    this.screen = screen;
    this._persistSession(screen);
    this.root.innerHTML = '';
    this.app.syncChrome(screen);
    switch (screen) {
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

  _hubSection(title, category, hubSection = null) {
    const section = this._el('div', 'hub-section');
    section.appendChild(this._el('h2', 'hub-section-title', title));
    const grid = this._el('div', 'activity-grid');

    const activities = getEnabledActivities(this.app.settings.getAll(), this._activityContext(hubSection))
      .filter((a) => a.category === category);

    if (activities.length === 0) {
      const emptyMsg = this.app.profile.isAdult()
        ? 'No activities enabled at this level. Try a different skill level.'
        : 'No games enabled. Ask a grown-up to turn games on in Settings.';
      const empty = this._el('p', 'hub-empty', emptyMsg);
      section.appendChild(empty);
      return section;
    }

    for (const activity of activities) {
      const best = this.app.progress.getBestStars(activity.id, this.skillSegmentId);
      grid.appendChild(createActivityCard(activity, best, () => {
        this.app.sound.playClick();
        this.selectedActivity = activity;
        this.app.startActivity(activity);
      }));
    }

    section.appendChild(grid);
    return section;
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
    const profile = this.app.profile;
    const isAdult = profile.isAdult();
    const messages = isAdult ? ADULT_MESSAGES : CHILD_MESSAGES;

    if (!isAdult) screen.appendChild(createMascot());

    const title = this._el('h1', 'screen-title', isAdult ? 'Session Complete' : 'Round Complete!');
    const stars = isAdult && !this.lastScore?.wpm ? createStarRating(this.lastScore?.stars ?? 0, true) : null;
    const wpmLine = isAdult && this.lastScore?.wpm
      ? this._el('p', 'adult-results-wpm', `${this.lastScore.wpm} WPM`)
      : null;
    const msg = this._el('p', 'results-message',
      `${messages[Math.floor(Math.random() * messages.length)]} Accuracy: ${this.lastScore?.accuracy ?? 0}%`);

    let note;
    if (isAdult) {
      const level = getAdultLevel(this.adultLevelId);
      note = this._el('p', 'results-age', `${level.icon} ${level.label} · ${level.difficultyLabel}`);
    } else {
      const age = getAgeGroup(this.ageGroupId);
      note = this._el('p', 'results-age', `${age.icon} Great work for ages ${age.ages}!`);
    }

    const row = this._el('div', 'btn-row');
    row.appendChild(this._btn('Play Again', 'btn btn-primary', () => {
      this.app.startActivity(this.selectedActivity);
    }));
    const parts = [title];
    if (wpmLine) parts.push(wpmLine);
    if (stars) parts.push(stars);
    parts.push(msg, note, row);
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
