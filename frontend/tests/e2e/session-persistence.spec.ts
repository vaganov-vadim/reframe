import { test, expect } from '@playwright/test';

test('session persists when navigating to distortions and back', async ({ page }) => {
  // Dismiss onboarding
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockRecognition {
      continuous = true;
      interimResults = true;
      lang = 'ru-RU';
      onresult: ((event: {
        resultIndex: number;
        results: { isFinal: boolean; 0: { transcript: string } }[];
      }) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      start() {
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: true, 0: { transcript: 'Я опоздал и все смеялись' } }],
          });
        }, 100);
      }
      stop() {
        this.onend?.();
      }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  // Mock LLM API
  await page.route('**/api/reframe', async (route) => {
    const body = {
      distortions: [{ type: 'Катастрофизация', thought: 'всё плохо', why: 'преувеличение' }],
      reframing: 'Не всё так страшно.',
      question: 'Что скажешь другу?',
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });

  await page.goto('/');

  // Complete a recording session
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(300);
  await page.click('button:has-text("Стоп")', { force: true });
  await page.click('button:has-text("Отправить")', { force: true });

  // Wait for the result to appear
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Не всё так страшно.')).toBeVisible();

  // Navigate to distortions reference page via "Узнать больше" link
  await page.click('text=Узнать больше об искажениях');
  await expect(page.getByText('Когнитивные искажения')).toBeVisible({ timeout: 3000 });

  // Navigate back to main via full page reload
  await page.goto('/');

  // Session should still show the result (not start over)
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 3000 });
  await expect(page.getByText('Не всё так страшно.')).toBeVisible();
});
