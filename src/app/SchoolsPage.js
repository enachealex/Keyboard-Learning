/**
 * "For Schools" page (free web edition only) — pitches the school edition,
 * offers the signed installer download, and starts the quote flow.
 *
 * Purchasing is deliberately contact-first: schools request a quote and we
 * reply with their quote and a secure payment link. No checkout lives on
 * this static site.
 */

const QUOTE_EMAIL = 'enachealex1@gmail.com';

// releases/latest/download URLs save the file directly — visitors never
// see a GitHub page, the bytes just come from the release CDN.
const DOWNLOAD_BASE = 'https://github.com/enachealex/Keyboard-Learning/releases/latest/download';
const DOWNLOAD_URL = `${DOWNLOAD_BASE}/Keyboard-Learning-School-Setup.exe`;
const CHECKSUM_URL = `${DOWNLOAD_BASE}/Keyboard-Learning-School-Setup.exe.sha256`;

export const FREE_DOWNLOAD_URL = `${DOWNLOAD_BASE}/Keyboard-Learning-Free-Setup.exe`;

const BENEFITS = [
  ['🏫', 'Class rosters, no accounts', 'Teachers add students by name and grade; students sign in by tapping their name. No passwords, no student emails.'],
  ['🧑‍🏫', 'Teacher dashboard', 'Set each student’s level, pin a difficulty, and watch per-student progress — points, bests, accuracy, and typing speed.'],
  ['🎓', 'Elementary, Middle, and High modes', 'The same skills with age-appropriate coaching: playful for young learners, respectful and progress-framed for older students.'],
  ['📈', 'Points and advancement levels', 'Students earn points every round and level up as they improve. High scores become goals to beat.'],
  ['📝', 'Your word lists in the games', 'Paste this week’s spelling or vocabulary words and the typing games practice them all week.'],
  ['🛠️', 'Build your own games', 'Create custom typing games from your own content with the same settings our built-in games use.'],
  ['🧮', 'Math Facts Sprint', 'Number-row typing practice on math problems you configure — operations, ranges, even a single times table.'],
  ['💾', 'Class files', 'Move a whole class — students, levels, word lists, games, and scores — between lab machines with one file.'],
  ['🔒', 'Student data stays at school', 'Everything lives on your computers. Nothing is uploaded anywhere, which keeps FERPA/COPPA conversations short.'],
  ['🛡️', 'Signed Windows installer', 'Installs per-machine for every user, digitally signed by The Jump Vault, with published checksums your IT can verify.'],
];

const STEPS = [
  ['1', 'Request a quote', 'Tell us your school’s name and roughly how many computers you’ll install on.'],
  ['2', 'Receive your quote and payment link', 'We reply with pricing for your school and a secure link where you can review and pay online.'],
  ['3', 'Install and teach', 'Download the installer, run it on your lab machines, and set up your class in minutes.'],
];

function quoteMailto() {
  const subject = 'Key Buddy School — price quote request';
  const body = [
    'Hi,',
    '',
    'We’d like a quote for Key Buddy School.',
    '',
    'School name: ',
    'Number of computers: ',
    'Contact name and role: ',
    '',
    'Thanks!',
  ].join('\n');
  return `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function renderSchoolsPage(app) {
  const screen = _el('div', 'screen schools-screen');

  const header = _el('div', 'screen-header');
  header.appendChild(_el('h1', 'screen-title', 'Key Buddy for Schools'));
  header.appendChild(_el('p', 'screen-subtitle',
    'Everything in the free app, plus the classroom tools that make keyboard and mouse practice part of your curriculum.'));
  screen.appendChild(header);

  // Benefits
  const grid = _el('div', 'schools-benefits');
  for (const [icon, title, text] of BENEFITS) {
    const card = _el('div', 'schools-benefit');
    card.appendChild(_el('div', 'schools-benefit__icon', icon));
    const body = _el('div', 'schools-benefit__body');
    body.appendChild(_el('h3', 'schools-benefit__title', title));
    body.appendChild(_el('p', 'schools-benefit__text', text));
    card.appendChild(body);
    grid.appendChild(card);
  }
  screen.appendChild(grid);

  // How purchasing works
  const how = _el('div', 'schools-how');
  how.appendChild(_el('h2', 'hub-section-title', 'How purchasing works'));
  const steps = _el('div', 'schools-steps');
  for (const [n, title, text] of STEPS) {
    const step = _el('div', 'schools-step');
    step.appendChild(_el('div', 'schools-step__number', n));
    step.appendChild(_el('h3', 'schools-step__title', title));
    step.appendChild(_el('p', 'schools-step__text', text));
    steps.appendChild(step);
  }
  how.appendChild(steps);
  screen.appendChild(how);

  // CTAs
  const ctaRow = _el('div', 'btn-row schools-cta-row');
  const quoteBtn = _el('a', 'btn btn-primary btn-large', 'Request Price Quote');
  quoteBtn.href = quoteMailto();
  ctaRow.appendChild(quoteBtn);

  // Same-tab: the browser saves the file and the visitor stays right here.
  const downloadBtn = _el('a', 'btn btn-secondary btn-large', 'Download the Installer');
  downloadBtn.href = DOWNLOAD_URL;
  ctaRow.appendChild(downloadBtn);
  screen.appendChild(ctaRow);

  const fineprint = _el('p', 'schools-fineprint');
  fineprint.append(
    'Windows 10/11, 64-bit. Signed by The Jump Vault. IT can verify the download against the ',
    _link('checksum file', CHECKSUM_URL),
    '. Questions about evaluation or district-wide rollout? Include them in your quote request.',
  );
  screen.appendChild(fineprint);

  // '?' opens accessibility elsewhere; here just keep focus sane
  return screen;
}

function _link(text, href) {
  const a = document.createElement('a');
  a.className = 'schools-link';
  a.textContent = text;
  a.href = href;
  return a;
}

function _el(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}
