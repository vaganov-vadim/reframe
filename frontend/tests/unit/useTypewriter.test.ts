import { describe, it, expect } from 'vitest';
import { typewriterStep } from '../../src/hooks/useTypewriter';

describe('typewriterStep', () => {
  it('keeps short text duration within a lively window', () => {
    const { totalMs, step } = typewriterStep(10);
    expect(totalMs).toBeGreaterThanOrEqual(350);
    expect(totalMs).toBeLessThanOrEqual(1100);
    expect(step).toBeGreaterThanOrEqual(1);
  });

  it('caps long text so reveal finishes under ~1.1s of ticks', () => {
    const { totalMs, step } = typewriterStep(500);
    expect(totalMs).toBe(1100);
    expect(step * Math.ceil(totalMs / 16)).toBeGreaterThanOrEqual(500);
  });
});
