export function RecordingIndicator() {
  return (
    <div
      role="status"
      aria-label="Recording in progress"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-md)',
      }}
    >
      {/* Animated ring */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'recording-pulse 2s ease-out infinite',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--bg-primary)',
          }}
        />
      </div>
      <span
        style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        Запись...
      </span>
    </div>
  );
}
