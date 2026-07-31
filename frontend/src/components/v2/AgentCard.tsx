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

  return (
    <article
      data-testid={`agent-card-${event.agent}`}
      className="phase-enter"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-md)',
        minHeight: 120,
      }}
    >
      <header style={{ marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', alignItems: 'baseline' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', fontWeight: 600 }}>
            {name}
          </h3>
          {status === 'loading' && (
            <span data-testid="agent-loading" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Смотрю…</span>
          )}
          {status === 'error' && (
            <span data-testid="agent-error" style={{ color: 'var(--error)', fontSize: 13 }}>Не вышло</span>
          )}
        </div>
        {role && (
          <p data-testid="agent-role" style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            {role}
          </p>
        )}
      </header>

      {status === 'loading' && (
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 15 }}>Жду ответ…</p>
      )}

      {status === 'error' && (
        <p style={{ color: 'var(--error)', margin: 0, fontSize: 15 }}>{error || 'Не получилось получить ответ.'}</p>
      )}

      {status === 'ok' && isBurnsPayload(payload) && (
        <div data-testid="agent-burns-payload">
          {payload.reframing && (
            <p
              data-testid="agent-burns-reframing"
              style={{ margin: '0 0 var(--space-sm)', fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5 }}
            >
              {payload.reframing}
            </p>
          )}
          {payload.distortions && payload.distortions.length > 0 && (
            <div data-testid="agent-burns-distortions">
              {payload.distortions.map((d) => (
                <p key={`${d.type}-${d.thought}`} style={{ margin: '0 0 var(--space-xs)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent)' }}>{d.type}</strong>
                  {' — '}
                  {d.thought}
                </p>
              ))}
            </div>
          )}
          {payload.question && (
            <p
              data-testid="agent-burns-question"
              style={{ margin: 'var(--space-sm) 0 0', fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}
            >
              {payload.question}
            </p>
          )}
        </div>
      )}

      {status === 'ok' && isTextPayload(payload) && (
        <p data-testid="agent-text-payload" style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {payload.text}
        </p>
      )}
    </article>
  );
}
