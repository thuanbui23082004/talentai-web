import { expect, test } from '@playwright/test';

const screens = [
  ['dashboard', '.stats-dashboard'], ['jobs', '.jobs-page'], ['jobs/new', '.create-job-page'],
  ['candidates', '.candidates-page'], ['candidates/pipeline', '.pipeline-page'], ['interviews', '.interview-page'],
  ['account', '.settings-page'], ['company', '.settings-page'], ['services', '.service-portal'],
  ['pricing', '.service-portal'], ['promotions', '.service-portal'], ['help', '.recruiter-help'], ['inbox', '.inbox-page'],
] as const;

for (const width of [360, 1440, 1920]) {
  test(`recruiter screens use the available content width and fit at ${width}px`, async ({ page }, info) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 1000 });
    for (const [route, selector] of screens) {
      await page.goto(`/recruiter/${route}`);
      const content = page.locator(selector).first();
      await expect(content).toBeVisible({ timeout: 30000 });
      await expect(page.locator('main .candidate-skeleton, main .interview-loading, main .stats-skeleton, main .settings-skeleton')).toHaveCount(0, { timeout: 30000 });
      const main = await page.locator('.recruiter-main').boundingBox();
      const box = await content.boundingBox();
      const gutter = width <= 640 ? 16 : 24;
      const expected = Math.min(1600, main!.width - 2 * gutter);
      expect(box!.width, route).toBeCloseTo(expected, 0);
      expect(box!.x - main!.x, route).toBeCloseTo((main!.width - expected) / 2, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
      if (width === 1920 && ['dashboard', 'jobs/new', 'company', 'inbox', 'candidates'].includes(route)) {
        if (route === 'inbox') await page.locator('.mail-row-main').first().click();
        await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}-${width}.png`), fullPage: true });
      }
    }
  });
}

test('job and candidate detail pages use the same frame as their lists', async ({ page }, info) => {
  test.setTimeout(120000);
  const details: [string, string][] = [];
  await page.goto('/recruiter/jobs');
  await expect(page.locator('.detail-card-link').first()).toBeVisible();
  const job = (await page.locator('.detail-card-link').first().getAttribute('href'))!;
  details.push([job, '.recruiter-job-detail-page'], [`${job}/edit`, '.create-job-page']);
  await page.goto('/recruiter/candidates');
  await expect(page.locator('.candidate-detail-link').first()).toBeVisible();
  details.push([(await page.locator('.candidate-detail-link').first().getAttribute('href'))!, '.candidate-detail-page']);
  for (const width of [1920, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [route, selector] of details) {
      await page.goto(route);
      const content = page.locator(selector).first();
      await expect(content).toBeVisible({ timeout: 30000 });
      const box = await content.boundingBox();
      const main = await page.locator('.recruiter-main').boundingBox();
      expect(box!.width).toBeCloseTo(Math.min(1600, main!.width - (width <= 640 ? 32 : 48)), 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
      if (width === 1920 && !route.endsWith('/edit')) await page.screenshot({ path: info.outputPath(`${selector.slice(1)}-${width}.png`), fullPage: true });
    }
  }
});

test('dashboard chart labels keep their proportions as the content width changes', async ({ page }, info) => {
  await page.goto('/recruiter/dashboard');
  const chart = page.locator('.dashboard-line-chart');
  await expect(chart).toBeVisible();
  for (const width of [360, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect.poll(() => chart.evaluate(element => {
      const matrix = (element as SVGSVGElement).getScreenCTM();
      return matrix ? Math.abs(matrix.a - matrix.d) + Math.abs(matrix.a - 1) : 1;
    })).toBeLessThan(0.01);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('dashboard-wide-proportions.png'), fullPage: true });
});
