import katex from 'katex';
import { useMemo } from 'react';

function renderLatex(text, displayMode = false) {
  try {
    return katex.renderToString(text, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    });
  } catch {
    return text;
  }
}

/**
 * Pre-process AI-generated text to fix broken LaTeX formatting.
 * Handles newlines inside formulas, orphaned math, etc.
 */
function preprocessMathText(text) {
  if (!text) return '';
  let result = text;

  // Remove newlines that break inline math (AI sometimes puts $...\n...$)
  // Join lines that are part of the same formula
  result = result.replace(/\$([^$]+?)\n([^$]+?)\$/g, '$$1$2$');

  // Fix common orphaned patterns from AI: "f\n(\n3\n)" should be wrapped
  // Pattern: letter, newline, (, number, ), newline, same pattern
  result = result.replace(/(\w)\s*\n\s*\(\s*\n\s*(\d+)\s*\)\s*\n\s*\1\s*\(\s*\2\s*\)/g, '$$$1($2)$');

  // Fix: "f(x)=8x" on one line then "2" on next (exponent broken)
  result = result.replace(/(\d+)\s*\n\s*(\d+)/g, '$1$2');

  // Collapse multiple newlines to single space (prevents broken rendering)
  result = result.replace(/\n\s*\n/g, '\n');

  // Wrap standalone math expressions that aren't in $...$
  // Pattern: f(3) or x^2 or 2x+1 - but avoid if already inside $ or after \)
  // Only wrap if it looks like a math expression and isn't already wrapped
  const mathPattern = /(^|[^\\$\w])([a-zA-Z]+\([^)]+\)|\d+[xX]|\d+\^\d+|[a-zA-Z]\^\d+)([^$]|$)/g;
  result = result.replace(mathPattern, (match, before, math, after) => {
    // Don't wrap if it looks like a word or URL
    if (/^(http|www|pdf|doc|etc)$/i.test(math)) return match;
    return `${before}$${math}$${after}`;
  });

  return result;
}

/**
 * Render a string that may contain inline LaTeX ($...$) and display LaTeX ($$...$$).
 */
export function MathText({ text, className = '' }) {
  const html = useMemo(() => {
    if (!text) return '';

    // Pre-process to fix AI-generated broken LaTeX
    let result = preprocessMathText(text);

    // display math $$...$$
    result = result.replace(/\$\$(.+?)\$\$/gs, (_, inner) =>
      renderLatex(inner.trim(), true)
    );
    // inline math $...$ - use non-greedy match, but allow \$ escaped
    result = result.replace(/\$((?:[^$\\]|\\.)+?)\$/g, (_, inner) =>
      renderLatex(inner.trim().replace(/\\\$/g, '$'), false)
    );
    // Replace remaining newlines with <br>
    result = result.replace(/\n/g, '<br/>');
    return result;
  }, [text]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Render pure LaTeX string (no $ delimiters needed).
 */
export function MathDisplay({ latex, block = false, className = '' }) {
  const html = useMemo(() => renderLatex(latex || '', block), [latex, block]);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
