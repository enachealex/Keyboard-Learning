import {
  bandForGrade,
  defaultLevelForGrade,
  levelForPoints,
  MAX_ADVANCEMENT_LEVEL,
  SCHOOL_GRADES,
} from '../config/schoolBands.js';

const ROSTER_KEY = 'keyboard-learning-roster';
const EXPORT_FORMAT = 'key-buddy-class';
const EXPORT_VERSION = 1;

function makeId() {
  return `s${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function normalizeStudent(raw) {
  if (!raw || typeof raw.name !== 'string' || !raw.name.trim()) return null;
  const grade = SCHOOL_GRADES.includes(String(raw.grade)) ? String(raw.grade) : 'K';
  const level = Math.max(1, Math.min(MAX_ADVANCEMENT_LEVEL, Math.round(raw.level) || 1));
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
    name: raw.name.trim().slice(0, 40),
    grade,
    band: bandForGrade(grade),
    level,
    lastAutoLevel: Math.max(1, Math.round(raw.lastAutoLevel) || level),
    difficultyOverride: raw.difficultyOverride ?? 'auto',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

/**
 * On-device class roster for the school edition. Student data stays on the
 * school's own computer; export/import moves a class between lab machines
 * as a plain JSON file.
 */
export class RosterStore {
  constructor() {
    this.data = this._load();
    // The active student is per-tab on purpose: shared lab machines should
    // ask "who's playing?" on every fresh launch.
  }

  _load() {
    try {
      const raw = localStorage.getItem(ROSTER_KEY);
      if (!raw) return { students: [] };
      const data = JSON.parse(raw);
      const students = Array.isArray(data.students)
        ? data.students.map(normalizeStudent).filter(Boolean)
        : [];
      return { students };
    } catch {
      return { students: [] };
    }
  }

  _save() {
    try {
      localStorage.setItem(ROSTER_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  getStudents() {
    return [...this.data.students];
  }

  getStudent(id) {
    return this.data.students.find((s) => s.id === id) ?? null;
  }

  addStudent(name, grade) {
    const student = normalizeStudent({
      name,
      grade,
      level: defaultLevelForGrade(grade),
    });
    if (!student) return null;
    this.data.students.push(student);
    this._save();
    return student;
  }

  updateStudent(id, partial) {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx < 0) return null;
    const merged = normalizeStudent({ ...this.data.students[idx], ...partial });
    if (!merged) return null;
    merged.id = id;
    this.data.students[idx] = merged;
    this._save();
    return merged;
  }

  removeStudent(id) {
    const before = this.data.students.length;
    this.data.students = this.data.students.filter((s) => s.id !== id);
    if (this.data.students.length !== before) this._save();
  }

  /** Progress-store segment for a student — keeps per-student scores apart. */
  segmentFor(studentId) {
    return `stu:${studentId}`;
  }

  setActive(studentId) {
    try {
      sessionStorage.setItem('keyboard-learning-active-student', studentId ?? '');
    } catch {
      this._memActive = studentId ?? '';
    }
  }

  getActive() {
    let id = '';
    try {
      id = sessionStorage.getItem('keyboard-learning-active-student') ?? '';
    } catch {
      id = this._memActive ?? '';
    }
    return id ? this.getStudent(id) : null;
  }

  /**
   * Called after a round: bumps the student's level when their lifetime
   * points cross a new threshold. Only newly crossed thresholds bump, so a
   * teacher who manually lowers a student's level stays in control.
   * Returns the new level when a level-up happened, else null.
   */
  autoAdvance(studentId, totalPoints) {
    const student = this.getStudent(studentId);
    if (!student) return null;
    const earned = levelForPoints(totalPoints);
    if (earned <= student.lastAutoLevel) return null;
    const newLevel = Math.max(student.level, earned);
    const leveledUp = newLevel > student.level;
    this.updateStudent(studentId, { level: newLevel, lastAutoLevel: earned });
    return leveledUp ? newLevel : null;
  }

  /** Class file: roster plus each student's progress entries. */
  exportClass(progressData) {
    const studentIds = new Set(this.data.students.map((s) => s.id));
    const progress = {};
    for (const [key, value] of Object.entries(progressData ?? {})) {
      for (const id of studentIds) {
        if (key.endsWith(`:stu:${id}`) || key === `total:stu:${id}`) {
          progress[key] = value;
          break;
        }
      }
    }
    return {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      students: this.getStudents(),
      progress,
    };
  }

  /**
   * Merge a class file into this device. Existing students with the same id
   * are updated; progress keeps whichever value is higher (numbers) or the
   * incoming record (objects), so re-importing never erases a high score.
   * Returns { added, updated } or null if the file isn't a class export.
   */
  importClass(parsed, progressStore) {
    if (!parsed || parsed.format !== EXPORT_FORMAT || !Array.isArray(parsed.students)) {
      return null;
    }
    let added = 0;
    let updated = 0;
    for (const raw of parsed.students) {
      const student = normalizeStudent(raw);
      if (!student) continue;
      if (this.getStudent(student.id)) {
        this.updateStudent(student.id, student);
        updated++;
      } else {
        this.data.students.push(student);
        added++;
      }
    }
    this._save();

    if (parsed.progress && progressStore) {
      for (const [key, value] of Object.entries(parsed.progress)) {
        const current = progressStore.data[key];
        if (typeof value === 'number') {
          if (typeof current !== 'number' || value > current) {
            progressStore.data[key] = value;
          }
        } else if (current == null) {
          progressStore.data[key] = value;
        }
      }
      progressStore._save();
    }
    return { added, updated };
  }
}
