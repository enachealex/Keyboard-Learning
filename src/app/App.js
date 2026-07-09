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
import { RosterStore } from './RosterStore.js';
import { TeacherContentStore } from './TeacherContentStore.js';
import { IS_SCHOOL } from '../config/edition.js';
import { getBand, difficultyForLevel } from '../config/schoolBands.js';
import { DIFFICULTY_ORDER } from '../config/difficultyTiers.js';
import { computePoints } from '../utils/scoring.js';

const AUDIO_CONTROL_SCREENS = new Set(['welcome', 'age', 'adult-level', 'hub', 'activity', 'results']);

export class App {
  constructor() {
    this.sound = new SoundManager();
    this.progress = new ProgressStore();
    this.profile = new ProfileStore();
    this.settings = new SettingsStore();
    this.session = new SessionStore();
    this.access = new AccessStore();
    this.roster = IS_SCHOOL ? new RosterStore() : null;
    this.teacherContent = IS_SCHOOL ? new TeacherContentStore() : null;
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
    requestAnimationFrame(() => this._syncLayoutChrome?.());
  }

  _syncMusicAudience(screen) {
    if (IS_SCHOOL) {
      const quiet = ['student-picker', 'teacher-gate', 'teacher', 'access-lock', 'access-teacher-gate'];
      const student = this.roster.getActive();
      if (student && !quiet.includes(screen)) {
        this.sound.setMusicAudience(getBand(student.band).audience === 'adult' ? 'adult' : 'child');
      } else {
        this.sound.setMusicAudience(null);
      }
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
    if (this.access.isLocked()) {
      this.screens.show('access-lock');
    } else {
      this._enterApp();
    }
  }

  /** Called once the picture code (or teacher gate) is passed. */
  enterFromAccessLock() {
    this.access.unlockSession();
    this._enterApp();
  }

  _enterApp() {
    if (IS_SCHOOL) {
      // Shared lab machines ask "who's playing?" on every fresh launch.
      this.screens.show(this.roster.getActive() ? 'hub' : 'student-picker');
    } else {
      this.screens.restoreFromSession();
    }
  }

  /** Word-typing games that swap in the teacher's active word list. */
  static WORD_LIST_ACTIVITIES = new Set(['wordGarden', 'typingTest', 'fixAndType']);

  /** Overlay teacher-authored content onto a resolved activity config. */
  _applyTeacherContent(activityId, config) {
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
    let difficulty;
    if (IS_SCHOOL) {
      const student = this.roster.getActive();
      if (!student) {
        this.screens.show('student-picker');
        return;
      }
      difficulty = this.studentDifficulty(student);
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
    if (IS_SCHOOL && activityMeta.custom) {
      config = this._customGameConfig(activityMeta);
      if (!config) {
        this.screens.show('hub');
        return;
      }
    } else {
      config = resolveActivityConfig(activityMeta.id, difficulty, this.settings.getAll());
      if (IS_SCHOOL) this._applyTeacherContent(activityMeta.id, config);
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

    const mod = await activityMeta.class();
    const ActivityClass = Object.values(mod).find((v) => typeof v === 'function');
    if (!ActivityClass) {
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
        const student = IS_SCHOOL ? this.roster.getActive() : null;
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
