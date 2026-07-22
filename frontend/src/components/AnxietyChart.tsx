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

interface ChartPoint {
  time: string;
  'До': number | null;
  'После': number | null;
}

export function AnxietyChart() {
  // Get last 15 sessions, ordered chronologically (oldest first)
  const sessions = getSessions()
    .slice(0, 15) // latest sessions first (storage order), take last 15
    .reverse();   // chronological order for chart

  // Build chart data — each session is one point
  const data: ChartPoint[] = sessions.map((s) => ({
    time:
      new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) +
      ' ' +
      new Date(s.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    'До': s.anxietyBefore,
    'После': s.anxietyAfter,
  }));

  const isEmpty = data.length === 0;

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
        Последние сессии
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            interval={data.length > 7 ? Math.floor(data.length / 7) : 0}
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
            formatter={(value, name) => [
              <span style={{ color: name === 'До' ? 'var(--error)' : 'var(--success)' }}>
                {String(value)}
              </span>,
              String(name),
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
