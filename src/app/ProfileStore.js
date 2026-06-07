const PROFILE_KEY = 'keyboard-learning-profile';

export class ProfileStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : { ageGroup: null };
    } catch {
      return { ageGroup: null };
    }
  }

  _save() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  getAgeGroup() {
    return this.data.ageGroup;
  }

  setAgeGroup(ageGroupId) {
    this.data.ageGroup = ageGroupId;
    this._save();
  }

  hasAgeGroup() {
    return this.data.ageGroup != null && this.data.ageGroup in
      { young: 1, growing: 1, pro: 1 };
  }
}
