import { test, expect } from '@playwright/test';

test('shows error banner on network failure', async ({ page }) => {
  // Mock SpeechRecognition and dismiss onboarding
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockRecognition {
      continuous = true; interimResults = true; lang = 'ru-RU';
      onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      start() { setTimeout(() => { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'test' } }] }); this.onend?.(); }, 50); }
      stop() { this.onend?.(); }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
  });

  // Mock network failure
  await page.route('**/api/reframe', (route) => route.abort('failed'));

  await page.goto('/');
  await page.click('button:has-text("Говорить")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")');
  await expect(page.getByText(/ошибка/i)).toBeVisible({ timeout: 5000 });
});
