import type { Session } from '../types/session';

export interface WeeklyInsight {
  sessionCount: number;
  avgDelta: number;
  topDistortions: string[];
  /** Human template — no LLM */
  summary: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Sessions with date within the last 7 calendar days (including today). */
export function sessionsInLast7Days(sessions: Session[], now = new Date()): Session[] {
  const end = startOfDay(now);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return sessions.filter((s) => {
    const day = startOfDay(new Date(s.date));
    return !Number.isNaN(day.getTime()) && day >= start && day <= end;
  });
}

export function buildWeeklyInsight(sessions: Session[], now = new Date()): WeeklyInsight | null {
  const week = sessionsInLast7Days(sessions, now);
  if (week.length === 0) return null;

  const avgDelta = week.reduce((sum, s) => sum + s.delta, 0) / week.length;
  const counts: Record<string, number> = {};
  for (const s of week) {
    if (s.distortion) counts[s.distortion] = (counts[s.distortion] ?? 0) + 1;
  }
  const topDistortions = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);

  const n = week.length;
  const deltaPart =
    avgDelta > 0.5
      ? 'в среднем после сессии становилось чуть спокойнее'
      : avgDelta < -0.5
        ? 'тревога после сессий часто оставалась высокой — это ок замечать'
        : 'уровень тревоги менялся по-разному';

  const distortionPart =
    topDistortions.length > 0
      ? ` Чаще всплывало: ${topDistortions.join(', ')}.`
      : '';

  const summary = `За 7 дней — ${n} ${sessionWord(n)}. ${capitalize(deltaPart)}.${distortionPart}`;

  return { sessionCount: n, avgDelta, topDistortions, summary };
}

function sessionWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'сессия';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'сессии';
  return 'сессий';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
