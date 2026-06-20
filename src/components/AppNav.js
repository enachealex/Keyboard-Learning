/**
 * Fixed bottom app navigation (Back, Home, Accessibility).
 * Placement follows Fitts's Law: large targets at the screen edge with ample spacing.
 */
export function createAppNav(app) {
  const bar = document.createElement('nav');
  bar.className = 'app-nav';
  bar.setAttribute('aria-label', 'App navigation');

  const start = document.createElement('div');
  start.className = 'app-nav__cluster app-nav__cluster--start';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn btn-outline app-nav__btn app-nav__btn--back';
  backBtn.innerHTML = '<span class="app-nav__icon" aria-hidden="true">←</span><span class="app-nav__label">Back</span>';
  backBtn.hidden = true;

  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.className = 'btn btn-outline app-nav__btn app-nav__btn--home';
  homeBtn.innerHTML = '<span class="app-nav__icon" aria-hidden="true">⌂</span><span class="app-nav__label">Home</span>';
  homeBtn.hidden = true;

  start.append(backBtn, homeBtn);

  const end = document.createElement('div');
  end.className = 'app-nav__cluster app-nav__cluster--end';

  const a11yBtn = document.createElement('button');
  a11yBtn.type = 'button';
  a11yBtn.className = 'btn btn-outline app-nav__btn app-nav__btn--a11y';
  a11yBtn.setAttribute('aria-label', 'Accessibility options');
  a11yBtn.innerHTML = '<span class="app-nav__icon" aria-hidden="true">♿</span><span class="app-nav__label">Accessibility</span>';
  a11yBtn.hidden = true;

  end.appendChild(a11yBtn);
  bar.append(start, end);

  let backAction = null;

  backBtn.addEventListener('click', () => {
    app.sound.playClick();
    backAction?.();
  });

  homeBtn.addEventListener('click', () => {
    app.sound.playClick();
    app.screens.goHome();
  });

  a11yBtn.addEventListener('click', () => {
    app.sound.playClick();
    if (app.accessibility.isOpen()) app.accessibility.close();
    else app.accessibility.open();
  });

  function sync(screen) {
    const state = app.screens.getNavState(screen);
    backAction = state.backAction;

    backBtn.hidden = !state.showBack;
    homeBtn.hidden = !state.showHome;
    a11yBtn.hidden = !state.showA11y;

    const anyVisible = state.showBack || state.showHome || state.showA11y;
    bar.hidden = !anyVisible;

    if (!app.accessibility.isOpen()) {
      a11yBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function setA11yExpanded(expanded) {
    a11yBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  return {
    element: bar,
    sync,
    setA11yExpanded,
  };
}
