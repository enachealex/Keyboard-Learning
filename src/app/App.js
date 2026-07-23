import { ScreenManager } from './ScreenManager.js';
import { ProgressStore } from './ProgressStore.js';
import { ProfileStore } from './ProfileStore.js';
import { SettingsStore } from './SettingsStore.js';
import { SoundManager } from '../audio/SoundManager.js';
import { createAudioControls } from '../components/AudioControls.js';
import { createAppNav } from '../components/AppNav.js';
import { createAccessibilityHub } from '../components/AccessibilityHub.js';
import { createDesktopOnlyGate } from '../components/DesktopOnlyGate.js';
import { resolveDifficulty, resolveActivityConfig, shouldShowKeyboard } from '../config/settingsResolver.js';
import { applyUiPreferences, watchSystemUiPreferences } from '../utils/uiPreferences.js';
import { initLayoutChrome, syncLayoutChrome } from '../utils/layoutChrome.js';
import { SessionStore } from './SessionStore.js';
import { AccessStore } from './AccessStore.js';
import { IS_SCHOOL } from '../config/edition.js';
import { getBand, difficultyForLevel } from '../config/schoolBands.js';
import { DIFFICULTY_ORDER } from '../config/difficultyTiers.js';
import { computePoints } from '../utils/scoring.js';
import { getStoredLicense } from './webSchool.js';

const AUDIO_CONTROL_SCREENS = new Set(['welcome', 'age', 'adult-level', 'hub', 'activity', 'results']);

export class App {
  constructor() {
    this.sound = new SoundManager();
    this.progress = new ProgressStore();
    this.profile = new ProfileStore();
    this.settings = new SettingsStore();
    this.session = new SessionStore();
    this.access = new AccessStore();
    // School stores live in the lazily loaded school kit (see ensureSchool).
    this.schoolKit = null;
    this.roster = null;
    this.teacherContent = null;
    this.accessContinuation = null;
    this._setupLayout();
    this.sound.setMusicEnabled(this.settings.isMusicEnabled());
    this.sound.setSfxEnabled(this.settings.isSfxEnabled());
    this.sound.setMusicVolume(this.settings.getMusicVolume());
    this.sound.setSfxVolume(this.settings.getSfxVolume());
    this.screens = new ScreenManager(this);
    this.audioControls = createAudioControls(this);
    document.getElementById('app').appendChild(this.audioControls.element);
    this.appNav = createAppNav(this);
    document.getElementById('app').appendChild(this.appNav.element);
    this.accessibility = createAccessibilityHub(this);
    this.accessibility.mount(document.getElementById('app'));
    this.desktopGate = createDesktopOnlyGate();
    this.desktopGate.mount(document.getElementById('app'));
    this.currentActivity = null;
    this._keyHandler = this._onKeyDown.bind(this);
    this._pointerDown = this._onPointerDown.bind(this);
    this._pointerMove = this._onPointerMove.bind(this);
    this._pointerUp = this._onPointerUp.bind(this);
    this._globalKeyHandler = this._onGlobalKeyDown.bind(this);
    document.addEventListener('keydown', this._globalKeyHandler);
    applyUiPreferences(this.settings.getAll());
    this._unwatchUi = watchSystemUiPreferences(this.settings.getAll(), () => {
      applyUiPreferences(this.settings.getAll());
      syncLayoutChrome();
    });
    this._syncLayoutChrome = initLayoutChrome();

    // Desktop app: re-sync any previously saved license to the updater,
    // so installs licensed before this build (or restored data) count.
    const license = getStoredLicense();
    if (license) window.keyBuddyDesktop?.setLicense(license);
  }

  _setupLayout() {
    const appRoot = document.getElementById('app');
    const screenRoot = document.createElement('div');
    screenRoot.id = 'screen-root';
    screenRoot.className = 'screen-root';
    screenRoot.setAttribute('role', 'main');
    screenRoot.setAttribute('aria-label', 'Key Buddy');
    appRoot.appendChild(screenRoot);
  }

  syncChrome(screen) {
    this.audioControls.setVisible(AUDIO_CONTROL_SCREENS.has(screen));
    this.appNav.sync(screen);
    this._syncMusicAudience(screen);
    // The teacher's music preview must not outlive the dashboard.
    if (screen !== 'teacher') {
      this._stopMusicPreview?.();
      this._stopMusicPreview = null;
    }
    requestAnimationFrame(() => this._syncLayoutChrome?.());
  }

