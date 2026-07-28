import { useState, useEffect, useCallback } from 'react';

interface HealthData {
  status: string;
  llm: string;
  uptime: string;
  requests: number;
  errors: number;
  memory: string;
}

interface StatusCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'good' | 'warn' | 'error';
  subtitle?: string;
}

function StatusCard({ label, value, variant = 'default', subtitle }: StatusCardProps) {
  const variantColors: Record<string, { bg: string; border: string; text: string }> = {
    good: { bg: 'rgba(126, 184, 160, 0.12)', border: 'var(--success)', text: 'var(--success)' },
    warn: { bg: 'rgba(232, 168, 80, 0.12)', border: 'var(--accent)', text: 'var(--accent)' },
    error: { bg: 'rgba(212, 120, 110, 0.12)', border: 'var(--error)', text: 'var(--error)' },
    default: { bg: 'var(--bg-elevated)', border: 'var(--border)', text: 'var(--text-primary)' },
  };

  const colors = variantColors[variant] ?? variantColors.default;

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: colors.text,
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {subtitle && (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

export function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as HealthData;
      setHealth(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch health status');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  const backendOk = health?.status === 'ok';
  const llmOk = health?.llm === 'connected';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        padding: 'var(--space-md) 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Статус системы
        </h2>
        <button
          onClick={() => void fetchHealth()}
          disabled={loading}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--text-secondary)',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            minHeight: '40px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
          }}
        >
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(212, 120, 110, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--border-radius-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            color: 'var(--error)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 'var(--space-sm)',
        }}
      >
        <StatusCard
          label="Бэкенд"
          value={health?.status ?? (loading ? '...' : '—')}
          variant={health ? (backendOk ? 'good' : 'error') : 'warn'}
        />
        <StatusCard
          label="LLM"
          value={health?.llm ?? (loading ? '...' : '—')}
          variant={health ? (llmOk ? 'good' : 'error') : 'warn'}
        />
        <StatusCard
          label="Uptime"
          value={health?.uptime ?? (loading ? '...' : '—')}
        />
        <StatusCard
          label="RAM"
          value={health?.memory ?? (loading ? '...' : '—')}
        />
        <StatusCard
          label="Запросы"
          value={health?.requests ?? (loading ? '...' : '—')}
          subtitle="с момента запуска"
        />
        <StatusCard
          label="Ошибки"
          value={health?.errors ?? (loading ? '...' : '—')}
          variant={health && health.errors > 0 ? 'warn' : 'default'}
          subtitle="с момента запуска"
        />
      </div>

      {health && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            paddingTop: 'var(--space-xs)',
          }}
        >
          Данные с /api/health · JSON · обновляются вручную
        </div>
      )}
    </div>
  );
}
