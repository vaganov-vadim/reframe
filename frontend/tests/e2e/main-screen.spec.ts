import { test, expect } from '@playwright/test';

test('shows anxiety slider and record button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('спокойно')).toBeVisible();
  await expect(page.getByText('предельно')).toBeVisible();
  await expect(page.getByRole('button', { name: /говорить/i })).toBeVisible();
});

test('shows text input when Speech API missing', async ({ page }) => {
  await page.addInitScript(() => {
    delete (window as Record<string, unknown>).SpeechRecognition;
    delete (window as Record<string, unknown>).webkitSpeechRecognition;
});

  await page.goto('/');
  await expect(page.getByPlaceholder('Опишите, что вас тревожит...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();
});


