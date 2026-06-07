const STORAGE_KEY = 'keyboard-learning-progress';

export class ProgressStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  _key(activityId, ageGroupId) {
    return `${activityId}:${ageGroupId}`;
  }

  getStars(activityId, ageGroupId) {
    return this.data[this._key(activityId, ageGroupId)] ?? 0;
  }

  setStars(activityId, ageGroupId, stars) {
    const key = this._key(activityId, ageGroupId);
    const current = this.data[key] ?? 0;
    if (stars > current) {
      this.data[key] = stars;
      this._save();
    }
  }

  getBestStars(activityId, ageGroupId) {
    if (ageGroupId) return this.getStars(activityId, ageGroupId);
    let best = 0;
    for (const age of ['young', 'growing', 'pro']) {
      best = Math.max(best, this.getStars(activityId, age));
    }
    return best;
  }
}
