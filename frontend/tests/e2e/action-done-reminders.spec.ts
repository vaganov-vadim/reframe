import { test, expect } from '@playwright/test';

test('marks action done in history and shows steps in weekly insight', async ({ page }) => {
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
          action: 'Спроси одного коллегу, заметил ли он опоздание.',
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000).toISOString(),
          distortion: 'Персонализация',
          anxietyBefore: 6,
          anxietyAfter: 3,
          delta: 3,
          reframing: 'Не всё про тебя.',
          action: 'Запиши один факт без ярлыка.',
          actionDone: true,
        },
      ]),
    );
  });

  await page.goto('/history');
  await page.getByText('Катастрофизация').click();
  await expect(page.getByTestId('history-action')).toContainText('Спроси одного коллегу');
  await page.getByTestId('history-action-mark-done').click();
  await expect(page.getByTestId('history-action-done')).toContainText('Сделано');
  await expect(page.getByRole('checkbox', { name: /Сделано/i })).toBeChecked();

  await page.getByRole('link', { name: 'Прогресс' }).click();
  await expect(page.getByTestId('weekly-insight')).toContainText('Шаги: 2 из 2 сделаны');
});

test('reminder settings persist on progress', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockNotification {
      static permission: NotificationPermission = 'default';
      static requestPermission(): Promise<NotificationPermission> {
        MockNotification.permission = 'granted';
        return Promise.resolve('granted');
      }
      constructor(_title: string, _opts?: NotificationOptions) {}
    }
    (window as unknown as { Notification: typeof MockNotification }).Notification = MockNotification;
  });

  await page.goto('/progress');
  await expect(page.getByTestId('reminder-settings')).toBeVisible();
  await page.getByTestId('reminder-toggle').click();
  await expect(page.getByTestId('reminder-toggle')).toHaveText('Выключить');
  await page.getByTestId('reminder-time').fill('09:15');
  await page.reload();
  await expect(page.getByTestId('reminder-toggle')).toHaveText('Выключить');
  await expect(page.getByTestId('reminder-time')).toHaveValue('09:15');
});
