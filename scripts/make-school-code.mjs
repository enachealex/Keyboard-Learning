/**
 * Generate a school license code for Key Buddy School (web School mode).
 *
 *   node scripts/make-school-code.mjs "Lincoln Elementary"
 *
 * Send the printed code to the school after payment. Teachers enter it at
 * keybuddy.thejumpvault.com → School → Teacher. Codes validate offline;
 * keep a record of which code went to which school.
 */
import { makeSchoolCode, validateSchoolCode } from '../src/school/schoolCode.js';

const name = process.argv.slice(2).join(' ').trim();
if (!name) {
  console.error('Usage: node scripts/make-school-code.mjs "School Name"');
  process.exit(1);
}

const code = makeSchoolCode(name);
if (!validateSchoolCode(code)) {
  console.error('Internal error: generated code failed self-validation.');
  process.exit(1);
}
console.log(code);
