import { createDefaultSettings } from '../config/settingsDefaults.js';

const SETTINGS_KEY = 'keyboard-learning-settings';

function migrateSavedSettings(saved, defaults) {
  const merged = {
    ...defaults,
    ...saved,
    enabledActivities: {
      ...defaults.enabledActivities,
      ...(saved.enabledActivities ?? {}),
    },
  };

  if ('soundEnabled' in saved && !('musicEnabled' in saved) && !('sfxEnabled' in saved)) {
    const on = saved.soundEnabled !== false;
    merged.musicEnabled = on;
    merged.sfxEnabled = on;
  }

  delete merged.soundEnabled;
  return merged;
}

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
      return migrateSavedSettings(saved, defaults);
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
    delete this.data.soundEnabled;
    this._save();
  }

  isActivityEnabled(activityId) {
    return this.data.enabledActivities[activityId] !== false;
  }

  setActivityEnabled(activityId, enabled) {
    this.data.enabledActivities[activityId] = enabled;
    this._save();
  }

  isMusicEnabled() {
    return this.data.musicEnabled !== false;
  }

  isSfxEnabled() {
    return this.data.sfxEnabled !== false;
  }

  setMusicEnabled(enabled) {
    this.data.musicEnabled = enabled;
    this._save();
  }

  setSfxEnabled(enabled) {
    this.data.sfxEnabled = enabled;
    this._save();
  }
}
