import { test, expect } from '@playwright/test';

test('shows warning on LLM timeout', async ({ page }) => {
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

  // Mock API with a delay that exceeds the 10s timeout
  await page.route('**/api/reframe', async (_route) => {
    await new Promise(r => setTimeout(r, 15000)); // never resolves before timeout
  });

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });
  await page.click('button:has-text("Отправить")', { force: true });
  // After 10s timeout, error should appear
  await expect(page.getByText(/не получилось/i)).toBeVisible({ timeout: 15000 });
});
