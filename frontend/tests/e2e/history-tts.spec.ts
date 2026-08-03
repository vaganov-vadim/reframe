import { test, expect } from '@playwright/test';

test('history detail offers listen on reframing and VA', async ({ page }) => {
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
          reframing: 'Факт отделён от догадки.',
          action: 'Запиши один факт без ярлыка.',
          verticalArrowLevels: [
            { thought: 'Я опоздал', label: 'Поверхностная мысль' },
            { thought: 'Я недостаточно хорош', label: 'Глубинное убеждение' },
          ],
          verticalArrowReframing: 'Опоздание не определяет ценность.',
        },
      ]),
    );
  });

  await page.goto('/history');
  await page.getByText('Катастрофизация').click();
  await expect(page.getByTestId('history-reframing')).toContainText('Факт отделён от догадки.');
  await expect(page.getByTestId('listen-history-reframing')).toBeVisible();
  await expect(page.getByTestId('listen-history-va-reframing')).toBeVisible();
});
