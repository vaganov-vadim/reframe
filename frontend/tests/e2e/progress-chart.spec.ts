import { test, expect } from '@playwright/test';

test('shows progress chart with session data', async ({ page }) => {
  // Seed localStorage with sessions
  await page.addInitScript(() => {
    const sessions = [
      { id: '1', date: new Date().toISOString(), distortion: 'Катастрофизация', anxietyBefore: 8, anxietyAfter: 4, delta: 4, reframing: 'test' },
      { id: '2', date: new Date(Date.now() - 86400000).toISOString(), distortion: 'Персонализация', anxietyBefore: 6, anxietyAfter: 3, delta: 3, reframing: 'test' },
    ];
    localStorage.setItem('reframe_sessions', JSON.stringify(sessions));
  });
  await page.goto('/progress');
  await expect(page.getByText('Последние 7 дней')).toBeVisible({ timeout: 3000 });
});
