import { test, expect } from '@playwright/test';

test('shows Vertical Arrow staircase after deep analysis', async ({ page }) => {
  // Mock LLM API — first call returns normal reframing, second returns Vertical Arrow
  let callCount = 0;
  await page.route('**/api/reframe', async (route) => {
    if (callCount === 0) {
      const body = {
        distortions: [{ type: 'Катастрофизация', thought: 'всё плохо', why: 'преувеличение' }],
        reframing: 'Не всё так страшно.',
        question: 'Что скажешь другу?',
      };
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: `data: ${JSON.stringify(body)}\n\n` });
      callCount++;
    } else {
      const body = {
        levels: [
          { thought: 'Я опоздал', label: 'Поверхностная мысль' },
          { thought: 'Я безответственный', label: 'Промежуточная' },
          { thought: 'Я недостаточно хорош', label: 'Глубинное убеждение' },
        ],
        reframing: 'Одно опоздание не определяет твою ценность.',
        question: 'Вспомни три своих достижения за месяц.',
      };
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: `data: ${JSON.stringify(body)}\n\n` });
    }
  });

  // Mock SpeechRecognition and dismiss onboarding
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    class MockRecognition {
      continuous = true; interimResults = true; lang = 'ru-RU';
      onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      start() {
        setTimeout(() => {
          this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Я опоздал и все смеялись' } }] });
          this.onend?.();
        }, 100);
      }
      stop() { this.onend?.(); }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  await page.goto('/');

  // Start recording — mock auto-completes after 100ms
  await page.click('button:has-text("Говорить")', { force: true });

  // Wait for reframing result (mock fires onresult + onend automatically)
  await expect(page.getByText('Не всё так страшно.')).toBeVisible({ timeout: 5000 });

  // Click "Копнуть глубже" to start deep analysis
  await page.click('button:has-text("Копнуть глубже")', { force: true });

  // Mock auto-completes the deep recording — wait for Vertical Arrow
  await expect(page.getByText('Вертикальная стрелка')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Вертикальная стрелка')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Поверхностная мысль')).toBeVisible();
  await expect(page.getByText('Промежуточная')).toBeVisible();
  await expect(page.getByText('Глубинное убеждение')).toBeVisible();
  await expect(page.getByText('Я опоздал')).toBeVisible();
  await expect(page.getByText('Я безответственный')).toBeVisible();
  await expect(page.getByText('Я недостаточно хорош')).toBeVisible();
});