  _syncMusicAudience(screen) {
    const quiet = ['student-picker', 'teacher-gate', 'teacher', 'access-lock', 'access-teacher-gate', 'school-role', 'school-code'];
    const student = this.roster?.getActive();
    if (student && !quiet.includes(screen)) {
      // Each band has its own playlist: playful / bridge / calm.
      this.sound.setMusicAudience(getBand(student.band).id);
      return;
    }
    if (IS_SCHOOL || quiet.includes(screen)) {
      this.sound.setMusicAudience(null);
      return;
    }
    if (this.profile.isAdult()) {
      this.sound.setMusicAudience('adult');
    } else if (this.profile.isChild() && screen !== 'welcome') {
      this.sound.setMusicAudience('child');
    } else {
      this.sound.setMusicAudience(null);
    }
  }

  _onGlobalKeyDown(event) {
    if (this.accessibility.isOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.accessibility.close();
      }
      return;
    }
    if (this.currentActivity) return;
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      this.accessibility.open();
    }
  }

  init() {
    const start = () => {
      if (this.access.isLocked()) {
        this.screens.show('access-lock');
      } else {
        this._enterApp();
      }
    };
    // The school build always needs the kit; the web app preloads it only
    // when this tab already has a school session (refresh mid-class).
    if (IS_SCHOOL || this._hasWebSchoolSession()) {
      this.ensureSchool().then(start);
    } else {
      start();
    }
  }

  /**
   * Loads the school chunk and its stores. Idempotent; everything
   * school-flavored funnels through here.
   */
  async ensureSchool() {
    if (!this.schoolKit) {
      this.schoolKit = await import('../school/kit.js');
      this.roster = new this.schoolKit.RosterStore();
      this.teacherContent = new this.schoolKit.TeacherContentStore();
      this.refreshCustomMusic().catch(() => {});
    }
    return this.schoolKit;
  }

  /**
   * Load (or clear) the teacher's class music into the sound engine.
   * Called on kit load and whenever the dashboard changes tracks/toggle.
   */
  async refreshCustomMusic() {
    if (!this.schoolKit || !this.teacherContent) return;
    for (const url of this._customMusicUrls ?? []) URL.revokeObjectURL(url);
    this._customMusicUrls = [];
    if (this.teacherContent.isCustomMusicEnabled()) {
      this._customMusicUrls = await this.schoolKit.music.getTrackUrls();
    }
    this.sound.setCustomTracks(this._customMusicUrls);
  }

  _hasWebSchoolSession() {
    try {
      return !IS_SCHOOL && Boolean(sessionStorage.getItem('keyboard-learning-active-student'));
    } catch {
      return false;
    }
  }

  /** Called once the picture code (or teacher gate) is passed. */
  enterFromAccessLock() {
    this.access.unlockSession();
    const target = this.accessContinuation;
    this.accessContinuation = null;
    if (target) {
      this.screens.show(target);
    } else {
      this._enterApp();
    }
  }

  _enterApp() {
    if (IS_SCHOOL) {
      // Shared lab machines ask "who's playing?" on every fresh launch.
      this.screens.show(this.roster.getActive() ? 'hub' : 'student-picker');
      return;
    }
    // Deep links from the desktop updater and marketing.
    const hash = window.location.hash;
    if (hash === '#full-version') {
      this.screens.show('full-version');
      return;
    }
    if (hash === '#schools') {
      this.screens.show('schools');
      return;
    }
    this.screens.restoreFromSession();
  }

  /** Word-typing games that swap in the teacher's active word list. */
  static WORD_LIST_ACTIVITIES = new Set(['wordGarden', 'typingTest', 'fixAndType']);

  /** Overlay teacher-authored content onto a resolved activity config. */
  _applyTeacherContent(activityId, config) {
    if (!this.teacherContent) return;
    const words = this.teacherContent.getActiveWordList()?.words;
    if (words?.length && App.WORD_LIST_ACTIVITIES.has(activityId)) {
      config.customWords = [...words];
    }
    if (activityId === 'mathFacts') {
      const math = this.teacherContent.getMathSettings();
      if (math) Object.assign(config, math);
    }
  }

  /** Config for a teacher-built game — its saved settings ARE the config. */
  _customGameConfig(activityMeta) {
    const game = this.teacherContent?.getCustomGame(activityMeta.gameId);
    if (!game || !game.enabled) return null;
    const words = this.teacherContent.resolveGameWords(game);
    if (words.length === 0) return null;
    return {
      mode: game.mode,
      words,
      count: game.count,
      timed: game.timed,
      timeLimit: game.timeLimit,
      showKeyboard: game.showKeyboard && shouldShowKeyboard(this.settings.getAll()),
    };
  }

  /** Active student's difficulty: teacher override wins, else their level. */
  studentDifficulty(student) {
    const override = student.difficultyOverride;
    if (override && override !== 'auto' && DIFFICULTY_ORDER.includes(override)) {
      return override;
    }
    return difficultyForLevel(student.level);
  }

  async startActivity(activityMeta) {
    // An active student (school build OR web School mode) drives difficulty
    // and content; otherwise the web parent/adult profile does.
    const student = this.roster?.getActive() ?? null;
    let difficulty;
    if (student) {
      difficulty = this.studentDifficulty(student);
    } else if (IS_SCHOOL) {
      this.screens.show('student-picker');
      return;
    } else {
      const profile = this.profile;
      if (!profile.hasActiveProfile()) {
        this.screens.show(profile.isAdult() ? 'adult-level' : 'age');
        return;
      }
      const audience = profile.getAudience() ?? 'child';
      difficulty = resolveDifficulty(profile.getSkillSegmentId(), this.settings.getAll(), audience);
    }

    let config;
    if (activityMeta.custom) {
      config = this._customGameConfig(activityMeta);
      if (!config) {
        this.screens.show('hub');
        return;
      }
    } else {
      config = resolveActivityConfig(activityMeta.id, difficulty, this.settings.getAll());
      if (student) this._applyTeacherContent(activityMeta.id, config);
    }

    this.stopActivity(false);
    this.screens.selectedActivity = activityMeta;
    this.screens.show('activity');
    const container = this.screens.getActivityContainer();

    if (!container) {
      console.error('Activity container not found');
      this.screens.show('hub');
      return;
    }

    // Loaders resolve to the named class directly (see activityRegistry).
    const ActivityClass = await activityMeta.class();
    if (typeof ActivityClass !== 'function') {
      console.error('Activity class not found for', activityMeta.id);
      this.screens.show('hub');
      return;
    }

    this.currentActivity = new ActivityClass(this.sound);
    // Typing games arm their timer on the first keystroke; mouse games on
    // the first click or movement.
    this.currentActivity.startInput = activityMeta.category === 'typing' ? 'key' : 'any';
    this.currentActivity.init(difficulty, container, config);

    document.addEventListener('keydown', this._keyHandler);
    document.addEventListener('pointerdown', this._pointerDown);
    document.addEventListener('pointermove', this._pointerMove);
    document.addEventListener('pointerup', this._pointerUp);

    this._checkComplete();
  }

  _checkComplete() {
    const check = () => {
      if (this.currentActivity?.complete) {
        const score = this.currentActivity.getScore();
        const activityId = this.screens.selectedActivity.id;
        const student = this.roster?.getActive() ?? null;
        const segmentId = student
          ? this.roster.segmentFor(student.id)
          : this.profile.getSkillSegmentId();

        this.progress.setStars(activityId, segmentId, score.stars);

        const points = computePoints(score);
        const record = this.progress.recordPoints(activityId, segmentId, points);

        let levelUp = null;
        if (student) {
          const totalPoints = this.progress.addTotalPoints(segmentId, points);
          levelUp = this.roster.autoAdvance(student.id, totalPoints);
          if (score.wpm > 0) {
            // WPM history feeds the teacher's per-student progress view.
            this.progress.recordAdultSession(activityId, segmentId, score);
          }
        } else if (this.profile.isAdult()) {
          this.progress.recordAdultSession(activityId, segmentId, score);
        }

        this.stopActivity(false);
        this.screens.showResults({
          ...score,
          points,
          bestPoints: record.best,
          prevBest: record.prevBest,
          isNewBest: record.isNewBest,
          levelUp,
        });
        return;
      }
      if (this.currentActivity) requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  stopActivity(goHub = true) {
    document.removeEventListener('keydown', this._keyHandler);
    document.removeEventListener('pointerdown', this._pointerDown);
    document.removeEventListener('pointermove', this._pointerMove);
    document.removeEventListener('pointerup', this._pointerUp);
    if (this.currentActivity) {
      this.currentActivity.destroy();
      this.currentActivity = null;
    }
    if (goHub) this.screens.show('hub');
  }

  _onKeyDown(event) {
    if (event.key === 'Escape') {
      this.stopActivity();
      return;
    }
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      return;
    }
    this.currentActivity?.markStarted('key');
    this.currentActivity?.onKeyDown(event);
  }

  _onPointerDown(event) {
    this.currentActivity?.markStarted('pointer');
    this.currentActivity?.onPointerDown(event);
  }

  _onPointerMove(event) {
    this.currentActivity?.markStarted('pointer');
    this.currentActivity?.onPointerMove(event);
  }

  _onPointerUp(event) {
    this.currentActivity?.onPointerUp(event);
  }
}
