import { ADULT_LEVEL_IDS } from '../config/adultLevels.js';
import { ageGroupFromNumber } from '../config/ageGroups.js';

const PROFILE_KEY = 'keyboard-learning-profile';
const CHILD_AGE_IDS = { young: 1, growing: 1, pro: 1 };

export class ProfileStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) {
        return { audience: null, ageGroup: null, childAge: null, adultLevel: null };
      }
      const data = JSON.parse(raw);
      return {
        audience: data.audience ?? (data.ageGroup ? 'child' : null),
        ageGroup: data.ageGroup ?? null,
        childAge: data.childAge ?? null,
        adultLevel: data.adultLevel ?? null,
      };
    } catch {
      return { audience: null, ageGroup: null, childAge: null, adultLevel: null };
    }
  }

  _save() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  getAudience() {
    return this.data.audience;
  }

  setAudience(audience) {
    this.data.audience = audience;
    this._save();
  }

  isAdult() {
    return this.data.audience === 'adult';
  }

  isChild() {
    return this.data.audience === 'child';
  }

  getChildAge() {
    return this.data.childAge;
  }

  getAgeGroup() {
    return this.data.ageGroup;
  }

  /** Child types their age — auto-assigns the matching play group. */
  setChildAge(age) {
    const n = Math.round(Number(age));
    this.data.childAge = n;
    this.data.ageGroup = ageGroupFromNumber(n);
    this.data.audience = 'child';
    this._save();
  }

  /** Parent override — keeps stored child age but changes play group. */
  setAgeGroup(ageGroupId) {
    this.data.ageGroup = ageGroupId;
    this.data.audience = 'child';
    this._save();
  }

  hasAgeGroup() {
    return this.data.ageGroup != null && this.data.ageGroup in CHILD_AGE_IDS;
  }

  getAdultLevel() {
    return this.data.adultLevel;
  }

  setAdultLevel(levelId) {
    this.data.adultLevel = levelId;
    this.data.audience = 'adult';
    this._save();
  }

  hasAdultLevel() {
    return this.data.adultLevel != null && ADULT_LEVEL_IDS.includes(this.data.adultLevel);
  }

  /** Progress + difficulty key: child age group or adult skill level. */
  getSkillSegmentId() {
    if (this.isAdult()) return this.getAdultLevel();
    return this.getAgeGroup();
  }

  hasActiveProfile() {
    return this.isAdult() ? this.hasAdultLevel() : this.hasAgeGroup();
  }
}
