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
 * Light pre-processing: only fix LaTeX inside $...$ delimiters.
 * Does NOT auto-wrap math expressions - that causes double rendering.
 */
function preprocessMathText(text) {
  if (!text) return '';
  let result = text;

  // Only fix newlines INSIDE $...$ delimiters
  result = result.replace(/\$([^$]+?)\$/g, (match, inner) => {
    // Remove newlines and excess whitespace inside formulas
    const cleaned = inner.replace(/\s+/g, ' ').trim();
    return `$${cleaned}$`;
  });

  // Fix double dollars
  result = result.replace(/\$\$+/g, '$');

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
