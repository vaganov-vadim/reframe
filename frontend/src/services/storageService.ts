import type { Session } from '../types/session';
import { STORAGE_KEYS } from '../types/session';

const STORAGE_KEY = STORAGE_KEYS.sessions;

export type { Session };

export function getSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  sessions.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const next = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function updateSession(id: string, patch: Partial<Session>): Session | null {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const updated = { ...sessions[idx], ...patch, id: sessions[idx].id };
  sessions[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return updated;
}

export function markActionDone(id: string, done = true): Session | null {
  return updateSession(id, { actionDone: done });
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Wipe all Reframe keys on this device (sessions, prefs, onboarding). */
export function clearAllDeviceData(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}
