import { lazy, Suspense } from 'react';

const AnxietyChart = lazy(() => import('./AnxietyChart').then(m => ({ default: m.AnxietyChart })));

export function ProgressTab() {
  return (
    <div style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
    }}>
      <Suspense fallback={
        <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Загрузка...
        </div>
      }>
        <AnxietyChart />
      </Suspense>
    </div>
  );
}
