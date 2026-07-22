import { test, expect } from '@playwright/test';

test('shows anxiety slider and record button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('спокойно')).toBeVisible();
  await expect(page.getByText('предельно')).toBeVisible();
  await expect(page.getByRole('button', { name: /говорить/i })).toBeVisible();
});

test('shows BrowserFallback when Speech API missing', async ({ page }) => {
  // Remove SpeechRecognition to simulate non-Chrome
  await page.addInitScript(() => {
    delete (window as Record<string, unknown>).SpeechRecognition;
    delete (window as Record<string, unknown>).webkitSpeechRecognition;
  });
  await page.goto('/');
  await expect(page.getByText(/голосовой ввод доступен в chrome/i)).toBeVisible();
});
