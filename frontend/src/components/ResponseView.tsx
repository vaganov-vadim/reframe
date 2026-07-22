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
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-md)',
          textAlign: 'center',
          letterSpacing: '0.5px',
        }}
      >
        КОГНИТИВНЫЕ ИСКАЖЕНИЯ
      </h3>
      {distortions.map((d, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 'var(--space-sm)',
            alignItems: 'start',
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Column 1: Automatic thought */}
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Мысль
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                lineHeight: '1.5',
              }}
            >
              &laquo;{d.thought}&raquo;
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '14px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '16px' }}>&rarr;</span>
          </div>

          {/* Column 2+3: Distortion type + reason */}
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Искажение
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--accent)',
                marginBottom: 'var(--space-sm)',
              }}
            >
              {d.type}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: '1.5',
              }}
            >
              {d.why}
            </div>
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
            padding: 'var(--space-md)',
            margin: '0 var(--space-md) var(--space-md)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px dashed var(--accent)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Вопрос для размышления
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--accent)',
              fontStyle: 'italic',
              lineHeight: '1.5',
              fontWeight: 500,
            }}
          >
            {data.question}
          </div>
        </div>
      )}

      {data.pattern && (
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            margin: '0 var(--space-md) var(--space-md)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: '1.5',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-sm)',
          }}
        >
          <span style={{ opacity: 0.5 }}>Повторяющийся паттерн: </span>
          {data.pattern}
        </div>
      )}
    </div>
  );
}
