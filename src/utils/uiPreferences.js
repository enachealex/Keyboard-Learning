const THEME_MEDIA = '(prefers-color-scheme: light)';

export const THEME_OPTIONS = [
  { id: 'auto', label: 'Auto (match device)' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

export const TEXT_SCALE_OPTIONS = [
  { id: 'normal', label: 'Normal text' },
  { id: 'large', label: 'Large text' },
  { id: 'xlarge', label: 'Extra large text' },
];

export const REDUCE_MOTION_OPTIONS = [
  { id: 'auto', label: 'Auto (match device)' },
  { id: 'on', label: 'Reduce motion' },
  { id: 'off', label: 'Full motion' },
];

function resolveTheme(themePref) {
  if (themePref === 'light') return 'light';
  if (themePref === 'dark') return 'dark';
  return window.matchMedia(THEME_MEDIA).matches ? 'light' : 'dark';
}

function resolveReduceMotion(pref) {
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyUiPreferences(settings) {
  const theme = resolveTheme(settings.theme ?? 'auto');
  const textScale = settings.textScale ?? 'normal';
  const reduceMotion = resolveReduceMotion(settings.reduceMotion ?? 'auto');

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-text-scale', textScale);
  document.documentElement.setAttribute('data-reduce-motion', reduceMotion ? 'true' : 'false');
  document.documentElement.setAttribute(
    'data-high-contrast',
    settings.highContrast ? 'true' : 'false',
  );

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    if (settings.highContrast) {
      metaTheme.setAttribute('content', '#000000');
    } else {
      metaTheme.setAttribute('content', theme === 'light' ? '#e8f4fd' : '#1a2440');
    }
  }
  document.documentElement.style.colorScheme = theme;
}

export function watchSystemUiPreferences(settings, onChange) {
  const themeMq = window.matchMedia(THEME_MEDIA);
  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = () => {
    if (settings.theme === 'auto' || settings.reduceMotion === 'auto') {
      applyUiPreferences(settings);
      onChange?.();
    }
  };

  themeMq.addEventListener('change', handler);
  motionMq.addEventListener('change', handler);

  return () => {
    themeMq.removeEventListener('change', handler);
    motionMq.removeEventListener('change', handler);
  };
}
