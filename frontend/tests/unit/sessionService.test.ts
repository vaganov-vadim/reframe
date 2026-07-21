import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/services/storageService', () => ({
  saveSession: vi.fn(),
  getSessions: vi.fn(() => []),
}));

import { startSession, completeSession } from '../../src/services/sessionService';
import { saveSession } from '../../src/services/storageService';
import type { Session } from '../../src/services/storageService';

const mockedSaveSession = vi.mocked(saveSession);

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startSession returns session with anxietyBefore', () => {
    const session = startSession(7);
    expect(session.anxietyBefore).toBe(7);
    expect(session.id).toBeDefined();
    expect(session.date).toBeDefined();
  });

  it('startSession generates different IDs for each call', () => {
    const a = startSession(5);
    const b = startSession(5);
    expect(a.id).not.toBe(b.id);
  });

  it('completeSession fills anxietyAfter, delta, distortion, reframing and saves', () => {
    const session = startSession(8);
    completeSession(session, 3, {
      distortions: [{ type: 'Катастрофизация', thought: '...', why: '...' }],
      reframing: 'Другой взгляд.',
      question: 'Что скажешь?',
    });

    expect(mockedSaveSession).toHaveBeenCalledTimes(1);
    const saved: Session = mockedSaveSession.mock.calls[0][0];
    expect(saved.anxietyBefore).toBe(8);
    expect(saved.anxietyAfter).toBe(3);
    expect(saved.delta).toBe(5);
    expect(saved.distortion).toBe('Катастрофизация');
    expect(saved.reframing).toBe('Другой взгляд.');
  });

  it('completeSession uses default distortion when none provided', () => {
    const session = startSession(5);
    completeSession(session, 2, {
      distortions: [],
      reframing: 'Спасибо.',
      question: 'Как?',
    });

    const saved: Session = mockedSaveSession.mock.calls[0][0];
    expect(saved.distortion).toBe('не определено');
  });
});
