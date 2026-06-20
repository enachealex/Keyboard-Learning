/**
 * Music / Audio toggles with hover/focus vertical volume sliders.
 */
export function createAudioControls(app) {
  const bar = document.createElement('div');
  bar.className = 'audio-controls';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Sound controls');
  bar.hidden = true;

  const musicGroup = _volumeGroup('Music', '🎵', '🔇', 'music');
  const sfxGroup = _volumeGroup('Audio', '🔊', '🔈', 'sfx');
  bar.append(musicGroup.wrap, sfxGroup.wrap);

  function refresh() {
    _setToggleState(
      musicGroup,
      app.settings.isMusicEnabled(),
      app.settings.getMusicVolume(),
    );
    _setToggleState(
      sfxGroup,
      app.settings.isSfxEnabled(),
      app.settings.getSfxVolume(),
    );
    app.sound.setMusicVolume(app.settings.getMusicVolume());
    app.sound.setSfxVolume(app.settings.getSfxVolume());
  }

  musicGroup.btn.addEventListener('click', () => {
    const next = !app.settings.isMusicEnabled();
    app.settings.setMusicEnabled(next);
    app.sound.setMusicEnabled(next);
    if (next) app.sound.unlock();
    refresh();
  });

  musicGroup.slider.addEventListener('input', () => {
    const vol = Number(musicGroup.slider.value);
    app.settings.setMusicVolume(vol);
    app.sound.setMusicVolume(vol);
    if (vol > 0 && !app.settings.isMusicEnabled()) {
      app.settings.setMusicEnabled(true);
      app.sound.setMusicEnabled(true);
      app.sound.unlock();
    }
    refresh();
  });

  sfxGroup.btn.addEventListener('click', () => {
    const next = !app.settings.isSfxEnabled();
    app.settings.setSfxEnabled(next);
    app.sound.setSfxEnabled(next);
    if (next) {
      app.sound.unlock();
      app.sound.playClick();
    }
    refresh();
  });

  sfxGroup.slider.addEventListener('input', () => {
    const vol = Number(sfxGroup.slider.value);
    app.settings.setSfxVolume(vol);
    app.sound.setSfxVolume(vol);
    if (vol > 0 && !app.settings.isSfxEnabled()) {
      app.settings.setSfxEnabled(true);
      app.sound.setSfxEnabled(true);
      app.sound.unlock();
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

function _volumeGroup(label, onIcon, offIcon, kind) {
  const wrap = document.createElement('div');
  wrap.className = 'audio-controls__group';

  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'audio-controls__slider-wrap';

  const sliderLabel = document.createElement('span');
  sliderLabel.className = 'audio-controls__slider-label';
  sliderLabel.textContent = 'Volume';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'audio-controls__slider';
  slider.min = '0';
  slider.max = '100';
  slider.step = '5';
  slider.value = '100';
  slider.setAttribute('aria-label', `${label} volume`);

  sliderWrap.append(sliderLabel, slider);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'audio-controls__btn';
  btn.dataset.kind = kind;

  const icon = document.createElement('span');
  icon.className = 'audio-controls__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = onIcon;

  const text = document.createElement('span');
  text.className = 'audio-controls__label';
  text.textContent = label;

  btn.append(icon, text);
  wrap.append(sliderWrap, btn);

  return { wrap, btn, slider, onIcon, offIcon };
}

function _setToggleState(group, enabled, volume) {
  const icon = group.btn.querySelector('.audio-controls__icon');
  icon.textContent = enabled ? group.onIcon : group.offIcon;
  group.btn.classList.toggle('audio-controls__btn--muted', !enabled);
  group.btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  group.btn.setAttribute(
    'aria-label',
    `${group.btn.querySelector('.audio-controls__label').textContent} ${enabled ? 'on' : 'off'}, volume ${volume}%`,
  );
  group.slider.value = String(volume);
  group.slider.disabled = false;
}
