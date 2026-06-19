import { CATEGORIES, getEnabledActivities } from '../config/activityRegistry.js';
import { AGE_GROUPS, getAgeGroup } from '../config/ageGroups.js';
import { createActivityCard } from '../components/ActivityCard.js';
import { createStarRating } from '../components/StarRating.js';
import { createMascot } from '../components/Mascot.js';
import { renderAdultSettings, renderMathGate } from './AdultSettings.js';

const MESSAGES = [
  'Amazing work!',
  'You are a superstar!',
  'Keep practicing — you are doing great!',
  'Fantastic job!',
  'Wow, impressive!',
];

export class ScreenManager {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById('screen-root') ?? document.getElementById('app');
    this.screen = 'welcome';
    this.selectedActivity = null;
    this.lastScore = null;
    this._pendingAgeGroup = null;
  }

  get ageGroupId() {
    return this.app.profile.getAgeGroup();
  }

  show(screen) {
    this.screen = screen;
    this.root.innerHTML = '';
    this.app.syncAudioControls(screen);
    switch (screen) {
      case 'welcome': this._renderWelcome(); break;
      case 'age': this._renderAgePicker(); break;
      case 'hub': this._renderHub(); break;
      case 'activity': this._renderActivityShell(); break;
      case 'results': this._renderResults(); break;
      case 'settings-gate': this._renderSettingsGate(); break;
      case 'settings': this._renderSettings(); break;
    }
  }

  openAdultSettings() {
    this.show('settings-gate');
  }

  _renderWelcome() {
    const screen = this._screenEl('screen', 'screen--center', 'welcome-screen');
    const card = this._el('div', 'welcome-card');

    const mascot = createMascot({ hideWordmark: true });
    mascot.classList.add('welcome-mascot');
    card.appendChild(mascot);
    card.appendChild(this._el('p', 'brand-wordmark', 'KEY BUDDY'));

    const header = this._el('div', 'welcome-header');
    header.appendChild(this._el('h1', 'welcome-title', 'Key Buddy'));
    header.appendChild(this._el('p', 'welcome-subtitle', 'Fun games to learn typing and mouse skills!'));
    card.appendChild(header);

    if (this.app.profile.hasAgeGroup()) {
      const age = getAgeGroup(this.ageGroupId);
      const badge = this._el('p', 'welcome-age-badge', `${age.icon} Ages ${age.ages} · ${age.label}`);
      card.appendChild(badge);
    }

    const actions = this._el('div', 'welcome-actions');
    actions.appendChild(this._btn('Let\u2019s Play!', 'btn btn-primary btn-large welcome-cta', () => {
      this.app.sound.unlock();
      this.app.sound.playClick();
      if (this.app.profile.hasAgeGroup()) {
        this.show('hub');
      } else {
        this.show('age');
      }
    }));

    if (this.app.profile.hasAgeGroup()) {
      actions.appendChild(this._btn('Change Age Group', 'btn btn-outline welcome-secondary', () => this.show('age')));
    }
    card.appendChild(actions);

    const footer = this._el('div', 'welcome-footer');
    footer.appendChild(this._btn('Grown-Up Settings', 'btn-grown-up', () => this.openAdultSettings()));
    card.appendChild(footer);

    screen.appendChild(card);
    this.root.appendChild(screen);
  }

  _renderSettingsGate() {
    const back = this.app.profile.hasAgeGroup() ? 'hub' : 'welcome';
    const screen = renderMathGate(
      this.app,
      () => this.show('settings'),
      () => this.show(back),
    );
    this.root.appendChild(screen);
  }

  _renderSettings() {
    const screen = renderAdultSettings(this.app, () => {
      if (this.app.profile.hasAgeGroup()) {
        this.show('hub');
      } else {
        this.show('welcome');
      }
    });
    this.root.appendChild(screen);
  }

  _renderAgePicker() {
    const screen = this._screenEl('screen', 'screen--center');
    screen.appendChild(createMascot());
    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', 'How old are you?'));
    header.appendChild(this._el('p', 'screen-subtitle', 'Pick your age group so the games are just right!'));

    const grid = this._el('div', 'age-group-grid');
    const preselect = this._pendingAgeGroup ?? this.ageGroupId;

    for (const group of Object.values(AGE_GROUPS)) {
      const btn = this._el('div', 'age-group-btn');
      if (group.id === preselect) btn.classList.add('selected');
      btn.appendChild(this._el('div', 'age-group-icon', group.icon));
      btn.appendChild(this._el('div', 'age-group-label', `Ages ${group.ages}`));
      btn.appendChild(this._el('div', 'age-group-name', group.label));
      btn.appendChild(this._el('div', 'age-group-desc', group.description));
      btn.addEventListener('click', () => {
        this.app.sound.playClick();
        this._pendingAgeGroup = group.id;
        grid.querySelectorAll('.age-group-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      grid.appendChild(btn);
    }

    const row = this._el('div', 'btn-row');
    if (this.app.profile.hasAgeGroup()) {
      row.appendChild(this._btn('Back', 'btn btn-outline', () => {
        this._pendingAgeGroup = null;
        this.show('hub');
      }));
    }
    row.appendChild(this._btn('Continue!', 'btn btn-primary', () => {
      const chosen = this._pendingAgeGroup ?? preselect ?? 'young';
      this.app.profile.setAgeGroup(chosen);
      this._pendingAgeGroup = null;
      this.show('hub');
    }));

    screen.append(header, grid, row);
    this.root.appendChild(screen);
  }

  _renderHub() {
    if (!this.app.profile.hasAgeGroup()) {
      this.show('age');
      return;
    }

    const screen = this._screenEl('screen', 'hub-screen');
    const age = getAgeGroup(this.ageGroupId);

    const header = this._el('div', 'screen-header');
    header.appendChild(this._el('h1', 'screen-title', 'Choose a Game'));

    const ageBar = this._el('div', 'age-bar');
    const ageInfo = this._el('span', 'age-bar-text', `${age.icon} Ages ${age.ages} — ${age.label}`);
    const changeBtn = this._btn('Change', 'btn btn-outline btn-small', () => {
      this._pendingAgeGroup = this.ageGroupId;
      this.show('age');
    });
    changeBtn.classList.add('btn-small');
    ageBar.append(ageInfo, changeBtn);
    header.appendChild(ageBar);

    const typingSection = this._hubSection(CATEGORIES.typing.label, 'typing');
    const mouseSection = this._hubSection(CATEGORIES.mouse.label, 'mouse');

    const row = this._el('div', 'btn-row');
    row.appendChild(this._btn('Home', 'btn btn-outline', () => this.show('welcome')));
    row.appendChild(this._btn('Grown-Up Settings', 'btn btn-outline btn-small', () => this.openAdultSettings()));
    screen.append(header, typingSection, mouseSection, row);
    this.root.appendChild(screen);
  }

  _hubSection(title, category) {
    const section = this._el('div', 'hub-section');
    section.appendChild(this._el('h2', 'hub-section-title', title));
    const grid = this._el('div', 'activity-grid');

    const activities = getEnabledActivities(this.app.settings.getAll(), this.ageGroupId)
      .filter((a) => a.category === category);

    if (activities.length === 0) {
      const empty = this._el('p', 'hub-empty', 'No games enabled. Ask a grown-up to turn games on in Settings.');
      section.appendChild(empty);
      return section;
    }

    for (const activity of activities) {
      const best = this.app.progress.getBestStars(activity.id, this.ageGroupId);
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
    const age = getAgeGroup(this.ageGroupId);
    const topbar = this._el('div', 'activity-topbar');
    const info = this._el('div', 'activity-info');
    info.textContent = `${this.selectedActivity?.icon} ${this.selectedActivity?.title} · Ages ${age.ages}`;
    const backBtn = this._btn('Back', 'btn btn-outline', () => this.app.stopActivity());
    topbar.append(info, backBtn);

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
    const age = getAgeGroup(this.ageGroupId);
    screen.appendChild(createMascot());
    const title = this._el('h1', 'screen-title', 'Round Complete!');
    const stars = createStarRating(this.lastScore?.stars ?? 0, true);
    const msg = this._el('p', 'results-message',
      `${MESSAGES[Math.floor(Math.random() * MESSAGES.length)]} Accuracy: ${this.lastScore?.accuracy ?? 0}%`);
    const ageNote = this._el('p', 'results-age', `${age.icon} Great work for ages ${age.ages}!`);
    const row = this._el('div', 'btn-row');
    row.appendChild(this._btn('Play Again', 'btn btn-primary', () => {
      this.app.startActivity(this.selectedActivity);
    }));
    row.appendChild(this._btn('Back to Hub', 'btn btn-secondary', () => this.show('hub')));
    screen.append(title, stars, msg, ageNote, row);
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
