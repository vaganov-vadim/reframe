import { test, expect } from '@playwright/test';

test('privacy wipe clears sessions after confirm', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    localStorage.setItem(
      'reframe_sessions',
      JSON.stringify([
        {
          id: '1',
          date: new Date().toISOString(),
          distortion: 'Катастрофизация',
          anxietyBefore: 8,
          anxietyAfter: 4,
          delta: 4,
          reframing: 'Факт.',
        },
      ]),
    );
    localStorage.setItem('reframe_reminder', JSON.stringify({ enabled: true, hour: 20, minute: 0 }));
  });

  await page.goto('/privacy');
  await page.getByTestId('privacy-wipe-start').click();
  await expect(page.getByTestId('privacy-wipe-confirm')).toBeVisible();
  await page.getByTestId('privacy-wipe-cancel').click();
  await expect(page.getByTestId('privacy-wipe-confirm')).toHaveCount(0);

  await page.getByTestId('privacy-wipe-start').click();
  await page.getByTestId('privacy-wipe-confirm-yes').click();
  await expect(page).toHaveURL('/');

  const keys = await page.evaluate(() => ({
    sessions: localStorage.getItem('reframe_sessions'),
    reminder: localStorage.getItem('reframe_reminder'),
    onboarding: localStorage.getItem('reframe_onboarding'),
  }));
  expect(keys.sessions).toBeNull();
  expect(keys.reminder).toBeNull();
  expect(keys.onboarding).toBeNull();
});
