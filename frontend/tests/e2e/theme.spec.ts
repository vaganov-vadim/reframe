import { test, expect } from '@playwright/test';

test('toggles theme dark ↔ light and persists', async ({ page }) => {
  // Dismiss onboarding so it doesn't block clicks
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
  });
  await page.goto('/');
  // Default dark theme
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // Toggle
  await page.click('[aria-label*="light"]');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  // Persists across reload
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
