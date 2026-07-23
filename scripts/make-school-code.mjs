/**
 * Issue or decode personal teacher license codes for Key Buddy School.
 *
 * Issue (assign each teacher the next ID in your ledger; the school type
 * is REQUIRED — it sets the grade tiers and music the app uses):
 *   node scripts/make-school-code.mjs "Lincoln Elementary" 42 elementary
 *   node scripts/make-school-code.mjs "Jefferson Middle" 43 middle
 *   node scripts/make-school-code.mjs "Roosevelt High" 44 high
 *   node scripts/make-school-code.mjs "Home" 45 all        (family codes)
 *
 * Decode (identify whose code you're looking at):
 *   node scripts/make-school-code.mjs --decode KB-LNCL-XXXX-XXXX
 *
 * Email the code to the teacher with their receipt, and record
 * ID ↔ teacher name/email ↔ school type in your ledger.
 */
import {
  makeSchoolCode,
  validateSchoolCode,
  decodeTeacherId,
  decodeSchoolType,
  SCHOOL_TYPES,
  MAX_TEACHER_ID,
} from '../src/school/schoolCode.js';

const args = process.argv.slice(2);

if (args[0] === '--decode') {
  const code = args[1] ?? '';
  if (!validateSchoolCode(code)) {
    console.error('Invalid code.');
    process.exit(1);
  }
  console.log(`Teacher ID: ${decodeTeacherId(code)} · School type: ${decodeSchoolType(code)}`);
  process.exit(0);
}

const schoolType = args.at(-1);
const teacherId = Number(args.at(-2));
const name = args.slice(0, -2).join(' ').trim();
if (!name || !Number.isInteger(teacherId) || teacherId < 1 || teacherId > MAX_TEACHER_ID
    || !SCHOOL_TYPES.includes(schoolType)) {
  console.error('Usage: node scripts/make-school-code.mjs "School Name" <teacherId> <elementary|middle|high|all>');
  console.error('       node scripts/make-school-code.mjs --decode KB-XXXX-XXXX-XXXX');
  console.error(`Teacher ID must be 1..${MAX_TEACHER_ID}. Use "all" for family/Home codes.`);
  process.exit(1);
}

const code = makeSchoolCode(name, teacherId, schoolType);
if (!validateSchoolCode(code) || decodeTeacherId(code) !== teacherId || decodeSchoolType(code) !== schoolType) {
  console.error('Internal error: generated code failed self-validation.');
  process.exit(1);
}
console.log(code);
console.log(`(Teacher ID ${teacherId} · ${schoolType} — record this pairing in your ledger)`);
