import { WEB3FORMS_ACCESS_KEY, HCAPTCHA_SITEKEY, CONTACT_EMAIL } from '../config/quote.js';

/**
 * Quote request / contact page. Schools leave their details; the form
 * requires an hCaptcha pass (verified server-side by Web3Forms) before
 * anything is sent. The direct email is always shown as selectable text
 * because mailto: links do nothing on machines without a mail app —
 * the very bug that motivated this page.
 */

let hcaptchaLoading = null;

function ensureHcaptcha() {
  if (window.hcaptcha) return Promise.resolve();
  if (hcaptchaLoading) return hcaptchaLoading;
  hcaptchaLoading = new Promise((resolve, reject) => {
    window.__kbHcaptchaReady = () => resolve();
    const script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=__kbHcaptchaReady';
    script.async = true;
    script.onerror = () => {
      hcaptchaLoading = null;
      reject(new Error('captcha failed to load'));
    };
    document.head.appendChild(script);
  });
  return hcaptchaLoading;
}

export function renderQuotePage(app, { preselectedPackage, onSchools }) {
  const screen = _el('div', 'screen schools-screen quote-screen');

  const header = _el('div', 'screen-header');
  header.appendChild(_el('h1', 'screen-title', 'Request a Quote'));
  header.appendChild(_el('p', 'screen-subtitle',
    'Tell us about your school and we’ll get back to you with a quote — usually within a day.'));
  screen.appendChild(header);

  // Direct contact — always available, mail-app or not.
  const contact = _el('div', 'quote-contact');
  contact.append(
    _el('span', 'quote-contact__label', 'Prefer email? Write to us directly:'),
    _el('span', 'quote-contact__email', CONTACT_EMAIL),
  );
  const copyBtn = _btn('Copy address', 'btn btn-outline btn-small', async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy address'; }, 2000);
    } catch {
      copyBtn.textContent = 'Select the address above';
    }
  });
  contact.appendChild(copyBtn);
  screen.appendChild(contact);

  if (!WEB3FORMS_ACCESS_KEY) {
    // The form backend isn't configured yet — contact info carries the day.
    screen.appendChild(_el('p', 'schools-fineprint',
      'Our online form is coming shortly — for now, email us with your school’s name, type (Elementary / Middle / High), and roughly how many teachers and computers, and we’ll send your quote.'));
    const row = _el('div', 'btn-row');
    row.appendChild(_btn('Back to packages', 'btn btn-outline', onSchools));
    screen.appendChild(row);
    return screen;
  }

  const form = _el('form', 'quote-form');
  form.noValidate = true;

  const schoolName = _field(form, 'School name *', 'text', 'e.g. Lincoln Elementary');
  const schoolType = _selectField(form, 'School type *', [
    ['', 'Choose…'],
    ['Elementary', 'Elementary (K–5)'],
    ['Middle', 'Middle school (6–8)'],
    ['High', 'High school (9–12)'],
    ['Mixed', 'Multiple / combined'],
  ]);
  const pkg = _selectField(form, 'Package', [
    ['Classroom', 'Classroom — $129/yr'],
    ['School', 'School — $599/yr'],
    ['District', 'District — custom'],
    ['Not sure', 'Not sure yet'],
  ]);
  if (preselectedPackage) pkg.value = preselectedPackage;
  else pkg.value = 'Not sure';
  const contactName = _field(form, 'Your name *', 'text', 'Name and role');
  const email = _field(form, 'Email *', 'email', 'you@school.org');
  const phone = _field(form, 'Phone (optional)', 'tel', '');
  const message = document.createElement('textarea');
  message.rows = 4;
  message.className = 'teacher-textarea';
  message.placeholder = 'Anything else — teacher count, computers, timeline…';
  const messageWrap = _el('label', 'quote-field');
  messageWrap.append(_el('span', 'quote-field__label', 'Message (optional)'), message);
  form.appendChild(messageWrap);

  // Honeypot for bots (Web3Forms convention)
  const honeypot = document.createElement('input');
  honeypot.type = 'checkbox';
  honeypot.name = 'botcheck';
  honeypot.tabIndex = -1;
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.className = 'quote-honeypot';
  form.appendChild(honeypot);

  // Required hCaptcha
  const captchaWrap = _el('div', 'quote-captcha');
  const captchaEl = _el('div');
  captchaWrap.appendChild(captchaEl);
  form.appendChild(captchaWrap);
  let widgetId = null;
  ensureHcaptcha()
    .then(() => {
      widgetId = window.hcaptcha.render(captchaEl, { sitekey: HCAPTCHA_SITEKEY });
    })
    .catch(() => {
      captchaWrap.appendChild(_el('p', 'settings-error',
        'The captcha couldn’t load — check your connection, or email us directly above.'));
    });

  const error = _el('p', 'settings-error quote-error');
  error.setAttribute('role', 'alert');
  form.appendChild(error);

  const submitRow = _el('div', 'btn-row quote-submit-row');
  const submitBtn = _btn('Send quote request', 'btn btn-primary btn-large', () => {});
  submitBtn.type = 'submit';
  submitRow.appendChild(submitBtn);
  form.appendChild(submitRow);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    if (!schoolName.value.trim() || !schoolType.value || !contactName.value.trim() || !email.value.trim()) {
      error.textContent = 'Please fill in the required fields (marked *).';
      return;
    }
    if (!/.+@.+\..+/.test(email.value.trim())) {
      error.textContent = 'That email address doesn’t look right.';
      return;
    }
    const token = widgetId != null ? window.hcaptcha.getResponse(widgetId) : '';
    if (!token) {
      error.textContent = 'Please complete the captcha check first.';
      return;
    }
    if (honeypot.checked) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Key Buddy quote request — ${schoolName.value.trim()} (${pkg.value})`,
          school_name: schoolName.value.trim(),
          school_type: schoolType.value,
          package: pkg.value,
          contact_name: contactName.value.trim(),
          email: email.value.trim(),
          phone: phone.value.trim(),
          message: message.value.trim(),
          'h-captcha-response': token,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'send failed');
      form.replaceChildren(
        _el('h2', 'hub-section-title', 'Request sent! 🎉'),
        _el('p', 'schools-fineprint',
          `Thanks, ${contactName.value.trim()} — we’ll reply to ${email.value.trim()} with your quote, usually within a day.`),
      );
    } catch {
      error.textContent = 'Couldn’t send just now — please try again, or email us directly above.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send quote request';
      if (widgetId != null) window.hcaptcha.reset(widgetId);
    }
  });

  screen.appendChild(form);
  return screen;
}

function _field(form, label, type, placeholder) {
  const wrap = _el('label', 'quote-field');
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.className = 'teacher-name-input';
  wrap.append(_el('span', 'quote-field__label', label), input);
  form.appendChild(wrap);
  return input;
}

function _selectField(form, label, options) {
  const wrap = _el('label', 'quote-field');
  const select = document.createElement('select');
  select.className = 'settings-select';
  for (const [value, text] of options) {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = text;
    select.appendChild(o);
  }
  wrap.append(_el('span', 'quote-field__label', label), select);
  form.appendChild(wrap);
  return select;
}

function _el(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function _btn(text, className, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}
