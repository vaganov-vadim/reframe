import { useTypewriter } from '../../hooks/useTypewriter';

interface ConsensusViewProps {
  text: string | null;
  loading?: boolean;
  /** Disable typewriter (tests / reduced motion callers). Default true. */
  typewriter?: boolean;
}

export function ConsensusView({ text, loading = false, typewriter = true }: ConsensusViewProps) {
  const shown = useTypewriter(text, typewriter && !!text && !loading);
  if (!loading && !text) return null;

  return (
    <section
      data-testid="consensus-view"
      className="phase-enter"
      style={{
        padding: 'var(--space-md) 0 var(--space-lg)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 'var(--space-sm)',
      }}
    >
      <p
        className="studio-takeaway-title"
        style={{
          margin: '0 0 var(--space-sm)',
          fontSize: 13,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          fontWeight: 600,
          fontFamily: 'var(--studio-body, inherit)',
        }}
      >
        Что унести
      </p>
      {loading && !text ? (
        <div data-testid="consensus-loading" aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="studio-skeleton" style={{ height: 22, width: '92%' }} />
          <div className="studio-skeleton" style={{ height: 22, width: '70%' }} />
        </div>
      ) : (
        <p
          data-testid="consensus-text"
          className="studio-takeaway-text"
          style={{
            margin: 0,
            fontSize: 22,
            color: 'var(--text-primary)',
            lineHeight: 1.45,
            fontWeight: 500,
            minHeight: '1.45em',
          }}
        >
          {shown}
          {typewriter && text && shown.length < text.length && (
            <span
              data-testid="consensus-caret"
              aria-hidden
              style={{
                display: 'inline-block',
                width: 2,
                height: '0.9em',
                marginLeft: 2,
                background: 'var(--accent)',
                verticalAlign: 'text-bottom',
                opacity: 0.85,
              }}
            />
          )}
        </p>
      )}
    </section>
  );
}
