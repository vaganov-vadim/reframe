import { test, expect } from '@playwright/test';

test('deep recording shows review before send and allows rewrite', async ({ page }) => {
  let deepCalls = 0;
  await page.route('**/api/reframe', async (route) => {
    const req = route.request();
    const post = req.postDataJSON() as { mode?: string } | null;
    if (post?.mode === 'deeper') {
      deepCalls += 1;
      const body = {
        levels: [
          { thought: 'Я опоздал', label: 'Поверхностная мысль' },
          { thought: 'Я безответственный', label: 'Промежуточная' },
          { thought: 'Я недостаточно хорош', label: 'Глубинное убеждение' },
        ],
        reframing: 'Одно опоздание не определяет твою ценность.',
        question: 'Что бы сказал другу?',
      };
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify(body)}\n\n`,
      });
      return;
    }
    const body = {
      distortions: [{ type: 'Катастрофизация', thought: 'всё плохо', why: 'преувеличение' }],
      reframing: 'Не всё так страшно.',
      question: 'Что скажешь другу?',
      action: 'Запиши один факт без ярлыка.',
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });

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
        const transcript =
          callCount === 0 ? 'Я опоздал и все смеялись' : `Глубинная мысль номер ${callCount}`;
        callCount += 1;
        setTimeout(() => {
          this.onresult?.({
            resultIndex: 0,
            results: [{ isFinal: true, 0: { transcript } }],
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
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Говорить'))?.click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Стоп'))?.click();
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Отправить'))?.click();
  });
  await expect(page.getByText('Не всё так страшно.')).toBeVisible({ timeout: 5000 });

  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Копнуть глубже'))?.click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Стоп'))?.click();
  });

  // Review — text visible, API not called yet
  await expect(page.getByText('Глубинная мысль номер 1')).toBeVisible({ timeout: 3000 });
  expect(deepCalls).toBe(0);
  await expect(page.getByRole('button', { name: 'Записать заново' })).toBeVisible();

  // Rewrite once
  await page.getByRole('button', { name: 'Записать заново' }).click();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Стоп'))?.click();
  });
  await expect(page.getByText('Глубинная мысль номер 2')).toBeVisible({ timeout: 3000 });
  expect(deepCalls).toBe(0);

  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent?.includes('Отправить'))?.click();
  });

  await expect(page.getByText('Вертикальная стрелка')).toBeVisible({ timeout: 10000 });
  expect(deepCalls).toBe(1);
  await expect(page.getByTestId('listen-va-reframing')).toBeVisible();
});
