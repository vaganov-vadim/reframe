import { test, expect } from '@playwright/test';

test('slider labels fixed across refreshes', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('reframe_onboarding', 'true'); });
  
  const positions: number[] = [];
  for (let i = 0; i < 3; i++) {
    await page.goto('/');
    await page.waitForTimeout(500);
    const box = await page.getByText('спокойно', { exact: true }).boundingBox();
    positions.push(box?.x ?? 0);
  }
  
  const first = positions[0];
  for (let i = 1; i < positions.length; i++) {
    expect(Math.abs(positions[i] - first)).toBeLessThanOrEqual(1);
  }
});

test('slider input stacks above custom track', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reframe_onboarding', 'true');
  });
  await page.goto('/');

  const stacking = await page.locator('input[type="range"]').evaluate((el) => {
    const style = getComputedStyle(el);
    const track = el.nextElementSibling as HTMLElement | null;
    const trackZ = track ? getComputedStyle(track).zIndex : null;
    return {
      inputZ: style.zIndex,
      inputPosition: style.position,
      trackZ,
    };
  });

  expect(stacking.inputPosition).toBe('relative');
  expect(Number(stacking.inputZ)).toBeGreaterThan(Number(stacking.trackZ ?? 0));
});
