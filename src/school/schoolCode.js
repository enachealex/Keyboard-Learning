/**
 * Teacher license codes — KB-XXXX-XXXX-XXXX.
 *
 * Each code is personal: it is emailed to one teacher after purchase and
 * doubles as their encoded ID. The three groups are:
 *
 *   slug   — 4 chars derived from the school name (cosmetic, aids support)
 *   id     — the teacher's numeric ID (1..1048575), scrambled so codes
 *            don't look sequential, decodable by the app and the issuer
 *   check  — checksum binding slug + id
 *
 * Issue codes with scripts/make-school-code.mjs and keep a ledger of
 * which ID belongs to which teacher. Validation and decoding happen
 * offline; like the rest of the access layer this is a soft gate that
 * ties use to purchase and attributes data — it is not DRM.
 *
 * Charset avoids lookalikes (no I, O, 0, 1).
 */
export const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CHECK_SALT = 'the-jump-vault-key-buddy-2026';
const GROUP = 4;

/**
 * The 20-bit payload packs the school type (2 bits) above the teacher ID
 * (18 bits). Codes minted before types existed had type bits of zero, so
 * they decode as 'elementary' with their original ID — compatible.
 */
export const SCHOOL_TYPES = ['elementary', 'middle', 'high', 'all'];
const ID_BITS = 18;
export const MAX_TEACHER_ID = 2 ** ID_BITS - 1; // 262,143

// Odd multiplier scrambles sequential IDs across the space; its modular
// inverse (computed below) unscrambles them.
const SCRAMBLE = 566527;
const MOD = 32 ** GROUP;

function modInverse(a, m) {
  let [t, newT, r, newR] = [0, 1, m, a % m];
  while (newR !== 0) {
    const q = Math.floor(r / newR);
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  return ((t % m) + m) % m;
}
const UNSCRAMBLE = modInverse(SCRAMBLE, MOD);

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function encodeGroup(value) {
  let out = '';
  let v = value;
  for (let i = 0; i < GROUP; i++) {
    out = CODE_CHARSET[v % 32] + out;
    v = Math.floor(v / 32);
  }
  return out;
}

function decodeGroup(group) {
  let v = 0;
  for (const ch of group) {
    const idx = CODE_CHARSET.indexOf(ch);
    if (idx < 0) return null;
    v = v * 32 + idx;
  }
  return v;
}

/** Deterministic check group for the two payload groups. */
export function checkGroup(slug, idGroup) {
  let out = '';
  for (let i = 0; i < GROUP; i++) {
    const h = fnv1a(`${CHECK_SALT}:${slug}:${idGroup}:${i}`);
    out += CODE_CHARSET[h % CODE_CHARSET.length];
  }
  return out;
}

/** 4-char slug from a school name, padded from the charset if short. */
export function slugForName(name) {
  const letters = String(name ?? '').toUpperCase().replace(/[^A-Z2-9]/g, '')
    .replace(/[IO01]/g, '');
  let slug = letters.slice(0, GROUP);
  let i = 0;
  while (slug.length < GROUP) {
    slug += CODE_CHARSET[fnv1a(`${name}:${i++}`) % CODE_CHARSET.length];
  }
  return slug;
}

/** Personal code for one teacher. Same inputs always yield the same code. */
export function makeSchoolCode(schoolName, teacherId, schoolType = 'all') {
  const id = Math.round(Number(teacherId));
  if (!Number.isFinite(id) || id < 1 || id > MAX_TEACHER_ID) {
    throw new Error(`Teacher ID must be 1..${MAX_TEACHER_ID}`);
  }
  const typeIndex = SCHOOL_TYPES.indexOf(schoolType);
  if (typeIndex < 0) {
    throw new Error(`School type must be one of: ${SCHOOL_TYPES.join(', ')}`);
  }
  const payload = (typeIndex << ID_BITS) | id;
  const slug = slugForName(schoolName);
  const idGroup = encodeGroup((payload * SCRAMBLE) % MOD);
  return `KB-${slug}-${idGroup}-${checkGroup(slug, idGroup)}`;
}

function parse(input) {
  const cleaned = String(input ?? '').toUpperCase().replace(/\s/g, '');
  const match = /^KB-([A-Z2-9]{4})-([A-Z2-9]{4})-([A-Z2-9]{4})$/.exec(cleaned);
  if (!match) return null;
  const [, slug, idGroup, check] = match;
  if (checkGroup(slug, idGroup) !== check) return null;
  return { slug, idGroup, cleaned };
}

/** Accepts the code with any casing/spacing; true only if the check matches. */
export function validateSchoolCode(input) {
  return parse(input) !== null;
}

function decodePayload(input) {
  const parsed = parse(input);
  if (!parsed) return null;
  const raw = decodeGroup(parsed.idGroup);
  if (raw == null) return null;
  const payload = (raw * UNSCRAMBLE) % MOD;
  const id = payload & MAX_TEACHER_ID;
  if (id < 1) return null;
  return { id, type: SCHOOL_TYPES[payload >> ID_BITS] };
}

/** The teacher ID a valid code encodes, or null for an invalid code. */
export function decodeTeacherId(input) {
  return decodePayload(input)?.id ?? null;
}

/** The school type a valid code encodes ('all' for family codes). */
export function decodeSchoolType(input) {
  return decodePayload(input)?.type ?? null;
}
