import { KEYBOARD_SHORTCUTS } from '../config/keyboardShortcuts.js';
import {
  applyUiPreferences,
  REDUCE_MOTION_OPTIONS,
  TEXT_SCALE_OPTIONS,
  THEME_OPTIONS,
} from '../utils/uiPreferences.js';

export function createAccessibilityHub(app) {
  const backdrop = document.createElement('div');
  backdrop.className = 'a11y-modal-backdrop';
  backdrop.hidden = true;

  const modal = document.createElement('div');
  modal.className = 'a11y-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'a11y-modal-title');
  backdrop.appendChild(modal);

  let draft = { ...app.settings.getAll() };
  let lastFocus = null;

  function _applyDraft() {
    app.settings.update(draft);
    applyUiPreferences(draft);
    app.audioControls.refresh();
  }

  function _buildModal() {
    modal.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'a11y-modal__header';
    header.innerHTML = '<h2 id="a11y-modal-title" class="a11y-modal__title">Accessibility</h2>';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-outline btn-small a11y-modal__close';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => close());
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'a11y-modal__body';

    body.appendChild(_section('Display', [
      _selectRow('Theme', THEME_OPTIONS, draft.theme, (v) => { draft.theme = v; _applyDraft(); }),
      _selectRow('Text size', TEXT_SCALE_OPTIONS, draft.textScale, (v) => { draft.textScale = v; _applyDraft(); }),
      _selectRow('Motion', REDUCE_MOTION_OPTIONS, draft.reduceMotion, (v) => { draft.reduceMotion = v; _applyDraft(); }),
      _toggleRow('High contrast', draft.highContrast, (v) => { draft.highContrast = v; _applyDraft(); }),
    ]));

    const shortcutsSec = document.createElement('section');
    shortcutsSec.className = 'a11y-modal__section';
    shortcutsSec.innerHTML = '<h3 class="a11y-modal__section-title">Keyboard shortcuts</h3>';
    const table = document.createElement('dl');
    table.className = 'a11y-shortcuts';
    for (const item of KEYBOARD_SHORTCUTS) {
      const dt = document.createElement('dt');
      dt.className = 'a11y-shortcuts__keys';
      dt.textContent = item.keys;
      const dd = document.createElement('dd');
      dd.className = 'a11y-shortcuts__desc';
      dd.textContent = item.description;
      table.append(dt, dd);
    }
    shortcutsSec.appendChild(table);
    body.appendChild(shortcutsSec);

    modal.appendChild(body);
  }

  function open() {
    draft = { ...app.settings.getAll() };
    lastFocus = document.activeElement;
    _buildModal();
    backdrop.hidden = false;
    app.appNav?.setA11yExpanded(true);
    const closeBtn = modal.querySelector('.a11y-modal__close');
    closeBtn?.focus();
  }

  function close() {
    backdrop.hidden = true;
    app.appNav?.setA11yExpanded(false);
    if (lastFocus?.focus) lastFocus.focus();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  return {
    backdrop,
    mount(parent) {
      parent.appendChild(backdrop);
    },
    open,
    close,
    isOpen() {
      return !backdrop.hidden;
    },
  };
}

function _section(title, children) {
  const sec = document.createElement('section');
  sec.className = 'a11y-modal__section';
  const h = document.createElement('h3');
  h.className = 'a11y-modal__section-title';
  h.textContent = title;
  sec.appendChild(h);
  for (const child of children) sec.appendChild(child);
  return sec;
}

function _selectRow(label, options, value, onChange) {
  const row = document.createElement('label');
  row.className = 'a11y-modal__row';
  const lbl = document.createElement('span');
  lbl.className = 'a11y-modal__label';
  lbl.textContent = label;
  const select = document.createElement('select');
  select.className = 'a11y-modal__select';
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt.id;
    o.textContent = opt.label;
    if (opt.id === value) o.selected = true;
    select.appendChild(o);
  }
  select.addEventListener('change', () => onChange(select.value));
  row.append(lbl, select);
  return row;
}

function _toggleRow(label, value, onChange) {
  const row = document.createElement('label');
  row.className = 'a11y-modal__row a11y-modal__row--toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.addEventListener('change', () => onChange(input.checked));
  const span = document.createElement('span');
  span.textContent = label;
  row.append(input, span);
  return row;
}
