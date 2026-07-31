import { test, expect } from '@playwright/test';

test('studio multi-agent flow shows takeaway then two lenses', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    // Force text input path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });

  await page.route('**/api/reframe', async (route) => {
    const request = route.request();
    const post = request.postDataJSON() as { agents?: string[] };
    if (post.agents) {
      const events = [
        {
          agent: 'burns',
          name: 'Д-р Бёрнс',
          status: 'ok',
          payload: {
            distortions: [{ type: 'Чтение мыслей', thought: 'все думают', why: 'не знаешь' }],
            reframing: 'Опоздание — факт. Остальное — интерпретация.',
            question: 'Что бы сказал другу?',
          },
        },
        {
          agent: 'stoic',
          name: 'Стоик',
          status: 'ok',
          payload: { text: 'Мнение других вне контроля. В контроле — следующий шаг.' },
        },
        {
          agent: 'consensus',
          name: 'Что унести',
          status: 'ok',
          payload: { text: 'Проблема в интерпретации, не в факте.' },
        },
      ];
      const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify({ reframing: 'v1', distortions: [], question: '?' })}\n\n`,
    });
  });

  await page.goto('/studio');
  await expect(page.getByTestId('studio-screen')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Два взгляда' })).toBeVisible();
  await expect(page.getByTestId('studio-example')).toBeVisible();
  await expect(page.getByPlaceholder('Одна ситуация своими словами...')).toBeVisible();

  await page.getByPlaceholder('Одна ситуация своими словами...').fill('Я опоздал, все думают что я безответственный');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByTestId('consensus-view')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Что унести')).toBeVisible();
  await expect(page.getByText('Проблема в интерпретации, не в факте.')).toBeVisible();
  await expect(page.getByTestId('agent-card-burns')).toBeVisible();
  await expect(page.getByTestId('agent-card-stoic')).toBeVisible();
  await expect(page.getByText('искажения и перефраз')).toBeVisible();
  await expect(page.getByText('что в контроле / что отпустить')).toBeVisible();
  await expect(page.getByText('Опоздание — факт. Остальное — интерпретация.')).toBeVisible();
  await expect(page.getByText('Мнение других вне контроля. В контроле — следующий шаг.')).toBeVisible();
  await expect(page.getByTestId('studio-again')).toHaveText('Понял · ещё раз');
  await expect(page.getByTestId('studio-to-diary')).toBeVisible();

  // Hero takeaway appears before agent cards in DOM order
  const consensusBox = await page.getByTestId('consensus-view').boundingBox();
  const burnsBox = await page.getByTestId('agent-card-burns').boundingBox();
  expect(consensusBox).toBeTruthy();
  expect(burnsBox).toBeTruthy();
  expect(consensusBox!.y).toBeLessThan(burnsBox!.y);
});

test('v1 home still works and links to studio', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Reframe' })).toBeVisible();
  await expect(page.getByTestId('studio-discovery')).toHaveText(/Два взгляда на ситуацию/);
  await page.getByTestId('studio-discovery').click();
  await expect(page).toHaveURL(/\/studio/);
  await expect(page.getByTestId('studio-screen')).toBeVisible();
  await page.getByTestId('back-to-diary').click();
  await expect(page).toHaveURL('/');
});

test('studio voice stop waits for async transcript then shows review', async ({ page }) => {
  // Reproduce the race: final transcript arrives only after recognition.stop()
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
        // Interim only while listening — no final yet
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: false, 0: { transcript: 'Я опоздал на встречу' } }],
          });
        }, 30);
      }
      stop() {
        // Final result arrives after stop(), then onend — matches real Web Speech API
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: true, 0: { transcript: 'Я опоздал на встречу' } }],
          });
          this.onend?.(new Event('end'));
        }, 20);
      }
      abort() {}
    }
    (window as Record<string, unknown>).SpeechRecognition = MockRecognition;
    (window as Record<string, unknown>).webkitSpeechRecognition = MockRecognition;
  });

  await page.route('**/api/reframe', async (route) => {
    const events = [
      {
        agent: 'burns',
        name: 'Д-р Бёрнс',
        status: 'ok',
        payload: {
          distortions: [{ type: 'Чтение мыслей', thought: 'все думают', why: 'не знаешь' }],
          reframing: 'Опоздание — факт.',
          question: '?',
        },
      },
      {
        agent: 'stoic',
        name: 'Стоик',
        status: 'ok',
        payload: { text: 'Мнение других вне контроля.' },
      },
      {
        agent: 'consensus',
        name: 'Что унести',
        status: 'ok',
        payload: { text: 'Проблема в интерпретации.' },
      },
    ];
    const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
  });

  await page.goto('/studio');
  await expect(page.getByTestId('studio-screen')).toBeVisible();

  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Говорить'))?.click();
  });
  await page.waitForTimeout(80);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Стоп'))?.click();
  });

  // Must reach review with transcript (would fail with immediate getFinalText after stop)
  await expect(page.getByText('Я опоздал на встречу')).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();

  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page.getByTestId('agent-card-burns')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('consensus-view')).toBeVisible();
});
