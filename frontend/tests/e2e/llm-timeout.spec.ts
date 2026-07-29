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
    // Override AbortSignal.timeout to force 5s timeout in tests
    const origTimeout = AbortSignal.timeout.bind(AbortSignal);
    (AbortSignal as unknown as Record<string, unknown>).timeout = (_ms: number) => origTimeout(5000);
  });

  // Mock API with a delay that exceeds the forced 5s timeout
  await page.route('**/api/reframe', async (_route) => {
    await new Promise(r => setTimeout(r, 15000)); // never resolves before timeout
  });

  await page.goto('/');
  await page.evaluate(() => { const btns = [...document.querySelectorAll('button')]; btns.find(b => b.textContent?.includes('Говорить'))?.click(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { const btns = [...document.querySelectorAll('button')]; btns.find(b => b.textContent?.includes('Стоп'))?.click(); });
  await page.evaluate(() => { const btns = [...document.querySelectorAll('button')]; btns.find(b => b.textContent?.includes('Отправить'))?.click(); });
  // After forced timeout, error should appear
  await expect(page.getByText(/не получилось/i)).toBeVisible({ timeout: 15000 });
});
