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

  if (!merged.theme) merged.theme = 'auto';
  if (!merged.textScale) merged.textScale = 'normal';
  if (!merged.reduceMotion) merged.reduceMotion = 'auto';
  if (merged.highContrast == null) merged.highContrast = false;
  if (merged.musicVolume == null) merged.musicVolume = 100;
  if (merged.sfxVolume == null) merged.sfxVolume = 100;

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

  getMusicVolume() {
    const v = this.data.musicVolume ?? 100;
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  setMusicVolume(volume) {
    this.data.musicVolume = Math.max(0, Math.min(100, Math.round(volume)));
    this._save();
  }

  getSfxVolume() {
    const v = this.data.sfxVolume ?? 100;
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  setSfxVolume(volume) {
    this.data.sfxVolume = Math.max(0, Math.min(100, Math.round(volume)));
    this._save();
  }
}
