import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/services/storageService', () => ({
  saveSession: vi.fn(),
  getSessions: vi.fn(() => []),
}));

import { startSession, completeSession, seedFromSession } from '../../src/services/sessionService';
import { saveSession } from '../../src/services/storageService';
import type { Session } from '../../src/services/storageService';

const mockedSaveSession = vi.mocked(saveSession);

describe('seedFromSession', () => {
  it('prefers action over reframing', () => {
    expect(
      seedFromSession({
        action: '  Сделай один звонок.  ',
        reframing: 'Это не конец.',
      }),
    ).toBe('Сделай один звонок.');
  });

  it('falls back to reframing when action empty', () => {
    expect(
      seedFromSession({
        action: '   ',
        reframing: '  Другой взгляд.  ',
      }),
    ).toBe('Другой взгляд.');
  });

  it('returns null when neither usable', () => {
    expect(seedFromSession({ action: '', reframing: '  ' })).toBeNull();
    expect(seedFromSession({ reframing: '' })).toBeNull();
  });
});

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
      action: 'Запиши один факт без ярлыка.',
      verticalArrowLevels: [{ thought: 'Я плохой', label: 'Глубинное убеждение' }],
      verticalArrowReframing: 'Глубже.',
    });

    expect(mockedSaveSession).toHaveBeenCalledTimes(1);
    const saved: Session = mockedSaveSession.mock.calls[0][0];
    expect(saved.anxietyBefore).toBe(8);
    expect(saved.anxietyAfter).toBe(3);
    expect(saved.delta).toBe(5);
    expect(saved.distortion).toBe('Катастрофизация');
    expect(saved.reframing).toBe('Другой взгляд.');
    expect(saved.action).toBe('Запиши один факт без ярлыка.');
    expect(saved.distortions).toEqual([{ type: 'Катастрофизация', thought: '...', why: '...' }]);
    expect(saved.verticalArrowLevels).toEqual([{ thought: 'Я плохой', label: 'Глубинное убеждение' }]);
    expect(saved.verticalArrowReframing).toBe('Глубже.');
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
