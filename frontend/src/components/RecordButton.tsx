import { RecordingIndicator } from './RecordingIndicator';

type RecordState = 'idle' | 'recording' | 'disabled';

interface RecordButtonProps {
  state: RecordState;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}

export function RecordButton({ state, onStart, onStop, onCancel }: RecordButtonProps) {
  if (state === 'disabled') {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Голосовой ввод доступен в Chrome.
          <br />
          Откройте приложение в Chrome, чтобы начать.
        </p>
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div style={{ textAlign: 'center' }}>
        <RecordingIndicator />
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          justifyContent: 'center',
          marginTop: 'var(--space-md)',
        }}>
          <button
            onClick={onStop}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              border: 'none',
              padding: 'var(--space-sm) var(--space-lg)',
              fontSize: '16px',
              fontWeight: 600,
              minWidth: '120px',
              borderRadius: 'var(--border-radius)',
              minHeight: 'var(--touch-target)',
              cursor: 'pointer',
            }}
          >
            Стоп
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              padding: 'var(--space-sm) var(--space-lg)',
              fontSize: '16px',
              minWidth: '120px',
              borderRadius: 'var(--border-radius)',
              minHeight: 'var(--touch-target)',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  // idle state
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-lg) var(--space-md)' }}>
      <button
        onClick={onStart}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--bg-primary)',
          border: 'none',
          fontSize: '18px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 24px rgba(200, 168, 124, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Говорить
      </button>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '14px',
        marginTop: 'var(--space-md)',
      }}>
        Нажмите и расскажите, что вас тревожит
      </p>
    </div>
  );
}
