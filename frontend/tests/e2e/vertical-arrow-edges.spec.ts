import { test, expect } from '@playwright/test';

// ─── Test 1: Deep recording with empty text → returns to result phase ──────

test('deep recording with empty text returns to result phase', async ({ page }) => {
  // Mock API: always return a valid reframe response
  await page.route('**/api/reframe', async (route) => {
    const body = {
      distortions: [{ type: 'Катастрофизация', thought: 'test', why: 'test' }],
      reframing: 'ok',
      question: '?',
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });

  // Mock SpeechRecognition: first call produces text, second call produces empty
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    let callCount = 0;
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
      onend: (() => void) | null = null;

      start() {
        if (callCount === 0) {
          // First recording: produce text after delay, do NOT fire onend
          // (onend fires later via stop() — keeps recording "active" for the test)
          setTimeout(() => {
            this.onresult?.({
              resultIndex: 0,
              results: [{ isFinal: true, 0: { transcript: 'test' } }],
            });
          }, 50);
        }
        // Second call (deep): do NOTHING — no onresult, no onend in start()
        // (onend fires later via stop(), producing empty transcript)
        callCount++;
      }

      stop() {
        this.onend?.();
      }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  await page.goto('/');

  // Main recording — mock auto-completes after 50ms
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(300);
  await page.click('button:has-text("Стоп")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Отправить")', { force: true });

  // Wait for result phase
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });

  // Click "Копнуть глубже" to start deep recording
  await page.locator('button:has-text("Копнуть глубже")').dispatchEvent('click');
  await page.waitForTimeout(200);

  // Stop deep recording — mock fires onend with no onresult → empty text
  // Use dispatchEvent to avoid TabBar (fixed bottom, z-index 100) intercepting the click
  await page.locator('button:has-text("Стоп")').dispatchEvent('click');
  await page.waitForTimeout(500);

  // Should see error "Не расслышал" and still see the original result
  await expect(page.getByText(/не расслышал/i)).toBeVisible({ timeout: 3000 });
  await expect(page.getByText('Катастрофизация')).toBeVisible();
});

// ─── Test 2: Deep API failure → retry from result phase ────────────────────

test('deep API failure allows retry from result phase', async ({ page }) => {
  // Mock API: first call succeeds, all subsequent calls fail with 502
  let apiCallCount = 0;
  await page.route('**/api/reframe', async (route) => {
    if (apiCallCount === 0) {
      const body = {
        distortions: [{ type: 'Катастрофизация', thought: 'test', why: 'test' }],
        reframing: 'ok',
        question: '?',
      };
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify(body)}\n\n`,
      });
    } else {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'bad gateway' }),
      });
    }
    apiCallCount++;
  });

  // Mock SpeechRecognition: always produces text (for both main and deep).
  // onresult fires via setTimeout, but onend only fires via stop() — keeps
  // recording "active" for the test to click "Стоп".
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
      onend: (() => void) | null = null;

      start() {
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: true, 0: { transcript: 'test' } }],
          });
        }, 50);
      }

      stop() {
        this.onend?.();
      }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  await page.goto('/');

  // First recording
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(300);
  await page.click('button:has-text("Стоп")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Отправить")', { force: true });

  // Wait for result
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });

  // Start deep recording — API will fail (second call)
  await page.locator('button:has-text("Копнуть глубже")').dispatchEvent('click');
  await page.waitForTimeout(300);
  // Use dispatchEvent to avoid TabBar intercepting the click
  await page.locator('button:has-text("Стоп")').dispatchEvent('click');
  await page.waitForTimeout(500);

  // Should see error banner with "Не получилось" and retry button
  await expect(page.getByText(/не получилось/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();

  // Click retry — re-sends original text, API fails with 502, but original result stays visible
  await page.click('button:has-text("Повторить")', { force: true });
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 3000 });
});

// ─── Test 3: Navigate away during deep recording → session persists ────────

test('session survives navigation during deep recording', async ({ page }) => {
  // Mock API: return valid response
  const body = {
    distortions: [{ type: 'Катастрофизация', thought: 'test', why: 'test' }],
    reframing: 'ok',
    question: '?',
  };
  await page.route('**/api/reframe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });

  // Mock SpeechRecognition: both calls produce text (onresult via setTimeout,
  // onend only via stop() — keeps recording "active").
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
      onend: (() => void) | null = null;

      start() {
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: true, 0: { transcript: 'test' } }],
          });
        }, 50);
      }

      stop() {
        this.onend?.();
      }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  await page.goto('/');

  // Main recording
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(300);
  await page.click('button:has-text("Стоп")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Отправить")', { force: true });

  // Wait for result
  await expect(page.getByText('Катастрофизация')).toBeVisible({ timeout: 5000 });

  // Click "Копнуть глубже" to enter deep-recording phase
  await page.locator('button:has-text("Копнуть глубже")').dispatchEvent('click');
  await page.waitForTimeout(200);

  // Verify we're in deep-recording phase
  await expect(page.getByText(/Что эта мысль говорит о вас/i)).toBeVisible({ timeout: 3000 });

  // Navigate to /progress via TabBar
  await page.click('a:has-text("Прогресс")', { force: true });
  await page.waitForTimeout(500);

  // Navigate back to main with full page reload (simulates real navigation)
  await page.goto('/');

  // After navigation during deep recording and coming back,
  // session should return to result phase (not restore recording)
  await expect(page.getByText(/копнуть глубже/i)).toBeVisible();
  // Deep recording UI should NOT be visible
  await expect(page.getByText(/Что эта мысль говорит о вас/i)).not.toBeVisible();
});
