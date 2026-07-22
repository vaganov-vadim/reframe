import type { ReframeResponse } from '../hooks/useSSE';

export function DistortionList({
  distortions,
}: {
  distortions: ReframeResponse['distortions'];
}) {
  if (!distortions || distortions.length === 0) return null;

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-md)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Когнитивные искажения
      </h3>
      {distortions.map((d, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-sm)',
            borderLeft: '3px solid var(--accent)',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: '6px',
              letterSpacing: '0.3px',
            }}
          >
            {d.type}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              marginBottom: '6px',
              lineHeight: '1.5',
            }}
          >
            &laquo;{d.thought}&raquo;
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: '1.5',
            }}
          >
            {d.why}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReframingText({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div
      style={{
        padding: 'var(--space-lg)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius)',
        margin: 'var(--space-md)',
        fontSize: '15px',
        lineHeight: '1.7',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--success)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: 'var(--space-md)',
          fontSize: '28px',
          color: 'var(--success)',
          lineHeight: 1,
          opacity: 0.6,
        }}
      >
        &ldquo;
      </div>
      <div style={{ paddingTop: '8px' }}>{text}</div>
    </div>
  );
}

export function ResponseView({
  data,
  loading,
}: {
  data: ReframeResponse | null;
  loading: boolean;
}) {
  if (loading && !data) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-xl) var(--space-md)',
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
        <p>Анализирую...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <DistortionList distortions={data.distortions} />
      <ReframingText text={data.reframing} />
      {data.question && (
        <div
          style={{
            padding: '0 var(--space-md) var(--space-md)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          {data.question}
        </div>
      )}
    </div>
  );
}
