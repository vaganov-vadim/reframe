import { useState, useEffect } from 'react';
import { getSessions, deleteSession, type Session } from '../services/storageService';
import { ReframingText } from './ResponseView';

export function HistoryTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleBack = () => {
    setConfirmDelete(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteSession(selected.id);
    setSessions(getSessions());
    setConfirmDelete(false);
    setSelected(null);
  };

  if (selected) {
    return (
      <div
        style={{
          paddingTop: 'var(--space-md)',
          paddingLeft: 'var(--space-md)',
          paddingRight: 'var(--space-md)',
          paddingBottom: 'var(--space-xl)',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: 'transparent',
            color: 'var(--accent)',
            border: 'none',
            fontSize: '14px',
            padding: 'var(--space-sm) 0',
            marginBottom: 'var(--space-lg)',
            cursor: 'pointer',
            minHeight: 48,
          }}
        >
          ← Назад к списку
        </button>

        <header style={{ marginBottom: 'var(--space-lg)' }}>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)',
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
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '-0.2px',
            }}
          >
            {selected.distortion}
          </div>
        </header>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-lg)',
          }}
        >
          {selected.action && (
            <section
              data-testid="history-action"
              style={{
                padding: 'var(--space-lg)',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--accent)',
                fontSize: '15px',
                lineHeight: '1.65',
                color: 'var(--text-primary)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Что сделать сегодня
              </div>
              {selected.action}
            </section>
          )}

          <section data-testid="history-reframing">
            <ReframingText
              text={selected.reframing}
              listenTestId="listen-history-reframing"
              flush
            />
          </section>

          {selected.verticalArrowLevels && selected.verticalArrowLevels.length > 0 && (
            <section style={{ paddingTop: 'var(--space-xs)' }}>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 'var(--space-md)',
                }}
              >
                Vertical Arrow
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-md)',
                }}
              >
                {selected.verticalArrowLevels.map(
                  (level: { thought: string; label: string }, i: number) => (
                    <div key={i}>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginBottom: 'var(--space-xs)',
                        }}
                      >
                        {level.label}
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          color: 'var(--text-primary)',
                          padding: 'var(--space-md)',
                          background: 'var(--bg-elevated)',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid var(--border)',
                          lineHeight: 1.5,
                        }}
                      >
                        {level.thought}
                      </div>
                      {i < (selected.verticalArrowLevels?.length ?? 0) - 1 && (
                        <div
                          style={{
                            color: 'var(--accent)',
                            textAlign: 'center',
                            fontSize: 18,
                            marginTop: 'var(--space-md)',
                            opacity: 0.7,
                          }}
                        >
                          ↓
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {selected.verticalArrowReframing && (
            <section data-testid="history-va-reframing">
              <ReframingText
                text={selected.verticalArrowReframing}
                listenTestId="listen-history-va-reframing"
                flush
              />
            </section>
          )}

          <section
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center',
              paddingTop: 'var(--space-md)',
              marginTop: 'var(--space-xs)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4 }}>
                До
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--error)',
                }}
              >
                {selected.anxietyBefore}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4 }}>
                После
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--success)',
                }}
              >
                {selected.anxietyAfter}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Дельта
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: selected.delta > 0 ? 'var(--success)' : 'var(--error)',
                }}
              >
                {selected.delta > 0
                  ? `−${selected.delta}`
                  : `+${Math.abs(selected.delta)}`}
              </div>
            </div>
          </section>

          <section style={{ paddingTop: 'var(--space-sm)' }}>
            {!confirmDelete ? (
              <button
                type="button"
                data-testid="history-delete"
                onClick={() => setConfirmDelete(true)}
                style={{
                  width: '100%',
                  minHeight: 48,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Удалить сессию
              </button>
            ) : (
              <div data-testid="history-delete-confirm">
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    margin: '0 0 var(--space-md)',
                    lineHeight: 1.5,
                  }}
                >
                  Удалить эту сессию с устройства? Отменить нельзя.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button
                    type="button"
                    data-testid="history-delete-confirm-yes"
                    onClick={handleDelete}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      background: 'transparent',
                      color: 'var(--error)',
                      border: '1px solid var(--error)',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Удалить
                  </button>
                  <button
                    type="button"
                    data-testid="history-delete-cancel"
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Оставить
                  </button>
                </div>
              </div>
            )}
          </section>
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
        <p style={{ fontSize: '18px', marginBottom: 'var(--space-sm)' }}>🌿</p>
        <p>Здесь появятся твои сессии.</p>
        <p style={{ fontSize: '14px', marginTop: 'var(--space-xs)', opacity: 0.7 }}>
          Каждый разговор — шаг к ясности.
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
            marginBottom: 'var(--space-md)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 64,
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
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--accent)',
                marginTop: 'var(--space-xs)',
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
