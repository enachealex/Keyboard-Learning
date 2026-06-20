import { ADULT_LESSONS } from '../config/adultCurriculum.js';

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

  _key(activityId, segmentId) {
    return `${activityId}:${segmentId}`;
  }

  _wpmKey(activityId, segmentId) {
    return `wpm:${activityId}:${segmentId}`;
  }

  _lessonKey(activityId, segmentId) {
    return `lesson:${activityId}:${segmentId}`;
  }

  getStars(activityId, segmentId) {
    return this.data[this._key(activityId, segmentId)] ?? 0;
  }

  setStars(activityId, segmentId, stars) {
    const key = this._key(activityId, segmentId);
    const current = this.data[key] ?? 0;
    if (stars > current) {
      this.data[key] = stars;
      this._save();
    }
  }

  getBestStars(activityId, segmentId) {
    if (segmentId) return this.getStars(activityId, segmentId);
    let best = 0;
    for (const age of ['young', 'growing', 'pro']) {
      best = Math.max(best, this.getStars(activityId, age));
    }
    return best;
  }

  getBestWpm(activityId, segmentId) {
    return this.data[this._wpmKey(activityId, segmentId)]?.best ?? 0;
  }

  getBestWpmAccuracy(activityId, segmentId) {
    return this.data[this._wpmKey(activityId, segmentId)]?.bestAccuracy ?? 0;
  }

  isLessonComplete(activityId, segmentId) {
    return this.data[this._lessonKey(activityId, segmentId)]?.completed ?? false;
  }

  recordAdultSession(activityId, segmentId, score) {
    if (!segmentId || !score) return;

    if (score.wpm > 0) {
      const wpmKey = this._wpmKey(activityId, segmentId);
      const rec = this.data[wpmKey] ?? { best: 0, bestAccuracy: 0, history: [] };
      if (score.wpm > rec.best) rec.best = score.wpm;
      if (score.accuracy > rec.bestAccuracy) rec.bestAccuracy = score.accuracy;
      rec.history = [
        ...(rec.history ?? []),
        {
          wpm: score.wpm,
          accuracy: score.accuracy,
          date: new Date().toISOString(),
        },
      ].slice(-10);
      this.data[wpmKey] = rec;
    }

    const lessonKey = this._lessonKey(activityId, segmentId);
    const passed = score.accuracy >= 70 && score.completion >= 70;
    if (passed) {
      const cur = this.data[lessonKey] ?? {};
      this.data[lessonKey] = {
        completed: true,
        bestAccuracy: Math.max(cur.bestAccuracy ?? 0, score.accuracy),
      };
    }

    this._save();
  }

  getAdultProgressSummary(segmentId) {
    const lessonsCompleted = ADULT_LESSONS.filter(
      (l) => this.isLessonComplete(l.id, segmentId),
    ).length;
    const bestTestWpm = this.getBestWpm('typingTest', segmentId);
    const bestTestAccuracy = this.getBestWpmAccuracy('typingTest', segmentId);
    const history = this.data[this._wpmKey('typingTest', segmentId)]?.history ?? [];

    return {
      lessonsCompleted,
      lessonsTotal: ADULT_LESSONS.length,
      bestTestWpm,
      bestTestAccuracy,
      typingHistory: history.slice(-5).reverse(),
    };
  }
}
