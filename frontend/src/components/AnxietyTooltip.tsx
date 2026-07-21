const SUDS_LEVELS: Record<number, string> = {
  1: 'Спокойствие — нет дискомфорта',
  2: 'Минимальная тревога',
  3: 'Лёгкое напряжение',
  4: 'Фоновая тревога',
  5: 'Заметная тревога — мешает сосредоточиться',
  6: 'Тревога мешает',
  7: 'Сильная тревога',
  8: 'Трудно контролировать мысли',
  9: 'Почти невыносимо',
  10: 'Предельная тревога — паническое состояние',
};

export function AnxietyTooltip({ value }: { value: number }) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-sm) var(--space-md)',
        fontSize: '13px',
        maxWidth: '240px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '2px' }}>{value}/10</div>
      <div style={{ color: 'var(--text-secondary)' }}>{SUDS_LEVELS[value]}</div>
    </div>
  );
}
