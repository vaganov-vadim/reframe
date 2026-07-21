import { describe, it, expect } from 'vitest';

// Test sanitization — export from useSpeechRecognition for real use
function sanitizeText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 3000) return trimmed.slice(0, 3000);
  return trimmed;
}

describe('speechService', () => {
  it('sanitize: returns null for empty string', () => {
    expect(sanitizeText('')).toBeNull();
    expect(sanitizeText('   ')).toBeNull();
  });

  it('sanitize: trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('sanitize: truncates at 3000 chars', () => {
    const long = 'a'.repeat(5000);
    expect(sanitizeText(long)?.length).toBe(3000);
  });

  it('sanitize: null for only whitespace', () => {
    expect(sanitizeText('\n\t  \n')).toBeNull();
  });

  it('sanitize: keeps short text under limit', () => {
    expect(sanitizeText('short text')).toBe('short text');
  });
});
