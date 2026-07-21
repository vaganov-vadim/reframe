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
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-sm)',
        }}
      >
        Когнитивные искажения:
      </h3>
      {distortions.map((d, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: '4px',
            }}
          >
            {d.type}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              marginBottom: '4px',
            }}
          >
            «{d.thought}»
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{d.why}</div>
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
        padding: 'var(--space-md)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius)',
        margin: 'var(--space-md)',
        fontSize: '15px',
        lineHeight: '1.6',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent)',
        borderLeftWidth: '3px',
      }}
    >
      {text}
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
          padding: 'var(--space-lg)',
          color: 'var(--text-secondary)',
        }}
      >
        Анализирую...
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
          }}
        >
          {data.question}
        </div>
      )}
    </div>
  );
}
