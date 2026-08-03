import { test, expect } from '@playwright/test';

test('result shows action hero before distortions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockRecognition {
      continuous = true;
      interimResults = true;
      lang = 'ru-RU';
      onresult:
        | ((event: {
            resultIndex: number;
            results: { isFinal: boolean; 0: { transcript: string } }[];
          }) => void)
        | null = null;
      onerror: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      start() {
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: true, 0: { transcript: 'Я опоздал и все думают плохо' } }],
          });
        }, 50);
      }
      stop() {
        this.onend?.();
      }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
  });

  await page.route('**/api/reframe', async (route) => {
    const body = {
      distortions: [{ type: 'Чтение мыслей', thought: 'все думают', why: 'не знаешь' }],
      reframing: 'Опоздание — факт. Остальное — интерпретация.',
      question: 'Что скажешь другу?',
      action: 'Спроси одного коллегу, заметил ли он опоздание.',
      pattern: 'Поспешные выводы',
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });

  await page.goto('/');
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Говорить'))?.click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Стоп'))?.click();
  });
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Отправить'))?.click();
  });

  await expect(page.getByTestId('response-action')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('response-action')).toContainText('Что сделать сегодня');
  await expect(page.getByTestId('response-action')).toContainText(
    'Спроси одного коллегу, заметил ли он опоздание.',
  );

  const actionBox = await page.getByTestId('response-action').boundingBox();
  const distortionsHeading = page.getByText('КОГНИТИВНЫЕ ИСКАЖЕНИЯ');
  await expect(distortionsHeading).toBeVisible();
  const distortionsBox = await distortionsHeading.boundingBox();
  expect(actionBox).toBeTruthy();
  expect(distortionsBox).toBeTruthy();
  expect(actionBox!.y).toBeLessThan(distortionsBox!.y);
});
