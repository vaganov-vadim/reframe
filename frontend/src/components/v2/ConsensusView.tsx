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
        marginTop: 'var(--space-md)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--accent)',
        background: 'var(--accent-glow)',
      }}
    >
      <h3 style={{ margin: '0 0 var(--space-sm)', fontSize: 15, color: 'var(--accent)', fontWeight: 600 }}>
        Что общего
      </h3>
      {loading && !text ? (
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Собираю общее…</p>
      ) : (
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5 }}>{text}</p>
      )}
    </section>
  );
}
