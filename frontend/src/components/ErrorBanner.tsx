interface ErrorBannerProps {
  message: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  const isRateLimit = message.includes('429') || message.includes('limit');
  const msg = isRateLimit
    ? 'Слишком много запросов. Подождите минуту.'
    : message;

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-md)',
        margin: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}
    >
      <p style={{ fontSize: '14px', color: 'var(--error)', margin: 0 }}>{msg}</p>
      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              border: 'none',
              padding: 'var(--space-xs) var(--space-md)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Повторить
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              padding: 'var(--space-xs) var(--space-md)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Закрыть
          </button>
        )}
      </div>
    </div>
  );
}
