import { expect, test } from '@playwright/test';

test('personal panel stays visible and scrolls internally on desktop, then flows normally on mobile', async ({ page }, info) => {
  await page.goto('/recruiter/candidates');
  await page.locator('.candidate-detail-link').first().click();
  const panel = page.locator('.candidate-personal-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS('position', 'sticky');
  await page.evaluate(() => scrollTo(0, 220));
  const first = await panel.boundingBox();
  await page.evaluate(() => scrollTo(0, 520));
  const second = await panel.boundingBox();
  expect(second!.y).toBeCloseTo(first!.y, 0);
  expect(second!.y).toBeGreaterThanOrEqual(72);
  expect(await panel.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await panel.evaluate(element => { element.scrollTop = 100; });
  expect(await panel.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('sticky-profile-desktop.png') });
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(panel).toHaveCSS('position', 'static');
  await expect(panel).toHaveCSS('max-height', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
