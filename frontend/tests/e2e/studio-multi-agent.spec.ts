import { test, expect } from '@playwright/test';

test('studio quiet input, takeaway, follow-up updates hero, then Понял', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });

  await page.route('**/api/reframe', async (route) => {
    const post = route.request().postDataJSON() as {
      agents?: string[];
      mode?: string;
      text?: string;
    };
    if (post.mode === 'studio-followup') {
      const event = {
        agent: 'consensus',
        name: 'Что унести',
        status: 'ok',
        payload: { text: 'С учётом ответа: проверяй факты, не догадки.' },
      };
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify(event)}\n\n`,
      });
      return;
    }
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
  await expect(page.getByRole('heading', { name: 'Побрейншторм' })).toBeVisible();
  await expect(page.getByTestId('studio-example')).toHaveCount(0);
  await expect(page.getByPlaceholder(/опоздал на созвон/)).toBeVisible();

  await page.getByPlaceholder(/опоздал на созвон/).fill('Я опоздал, все думают что я безответственный');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByTestId('consensus-view')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Проблема в интерпретации, не в факте.')).toBeVisible();
  await expect(page.getByTestId('agent-burns-more')).toBeVisible();
  await expect(page.getByText('Чтение мыслей')).toHaveCount(0);

  await expect(page.getByTestId('studio-followup-question')).toHaveText('Что бы сказал другу?');
  await page.getByPlaceholder('Короткий ответ...').fill('Что можно проверить, а не догадки');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByText('С учётом ответа: проверяй факты, не догадки.')).toBeVisible({
    timeout: 5000,
  });
  await expect(page.getByTestId('studio-again')).toHaveText('Понял');
  await expect(page.getByTestId('studio-to-diary')).toHaveCount(0);
});

test('studio skip follow-up goes to Понял without second request', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });

  let followupCalls = 0;
  await page.route('**/api/reframe', async (route) => {
    const post = route.request().postDataJSON() as { agents?: string[]; mode?: string };
    if (post.mode === 'studio-followup') {
      followupCalls += 1;
      await route.fulfill({ status: 500, body: 'should not be called' });
      return;
    }
    const events = [
      {
        agent: 'burns',
        name: 'Д-р Бёрнс',
        status: 'ok',
        payload: {
          distortions: [],
          reframing: 'Факт.',
          question: 'Вопрос?',
        },
      },
      {
        agent: 'stoic',
        name: 'Стоик',
        status: 'ok',
        payload: { text: 'Контроль.' },
      },
      {
        agent: 'consensus',
        name: 'Что унести',
        status: 'ok',
        payload: { text: 'Первый вывод.' },
      },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(''),
    });
  });

  await page.goto('/studio');
  await page.getByPlaceholder(/опоздал на созвон/).fill('Ситуация');
  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page.getByText('Первый вывод.')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('studio-skip-followup').click();
  await expect(page.getByTestId('studio-again')).toHaveText('Понял');
  expect(followupCalls).toBe(0);
});

test('v1 home still works and links to studio', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Reframe' })).toBeVisible();
  await expect(page.getByTestId('studio-discovery')).toHaveText(/Побрейнштормить/);
  await page.getByTestId('studio-discovery').click();
  await expect(page).toHaveURL(/\/studio/);
  await expect(page.getByTestId('studio-screen')).toBeVisible();
  await page.getByTestId('back-to-diary').click();
  await expect(page).toHaveURL('/');
});

test('studio voice stop waits for async transcript then shows review', async ({ page }) => {
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
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: false, 0: { transcript: 'Я опоздал на встречу' } }],
          });
        }, 30);
      }
      stop() {
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

  await expect(page.getByText('Я опоздал на встречу')).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();

  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page.getByTestId('agent-card-burns')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('consensus-view')).toBeVisible();
});
