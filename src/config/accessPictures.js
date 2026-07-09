/**
 * Picture set for the kid-friendly school access code.
 *
 * Deliberately distinct, nameable objects so pre-readers can recognize them
 * and so each tile has a clear accessible label. The "code" is an ordered
 * sequence of these ids (e.g. ['dog', 'star', 'apple']).
 */
export const ACCESS_PICTURES = [
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'apple', emoji: '🍎', label: 'Apple' },
  { id: 'fish', emoji: '🐟', label: 'Fish' },
  { id: 'car', emoji: '🚗', label: 'Car' },
  { id: 'ball', emoji: '⚽', label: 'Ball' },
  { id: 'flower', emoji: '🌸', label: 'Flower' },
  { id: 'sun', emoji: '☀️', label: 'Sun' },
  { id: 'moon', emoji: '🌙', label: 'Moon' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'banana', emoji: '🍌', label: 'Banana' },
];

export const ACCESS_PICTURE_IDS = ACCESS_PICTURES.map((p) => p.id);

/** Codes shorter than this are too easy to guess by accident. */
export const MIN_CODE_LENGTH = 3;
/** Longer codes get hard for young kids to remember and tap in order. */
export const MAX_CODE_LENGTH = 5;

const PICTURE_BY_ID = new Map(ACCESS_PICTURES.map((p) => [p.id, p]));

export function getPicture(id) {
  return PICTURE_BY_ID.get(id) ?? null;
}

/** True only if every id is a real picture and the length is in range. */
export function isValidCode(code) {
  return (
    Array.isArray(code) &&
    code.length >= MIN_CODE_LENGTH &&
    code.length <= MAX_CODE_LENGTH &&
    code.every((id) => PICTURE_BY_ID.has(id))
  );
}
