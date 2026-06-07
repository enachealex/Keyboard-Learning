export function createMathProblem() {
  const useAddition = Math.random() < 0.6;
  if (useAddition) {
    const a = rand(8, 25);
    const b = rand(3, 15);
    return { question: `${a} + ${b}`, answer: a + b };
  }
  const a = rand(15, 35);
  const b = rand(3, Math.min(14, a - 1));
  return { question: `${a} − ${b}`, answer: a - b };
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
