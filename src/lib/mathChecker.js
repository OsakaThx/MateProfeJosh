/**
 * mathChecker.js
 * Uses nerdamer for symbolic math verification.
 * Falls back to numeric sampling when symbolic comparison is not possible.
 */
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import 'nerdamer/Calculus';
import 'nerdamer/Solve';

/**
 * Normalise a math expression string before parsing:
 * - replace implicit multiplication like 2x → 2*x
 * - allow ^ for power
 */
function normalise(expr) {
  if (!expr) return '';
  return expr
    .trim()
    .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
    .replace(/([a-zA-Z)])(\d)/g, '$1*$2')
    .replace(/([a-zA-Z])\(/g, '$1*(')
    .replace(/\^/g, '^');
}

/**
 * Numeric sampling check: evaluate both expressions at several x values
 * and verify they produce the same results.
 */
function numericCheck(exprA, exprB, variable = 'x') {
  const samples = [-3, -1, 0.5, 1, 2, 7, Math.PI];
  try {
    let matches = 0;
    for (const val of samples) {
      const a = nerdamer(exprA).evaluate({ [variable]: val }).text();
      const b = nerdamer(exprB).evaluate({ [variable]: val }).text();
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB) && Math.abs(numA - numB) < 1e-6) {
        matches++;
      }
    }
    return matches >= 5;
  } catch {
    return false;
  }
}

/**
 * Try symbolic subtraction: if (A - B) simplifies to 0, they are equal.
 */
function symbolicCheck(exprA, exprB) {
  try {
    const diff = nerdamer(`(${exprA}) - (${exprB})`).expand().text();
    return diff === '0';
  } catch {
    return false;
  }
}

/**
 * Main comparison function.
 * Returns { correct: boolean, method: string }
 */
export function checkAnswer(userAnswer, correctAnswer) {
  try {
    const ua = normalise(userAnswer);
    const ca = normalise(correctAnswer);
    if (!ua || !ca) return { correct: false, method: 'empty' };

    if (symbolicCheck(ua, ca)) return { correct: true, method: 'symbolic' };
    if (numericCheck(ua, ca)) return { correct: true, method: 'numeric' };

    return { correct: false, method: 'no-match' };
  } catch {
    return { correct: false, method: 'error' };
  }
}

/**
 * Check a multiple-choice answer (simple string equality, case-insensitive).
 */
export function checkMultipleChoice(userChoice, correctChoice) {
  return userChoice.trim().toLowerCase() === correctChoice.trim().toLowerCase();
}

/**
 * Evaluate a function f at a given x value numerically.
 */
export function evaluateAt(expr, x) {
  try {
    const result = nerdamer(normalise(expr)).evaluate({ x }).text();
    return parseFloat(result);
  } catch {
    return null;
  }
}
