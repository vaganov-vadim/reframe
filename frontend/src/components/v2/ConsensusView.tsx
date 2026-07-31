interface ConsensusViewProps {
  text: string | null;
  loading?: boolean;
}

export function ConsensusView({ text, loading = false }: ConsensusViewProps) {
  if (!loading && !text) return null;

  return (
    <section
      data-testid="consensus-view"
      className="phase-enter"
      style={{
        padding: 'var(--space-lg) var(--space-md)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--accent)',
        background: 'var(--accent-glow)',
      }}
    >
      <h2
        style={{
          margin: '0 0 var(--space-sm)',
          fontSize: 'var(--font-size-heading)',
          color: 'var(--accent)',
          fontWeight: 600,
        }}
      >
        Что унести
      </h2>
      {loading && !text ? (
        <p data-testid="consensus-loading" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 16 }}>
          Собираю вывод…
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.55, fontWeight: 500 }}>
          {text}
        </p>
      )}
    </section>
  );
}
