import { useState } from 'react';
import type { AgentEvent, BurnsAgentPayload, TextAgentPayload } from '../../types/session';

function isBurnsPayload(payload: AgentEvent['payload']): payload is BurnsAgentPayload {
  return !!payload && ('reframing' in payload || 'distortions' in payload);
}

function isTextPayload(payload: AgentEvent['payload']): payload is TextAgentPayload {
  return !!payload && 'text' in payload && typeof (payload as TextAgentPayload).text === 'string';
}

const AGENT_ROLES: Record<string, string> = {
  burns: 'искажения и перефраз',
  stoic: 'что в контроле / что отпустить',
};

interface AgentCardProps {
  event: AgentEvent;
}

export function AgentCard({ event }: AgentCardProps) {
  const { name, status, payload, error } = event;
  const role = AGENT_ROLES[event.agent];
  const [detailsOpen, setDetailsOpen] = useState(false);

  const burns = status === 'ok' && isBurnsPayload(payload) ? payload : null;
  const hasDetails =
    !!burns &&
    ((burns.distortions && burns.distortions.length > 0) || !!burns.question);

  return (
    <article
      data-testid={`agent-card-${event.agent}`}
      className={status === 'ok' ? 'studio-lens-enter' : 'studio-lens'}
      style={{
        background: 'transparent',
        border: 'none',
        borderTop: '1px solid var(--border)',
        borderRadius: 0,
        padding: 'var(--space-md) 0',
        minHeight: 88,
      }}
    >
      <header style={{ marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', alignItems: 'baseline' }}>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              color: 'var(--text-primary)',
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            {name}
          </h3>
          {status === 'error' && (
            <span data-testid="agent-error" style={{ color: 'var(--error)', fontSize: 13 }}>Не вышло</span>
          )}
        </div>
        {role && (
          <p data-testid="agent-role" style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            {role}
          </p>
        )}
      </header>

      {status === 'loading' && (
        <div data-testid="agent-loading" aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="studio-skeleton" style={{ height: 14, width: '88%' }} />
          <div className="studio-skeleton" style={{ height: 14, width: '62%' }} />
          <div className="studio-skeleton" style={{ height: 14, width: '74%' }} />
        </div>
      )}

      {status === 'error' && (
        <p style={{ color: 'var(--error)', margin: 0, fontSize: 15 }}>{error || 'Не получилось получить ответ.'}</p>
      )}

      {burns && (
        <div data-testid="agent-burns-payload">
          {burns.reframing && (
            <p
              data-testid="agent-burns-reframing"
              style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.55 }}
            >
              {burns.reframing}
            </p>
          )}
          {hasDetails && (
            <>
              <button
                type="button"
                data-testid="agent-burns-more"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsOpen((v) => !v)}
                style={{
                  marginTop: 'var(--space-sm)',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--accent)',
                  fontSize: 13,
                  cursor: 'pointer',
                  minHeight: 48,
                }}
              >
                {detailsOpen ? 'Скрыть' : 'Ещё'}
              </button>
              {detailsOpen && (
                <div data-testid="agent-burns-details">
                  {burns.distortions && burns.distortions.length > 0 && (
                    <div data-testid="agent-burns-distortions">
                      {burns.distortions.map((d) => (
                        <p
                          key={`${d.type}-${d.thought}`}
                          style={{ margin: '0 0 var(--space-xs)', fontSize: 13, color: 'var(--text-secondary)' }}
                        >
                          <strong style={{ color: 'var(--accent)' }}>{d.type}</strong>
                          {' — '}
                          {d.thought}
                        </p>
                      ))}
                    </div>
                  )}
                  {burns.question && (
                    <p
                      data-testid="agent-burns-question"
                      style={{
                        margin: 'var(--space-sm) 0 0',
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                      }}
                    >
                      {burns.question}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {status === 'ok' && isTextPayload(payload) && (
        <p data-testid="agent-text-payload" style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {payload.text}
        </p>
      )}
    </article>
  );
}
