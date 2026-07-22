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
        padding: 'var(--space-xl) 0',
      }}
    >
      {/* Pulsing ring */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '3px solid var(--accent)',
          animation: 'recording-pulse 1.5s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Inner dot */}
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--accent)',
            animation: 'breathe 1s ease-in-out infinite',
          }}
        />
      </div>
      <p
        style={{
          marginTop: 'var(--space-lg)',
          color: 'var(--text-secondary)',
          fontSize: '15px',
          fontWeight: 500,
        }}
      >
        ● Запись...
      </p>
    </div>
  );
}
