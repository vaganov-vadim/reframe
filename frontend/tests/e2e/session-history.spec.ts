import { test, expect } from '@playwright/test';

test('saves session and shows in history', async ({ page }) => {
  // Mock SpeechRecognition and dismiss onboarding
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockRecognition {
      continuous = true; interimResults = true; lang = 'ru-RU';
      onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      start() { setTimeout(() => { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'test' } }] }); }, 50); }
      stop() { this.onend?.(); }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
  });

  // Mock LLM API
  await page.route('**/api/reframe', async (route) => {
    const body = { distortions: [{ type: 'Катастрофизация', thought: 'всё плохо', why: 'преувеличение' }], reframing: 'Другой взгляд.', question: 'Что скажешь другу?' };
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: `data: ${JSON.stringify(body)}\n\n` });
  });

  await page.goto('/');
  // Complete flow: record → stop → save
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Сохранить")');
  // Navigate to history via tab bar
  await page.getByRole('link', { name: 'История' }).click();
  await expect(page.getByText('Катастрофизация')).toBeVisible();
});
