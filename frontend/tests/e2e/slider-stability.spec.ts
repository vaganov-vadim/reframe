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
