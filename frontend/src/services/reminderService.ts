import { STORAGE_KEYS } from '../types/session';

export interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Local calendar date YYYY-MM-DD of last notification */
  lastNotifiedDate: string | null;
}

const KEY = STORAGE_KEYS.reminder;

export const DEFAULT_REMINDER: ReminderPrefs = {
  enabled: false,
  hour: 20,
  minute: 0,
  lastNotifiedDate: null,
};

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_REMINDER };
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: !!parsed.enabled,
      hour: clampHour(parsed.hour ?? DEFAULT_REMINDER.hour),
      minute: clampMinute(parsed.minute ?? DEFAULT_REMINDER.minute),
      lastNotifiedDate:
        typeof parsed.lastNotifiedDate === 'string' ? parsed.lastNotifiedDate : null,
    };
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

export function setReminderPrefs(prefs: ReminderPrefs): void {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      enabled: prefs.enabled,
      hour: clampHour(prefs.hour),
      minute: clampMinute(prefs.minute),
      lastNotifiedDate: prefs.lastNotifiedDate,
    }),
  );
}

export function isReminderDue(prefs: ReminderPrefs, now = new Date()): boolean {
  if (!prefs.enabled) return false;
  if (prefs.lastNotifiedDate === localDateKey(now)) return false;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const target = prefs.hour * 60 + prefs.minute;
  return minutesNow >= target;
}

/**
 * Fire a local Notification if due. No session content.
 * Returns true if a notification was shown.
 */
export function maybeNotifyReminder(now = new Date()): boolean {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;
  const prefs = getReminderPrefs();
  if (!isReminderDue(prefs, now)) return false;

  new Notification('Reframe', {
    body: 'Есть пара минут на себя?',
    tag: 'reframe-daily',
  });
  setReminderPrefs({ ...prefs, lastNotifiedDate: localDateKey(now) });
  return true;
}

export async function requestReminderPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 20;
  return Math.min(23, Math.max(0, Math.round(h)));
}

function clampMinute(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return Math.min(59, Math.max(0, Math.round(m)));
}
