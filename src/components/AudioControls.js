/**
 * Persistent Music / Audio mute toggles for kid-facing screens.
 */
export function createAudioControls(app) {
  const bar = document.createElement('div');
  bar.className = 'audio-controls';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Sound controls');
  bar.hidden = true;

  const musicBtn = _toggleButton('Music', '🎵', '🔇');
  const sfxBtn = _toggleButton('Audio', '🔊', '🔈');
  bar.append(musicBtn, sfxBtn);

  function refresh() {
    _setToggleState(musicBtn, app.settings.isMusicEnabled(), '🎵', '🔇');
    _setToggleState(sfxBtn, app.settings.isSfxEnabled(), '🔊', '🔈');
  }

  musicBtn.addEventListener('click', () => {
    const next = !app.settings.isMusicEnabled();
    app.settings.setMusicEnabled(next);
    app.sound.setMusicEnabled(next);
    if (next) app.sound.unlock();
    refresh();
  });

  sfxBtn.addEventListener('click', () => {
    const next = !app.settings.isSfxEnabled();
    app.settings.setSfxEnabled(next);
    app.sound.setSfxEnabled(next);
    if (next) {
      app.sound.unlock();
      app.sound.playClick();
    }
    refresh();
  });

  return {
    element: bar,
    refresh,
    setVisible(visible) {
      bar.hidden = !visible;
      if (visible) refresh();
    },
  };
}

function _toggleButton(label, onIcon, offIcon) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'audio-controls__btn';

  const icon = document.createElement('span');
  icon.className = 'audio-controls__icon';
  icon.textContent = onIcon;

  const text = document.createElement('span');
  text.className = 'audio-controls__label';
  text.textContent = label;

  btn.append(icon, text);
  btn.dataset.onIcon = onIcon;
  btn.dataset.offIcon = offIcon;
  return btn;
}

function _setToggleState(btn, enabled, onIcon, offIcon) {
  const icon = btn.querySelector('.audio-controls__icon');
  icon.textContent = enabled ? onIcon : offIcon;
  btn.classList.toggle('audio-controls__btn--muted', !enabled);
  btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  btn.setAttribute('aria-label', `${btn.querySelector('.audio-controls__label').textContent} ${enabled ? 'on' : 'off'}`);
}
