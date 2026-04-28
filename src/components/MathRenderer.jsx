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
 * Render a string that may contain inline LaTeX ($...$) and display LaTeX ($$...$$).
 */
export function MathText({ text, className = '' }) {
  const html = useMemo(() => {
    if (!text) return '';
    let result = text;
    // display math $$...$$
    result = result.replace(/\$\$(.+?)\$\$/gs, (_, inner) =>
      renderLatex(inner.trim(), true)
    );
    // inline math $...$
    result = result.replace(/\$(.+?)\$/g, (_, inner) =>
      renderLatex(inner.trim(), false)
    );
    // replace newlines with <br>
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
