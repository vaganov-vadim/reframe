import { test, expect } from '@playwright/test';

test('shows onboarding on first visit', async ({ page }) => {
  // Fresh context = no localStorage = onboarding shows
  await page.goto('/');
  await expect(page.getByText('Добро пожаловать в Reframe')).toBeVisible();
});

test('hides onboarding after dismiss', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Понятно")');
  await expect(page.getByText('Добро пожаловать в Reframe')).not.toBeVisible();
  // Persists across reload
  await page.reload();
  await expect(page.getByText('Добро пожаловать в Reframe')).not.toBeVisible();
});
