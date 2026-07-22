import { test, expect } from '@playwright/test';

test('full recording flow: speech → API → response', async ({ page }) => {
  // Mock SpeechRecognition and dismiss onboarding before page loads
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockRecognition {
      continuous = true; interimResults = true; lang = 'ru-RU';
      onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      start() { setTimeout(() => { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Я опоздал и все смеялись' } }] }); this.onend?.(); }, 100); }
      stop() { this.onend?.(); }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  // Mock LLM API
  await page.route('**/api/reframe', async (route) => {
    const body = { distortions: [{ type: 'Катастрофизация', thought: 'всё плохо', why: 'преувеличение' }], reframing: 'Это факт, а не катастрофа.', question: 'Что скажешь другу?' };
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: `data: ${JSON.stringify(body)}\n\n` });
  });

  await page.goto('/');
  // Click record
  await page.click('button:has-text("Говорить")', { force: true });
  // Wait for stop button to appear (recording state)
  await page.waitForTimeout(300);
  // Click stop
  await page.click('button:has-text("Стоп")', { force: true });
  // Wait for response
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Это факт, а не катастрофа.')).toBeVisible();
});
