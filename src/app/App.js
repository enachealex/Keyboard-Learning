import { ScreenManager } from './ScreenManager.js';
import { ProgressStore } from './ProgressStore.js';
import { ProfileStore } from './ProfileStore.js';
import { SettingsStore } from './SettingsStore.js';
import { SoundManager } from '../audio/SoundManager.js';
import { createAudioControls } from '../components/AudioControls.js';
import { createAccessibilityHub } from '../components/AccessibilityHub.js';
import { createDesktopOnlyGate } from '../components/DesktopOnlyGate.js';
import { resolveDifficulty, resolveActivityConfig } from '../config/settingsResolver.js';
import { applyUiPreferences, watchSystemUiPreferences } from '../utils/uiPreferences.js';
import { SessionStore } from './SessionStore.js';

const AUDIO_CONTROL_SCREENS = new Set(['welcome', 'age', 'adult-level', 'hub', 'activity', 'results']);

export class App {
  constructor() {
    this.sound = new SoundManager();
    this.progress = new ProgressStore();
    this.profile = new ProfileStore();
    this.settings = new SettingsStore();
    this.session = new SessionStore();
    this._setupLayout();
    this.sound.setMusicEnabled(this.settings.isMusicEnabled());
    this.sound.setSfxEnabled(this.settings.isSfxEnabled());
    this.sound.setMusicVolume(this.settings.getMusicVolume());
    this.sound.setSfxVolume(this.settings.getSfxVolume());
    this.screens = new ScreenManager(this);
    this.audioControls = createAudioControls(this);
    document.getElementById('app').appendChild(this.audioControls.element);
    this.accessibility = createAccessibilityHub(this);
    this.accessibility.mount(document.getElementById('app'));
    this.desktopGate = createDesktopOnlyGate();
    this.desktopGate.mount(document.getElementById('app'));
    this.currentActivity = null;
    this._keyHandler = this._onKeyDown.bind(this);
    this._pointerDown = this._onPointerDown.bind(this);
    this._pointerMove = this._onPointerMove.bind(this);
    this._pointerUp = this._onPointerUp.bind(this);
    this._globalKeyHandler = this._onGlobalKeyDown.bind(this);
    document.addEventListener('keydown', this._globalKeyHandler);
    applyUiPreferences(this.settings.getAll());
    this._unwatchUi = watchSystemUiPreferences(this.settings.getAll(), () => {
      applyUiPreferences(this.settings.getAll());
    });
  }

  _setupLayout() {
    const appRoot = document.getElementById('app');
    const screenRoot = document.createElement('div');
    screenRoot.id = 'screen-root';
    screenRoot.className = 'screen-root';
    screenRoot.setAttribute('role', 'main');
    screenRoot.setAttribute('aria-label', 'Key Buddy');
    appRoot.appendChild(screenRoot);
  }

  syncAudioControls(screen) {
    this.audioControls.setVisible(AUDIO_CONTROL_SCREENS.has(screen));
    this.accessibility.setVisible(screen);
  }

  _onGlobalKeyDown(event) {
    if (this.accessibility.isOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.accessibility.close();
      }
      return;
    }
    if (this.currentActivity) return;
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      this.accessibility.open();
    }
  }

  init() {
    this.screens.restoreFromSession();
  }

  async startActivity(activityMeta) {
    const profile = this.profile;
    if (!profile.hasActiveProfile()) {
      this.screens.show(profile.isAdult() ? 'adult-level' : 'age');
      return;
    }

    const segmentId = profile.getSkillSegmentId();
    const audience = profile.getAudience() ?? 'child';
    const difficulty = resolveDifficulty(segmentId, this.settings.getAll(), audience);
    const config = resolveActivityConfig(activityMeta.id, difficulty, this.settings.getAll());

    this.stopActivity(false);
    this.screens.selectedActivity = activityMeta;
    this.screens.show('activity');
    const container = this.screens.getActivityContainer();

    if (!container) {
      console.error('Activity container not found');
      this.screens.show('hub');
      return;
    }

    const mod = await activityMeta.class();
    const ActivityClass = Object.values(mod).find((v) => typeof v === 'function');
    if (!ActivityClass) {
      console.error('Activity class not found for', activityMeta.id);
      this.screens.show('hub');
      return;
    }

    this.currentActivity = new ActivityClass(this.sound);
    this.currentActivity.init(difficulty, container, config);

    document.addEventListener('keydown', this._keyHandler);
    document.addEventListener('pointerdown', this._pointerDown);
    document.addEventListener('pointermove', this._pointerMove);
    document.addEventListener('pointerup', this._pointerUp);

    this._checkComplete();
  }

  _checkComplete() {
    const check = () => {
      if (this.currentActivity?.complete) {
        const score = this.currentActivity.getScore();
        const segmentId = this.profile.getSkillSegmentId();
        this.progress.setStars(
          this.screens.selectedActivity.id,
          segmentId,
          score.stars,
        );
        if (this.profile.isAdult()) {
          this.progress.recordAdultSession(
            this.screens.selectedActivity.id,
            segmentId,
            score,
          );
        }
        this.stopActivity(false);
        this.screens.showResults(score);
        return;
      }
      if (this.currentActivity) requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  stopActivity(goHub = true) {
    document.removeEventListener('keydown', this._keyHandler);
    document.removeEventListener('pointerdown', this._pointerDown);
    document.removeEventListener('pointermove', this._pointerMove);
    document.removeEventListener('pointerup', this._pointerUp);
    if (this.currentActivity) {
      this.currentActivity.destroy();
      this.currentActivity = null;
    }
    if (goHub) this.screens.show('hub');
  }

  _onKeyDown(event) {
    if (event.key === 'Escape') {
      this.stopActivity();
      return;
    }
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      return;
    }
    this.currentActivity?.onKeyDown(event);
  }

  _onPointerDown(event) {
    this.currentActivity?.onPointerDown(event);
  }

  _onPointerMove(event) {
    this.currentActivity?.onPointerMove(event);
  }

  _onPointerUp(event) {
    this.currentActivity?.onPointerUp(event);
  }
}
