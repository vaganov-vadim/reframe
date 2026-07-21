import { Link, useLocation } from 'react-router-dom';
import './TabBar.css';

interface Tab {
  path: string;
  label: string;
}

const TABS: Tab[] = [
  { path: '/', label: 'Главная' },
  { path: '/history', label: 'История' },
  { path: '/progress', label: 'Прогресс' },
];

export function TabBar() {
  const location = useLocation();

  return (
    <nav className="tab-bar">
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={isActive ? 'active' : ''}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
