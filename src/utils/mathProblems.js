/**
 * Math facts generator. Problems are always generated from parameters —
 * never typed in by hand — so the answer key can never be wrong.
 *
 * Settings shape (see TeacherContentStore.normalizeMath):
 *   ops: { add, sub, mul, div }   which operations may appear
 *   maxSum: 10 | 20 | 50 | 100    ceiling for addition/subtraction results
 *   maxFactor: 5 | 10 | 12        ceiling for multiplication/division factors
 *   focusTable: 2..12 | null      drill one times table (× and ÷ only)
 */

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeMathProblem(settings) {
  const ops = [];
  if (settings.ops.add) ops.push('add');
  if (settings.ops.sub) ops.push('sub');
  if (settings.ops.mul) ops.push('mul');
  if (settings.ops.div) ops.push('div');
  const op = ops[Math.floor(Math.random() * ops.length)] ?? 'add';

  const { maxSum, maxFactor, focusTable } = settings;

  if (op === 'add') {
    // Pick the sum first so results stay within the teacher's ceiling.
    const sum = rand(2, maxSum);
    const a = rand(0, sum);
    return { text: `${a} + ${sum - a}`, answer: sum };
  }

  if (op === 'sub') {
    // Never negative: subtract from within the ceiling.
    const a = rand(2, maxSum);
    const b = rand(0, a);
    return { text: `${a} − ${b}`, answer: a - b };
  }

  if (op === 'mul') {
    const a = focusTable ?? rand(0, maxFactor);
    const b = rand(0, maxFactor);
    const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
    return { text: `${x} × ${y}`, answer: x * y };
  }

  // div — built backwards from a multiplication so it always divides evenly.
  const divisor = focusTable ?? rand(1, maxFactor);
  const quotient = rand(1, maxFactor);
  return { text: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
}
