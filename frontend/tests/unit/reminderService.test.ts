import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getReminderPrefs,
  setReminderPrefs,
  isReminderDue,
  maybeNotifyReminder,
  localDateKey,
  DEFAULT_REMINDER,
} from '../../src/services/reminderService';

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.unstubAllGlobals();
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
});

describe('reminderService', () => {
  it('defaults to disabled 20:00', () => {
    expect(getReminderPrefs()).toEqual(DEFAULT_REMINDER);
  });

  it('persists prefs', () => {
    setReminderPrefs({ enabled: true, hour: 9, minute: 30, lastNotifiedDate: null });
    expect(getReminderPrefs()).toMatchObject({ enabled: true, hour: 9, minute: 30 });
  });

  it('is due after preferred time and not yet notified today', () => {
    const prefs = { enabled: true, hour: 20, minute: 0, lastNotifiedDate: null };
    expect(isReminderDue(prefs, new Date('2026-08-03T20:01:00'))).toBe(true);
    expect(isReminderDue(prefs, new Date('2026-08-03T19:59:00'))).toBe(false);
  });

  it('is not due if already notified today', () => {
    const now = new Date('2026-08-03T21:00:00');
    const prefs = {
      enabled: true,
      hour: 20,
      minute: 0,
      lastNotifiedDate: localDateKey(now),
    };
    expect(isReminderDue(prefs, now)).toBe(false);
  });

  it('maybeNotifyReminder shows Notification and marks date', () => {
    const notify = vi.fn();
    vi.stubGlobal('Notification', Object.assign(notify, { permission: 'granted' }));
    setReminderPrefs({ enabled: true, hour: 8, minute: 0, lastNotifiedDate: null });
    const now = new Date('2026-08-03T09:00:00');
    expect(maybeNotifyReminder(now)).toBe(true);
    expect(notify).toHaveBeenCalledOnce();
    expect(getReminderPrefs().lastNotifiedDate).toBe(localDateKey(now));
    expect(maybeNotifyReminder(now)).toBe(false);
  });
});
