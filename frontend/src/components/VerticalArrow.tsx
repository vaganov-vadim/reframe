import type { VerticalArrowLevel } from '../types/session';
import { ReframingText } from './ResponseView';

export function VerticalArrow({
  levels,
  reframing,
  question,
  loading,
}: {
  levels: VerticalArrowLevel[] | null | undefined;
  reframing?: string;
  question?: string;
  loading?: boolean;
}) {
  if (loading && !levels) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-lg) var(--space-md)',
          color: 'var(--text-secondary)',
          fontSize: '15px',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 'var(--space-md)',
          }}
        />
        <p>Смотрю на ситуацию...</p>
      </div>
    );
  }

  if (!levels || levels.length === 0) return null;

  return (
    <div style={{ padding: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
      <h3
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 'var(--space-lg)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Вертикальная стрелка
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
      >
        {levels.map((level, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: 'var(--space-md)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '340px',
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
                {level.label}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.5',
                }}
              >
                &laquo;{level.thought}&raquo;
              </div>
            </div>
            {i < levels.length - 1 && (
              <div
                style={{
                  color: 'var(--accent)',
                  fontSize: '20px',
                  lineHeight: 1,
                  margin: 'var(--space-xs) 0',
                }}
              >
                ↓
              </div>
            )}
          </div>
        ))}
      </div>

      {reframing && <ReframingText text={reframing} listenTestId="listen-va-reframing" />}

      {question && (
        <div
          style={{
            marginTop: 'var(--space-md)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          {question}
        </div>
      )}
    </div>
  );
}
