/** Keep CSS inset vars in sync with fixed nav / audio chrome (zoom, wrap, text scale). */
export function syncLayoutChrome() {
  const nav = document.querySelector('.app-nav');
  const audio = document.querySelector('.audio-controls');

  const navHeight = nav && !nav.hidden ? nav.getBoundingClientRect().height : 0;
  const audioHeight = audio && !audio.hidden ? audio.getBoundingClientRect().height : 0;

  document.documentElement.style.setProperty('--app-nav-height', `${Math.ceil(navHeight) || 56}px`);
  document.documentElement.style.setProperty('--app-chrome-bottom', `${Math.ceil(navHeight)}px`);
  document.documentElement.style.setProperty('--audio-controls-height', `${Math.ceil(audioHeight)}px`);
}

let _wired = false;

export function initLayoutChrome() {
  if (_wired) {
    syncLayoutChrome();
    return syncLayoutChrome;
  }
  _wired = true;

  const nav = document.querySelector('.app-nav');
  const audio = document.querySelector('.audio-controls');
  const ro = new ResizeObserver(() => syncLayoutChrome());

  if (nav) ro.observe(nav);
  if (audio) ro.observe(audio);

  window.addEventListener('resize', syncLayoutChrome);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncLayoutChrome);
  }

  syncLayoutChrome();
  return syncLayoutChrome;
}
