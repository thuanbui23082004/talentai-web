import { expect, test } from './recruiter-fixture';
import { z } from 'zod';
import { interviewSchema } from '@/lib/api/candidate-detail-schemas';

test('recruiter page headings share typography, alignment and spacing', async ({ page }, info) => {
  const headings: { x: number; y: number; height: number; bottom: number }[] = [];
  for (const [route, selector] of [
    ['candidates', '.candidates-page-heading'],
    ['interviews', '.interview-page-heading'],
    ['jobs', '.jobs-page-heading'],
    ['jobs/new', '.create-job-heading'],
    ['candidates/pipeline', '.pipeline-page-heading'],
  ]) {
    await page.goto(`/recruiter/${route}`);
    const header = page.locator(selector);
    await expect(header.locator('h1')).toBeVisible();
    if (route === 'candidates') await expect(page.locator('.candidate-card').first()).toBeVisible();
    if (route === 'interviews') await expect(page.locator('.interview-loading')).toHaveCount(0);
    await expect(header.locator('h1')).toHaveCSS('font-size', '20px');
    await expect(header.locator('h1')).toHaveCSS('font-weight', '700');
    await expect(page.locator('.recruiter-app')).toHaveCSS('font-size', '14px');
    await expect(page.locator('.recruiter-app')).toHaveCSS('font-family', /inter/i);
    const titleBox = await header.locator('h1').boundingBox();
    const headerBox = await header.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    headings.push({ x: titleBox!.x, y: titleBox!.y, height: headerBox!.height, bottom: Number.parseFloat(await header.evaluate(element => getComputedStyle(element).marginBottom)) });
    await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}-desktop.png`) });
  }
  for (const heading of headings) {
    expect(heading.x).toBeCloseTo(headings[0].x, 0);
    expect(heading.y).toBeCloseTo(headings[0].y, 0);
    expect(heading.height).toBeGreaterThanOrEqual(40);
    expect(heading.bottom).toBe(24);
  }
});

test('detail screens remain readable and fit after increasing typography', async ({ page }, info) => {
  const details: string[] = [];
  const csrf = z.object({ csrfToken: z.string() }).parse(await (await page.request.get('/api/bff/auth/csrf')).json());
  const created = await page.request.post('/api/bff/recruiter/interviews', { headers: { 'X-CSRF-Token': csrf.csrfToken }, data: { applicationId: '00000000-0000-4000-9000-000000000003', startTime: '2040-05-28T03:00:00Z', endTime: '2040-05-28T04:00:00Z', mode: 'offline', location: 'Văn phòng kiểm thử', sendInvitation: false } });
  expect(created.status()).toBe(201);
  const interview = interviewSchema.parse(await created.json());
  for (const [route, selector] of [['candidates', '.candidate-detail-link'], ['jobs', '.detail-card-link']]) {
    await page.goto(`/recruiter/${route}`);
    await expect(page.locator('main h1')).toBeVisible({ timeout: 60000 });
    const link = route === 'candidates' ? page.locator(selector).nth(3) : page.locator(selector).first();
    await expect(link).toBeVisible();
    details.push((await link.getAttribute('href'))!);
  }
  details.push(`/recruiter/interviews/${interview.id}`);
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of details) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main h1')).toHaveCSS('font-size', '20px');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
      if (route.includes('/candidates/')) {
        const grid = await page.locator('.candidate-detail-grid').boundingBox();
        const profile = await page.locator('.candidate-personal-panel').boundingBox();
        const center = await page.locator('.candidate-detail-center').boundingBox();
        expect(profile!.width).toBeGreaterThanOrEqual(260);
        expect(center!.width).toBeLessThanOrEqual(grid!.width);
        await page.screenshot({ path: info.outputPath(`candidate-detail-${width}.png`) });
      }
    }
  }
});

test('dashboard calendar weekday labels and dates share aligned rows', async ({ page }, info) => {
  for (const width of [375, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/recruiter/dashboard');
    const calendar = page.locator('.dashboard-calendar:visible');
    await expect(calendar.locator('.dashboard-calendar-days button')).toHaveCount(7);
    const rows = await calendar.locator('.dashboard-calendar-days button').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().top));
    for (const row of rows) expect(row).toBeCloseTo(rows[0], 0);
    const labels = await calendar.locator('.dashboard-calendar-days small').allTextContents();
    expect(labels.every(label => /^(T[2-7]|CN)$/.test(label))).toBe(true);
    await calendar.screenshot({ path: info.outputPath(`calendar-${width}.png`) });
  }
});

test('recruiter screens keep readable text and fit mobile, tablet and desktop', async ({ page }, info) => {
  for (const width of [375, 1024, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['dashboard', 'candidates', 'interviews', 'jobs', 'jobs/new', 'account', 'company', 'pricing', 'promotions', 'help']) {
      await page.goto(`/recruiter/${route}`);
      await expect(page.locator('.recruiter-main:visible')).toBeVisible();
      await expect(page.locator('.recruiter-main:visible').getByRole('heading').first()).toBeVisible();
      await expect(page.locator('main .candidate-skeleton, main .interview-loading, main .stats-skeleton, main .settings-skeleton')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
      const tinyText = await page.locator('.recruiter-main:visible').evaluate(main => Array.from(main.querySelectorAll('p, label, td, th, dt, dd, small, button, input')).filter(element => element.getClientRects().length && Number.parseFloat(getComputedStyle(element).fontSize) < 14).map(element => element.className));
      expect(tinyText, `${route} at ${width}px`).toEqual([]);
      if (width === 375 && ['candidates', 'interviews', 'dashboard', 'jobs/new'].includes(route)) await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}-mobile.png`), fullPage: true });
    }
  }
});
