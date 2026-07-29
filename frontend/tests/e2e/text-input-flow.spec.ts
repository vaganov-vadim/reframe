import { test, expect } from '@playwright/test';

test('text input sends directly without review phase', async ({ page }) => {
  // Dismiss onboarding
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });

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


  await page.goto('/');

  // Should see text input (not voice button)
  await expect(page.getByPlaceholder('Опишите, что вас тревожит...')).toBeVisible();

  await page.locator('[aria-label="Основная навигация"]').evaluate((el) => {
    (el as HTMLElement).style.display = 'none';
  });
  const textarea = page.getByPlaceholder('Опишите, что вас тревожит...');
  await textarea.fill('Тестовый текст для проверки');
  await page.getByRole('button', { name: 'Отправить' }).click();

  // Should go directly to result (no empty review screen)
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Не всё так страшно.')).toBeVisible();
});

test('manual text cleared after session save and auto-reset', async ({ page }) => {
  // Dismiss onboarding
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });

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

  await page.goto('/');
  await expect(page.getByPlaceholder('Опишите, что вас тревожит...')).toBeVisible();

  // Hide nav to avoid interference
  await page.locator('[aria-label="Основная навигация"]').evaluate((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  const textarea = page.getByPlaceholder('Опишите, что вас тревожит...');
  await textarea.fill('Тестовый текст для проверки');
  await page.getByRole('button', { name: 'Отправить' }).click();

  // Wait for result
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });

  // Save session
  await page.evaluate(() => { const btns = [...document.querySelectorAll('button')]; btns.find(b => b.textContent?.includes('Сохранить сессию'))?.click(); });
  await expect(page.getByText('Сессия сохранена')).toBeVisible();

  // Wait for auto-reset (~2s timeout + buffer)
  await page.waitForTimeout(3000);

  // Textarea should be empty after reset
  await expect(textarea).toHaveValue('');
});
