import { test, expect } from '@playwright/test';

test('text input sends directly without review phase', async ({ page }) => {
  // Mock LLM API
  await page.route('**/api/reframe', async (route) => {
    const body = {
      distortions: [{ type: 'Катастрофизация', thought: 'всё плохо', why: 'преувеличение' }],
      reframing: 'Не всё так страшно.',
      question: '?',
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });

  // Remove SpeechRecognition
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });

  await page.goto('/');

  // Should see text input (not voice button)
  await expect(page.getByPlaceholder('Опишите, что вас тревожит...')).toBeVisible();

  // Type text and send
  await page.fill('textarea', 'Тестовый текст для проверки');
  await page.click('button:has-text("Отправить")');

  // Should go directly to result (no empty review screen)
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Не всё так страшно.')).toBeVisible();
});
