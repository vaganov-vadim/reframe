import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { getSessions } from '../services/storageService';

interface ChartPoint {
  date: string;
  'До': number | null;
  'После': number | null;
  delta: number | null;
}

export function AnxietyChart() {
  const sessions = getSessions();

  // Build last 7 days map using ISO date keys (reliable grouping)
  const dayMap: Record<string, { before: number[]; after: number[] }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = { before: [], after: [] };
  }

  // Group sessions by day using ISO date key
  sessions.forEach((s) => {
    const dayKey = new Date(s.date).toISOString().split('T')[0];
    if (dayMap[dayKey]) {
      dayMap[dayKey].before.push(s.anxietyBefore);
      dayMap[dayKey].after.push(s.anxietyAfter);
    }
  });

  // Build chart data with averages
  const data: ChartPoint[] = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, vals]) => {
      const avgBefore = vals.before.length
        ? vals.before.reduce((a, b) => a + b, 0) / vals.before.length
        : null;
      const avgAfter = vals.after.length
        ? vals.after.reduce((a, b) => a + b, 0) / vals.after.length
        : null;
      return {
        date: new Date(dateKey).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        'До': avgBefore ? Math.round(avgBefore * 10) / 10 : null,
        'После': avgAfter ? Math.round(avgAfter * 10) / 10 : null,
        delta: avgBefore && avgAfter ? Math.round((avgBefore - avgAfter) * 10) / 10 : null,
      };
    });

  const isEmpty = data.every((d) => d['До'] === null);

  // Calculate trend from valid before values
  const validBefore = data.filter((d) => d['До'] !== null).map((d) => d['До'] as number);
  const trend =
    validBefore.length >= 2
      ? validBefore[validBefore.length - 1] - validBefore[0]
      : null;

  if (isEmpty) {
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

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h3
        style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-md)',
          fontWeight: 500,
        }}
      >
        Последние 7 дней
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              padding: '8px 12px',
            }}
            formatter={(value: number, name: string) => [
              <span style={{ color: name === 'До' ? 'var(--error)' : 'var(--success)' }}>
                {value}
              </span>,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="До"
            stroke="var(--error)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--error)', strokeWidth: 0 }}
            connectNulls
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="После"
            stroke="var(--success)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--success)', strokeWidth: 0 }}
            connectNulls
            activeDot={{ r: 6 }}
          />
          {trend !== null && (
            <ReferenceLine
              y={validBefore[0]}
              stroke="var(--text-secondary)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {trend !== null && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-md)',
            fontSize: '13px',
            color: trend > 0 ? 'var(--success)' : 'var(--error)',
          }}
        >
          {trend > 0
            ? `Тревога снижается`
            : trend < 0
              ? `Тревога растёт`
              : `Без изменений`}
        </div>
      )}
    </div>
  );
}
