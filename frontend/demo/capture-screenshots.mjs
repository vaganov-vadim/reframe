/**
 * Capture 6 demo screenshots of the Reframe app for investor presentation.
 *
 * Usage:  node demo/capture-screenshots.mjs
 * Requires: Playwright (devDep), gifski (brew), Vite dev server or auto-started.
 * Output: frontend/demo/*.png + frontend/demo/demo.gif
 */

import { chromium } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = join(__dirname);
const BASE = 'http://localhost:5173';

if (!existsSync(DEMO_DIR)) mkdirSync(DEMO_DIR, { recursive: true });

const STEPS = [
  '01-onboarding',
  '02-main-screen',
  '03-recording',
  '04-result',
  '05-history',
  '06-progress',
];

// ── Helpers ─────────────────────────────────────────────────────────

function mockRecognitionScript(partialText, finalText, partialDelay, finalDelay, autoStop) {
  return `
window.__MOCK_PARTIAL=${JSON.stringify(partialText)};
window.__MOCK_FINAL=${JSON.stringify(finalText)};
window.__MOCK_PD=${partialDelay};
window.__MOCK_FD=${finalDelay};
window.__MOCK_AS=${autoStop};
window.SpeechRecognition = class {
  continuous=true; interimResults=true; lang='ru-RU';
  onresult=null; onerror=null; onend=null;
  start() {
    var self = this;
    var partial = window.__MOCK_PARTIAL;
    var final = window.__MOCK_FINAL;
    setTimeout(function() {
      if(self.onresult) {
        self.onresult({
          resultIndex: 0,
          results: [{ isFinal: false, 0: { transcript: partial } }]
        });
      }
    }, window.__MOCK_PD);
    setTimeout(function() {
      if(self.onresult) {
        self.onresult({
          resultIndex: 0,
          results: [{ isFinal: true, 0: { transcript: final } }]
        });
      }
      if(window.__MOCK_AS) setTimeout(function(){if(self.onend)self.onend()},100);
    }, window.__MOCK_FD);
  }
  stop() {
    var self = this;
    setTimeout(function(){if(self.onend)self.onend()},10);
  }
  abort() {}
};
window.webkitSpeechRecognition = window.SpeechRecognition;
`;
}

function seedSessionsScript() {
  return `
    localStorage.setItem('reframe_onboarding','true');
    localStorage.setItem('reframe_sessions',JSON.stringify([
      {"id":"1","date":"2026-07-20T10:30:00","anxietyBefore":8,"anxietyAfter":5,"delta":3,"distortion":"Катастрофизация","reframing":"Ситуация не так страшна, как кажется."},
      {"id":"2","date":"2026-07-19T14:00:00","anxietyBefore":7,"anxietyAfter":4,"delta":3,"distortion":"Чтение мыслей","reframing":"Вы не можете знать, что думают другие."},
      {"id":"3","date":"2026-07-18T09:15:00","anxietyBefore":6,"anxietyAfter":6,"delta":0,"distortion":"Долженствование","reframing":"Нет обязательного стандарта, которому вы должны соответствовать."},
      {"id":"4","date":"2026-07-17T16:45:00","anxietyBefore":9,"anxietyAfter":3,"delta":6,"distortion":"Чёрно-белое мышление","reframing":"Между провалом и успехом есть много промежуточных состояний."},
      {"id":"5","date":"2026-07-16T11:20:00","anxietyBefore":5,"anxietyAfter":2,"delta":3,"distortion":"Сверхобобщение","reframing":"Один случай не формирует тенденцию."}
    ]));
  `;
}

function setupApiMock(page) {
  return page.route('**/api/reframe', async (route) => {
    const body = {
      distortions: [
        { type: 'Катастрофизация', thought: 'всё пропало', why: 'Вы представили худший сценарий как неизбежный' },
        { type: 'Чтение мыслей', thought: 'все осуждают', why: 'Вы решили, что знаете мысли других людей' },
        { type: 'Чёрно-белое мышление', thought: 'я всё испортил', why: 'Вы видите ситуацию только в крайностях' },
      ],
      reframing: 'Опоздание на встречу — неприятный инцидент, но он не определяет вашу ценность как профессионала. Большинство коллег, вероятно, даже не обратили внимания на время вашего прихода. Завтра — новый день, и вы можете начать с чистого листа.',
      question: 'Что бы вы сказали другу, который оказался в такой же ситуации?',
      pattern: 'Перфекционизм в рабочих ситуациях',
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'cache-control': 'no-cache', connection: 'keep-alive' },
      body: `data: ${JSON.stringify(body)}\n\n`,
    });
  });
}

function newCtx(browser) {
  return browser.newContext({ viewport: { width: 480, height: 896 }, deviceScaleFactor: 2, locale: 'ru-RU' });
}

