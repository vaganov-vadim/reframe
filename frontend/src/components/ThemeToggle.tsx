import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      style={{
        position: 'fixed',
        top: 'var(--space-md)',
        right: 'var(--space-md)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: 'none',
        width: '36px',
        height: '36px',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        cursor: 'pointer',
        opacity: 0.6,
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.6';
      }}
    >
      {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  );
}
