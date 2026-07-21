export function DeltaDisplay({
  before,
  after,
}: {
  before: number;
  after: number;
}) {
  const delta = before - after;
  const improved = delta > 0;

  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-md)',
        margin: 'var(--space-md)',
        borderRadius: 'var(--border-radius)',
        background: improved
          ? 'color-mix(in srgb, var(--success) 15%, transparent)'
          : 'color-mix(in srgb, var(--error) 15%, transparent)',
      }}
    >
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
        {improved ? 'Тревога снизилась на' : 'Тревога выросла на'}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: improved ? 'var(--success)' : 'var(--error)',
        }}
      >
        {improved ? `\u2212${delta}` : `+${Math.abs(delta)}`}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
        {before} &rarr; {after}
      </div>
    </div>
  );
}
