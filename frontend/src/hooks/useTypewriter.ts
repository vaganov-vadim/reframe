import { useEffect, useState } from 'react';

export function typewriterStep(textLength: number): { totalMs: number; step: number } {
  const totalMs = Math.min(1100, Math.max(350, textLength * 16));
  const ticks = Math.max(1, Math.ceil(totalMs / 16));
  const step = Math.max(1, Math.ceil(textLength / ticks));
  return { totalMs, step };
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Client-side reveal of a full string (not token SSE).
 * Caps duration so short takeaways feel alive without slowing E2E.
 */
export function useTypewriter(text: string | null, enabled = true): string {
  const [shown, setShown] = useState(() => (enabled ? '' : text ?? ''));

  useEffect(() => {
    if (!text) {
      setShown('');
      return;
    }
    if (!enabled || prefersReducedMotion()) {
      setShown(text);
      return;
    }

    setShown('');
    const { step } = typewriterStep(text.length);
    let i = 0;
    const id = window.setInterval(() => {
      i = Math.min(text.length, i + step);
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 16);

    return () => window.clearInterval(id);
  }, [text, enabled]);

  return shown;
}
