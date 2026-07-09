const SESSION_KEY = 'keyboard-learning-session';

const DEFAULT_SESSION = {
  screen: 'welcome',
  adultTab: 'learn',
  selectedActivityId: null,
  lastScore: null,
};

const PERSISTABLE_SCREENS = new Set([
  'welcome',
  'age',
  'adult-level',
  'hub',
  'results',
]);

export class SessionStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return { ...DEFAULT_SESSION };
      const data = JSON.parse(raw);
      return {
        screen: data.screen ?? DEFAULT_SESSION.screen,
        adultTab: data.adultTab ?? DEFAULT_SESSION.adultTab,
        selectedActivityId: data.selectedActivityId ?? null,
        lastScore: data.lastScore ?? null,
      };
    } catch {
      return { ...DEFAULT_SESSION };
    }
  }

  _save() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  getAll() {
    return { ...this.data, lastScore: this.data.lastScore ? { ...this.data.lastScore } : null };
  }

  update(partial) {
    this.data = { ...this.data, ...partial };
    this._save();
  }

  canPersistScreen(screen) {
    return PERSISTABLE_SCREENS.has(screen);
  }

  /**
   * Activity state is not restored after refresh — fall back to hub.
   * Parent Settings screens fall back too, so the math gate is always re-passed.
   */
  screenForPersistence(screen) {
    if (screen === 'activity' || screen === 'settings-gate' || screen === 'settings') {
      return 'hub';
    }
    return screen;
  }
}
