export function BrowserFallback() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-xl) var(--space-md)',
        color: 'var(--text-secondary)',
      }}
    >
      <p style={{ fontSize: '18px', marginBottom: 'var(--space-md)' }}>🎤</p>
      <p>Голосовой ввод доступен в Chrome.</p>
      <p style={{ fontSize: '14px', marginTop: 'var(--space-sm)' }}>
        Откройте приложение в Chrome, чтобы начать.
      </p>
    </div>
  );
}
