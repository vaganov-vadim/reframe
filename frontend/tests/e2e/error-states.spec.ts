import { test, expect } from '@playwright/test';

/** Shared mock for SpeechRecognition — sends "test" transcript after 50ms */
function mockSpeechWithText() {
  return async ({ page }: { page: ReturnType<typeof test['info']>['page'] }) => {
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
  };
}

/** Shared mock for SpeechRecognition — empty transcript (simulates silence) */
function mockSpeechEmpty() {
  return async ({ page }: { page: ReturnType<typeof test['info']>['page'] }) => {
    await page.addInitScript(() => {
      localStorage.setItem('reframe_onboarding', 'true');
      class MockRecognition {
        continuous = true; interimResults = true; lang = 'ru-RU';
        onresult: ((event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onend: ((event: Event) => void) | null = null;
        start() { /* active — no transcript */ }
        stop() { this.onend?.(); }
        abort() {}
      }
      (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    });
  };
}

// ─── Test 1: Network error → ErrorBanner appears ──────────────────────────

test('Test 1: network error shows ErrorBanner with retry', async ({ page }) => {
  await mockSpeechWithText()({ page });

  // Abort all API calls to simulate network failure
  await page.route('**/api/reframe', (route) => route.abort('failed'));

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });

  await expect(page.getByText(/нет связи/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});

// ─── Test 2: LLM error (502) → ErrorBanner + retry button ─────────────────

test('Test 2: LLM error 502 shows ErrorBanner with retry', async ({ page }) => {
  await mockSpeechWithText()({ page });

  // Return 502 Bad Gateway
  await page.route('**/api/reframe', async (route) => {
    await route.fulfill({ status: 502, contentType: 'text/plain', body: 'Bad Gateway' });
  });

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });

  await expect(page.getByText(/не получилось/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});

// ─── Test 3: Rate limit (429) → ErrorBanner, NO retry button ──────────────

test('Test 3: rate limit 429 shows warning without retry button', async ({ page }) => {
  await mockSpeechWithText()({ page });

  // Return 429 Too Many Requests
  await page.route('**/api/reframe', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: { 'Retry-After': '60' },
      body: JSON.stringify({ error: 'Too Many Requests' }),
    });
  });

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });

  await expect(page.getByText(/многовато запросов/i)).toBeVisible({ timeout: 5000 });
  // Rate-limit → no retry button
  await expect(page.getByRole('button', { name: 'Повторить' })).not.toBeVisible();
});

// ─── Test 4: Empty text after recording → error, return to start ──────────

test('Test 4: empty transcript shows speech error and returns to start', async ({ page }) => {
  await mockSpeechEmpty()({ page });

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });

  await expect(page.getByText(/не расслышал/i)).toBeVisible({ timeout: 5000 });
  // Should be back at the start — record button visible
  await expect(page.getByRole('button', { name: /говорить/i })).toBeVisible();
});

// ─── Test 5: Browser without Speech API → text input ──────────────

test('Test 5: no Speech API shows text input instead of voice button', async ({ page }) => {
  await page.addInitScript(() => {
    delete (window as Record<string, unknown>).SpeechRecognition;
    delete (window as Record<string, unknown>).webkitSpeechRecognition;
  });

  await page.goto('/');
  await expect(page.getByPlaceholder('Опишите, что вас тревожит...')).toBeVisible();
});

// ─── Test 6: Timeout (504) — route hangs beyond 10s client timeout ──────

test('Test 6: request timeout shows server error with retry', async ({ page }) => {
  await mockSpeechWithText()({ page });

  // Hang for 15s — client-side AbortSignal.timeout(10000) fires first
  await page.route('**/api/reframe', async (_route) => {
    await new Promise((r) => setTimeout(r, 15000));
  });

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });

  await expect(page.getByText(/не получилось/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});

// ─── Test 7: Partial SSE response — stream closes mid-JSON ──────────────

test('Test 7: partial SSE response shows structure error', async ({ page }) => {
  await mockSpeechWithText()({ page });

  // SSE that closes before JSON is complete
  await page.route('**/api/reframe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"reframing": "hello',
    });
  });

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });

  await expect(page.getByText(/неожиданная структура ответа/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});

// ─── Test 8: Bad SSE structure — JSON without reframing/error ───────────

test('Test 8: SSE with unrecognised payload shows structure error', async ({ page }) => {
  await mockSpeechWithText()({ page });

  // SSE that parses as valid JSON but lacks expected keys
  await page.route('**/api/reframe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'data: {"garbage":true}\n\n',
    });
  });

  await page.goto('/');
  await page.click('button:has-text("Говорить")', { force: true });
  await page.waitForTimeout(200);
  await page.click('button:has-text("Стоп")', { force: true });

  await expect(page.getByText(/неожиданная структура ответа/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});
