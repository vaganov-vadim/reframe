const STORAGE_KEY = 'reframe_sessions';

export interface Session {
  id: string;
  date: string;
  distortion: string;
  anxietyBefore: number;
  anxietyAfter: number;
  delta: number;
  reframing: string;
}

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
