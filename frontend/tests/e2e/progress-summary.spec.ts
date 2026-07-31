import { test, expect } from '@playwright/test';

test('shows progress summary with session data', async ({ page }) => {
  const sessions = [
    {
      id: '1',
      date: new Date().toISOString(),
      distortion: 'Катастрофизация',
      anxietyBefore: 8,
      anxietyAfter: 4,
      delta: 4,
      reframing: 'test',
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString(),
      distortion: 'Персонализация',
      anxietyBefore: 6,
      anxietyAfter: 3,
      delta: 3,
      reframing: 'test',
    },
  ];
  await page.addInitScript((data) => {
    localStorage.setItem('reframe_sessions', JSON.stringify(data));
  }, sessions);
  await page.goto('/progress');
  await expect(page.getByText('Твой прогресс')).toBeVisible();
  await expect(page.getByText('2', { exact: true })).toBeVisible(); // total sessions
  await expect(page.getByTestId('weekly-insight')).toContainText('За 7 дней — 2');
});
