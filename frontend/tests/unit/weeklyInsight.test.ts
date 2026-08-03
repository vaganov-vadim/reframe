import { describe, it, expect } from 'vitest';
import { buildWeeklyInsight, sessionsInLast7Days } from '../../src/services/weeklyInsight';
import type { Session } from '../../src/types/session';

function session(partial: Partial<Session> & { date: string }): Session {
  return {
    id: partial.id ?? '1',
    date: partial.date,
    distortion: partial.distortion ?? 'Чтение мыслей',
    anxietyBefore: partial.anxietyBefore ?? 7,
    anxietyAfter: partial.anxietyAfter ?? 4,
    delta: partial.delta ?? 3,
    reframing: partial.reframing ?? 'ok',
    action: partial.action,
    actionDone: partial.actionDone,
  };
}

describe('weeklyInsight', () => {
  const now = new Date('2026-07-31T12:00:00');

  it('filters last 7 days inclusive', () => {
    const sessions = [
      session({ date: '2026-07-31T10:00:00', id: 'a' }),
      session({ date: '2026-07-25T10:00:00', id: 'b' }),
      session({ date: '2026-07-24T10:00:00', id: 'c' }),
    ];
    const week = sessionsInLast7Days(sessions, now);
    expect(week.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('builds template summary without LLM', () => {
    const insight = buildWeeklyInsight(
      [
        session({ date: '2026-07-30', distortion: 'Катастрофизация', delta: 2 }),
        session({ date: '2026-07-29', distortion: 'Катастрофизация', delta: 4 }),
      ],
      now,
    );
    expect(insight).not.toBeNull();
    expect(insight!.sessionCount).toBe(2);
    expect(insight!.summary).toContain('За 7 дней');
    expect(insight!.summary).toContain('Катастрофизация');
  });

  it('adds steps line when actions exist', () => {
    const insight = buildWeeklyInsight(
      [
        session({
          date: '2026-07-30',
          id: 'a',
          action: 'Спроси коллегу',
          actionDone: true,
        }),
        session({
          date: '2026-07-29',
          id: 'b',
          action: 'Запиши факт',
          actionDone: false,
        }),
        session({ date: '2026-07-28', id: 'c' }),
      ],
      now,
    );
    expect(insight!.actionsTotal).toBe(2);
    expect(insight!.actionsDone).toBe(1);
    expect(insight!.summary).toContain('Шаги: 1 из 2 сделаны');
  });

  it('returns null when no sessions in window', () => {
    expect(buildWeeklyInsight([session({ date: '2026-01-01' })], now)).toBeNull();
  });
});
