import { createDefaultSettings } from '../config/settingsDefaults.js';

const SETTINGS_KEY = 'keyboard-learning-settings';

export class SettingsStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    const defaults = createDefaultSettings();
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      return {
        ...defaults,
        ...saved,
        enabledActivities: {
          ...defaults.enabledActivities,
          ...(saved.enabledActivities ?? {}),
        },
      };
    } catch {
      return defaults;
    }
  }

  _save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  getAll() {
    return { ...this.data, enabledActivities: { ...this.data.enabledActivities } };
  }

  update(partial) {
    this.data = {
      ...this.data,
      ...partial,
      enabledActivities: partial.enabledActivities
        ? { ...this.data.enabledActivities, ...partial.enabledActivities }
        : this.data.enabledActivities,
    };
    this._save();
  }

  isActivityEnabled(activityId) {
    return this.data.enabledActivities[activityId] !== false;
  }

  setActivityEnabled(activityId, enabled) {
    this.data.enabledActivities[activityId] = enabled;
    this._save();
  }

  isSoundEnabled() {
    return this.data.soundEnabled !== false;
  }
}
