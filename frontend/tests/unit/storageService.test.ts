import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
});

import { getSessions, saveSession, clearSessions, deleteSession, markActionDone } from '../../src/services/storageService';

const mockSession = {
  id: '123',
  date: '2026-01-01T00:00:00Z',
  distortion: 'Катастрофизация',
  anxietyBefore: 8,
  anxietyAfter: 4,
  delta: 4,
  reframing: 'Факты vs интерпретации.',
};

describe('storageService', () => {
  it('getSessions returns empty array when no data', () => {
    expect(getSessions()).toEqual([]);
  });

  it('saveSession persists and getSessions returns it', () => {
    saveSession(mockSession);
    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('123');
  });

  it('saveSession prepends new sessions', () => {
    saveSession(mockSession);
    saveSession({ ...mockSession, id: '456' });
    const sessions = getSessions();
    expect(sessions[0].id).toBe('456');
    expect(sessions[1].id).toBe('123');
  });

  it('clearSessions removes all data', () => {
    saveSession(mockSession);
    clearSessions();
    expect(getSessions()).toEqual([]);
  });

  it('deleteSession removes only the matching id', () => {
    saveSession(mockSession);
    saveSession({ ...mockSession, id: '456' });
    deleteSession('123');
    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('456');
  });

  it('deleteSession is a no-op for unknown id', () => {
    saveSession(mockSession);
    deleteSession('missing');
    expect(getSessions()).toHaveLength(1);
  });

  it('markActionDone sets actionDone on the session', () => {
    saveSession({ ...mockSession, action: 'Спроси коллегу' });
    const updated = markActionDone('123', true);
    expect(updated?.actionDone).toBe(true);
    expect(getSessions()[0].actionDone).toBe(true);
  });

  it('getSessions handles corrupt JSON gracefully', () => {
    store['reframe_sessions'] = '{invalid';
    expect(getSessions()).toEqual([]);
  });
});