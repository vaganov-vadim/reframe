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

test('crisis help button uses amber styling at anxiety 9-10', async ({ page }) => {
  await page.goto('/');
  // Set anxiety to 9 via slider
  await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    if (slider) { slider.value = '9'; slider.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(500);
  // Check help button exists
  const btn = page.getByText('Помощь — дыхательное упражнение');
  await expect(btn).toBeVisible();
  // Check it has amber styling (not gray)
  const color = await btn.evaluate(el => window.getComputedStyle(el).color);
  // Should be amber/gold, not gray
  expect(color).not.toBe('rgb(168, 152, 128)'); // --text-secondary gray
});
