import { lazy, Suspense } from 'react';

const AnxietyChart = lazy(() => import('./AnxietyChart').then(m => ({ default: m.AnxietyChart })));

export function ProgressTab() {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '0 var(--space-xs)',
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
