import { test, expect } from '@playwright/test';

test('shows empty state for history', async ({ page }) => {
  // Dismiss onboarding and clear sessions via addInitScript to avoid SecurityError
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('reframe_onboarding', 'true');
  });
  await page.goto('/history');
  await expect(page.getByText(/здесь появятся твои сессии/i)).toBeVisible();
});

test('shows empty state for progress', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('reframe_onboarding', 'true');
  });
  await page.goto('/progress');
  await expect(page.getByText(/твой прогресс появится здесь/i)).toBeVisible();
});
