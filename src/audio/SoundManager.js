export class SoundManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.enabled = true;
  }

  setEnabled(on) {
    this.enabled = on;
  }

  unlock() {
    if (this.unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.unlocked = true;
    } catch {
      // Audio not available
    }
  }

  _beep(freq, duration, type = 'sine', volume = 0.15) {
    if (!this.enabled || !this.ctx || !this.unlocked) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  playCorrect() {
    this._beep(523, 0.12);
    setTimeout(() => this._beep(659, 0.12), 80);
  }

  playWrong() {
    this._beep(200, 0.2, 'square', 0.1);
  }

  playComplete() {
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this._beep(f, 0.2), i * 120);
    });
  }

  playPop() {
    this._beep(800, 0.08, 'sine', 0.12);
  }

  playClick() {
    this._beep(440, 0.06, 'triangle', 0.1);
  }
}
