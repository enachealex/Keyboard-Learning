/**
 * Web School mode activation (free web edition). A device is "activated"
 * once a teacher has entered a valid school license code; the code stays
 * stored so returning teachers only face the quick math gate.
 * Tiny on purpose — it lives in the main bundle, the school kit does not.
 */
const ACTIVATION_KEY = 'keyboard-learning-school-web';

export function isWebSchoolActivated() {
  try {
    return Boolean(localStorage.getItem(ACTIVATION_KEY));
  } catch {
    return false;
  }
}

export function activateWebSchool(code) {
  try {
    localStorage.setItem(ACTIVATION_KEY, code);
  } catch {
    // Storage unavailable — activation won't persist past this page.
  }
  // In the desktop app, main's updater needs to know this install is
  // licensed (the full version). No-op in the browser.
  window.keyBuddyDesktop?.setLicense(code);
}

/** The license code this device was activated with, if any. */
export function getStoredLicense() {
  try {
    return localStorage.getItem(ACTIVATION_KEY) || null;
  } catch {
    return null;
  }
}
