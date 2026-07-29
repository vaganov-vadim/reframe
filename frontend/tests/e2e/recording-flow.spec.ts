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
      start() { setTimeout(() => { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Я опоздал и все смеялись' } }] }); }, 50); }
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
  // Click send in review phase
  await page.click('button:has-text("Отправить")', { force: true });
  // Wait for response
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Это факт, а не катастрофа.')).toBeVisible();
});

test('breathing exercise closes after session save and auto-reset', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockRecognition {
      continuous = true; interimResults = true; lang = 'ru-RU';
      onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      start() { setTimeout(() => { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Я опоздал и все смеялись' } }] }); }, 50); }
      stop() { this.onend?.(); }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  await page.route('**/api/reframe', async (route) => {
    const body = { distortions: [{ type: 'Катастрофизация', thought: 'всё плохо', why: 'преувеличение' }], reframing: 'Это факт, а не катастрофа.', question: 'Что скажешь другу?' };
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: `data: ${JSON.stringify(body)}\n\n` });
  });

  await page.goto('/');
  // Set anxiety slider to 9
  const slider = page.locator('input[type="range"]');
  await slider.fill('9');
  await page.waitForTimeout(300);
  // Open breathing exercise
  await page.getByText('Помощь — дыхательное упражнение').click();
  await expect(page.getByText('Вдох')).toBeVisible();
  // Close breathing exercise overlay (it's fullscreen — blocks all UI)
  await page.getByText('← Вернуться').click();
  // Verify we're back to normal UI before proceeding
  await expect(page.getByText('Говорить')).toBeVisible({ timeout: 5000 });
  // Full recording flow — same pattern as passing 'full recording flow' test
  await page.locator('button').filter({ hasText: 'Говорить' }).click({ force: true });
  await page.locator('button').filter({ hasText: 'Стоп' }).waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('button').filter({ hasText: 'Стоп' }).click({ force: true });
  await page.locator('button').filter({ hasText: 'Отправить' }).waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('button').filter({ hasText: 'Отправить' }).click({ force: true });
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });
  // Save
  await page.click('button:has-text("Сохранить сессию")');
  await expect(page.getByText('Сессия сохранена')).toBeVisible();
  // Wait for auto-reset (2s timeout + buffer)
  await page.waitForTimeout(3000);
  // Breathing exercise should NOT be showing after reset
  await expect(page.getByText('Вдох')).not.toBeVisible();
  // Slider should be reset to 5
  const sliderVal = await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    return slider?.value;
  });
  expect(sliderVal).toBe('5');
});
