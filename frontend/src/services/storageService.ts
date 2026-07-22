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

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
