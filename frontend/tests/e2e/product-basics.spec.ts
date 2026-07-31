import { test, expect } from '@playwright/test';

test('privacy page is honest and reachable from progress', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
  });
  await page.goto('/progress');
  await page.getByTestId('privacy-link').click();
  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.getByTestId('privacy-page')).toBeVisible();
  await expect(page.getByText('LLM-провайдер')).toBeVisible();
  await expect(page.getByText(/DeepSeek/)).toBeVisible();
});

test('progress shows weekly insight from recent sessions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    const now = new Date().toISOString();
    localStorage.setItem(
      'reframe_sessions',
      JSON.stringify([
        {
          id: '1',
          date: now,
          distortion: 'Чтение мыслей',
          anxietyBefore: 8,
          anxietyAfter: 5,
          delta: 3,
          reframing: 'Факт отделён от догадки.',
        },
      ]),
    );
  });
  await page.goto('/progress');
  await expect(page.getByTestId('weekly-insight')).toBeVisible();
  await expect(page.getByTestId('weekly-insight')).toContainText('За 7 дней');
});

test('manifest is linked for PWA lite', async ({ page }) => {
  await page.goto('/');
  const manifest = page.locator('link[rel="manifest"]');
  await expect(manifest).toHaveAttribute('href', '/manifest.webmanifest');
  const res = await page.request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.name).toBe('Reframe');
  expect(json.display).toBe('standalone');
});
