import { lazy, Suspense } from 'react';

const AnxietyChart = lazy(() =>
  import('./AnxietyChart').then((m) => ({ default: m.AnxietyChart })),
);

export function ProgressTab() {
  return (
    <div style={{ margin: '0 calc(-1 * var(--space-md))' }}>
      <Suspense
        fallback={
          <div
            style={{
              padding: 'var(--space-lg)',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            Загрузка...
          </div>
        }
      >
        <AnxietyChart />
      </Suspense>
    </div>
  );
}
