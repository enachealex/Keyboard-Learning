const CONTENT_KEY = 'keyboard-learning-teacher-content';

/** Characters the games can actually match on the keyboard (see keyCodes.js). */
const TYPEABLE = /[^a-zA-Z0-9 .,!?;'\-=]/g;

const MAX_LISTS = 20;
const MAX_WORDS_PER_LIST = 100;
const MAX_WORD_LENGTH = 24;
const MAX_GAMES = 10;

function makeId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Turn pasted text (one word or phrase per line) into a clean, typeable
 * word list. Untypeable characters are stripped, never silently dropping
 * whole words unless nothing typeable remains.
 */
export function sanitizeWords(text) {
  const seen = new Set();
  const words = [];
  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const word = rawLine.replace(TYPEABLE, '').replace(/\s+/g, ' ').trim().slice(0, MAX_WORD_LENGTH);
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
    if (words.length >= MAX_WORDS_PER_LIST) break;
  }
  return words;
}

function normalizeList(raw) {
  if (!raw || typeof raw.name !== 'string') return null;
  const words = Array.isArray(raw.words) ? sanitizeWords(raw.words.join('\n')) : [];
  if (words.length === 0) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId('wl'),
    name: raw.name.trim().slice(0, 40) || 'Word list',
    words,
  };
}

function normalizeMath(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const ops = {
    add: raw.ops?.add !== false,
    sub: Boolean(raw.ops?.sub),
    mul: Boolean(raw.ops?.mul),
    div: Boolean(raw.ops?.div),
  };
  if (!ops.add && !ops.sub && !ops.mul && !ops.div) ops.add = true;
  const maxSum = [10, 20, 50, 100].includes(raw.maxSum) ? raw.maxSum : 20;
  const maxFactor = [5, 10, 12].includes(raw.maxFactor) ? raw.maxFactor : 10;
  const focusTable = Number.isInteger(raw.focusTable) && raw.focusTable >= 2 && raw.focusTable <= 12
    ? raw.focusTable
    : null;
  return { ops, maxSum, maxFactor, focusTable };
}

function normalizeGame(raw) {
  if (!raw || typeof raw.name !== 'string' || !raw.name.trim()) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId('g'),
    name: raw.name.trim().slice(0, 24),
    icon: typeof raw.icon === 'string' && raw.icon ? raw.icon.slice(0, 4) : '⭐',
    mode: raw.mode === 'letters' ? 'letters' : 'words',
    useActiveList: Boolean(raw.useActiveList),
    words: Array.isArray(raw.words) ? sanitizeWords(raw.words.join('\n')) : [],
    count: Math.max(3, Math.min(50, Math.round(raw.count) || 10)),
    timed: Boolean(raw.timed),
    timeLimit: Math.max(15, Math.min(180, Math.round(raw.timeLimit) || 60)),
    showKeyboard: raw.showKeyboard !== false,
    enabled: raw.enabled !== false,
  };
}

/**
 * Synthetic activity metadata so a teacher-built game plugs into the hub,
 * scoring, and startActivity exactly like a registry activity.
 */
export function customGameMeta(game) {
  return {
    id: `custom:${game.id}`,
    gameId: game.id,
    custom: true,
    title: game.name,
    icon: game.icon,
    category: 'typing',
    description: game.mode === 'letters' ? 'Key practice made by your teacher' : 'Typing practice made by your teacher',
    class: () => import('../activities/typing/CustomTypingGame.js'),
  };
}

/**
 * Teacher-authored content for the school edition: spelling/vocab word
 * lists, math facts generator settings, and custom typing games. Lives on
 * the device like the roster and travels inside class export files.
 */
