import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getSessions } from '../services/storageService';

export function AnxietyChart() {
  const sessions = getSessions();

  const last7Days: Record<string, { before: number[]; after: number[] }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days[d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })] = {
      before: [],
      after: [],
    };
  }

  sessions.forEach((s) => {
    const key = new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    if (last7Days[key]) {
      last7Days[key].before.push(s.anxietyBefore);
      last7Days[key].after.push(s.anxietyAfter);
    }
  });

  const data = Object.entries(last7Days).map(([date, v]) => ({
    date,
    'До': v.before.length
      ? v.before.reduce((a, b) => a + b, 0) / v.before.length
      : null,
    'После': v.after.length
      ? v.after.reduce((a, b) => a + b, 0) / v.after.length
      : null,
  }));

  const empty = data.every((d) => d['До'] === null);

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
        Последние 7 дней
      </h3>
      {!empty && (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border)',
                fontSize: '13px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '13px' }} />
            <Line
              type="monotone"
              dataKey="До"
              stroke="var(--error)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="После"
              stroke="var(--success)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      {empty && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-lg)',
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}
        >
          Твой прогресс появится здесь после первых сессий.
        </div>
      )}
    </div>
  );
}
