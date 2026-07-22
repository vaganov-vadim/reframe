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
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-md)',
            justifyContent: 'center',
            marginTop: 'var(--space-md)',
          }}
        >
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

  // idle state — hero centered button
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-xl) 0',
        flex: 1,
      }}
    >
      <button
        onClick={onStart}
        style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--bg-primary)',
          border: 'none',
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          cursor: 'pointer',
          boxShadow:
            '0 0 40px var(--accent-glow), 0 4px 24px rgba(0,0,0,0.3)',
          animation: 'breathe 3s ease-in-out infinite',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Говорить
      </button>
      <p
        style={{
          marginTop: 'var(--space-lg)',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '280px',
        }}
      >
        Расскажите, что вас тревожит
      </p>
    </div>
  );
}
