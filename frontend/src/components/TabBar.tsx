import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '◉', label: 'Главная' },
  { to: '/history', icon: '☰', label: 'История' },
  { to: '/progress', icon: '📈', label: 'Прогресс' },
];

export function TabBar() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        justifyContent: 'center',
        gap: 0,
        padding:
          'var(--space-xs) 0 calc(var(--space-sm) + env(safe-area-inset-bottom, 0px))',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
        zIndex: 100,
      }}
      role="navigation"
      aria-label="Основная навигация"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          title={t.label}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: 'var(--space-xs) var(--space-sm)',
            margin: '0 var(--space-xs)',
            textDecoration: 'none',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: isActive ? 600 : 400,
            borderRadius: 'var(--border-radius-sm)',
            background: isActive ? 'var(--accent-glow)' : 'transparent',
            transition: 'background 0.2s, color 0.2s',
          })}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