async function gotoWithRetry(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`  ↻ goto retry ${i + 1}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// ── Capture ────────────────────────────────────────────────────────

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1. Onboarding
  console.log('📸 1/6 Onboarding...');
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    await gotoWithRetry(page, BASE);
    await page.waitForTimeout(500);
    await page.waitForSelector('text=Добро пожаловать в Reframe', { timeout: 10000 });
    await page.screenshot({ path: join(DEMO_DIR, '01-onboarding.png') });
    await ctx.close();
  }

  // 2. Main screen with slider + record button
  console.log('📸 2/6 Main screen...');
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    await page.addInitScript({ content: mockRecognitionScript('x', 'x', 99999, 99999, false) });
    await page.addInitScript({ content: seedSessionsScript() });
    await gotoWithRetry(page, BASE);
    await page.waitForSelector('button:has-text("Говорить")', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(DEMO_DIR, '02-main-screen.png') });
    await ctx.close();
  }

  // 3. Recording state (pulsing ring + live text)
  console.log('📸 3/6 Recording state...');
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    // Long final delay — stays recording with partial text visible
    await page.addInitScript({ content: mockRecognitionScript('Я сегодня опоздал на важную встречу и все коллеги', 'DONE', 200, 99999, false) });
    await page.addInitScript({ content: seedSessionsScript() });
    await gotoWithRetry(page, BASE);
    await page.waitForSelector('button:has-text("Говорить")', { timeout: 10000 });
    await page.click('button:has-text("Говорить")', { force: true });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(DEMO_DIR, '03-recording.png') });
    await ctx.close();
  }

  // 4. Result (distortions + reframing displayed)
  console.log('📸 4/6 Result...');
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();

    await page.addInitScript({ content: mockRecognitionScript('Я опоздал на встречу', 'Я опоздал на встречу и все смотрели на меня осуждающе', 50, 150, false) });
    await page.addInitScript({ content: seedSessionsScript() });
    await setupApiMock(page);
    await gotoWithRetry(page, BASE);
    await page.click('button:has-text("Говорить")', { force: true });
    await page.waitForTimeout(600);
    await page.click('button:has-text("Стоп")', { force: true });
    await page.waitForSelector('text=Катастрофизация', { timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(DEMO_DIR, '04-result.png'), fullPage: false });
    await ctx.close();
  }

  // 5. History tab with saved sessions
  console.log('📸 5/6 History...');
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    await page.addInitScript({ content: seedSessionsScript() });
    await gotoWithRetry(page, `${BASE}/history`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(DEMO_DIR, '05-history.png') });
    await ctx.close();
  }

  // 6. Progress tab with summary
  console.log('📸 6/6 Progress...');
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    await page.addInitScript({ content: seedSessionsScript() });
    await gotoWithRetry(page, `${BASE}/progress`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(DEMO_DIR, '06-progress.png') });
    await ctx.close();
  }

  await browser.close();
  console.log('✅ All 6 screenshots captured!');
}

// ── Stitch GIF ─────────────────────────────────────────────────────

async function stitchGif() {
  console.log('🎬 Stitching GIF with gifski...');
  const output = join(DEMO_DIR, 'demo.gif');
  const files = STEPS.map((s) => join(DEMO_DIR, `${s}.png`));

  try {
    execSync(
      `gifski --fps 0.5 --width 480 --quality 90 --output ${JSON.stringify(output)} ${files.map(f => JSON.stringify(f)).join(' ')}`,
      { stdio: 'inherit', timeout: 30000 },
    );
    console.log(`✅ GIF created: ${output}`);
  } catch (e) {
    console.error('⚠️ gifski failed:', e.message);
    console.log('  Trying ffmpeg fallback...');
    try {
      const pat = join(DEMO_DIR, '*.png');
      execSync(
        `ffmpeg -y -framerate 0.5 -pattern_type glob -i ${JSON.stringify(pat)} -vf "fps=1,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer" ${JSON.stringify(output)}`,
        { stdio: 'inherit', timeout: 30000 },
      );
      console.log(`✅ GIF created via ffmpeg: ${output}`);
    } catch (e2) {
      console.error('❌ ffmpeg also failed:', e2.message);
    }
  }
}

// ── Auto-start Vite ────────────────────────────────────────────────

async function ensureVite() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'dev'], {
      cwd: join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    let started = false;
    const onData = (data) => {
      const txt = data.toString();
      if (txt.includes('Local:') && !started) { started = true; resolve(proc); }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => { if (!started) resolve(proc); }, 10000);
  });
}

async function main() {
  console.log('🔧 Checking if Vite dev server is running...');
  const http = await import('http');
  let viteProc = null;

  try {
    await new Promise((resolve, reject) => {
      const req = http.get(`${BASE}/`, (res) => { res.resume(); resolve(); });
      req.on('error', reject);
      req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
    });
    console.log('  Vite is already running.');
  } catch {
    console.log('  Starting Vite dev server...');
    viteProc = await ensureVite();
    console.log('  Vite started.');
  }

  try {
    await capture();
    await stitchGif();
    console.log('\n✅ Done! Files in frontend/demo/:');
    for (const s of STEPS) {
      const p = join(DEMO_DIR, `${s}.png`);
      const size = existsSync(p) ? `${Math.round((await import('fs')).statSync(p).size / 1024)} KB` : 'missing';
      console.log(`  ${s}.png  (${size})`);
    }
    const gifPath = join(DEMO_DIR, 'demo.gif');
    if (existsSync(gifPath)) {
      console.log(`  demo.gif (${Math.round((await import('fs')).statSync(gifPath).size / 1024)} KB)`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (viteProc) process.kill(-viteProc.pid);
  }
}

main();
