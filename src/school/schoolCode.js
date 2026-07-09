/**
 * School license codes — KB-XXXX-XXXX-XXXX.
 *
 * Issued per school after purchase (scripts/make-school-code.mjs) and
 * validated offline: the last group is a checksum of the first two mixed
 * with a shared constant. Like the rest of the access layer this is a
 * soft gate — it lives client-side and deters casual use; it is not DRM.
 *
 * Charset avoids lookalikes (no I, O, 0, 1).
 */
export const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CHECK_SALT = 'the-jump-vault-key-buddy-2026';
const GROUP = 4;

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Deterministic check group for the two payload groups. */
export function checkGroup(slug, rand) {
  let out = '';
  for (let i = 0; i < GROUP; i++) {
    const h = fnv1a(`${CHECK_SALT}:${slug}:${rand}:${i}`);
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

export function randomGroup() {
  let out = '';
  for (let i = 0; i < GROUP; i++) {
    out += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return out;
}

export function makeSchoolCode(schoolName) {
  const slug = slugForName(schoolName);
  const rand = randomGroup();
  return `KB-${slug}-${rand}-${checkGroup(slug, rand)}`;
}

/** Accepts the code with any casing/spacing; true only if the check matches. */
export function validateSchoolCode(input) {
  const cleaned = String(input ?? '').toUpperCase().replace(/[\s]/g, '');
  const match = /^KB-([A-Z2-9]{4})-([A-Z2-9]{4})-([A-Z2-9]{4})$/.exec(cleaned);
  if (!match) return false;
  const [, slug, rand, check] = match;
  return checkGroup(slug, rand) === check;
}
