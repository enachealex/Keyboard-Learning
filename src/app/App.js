import { ScreenManager } from './ScreenManager.js';
import { ProgressStore } from './ProgressStore.js';
import { ProfileStore } from './ProfileStore.js';
import { SettingsStore } from './SettingsStore.js';
import { SoundManager } from '../audio/SoundManager.js';
import { resolveDifficulty, resolveActivityConfig } from '../config/settingsResolver.js';

export class App {
  constructor() {
    this.sound = new SoundManager();
    this.progress = new ProgressStore();
    this.profile = new ProfileStore();
    this.settings = new SettingsStore();
    this.sound.setEnabled(this.settings.isSoundEnabled());
    this.screens = new ScreenManager(this);
    this.currentActivity = null;
    this._keyHandler = this._onKeyDown.bind(this);
    this._pointerDown = this._onPointerDown.bind(this);
    this._pointerMove = this._onPointerMove.bind(this);
    this._pointerUp = this._onPointerUp.bind(this);
  }

  init() {
    this.screens.show('welcome');
  }

  async startActivity(activityMeta) {
    const ageGroupId = this.profile.getAgeGroup();
    if (!ageGroupId) {
      this.screens.show('age');
      return;
    }

    const difficulty = resolveDifficulty(ageGroupId, this.settings.getAll());
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
        this.progress.setStars(
          this.screens.selectedActivity.id,
          this.profile.getAgeGroup(),
          score.stars,
        );
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
