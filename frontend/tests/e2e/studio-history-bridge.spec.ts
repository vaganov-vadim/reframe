import { test, expect } from '@playwright/test';

test('history detail opens studio in review with action seed and returns to history', async ({
  page,
}) => {
  let agentsCalled = 0;
  await page.route('**/api/analyze-agents', async (route) => {
    agentsCalled += 1;
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"type":"done"}\n\n',
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    localStorage.setItem(
      'reframe_sessions',
      JSON.stringify([
        {
          id: 'bridge-1',
          date: new Date().toISOString(),
          distortion: 'Катастрофизация',
          anxietyBefore: 7,
          anxietyAfter: 4,
          delta: 3,
          action: 'Напиши одно предложение без ярлыка.',
          reframing: 'Это не провал навсегда.',
        },
      ]),
    );
  });

  await page.goto('/history');
  await page.getByText('Катастрофизация').click();
  await expect(page.getByTestId('history-action')).toContainText(
    'Напиши одно предложение без ярлыка.',
  );

  await page.getByTestId('history-studio').click();
  await expect(page).toHaveURL(/\/studio/);
  await expect(page.getByTestId('studio-screen')).toBeVisible();
  await expect(page.getByText('Напиши одно предложение без ярлыка.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();
  expect(agentsCalled).toBe(0);

  await page.getByTestId('back-to-diary').click();
  await expect(page).toHaveURL(/\/history/);
});

test('history studio CTA uses reframing when action missing', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    localStorage.setItem(
      'reframe_sessions',
      JSON.stringify([
        {
          id: 'bridge-2',
          date: new Date().toISOString(),
          distortion: 'Персонализация',
          anxietyBefore: 6,
          anxietyAfter: 3,
          delta: 3,
          reframing: 'Не всё про меня.',
        },
      ]),
    );
  });

  await page.goto('/history');
  await page.getByText('Персонализация').click();
  await page.getByTestId('history-studio').click();
  await expect(page).toHaveURL(/\/studio/);
  await expect(page.getByText('Не всё про меня.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();
});
