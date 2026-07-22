import { useState, useEffect } from 'react';
import { getSessions, type Session } from '../services/storageService';

export function HistoryTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  if (selected) {
    return (
      <div style={{ padding: 'var(--space-md)' }}>
        <button
          onClick={() => setSelected(null)}
          style={{
            background: 'transparent',
            color: 'var(--accent)',
            border: 'none',
            fontSize: '14px',
            padding: 'var(--space-sm) 0',
            marginBottom: 'var(--space-md)',
            cursor: 'pointer',
          }}
        >
          ← Назад к списку
        </button>
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--space-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-md)',
            }}
          >
            {new Date(selected.date).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--accent)',
              }}
            >
              {selected.distortion}
            </span>
          </div>
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-md)',
              fontSize: '15px',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent)',
              borderLeftWidth: '3px',
            }}
          >
            {selected.reframing}
          </div>
          {selected.verticalArrowLevels && selected.verticalArrowLevels.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-sm)' }}>
                Vertical Arrow
              </div>
              {selected.verticalArrowLevels.map((level: { thought: string; label: string }, i: number) => (
                <div key={i} style={{ marginBottom: 'var(--space-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    {level.label}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', padding: 'var(--space-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)' }}>
                    {level.thought}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected.verticalArrowReframing && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--space-md)',
                marginTop: 'var(--space-md)',
                fontSize: '15px',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                border: '1px solid var(--accent)',
                borderLeftWidth: '3px',
              }}
            >
              {selected.verticalArrowReframing}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center',
              marginTop: 'var(--space-md)',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                До
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--error)',
                }}
              >
                {selected.anxietyBefore}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                После
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--success)',
                }}
              >
                {selected.anxietyAfter}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Дельта
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color:
                    selected.delta > 0 ? 'var(--success)' : 'var(--error)',
                }}
              >
                {selected.delta > 0
                  ? `−${selected.delta}`
                  : `+${Math.abs(selected.delta)}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-xl) var(--space-md)',
          color: 'var(--text-secondary)',
        }}
      >
        <p style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>📋</p>
        <p>Здесь появятся твои сессии.</p>
        <p style={{ fontSize: '14px', marginTop: 'var(--space-xs)' }}>
          Начни с первой — это легко.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h3
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-md)',
        }}
      >
        {sessions.length}{' '}
        {sessions.length === 1
          ? 'сессия'
          : sessions.length < 5
            ? 'сессии'
            : 'сессий'}
      </h3>
      {sessions.map((s) => (
        <div
          key={s.id}
          onClick={() => setSelected(s)}
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-sm)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              {new Date(s.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--accent)',
                marginTop: '2px',
              }}
            >
              {s.distortion}
            </div>
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: s.delta > 0 ? 'var(--success)' : 'var(--error)',
            }}
          >
            {s.delta > 0 ? `−${s.delta}` : `+${Math.abs(s.delta)}`}
          </div>
        </div>
      ))}
    </div>
  );
}