export class TeacherContentStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(CONTENT_KEY);
      if (!raw) return this._empty();
      return this._normalize(JSON.parse(raw));
    } catch {
      return this._empty();
    }
  }

  _empty() {
    return { wordLists: [], activeWordListId: null, mathFacts: null, customGames: [] };
  }

  _normalize(data) {
    const wordLists = (Array.isArray(data.wordLists) ? data.wordLists : [])
      .map(normalizeList).filter(Boolean).slice(0, MAX_LISTS);
    const customGames = (Array.isArray(data.customGames) ? data.customGames : [])
      .map(normalizeGame).filter(Boolean).slice(0, MAX_GAMES);
    const activeWordListId = wordLists.some((l) => l.id === data.activeWordListId)
      ? data.activeWordListId
      : null;
    return {
      wordLists,
      activeWordListId,
      mathFacts: normalizeMath(data.mathFacts),
      customGames,
    };
  }

  _save() {
    try {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  // ----- Word lists -----

  getWordLists() {
    return [...this.data.wordLists];
  }

  canAddWordList() {
    return this.data.wordLists.length < MAX_LISTS;
  }

  addWordList(name, text) {
    if (!this.canAddWordList()) return null;
    const list = normalizeList({ name, words: sanitizeWords(text) });
    if (!list) return null;
    this.data.wordLists.push(list);
    // A teacher adding this week's list almost always wants it live now.
    this.data.activeWordListId = list.id;
    this._save();
    return list;
  }

  removeWordList(id) {
    this.data.wordLists = this.data.wordLists.filter((l) => l.id !== id);
    if (this.data.activeWordListId === id) this.data.activeWordListId = null;
    this._save();
  }

  setActiveWordList(id) {
    this.data.activeWordListId = this.data.wordLists.some((l) => l.id === id) ? id : null;
    this._save();
  }

  getActiveWordList() {
    return this.data.wordLists.find((l) => l.id === this.data.activeWordListId) ?? null;
  }

  // ----- Math facts settings -----

  /** null means "use the grade-band defaults". */
  getMathSettings() {
    return this.data.mathFacts ? { ...this.data.mathFacts, ops: { ...this.data.mathFacts.ops } } : null;
  }

  setMathSettings(settings) {
    this.data.mathFacts = settings == null ? null : normalizeMath(settings);
    this._save();
  }

  // ----- Custom games -----

  getCustomGames() {
    return [...this.data.customGames];
  }

  getEnabledCustomGames() {
    return this.data.customGames.filter((g) => g.enabled);
  }

  getCustomGame(id) {
    return this.data.customGames.find((g) => g.id === id) ?? null;
  }

  canAddCustomGame() {
    return this.data.customGames.length < MAX_GAMES;
  }

  saveCustomGame(def) {
    const game = normalizeGame(def);
    if (!game) return null;
    if (!game.useActiveList && game.words.length < 3) return null;
    const idx = this.data.customGames.findIndex((g) => g.id === game.id);
    if (idx >= 0) {
      this.data.customGames[idx] = game;
    } else {
      if (!this.canAddCustomGame()) return null;
      this.data.customGames.push(game);
    }
    this._save();
    return game;
  }

  removeCustomGame(id) {
    this.data.customGames = this.data.customGames.filter((g) => g.id !== id);
    this._save();
  }

  setCustomGameEnabled(id, enabled) {
    const game = this.getCustomGame(id);
    if (!game) return;
    game.enabled = Boolean(enabled);
    this._save();
  }

  /** Words a custom game should use right now. */
  resolveGameWords(game) {
    if (game.useActiveList) {
      const active = this.getActiveWordList();
      if (active?.words.length) return [...active.words];
    }
    return [...game.words];
  }

  // ----- Class file -----

  exportData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  /** Replace-by-id merge so re-importing a class file never duplicates. */
  importData(raw) {
    if (!raw || typeof raw !== 'object') return false;
    const incoming = this._normalize(raw);
    for (const list of incoming.wordLists) {
      const idx = this.data.wordLists.findIndex((l) => l.id === list.id);
      if (idx >= 0) this.data.wordLists[idx] = list;
      else if (this.data.wordLists.length < MAX_LISTS) this.data.wordLists.push(list);
    }
    for (const game of incoming.customGames) {
      const idx = this.data.customGames.findIndex((g) => g.id === game.id);
      if (idx >= 0) this.data.customGames[idx] = game;
      else if (this.data.customGames.length < MAX_GAMES) this.data.customGames.push(game);
    }
    if (incoming.mathFacts) this.data.mathFacts = incoming.mathFacts;
    if (incoming.activeWordListId) this.data.activeWordListId = incoming.activeWordListId;
    this._save();
    return true;
  }
}
