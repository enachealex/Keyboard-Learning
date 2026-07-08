import { isValidCode } from '../config/accessPictures.js';

const ACCESS_KEY = 'keyboard-learning-access';
const UNLOCK_KEY = 'keyboard-learning-access-unlocked';

/**
 * School access gate — a teacher-set picture code students tap to get in.
 *
 * This is a client-side soft deterrent, not real access control: the code and
 * the check both live in the browser, so a determined adult could read it. It
 * keeps casual/unauthorized users out and makes the app feel school-owned.
 * The configured code is stored in localStorage (persists across launches);
 * "unlocked for this session" lives in sessionStorage (clears when the app is
 * next launched, so students re-enter the code each day).
 */
export class AccessStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(ACCESS_KEY);
      if (!raw) return { enabled: false, code: [] };
      const data = JSON.parse(raw);
      const code = isValidCode(data.code) ? data.code : [];
      return { enabled: Boolean(data.enabled) && code.length > 0, code };
    } catch {
      return { enabled: false, code: [] };
    }
  }

  _save() {
    try {
      localStorage.setItem(ACCESS_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable — gate simply won't persist.
    }
  }

  /** A gate only counts as on when it's enabled AND has a valid code. */
  isEnabled() {
    return this.data.enabled && this.data.code.length > 0;
  }

  getCode() {
    return [...this.data.code];
  }

  /** Sets the picture code and turns the gate on. Rejects invalid codes. */
  setCode(code) {
    if (!isValidCode(code)) return false;
    this.data.code = [...code];
    this.data.enabled = true;
    this._save();
    return true;
  }

  /** Turns the gate off but keeps the code, so it can be re-enabled later. */
  disable() {
    this.data.enabled = false;
    this._save();
  }

  /** Turns the gate off and forgets the code. */
  clear() {
    this.data = { enabled: false, code: [] };
    this._save();
  }

  verify(attempt) {
    const code = this.data.code;
    if (!Array.isArray(attempt) || attempt.length !== code.length) return false;
    return attempt.every((id, i) => id === code[i]);
  }

  isUnlockedThisSession() {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch {
      return false;
    }
  }

  unlockSession() {
    try {
      sessionStorage.setItem(UNLOCK_KEY, '1');
    } catch {
      // sessionStorage unavailable — user re-enters on next screen change.
    }
  }

  /** True when a code is set and this session hasn't been unlocked yet. */
  isLocked() {
    return this.isEnabled() && !this.isUnlockedThisSession();
  }
}
