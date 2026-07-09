import { createMascot } from '../components/Mascot.js';
import { createActivityCard } from '../components/ActivityCard.js';
import { renderTeacherScreen } from '../app/TeacherScreen.js';
import { customGameMeta } from '../app/TeacherContentStore.js';
import {
  getBand,
  getPresentation,
  levelForPoints,
  pointsToNextLevel,
  LEVEL_POINT_THRESHOLDS,
} from '../config/schoolBands.js';
import { formatPoints } from '../utils/scoring.js';

/**
 * School-only screens, loaded as a separate chunk. Each renderer receives
 * (app, sm) where sm is the ScreenManager — they use its element helpers
 * and append into the already-cleared screen root.
 */

export function renderStudentPicker(app, sm) {
  const screen = sm._screenEl('screen', 'screen--center', 'student-picker-screen');

  const mascot = createMascot({ hideWordmark: true });
  mascot.classList.add('welcome-mascot');
  screen.appendChild(mascot);

  const header = sm._el('div', 'screen-header');
  header.appendChild(sm._el('h1', 'screen-title', "Who's playing today?"));
  screen.appendChild(header);

  const students = app.roster.getStudents();
  if (students.length === 0) {
    screen.appendChild(sm._el('p', 'screen-subtitle',
      'No class is set up on this computer yet. Teachers: tap the button below to add your students.'));
  } else {
    header.appendChild(sm._el('p', 'screen-subtitle', 'Tap your name to start.'));
    const grid = sm._el('div', 'student-grid');
    for (const student of students) {
      const band = getBand(student.band);
      const btn = sm._btn('', 'student-btn', () => {
        app.sound.unlock();
        app.sound.playClick();
        app.roster.setActive(student.id);
        sm.show('hub');
      });
      btn.appendChild(sm._el('span', 'student-btn-name', student.name));
      btn.appendChild(sm._el('span', 'student-btn-meta', `${band.icon} Grade ${student.grade}`));
      btn.setAttribute('aria-label', `${student.name}, grade ${student.grade}`);
      grid.appendChild(btn);
    }
    screen.appendChild(grid);
  }

  const teacherRow = sm._el('div', 'access-teacher-row');
  teacherRow.appendChild(sm._btn('👩‍🏫 Teacher', 'btn btn-outline btn-small access-teacher-btn', () => {
    sm.show('teacher-gate');
  }));
  screen.appendChild(teacherRow);

  sm.root.appendChild(screen);
}

export function renderTeacher(app, sm) {
  const screen = renderTeacherScreen(app, {
    onDone: () => sm.show('student-picker'),
    onOpenSettings: () => sm.show('settings'),
  });
  sm.root.appendChild(screen);
}

export function renderStudentHub(app, sm) {
  const student = app.roster.getActive();
  if (!student) {
    sm.show('student-picker');
    return;
  }
  const band = getBand(student.band);
  const pres = getPresentation(student.band);
  const segment = app.roster.segmentFor(student.id);
  const classes = ['screen', 'hub-screen'];
  if (!pres.showMascot) classes.push('adult-hub-screen');
  const screen = sm._screenEl(...classes);

  const header = sm._el('div', 'screen-header');
  header.appendChild(sm._el('h1', 'screen-title', pres.hubTitle));

  const bar = sm._el('div', 'age-bar');
  bar.appendChild(sm._el('span', 'age-bar-text',
    `${band.icon} ${student.name} · Grade ${student.grade} · ${pres.levelLabel(student.level)}`));
  bar.appendChild(sm._btn('Switch player', 'btn btn-outline btn-small', () => {
    app.roster.setActive(null);
    sm.show('student-picker');
  }));
  header.appendChild(bar);

  // Points progress toward the next advancement level.
  const total = app.progress.getTotalPoints(segment);
  const earned = levelForPoints(total);
  const toNext = pointsToNextLevel(total, earned);
  const nextLevel = earned + 1;
  const prog = sm._el('div', 'student-level-bar');
  const label = toNext != null && nextLevel > student.level
    ? `${formatPoints(total)} pts · ${formatPoints(toNext)} to ${pres.levelLabel(nextLevel)}`
    : `${formatPoints(total)} pts earned`;
  prog.appendChild(sm._el('span', 'student-level-text', label));
  const track = sm._el('div', 'student-level-track');
  const fill = sm._el('div', 'student-level-fill');
  const floor = LEVEL_POINT_THRESHOLDS[earned - 1] ?? 0;
  const ceil = LEVEL_POINT_THRESHOLDS[earned] ?? null;
  const pct = ceil != null ? Math.min(100, ((total - floor) / (ceil - floor)) * 100) : 100;
  fill.style.width = `${Math.max(0, pct)}%`;
  track.appendChild(fill);
  prog.appendChild(track);
  header.appendChild(prog);

  const ctx = {
    audience: band.audience,
    segmentId: segment,
    difficulty: app.studentDifficulty(student),
    hubSection: null,
  };
  const opts = { ctx, segmentId: segment, showStars: pres.showStars };
  const typingSection = sm._hubSection(pres.hubTypingLabel, 'typing', null, opts);
  const mouseSection = sm._hubSection(pres.hubMouseLabel, 'mouse', null, opts);

  screen.append(header, typingSection, mouseSection);

  const classSection = classGamesSection(app, sm, pres, segment);
  if (classSection) screen.insertBefore(classSection, typingSection);

  sm.root.appendChild(screen);
}

/** Teacher-built games, shown first — they're this week's assignment. */
function classGamesSection(app, sm, pres, segmentId) {
  const games = app.teacherContent?.getEnabledCustomGames() ?? [];
  if (games.length === 0) return null;

  const section = sm._el('div', 'hub-section');
  section.appendChild(sm._el('h2', 'hub-section-title', pres.classGamesLabel));
  const grid = sm._el('div', 'activity-grid');

  for (const game of games) {
    const meta = customGameMeta(game);
    const progress = {
      stars: app.progress.getStars(meta.id, segmentId),
      bestPoints: app.progress.getBestPoints(meta.id, segmentId),
      showStars: pres.showStars,
    };
    grid.appendChild(createActivityCard(meta, progress, () => {
      app.sound.playClick();
      sm.selectedActivity = meta;
      app.startActivity(meta);
    }));
  }

  section.appendChild(grid);
  return section;
}
