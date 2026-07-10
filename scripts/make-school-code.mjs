/**
 * Issue or decode personal teacher license codes for Key Buddy School.
 *
 * Issue (assign each teacher the next ID in your ledger):
 *   node scripts/make-school-code.mjs "Lincoln Elementary" 42
 *
 * Decode (identify whose code you're looking at):
 *   node scripts/make-school-code.mjs --decode KB-LNCL-XXXX-XXXX
 *
 * Email the code to the teacher with their receipt, and record
 * ID ↔ teacher name/email in your ledger — the code IS their identity
 * inside the app and in exported class files.
 */
import { makeSchoolCode, validateSchoolCode, decodeTeacherId, MAX_TEACHER_ID } from '../src/school/schoolCode.js';

const args = process.argv.slice(2);

if (args[0] === '--decode') {
  const code = args[1] ?? '';
  if (!validateSchoolCode(code)) {
    console.error('Invalid code.');
    process.exit(1);
  }
  console.log(`Teacher ID: ${decodeTeacherId(code)}`);
  process.exit(0);
}

const teacherId = Number(args.at(-1));
const name = args.slice(0, -1).join(' ').trim();
if (!name || !Number.isInteger(teacherId) || teacherId < 1 || teacherId > MAX_TEACHER_ID) {
  console.error('Usage: node scripts/make-school-code.mjs "School Name" <teacherId>');
  console.error(`       node scripts/make-school-code.mjs --decode KB-XXXX-XXXX-XXXX`);
  console.error(`Teacher ID must be 1..${MAX_TEACHER_ID}.`);
  process.exit(1);
}

const code = makeSchoolCode(name, teacherId);
if (!validateSchoolCode(code) || decodeTeacherId(code) !== teacherId) {
  console.error('Internal error: generated code failed self-validation.');
  process.exit(1);
}
console.log(code);
console.log(`(decodes to Teacher ID ${teacherId} — record this pairing in your ledger)`);
