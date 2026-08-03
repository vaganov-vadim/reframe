import { test, expect } from '@playwright/test';

test('deletes session from history detail after confirm', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    localStorage.setItem(
      'reframe_sessions',
      JSON.stringify([
        {
          id: 'keep',
          date: new Date().toISOString(),
          distortion: 'Персонализация',
          anxietyBefore: 6,
          anxietyAfter: 3,
          delta: 3,
          reframing: 'Остаётся.',
        },
        {
          id: 'drop',
          date: new Date(Date.now() - 86400000).toISOString(),
          distortion: 'Катастрофизация',
          anxietyBefore: 8,
          anxietyAfter: 4,
          delta: 4,
          reframing: 'Удалится.',
        },
      ]),
    );
  });

  await page.goto('/history');
  await expect(page.getByText('2 сессии')).toBeVisible();
  await page.getByText('Катастрофизация').click();
  await expect(page.getByText('Удалится.')).toBeVisible();

  await page.getByTestId('history-delete').click();
  await expect(page.getByTestId('history-delete-confirm')).toBeVisible();
  await page.getByTestId('history-delete-cancel').click();
  await expect(page.getByTestId('history-delete-confirm')).toHaveCount(0);
  await expect(page.getByText('Удалится.')).toBeVisible();

  await page.getByTestId('history-delete').click();
  await page.getByTestId('history-delete-confirm-yes').click();

  await expect(page.getByText('1 сессия')).toBeVisible();
  await expect(page.getByText('Персонализация')).toBeVisible();
  await expect(page.getByText('Катастрофизация')).toHaveCount(0);

  const stored = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('reframe_sessions') ?? '[]') as { id: string }[];
  });
  expect(stored.map((s) => s.id)).toEqual(['keep']);
});
