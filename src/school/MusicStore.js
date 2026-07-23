/**
 * Class music — teacher-added background tracks, stored in IndexedDB
 * (audio files are megabytes; localStorage can't hold them).
 *
 * Like the roster, music is specific to this teacher's device and their
 * students: files never leave the computer, and they are deliberately
 * NOT included in class-file exports (a single song would dwarf the
 * entire class file). Teachers re-add music on other machines.
 */

const DB_NAME = 'keybuddy-class-music';
const STORE = 'tracks';

export const MAX_TRACKS = 10;
export const MAX_TRACK_BYTES = 15 * 1024 * 1024; // 15 MB

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|oga|flac)$/i;

function makeId() {
  return `t${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const out = fn(store);
    t.oncomplete = () => resolve(out?.result ?? out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

async function getAllRecords() {
  const db = await openDb();
  try {
    return (await tx(db, 'readonly', (s) => s.getAll())) ?? [];
  } finally {
    db.close();
  }
}

/** Track metadata (no blobs) for the dashboard list. */
export async function listTracks() {
  const records = await getAllRecords();
  return records
    .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0))
    .map(({ id, name, size }) => ({ id, name, size }));
}

/**
 * Validate and store one audio file. Returns { ok, error?, track? }.
 */
export async function addTrack(file) {
  const isAudio = (file.type ?? '').startsWith('audio/') || AUDIO_EXTENSIONS.test(file.name ?? '');
  if (!isAudio) {
    return { ok: false, error: `"${file.name}" isn't an audio file.` };
  }
  if (file.size > MAX_TRACK_BYTES) {
    return { ok: false, error: `"${file.name}" is over ${Math.round(MAX_TRACK_BYTES / 1024 / 1024)} MB.` };
  }
  const existing = await getAllRecords();
  if (existing.length >= MAX_TRACKS) {
    return { ok: false, error: `Track limit reached (${MAX_TRACKS}) — delete one first.` };
  }
  const track = {
    id: makeId(),
    name: String(file.name ?? 'Track').slice(0, 80),
    size: file.size,
    type: file.type || 'audio/mpeg',
    blob: file,
    addedAt: Date.now(),
  };
  const db = await openDb();
  try {
    await tx(db, 'readwrite', (s) => s.put(track));
  } finally {
    db.close();
  }
  return { ok: true, track: { id: track.id, name: track.name, size: track.size } };
}

export async function deleteTrack(id) {
  const db = await openDb();
  try {
    await tx(db, 'readwrite', (s) => s.delete(id));
  } finally {
    db.close();
  }
}

/**
 * Object URLs for every stored track, in added order. Caller owns the
 * URLs and should revoke the previous batch when refreshing.
 */
export async function getTrackUrls() {
  const records = await getAllRecords();
  return records
    .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0))
    .map((r) => URL.createObjectURL(r.blob));
}
