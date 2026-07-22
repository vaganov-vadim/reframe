import { getSessions, type Session } from '../services/storageService';

interface Summary {
  total: number;
  avgDelta: number;
  trend: 'down' | 'up' | 'flat';
  topDistortions: { type: string; count: number }[];
}

function computeSummary(sessions: Session[]): Summary | null {
  if (sessions.length === 0) return null;

  const total = sessions.length;
  const avgDelta = sessions.reduce((sum, s) => sum + s.delta, 0) / total;

  // Trend: compare first and last session (oldest first)
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const firstDelta = sorted[0].delta;
  const lastDelta = sorted[sorted.length - 1].delta;
  const trend =
    lastDelta > firstDelta
      ? ('up' as const)
      : lastDelta < firstDelta
        ? ('down' as const)
        : ('flat' as const);

  // Top distortions by frequency
  const distortionCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    distortionCounts[s.distortion] = (distortionCounts[s.distortion] ?? 0) + 1;
  });
  const topDistortions = Object.entries(distortionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return { total, avgDelta, trend, topDistortions };
}

export function ProgressTab() {
  const sessions = getSessions();
  const summary = computeSummary(sessions);

  if (!summary) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-xl) var(--space-md)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}
      >
        Твой прогресс появится здесь после первых сессий.
      </div>
    );
  }

  const trendEmoji = summary.trend === 'down' ? '📉' : summary.trend === 'up' ? '📈' : '➡️';
  const trendText =
    summary.trend === 'down'
      ? 'Тревога снижается'
      : summary.trend === 'up'
        ? 'Тревога растёт'
        : 'Без изменений';
  const trendColor =
    summary.trend === 'down'
      ? 'var(--success)'
      : summary.trend === 'up'
        ? 'var(--error)'
        : 'var(--text-secondary)';

  const maxCount = Math.max(...summary.topDistortions.map((d) => d.count));

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h3
        style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-md)',
        }}
      >
        Твой прогресс
      </h3>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            padding: 'var(--space-md)',
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            Сессий
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {summary.total}
          </div>
        </div>
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            padding: 'var(--space-md)',
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            Средняя дельта
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: summary.avgDelta > 0 ? 'var(--success)' : 'var(--error)',
            }}
          >
            {summary.avgDelta > 0 ? '−' : '+'}
            {Math.abs(Math.round(summary.avgDelta))}
          </div>
        </div>
      </div>

      {/* Trend */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--border-radius-sm)',
          padding: 'var(--space-md)',
          textAlign: 'center',
          marginBottom: 'var(--space-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '4px' }}>{trendEmoji}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: trendColor }}>
          {trendText}
        </div>
      </div>

      {/* Distortion tag cloud */}
      <div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Частые искажения
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            justifyContent: 'center',
          }}
        >
          {summary.topDistortions.map((d) => {
            const size = 12 + (d.count / maxCount) * 10; // 12-22px
            const opacity = 0.5 + (d.count / maxCount) * 0.5; // 0.5-1.0
            return (
              <span
                key={d.type}
                style={{
                  fontSize: `${size}px`,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  opacity,
                  padding: 'var(--space-xs) var(--space-sm)',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                {d.type}
                <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>
                  ×{d.count}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
