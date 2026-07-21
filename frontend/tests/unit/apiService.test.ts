import { describe, it, expect } from 'vitest';

// Test SSE JSON parsing — export from useSSE for real use
function parseSSEData(line: string): unknown {
  if (!line.startsWith('data: ')) return null;
  const json = line.slice(6);
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

describe('apiService', () => {
  it('parses valid SSE data line', () => {
    const result = parseSSEData('data: {"distortions":[],"reframing":"test","question":"q"}');
    expect(result).toEqual({ distortions: [], reframing: 'test', question: 'q' });
  });

  it('parses error SSE line', () => {
    const result = parseSSEData('data: {"error":"timeout"}');
    expect(result).toEqual({ error: 'timeout' });
  });

  it('returns null for non-data lines', () => {
    expect(parseSSEData('event: ping')).toBeNull();
    expect(parseSSEData('')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseSSEData('data: {invalid')).toBeNull();
  });

  it('parses full response structure', () => {
    const result = parseSSEData(
      'data: {"distortions":[{"type":"Чтение мыслей","thought":"я неудачник","why":"тест"}],"reframing":"reframe","question":"?"}',
    );
    expect(result).toEqual({
      distortions: [{ type: 'Чтение мыслей', thought: 'я неудачник', why: 'тест' }],
      reframing: 'reframe',
      question: '?',
    });
  });
});
