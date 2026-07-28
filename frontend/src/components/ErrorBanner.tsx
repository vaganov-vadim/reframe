import { useEffect, useState } from 'react';

interface ErrorBannerProps {
  message: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  const [countdown, setCountdown] = useState(0);

  const rateLimitMatch = message?.match(/^rate_limit:(\d+)/);
  const isRateLimit = !!rateLimitMatch;
  const retrySeconds = rateLimitMatch ? parseInt(rateLimitMatch[1], 10) : 60;
  const displayMessage = isRateLimit
    ? 'Пауза. Пока можно осмыслить результат.'
    : message;

  useEffect(() => {
    if (!isRateLimit) {
      setCountdown(0);
      return;
    }

    setCountdown(retrySeconds);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRateLimit, retrySeconds]);

  useEffect(() => {
    if (countdown === 0 && isRateLimit && onDismiss) {
      onDismiss();
    }
  }, [countdown, isRateLimit, onDismiss]);

  if (!displayMessage && !isRateLimit) return null;

  return (
    <div
      style={{
        background: isRateLimit ? 'rgba(232, 168, 80, 0.1)' : 'var(--bg-elevated)',
        border: isRateLimit ? '1px solid var(--accent)' : '1px solid var(--error)',
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-md)',
        margin: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <p style={{ fontSize: '14px', color: 'var(--error)', margin: 0, flex: 1 }}>{displayMessage}</p>
        {isRateLimit && (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {countdown > 0 ? `Ещё ${countdown}с` : 'Можно продолжить'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
        {onRetry && !isRateLimit && (
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
        {onDismiss && !isRateLimit && (
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
