import victoryLapUrl from './Victory_Lap_Theme.mp3';
import goldRunUrl from './The_Gold_Run.mp3';

/** Background music level — kept low so game sounds stay clear. */
const BG_MUSIC_VOLUME = 0.28;

const BG_TRACKS = [victoryLapUrl, goldRunUrl];

/**
 * Child-safe synthesized UI sounds plus cycling background music.
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.bgTrackIndex = Math.floor(Math.random() * BG_TRACKS.length);
    this.bgMusic = new Audio(BG_TRACKS[this.bgTrackIndex]);
    this.bgMusic.loop = false;
    this.bgMusic.volume = BG_MUSIC_VOLUME;
    this.bgMusic.preload = 'auto';
    this.bgMusic.addEventListener('ended', () => this._onBgTrackEnded());
  }

  setMusicEnabled(on) {
    this.musicEnabled = on;
    this._syncBackgroundMusic();
  }

  setSfxEnabled(on) {
    this.sfxEnabled = on;
  }

  unlock() {
    if (!this.unlocked) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.unlocked = true;
      } catch {
        // Audio not available
      }
    }
    this._syncBackgroundMusic();
  }

  _onBgTrackEnded() {
    if (!this.musicEnabled || !this.unlocked) return;
    this.bgTrackIndex = (this.bgTrackIndex + 1) % BG_TRACKS.length;
    this.bgMusic.src = BG_TRACKS[this.bgTrackIndex];
    this.bgMusic.currentTime = 0;
    const playPromise = this.bgMusic.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  }

  _syncBackgroundMusic() {
    if (!this.musicEnabled || !this.unlocked) {
      this.bgMusic.pause();
      return;
    }
    const playPromise = this.bgMusic.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        // Autoplay blocked until the next user gesture.
      });
    }
  }

  _now() {
    return this.ctx?.currentTime ?? 0;
  }

  /** Bell-like tone with a soft overtone — kid-friendly, not harsh. */
  _ding(freq, delay = 0, duration = 0.45, volume = 0.18) {
    if (!this.sfxEnabled || !this.ctx || !this.unlocked) return;

    const start = this._now() + delay;
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const mix = this.ctx.createGain();

    osc.type = 'sine';
    overtone.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    overtone.frequency.setValueAtTime(freq * 2.4, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    mix.gain.value = 1;
    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(mix);
    mix.connect(this.ctx.destination);

    osc.start(start);
    overtone.start(start);
    osc.stop(start + duration + 0.05);
    overtone.stop(start + duration + 0.05);
  }

  _softTone(freq, duration, volume = 0.1, type = 'sine') {
    if (!this.sfxEnabled || !this.ctx || !this.unlocked) return;

    const start = this._now();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playSuccess() {
    this._ding(880, 0, 0.38, 0.16);
    this._ding(1175, 0.1, 0.42, 0.14);
  }

  playCorrect() {
    this.playSuccess();
  }

  playWrong() {
    this._softTone(280, 0.22, 0.08, 'triangle');
  }

  playComplete() {
    this._ding(784, 0, 0.35, 0.14);
    this._ding(988, 0.12, 0.38, 0.14);
    this._ding(1175, 0.26, 0.45, 0.12);
  }

  playPop() {
    this._softTone(660, 0.1, 0.09, 'sine');
  }

  playClick() {
    this._ding(988, 0, 0.28, 0.12);
  }
}
