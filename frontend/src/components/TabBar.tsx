import { Link, useLocation } from 'react-router-dom';

interface Tab {
  path: string;
  icon: string;
  label: string;
}

const TABS: Tab[] = [
  { path: '/', icon: '◉', label: 'Главная' },
  { path: '/history', icon: '☰', label: 'История' },
  { path: '/progress', icon: '📈', label: 'Прогресс' },
];

export function TabBar() {
  const location = useLocation();

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
        gap: 'var(--space-xl)',
        padding:
          'var(--space-sm) 0 calc(var(--space-sm) + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(transparent, var(--bg-primary) 40%)',
        zIndex: 100,
      }}
    >
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              width: 'var(--touch-target)',
              height: 'var(--touch-target)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
              borderRadius: '50%',
              background: isActive
                ? 'var(--accent-glow)'
                : 'transparent',
              transition: 'all 0.2s',
            }}
            aria-label={tab.label}
          >
            {tab.icon}
          </Link>
        );
      })}
    </nav>
  );
}
