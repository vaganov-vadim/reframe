import { test, expect } from '@playwright/test';

test('studio multi-agent flow shows two cards and consensus', async ({ page }) => {
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
          name: 'Что общего',
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
  await expect(page.getByPlaceholder('Опишите ситуацию...')).toBeVisible();

  await page.getByPlaceholder('Опишите ситуацию...').fill('Я опоздал, все думают что я безответственный');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByTestId('agent-card-burns')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('agent-card-stoic')).toBeVisible();
  await expect(page.getByText('Опоздание — факт. Остальное — интерпретация.')).toBeVisible();
  await expect(page.getByText('Мнение других вне контроля. В контроле — следующий шаг.')).toBeVisible();
  await expect(page.getByTestId('consensus-view')).toBeVisible();
  await expect(page.getByText('Проблема в интерпретации, не в факте.')).toBeVisible();
});

test('v1 home still works and links to studio', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Reframe' })).toBeVisible();
  await expect(page.getByTestId('studio-discovery')).toBeVisible();
  await page.getByTestId('studio-discovery').click();
  await expect(page).toHaveURL(/\/studio/);
  await expect(page.getByTestId('studio-screen')).toBeVisible();
  await page.getByTestId('back-to-diary').click();
  await expect(page).toHaveURL('/');
});
