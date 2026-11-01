import { expect, test } from './recruiter-fixture';

test('explicit candidate detail links work in cards and table', async ({ page }) => {
  await page.goto('/recruiter/candidates');
  const detail = page.getByRole('link', { name: 'Xem chi tiết ứng viên Mai An', exact: true });
  await expect(detail).toBeVisible({ timeout: 30000 });
  await detail.click();
  await expect(page.getByRole('heading', { name: 'Mai An', exact: true })).toBeVisible();
  await page.locator('.candidate-detail-back').click();
  await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Thao tác', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Xem chi tiết ứng viên Mai An', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mai An', exact: true })).toBeVisible();
});

test('shared sidebar remains fixed through scrolling on every recruiter screen', async ({ page }) => {
  const appId = '00000000-0000-4000-9000-000000000001';
  const jobId = '00000000-0000-4000-8000-000000000201';
  for (const route of ['dashboard', 'jobs', `jobs/${jobId}`, 'jobs/new', 'candidates', `candidates/${appId}`]) {
    await page.goto(`/recruiter/${route}`);
    const sidebar = page.locator('.recruiter-sidebar:visible');
    await expect(sidebar).toHaveCSS('position', 'fixed');
    const before = await sidebar.boundingBox();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(async () => (await sidebar.boundingBox())?.y).toBe(before?.y);
    await expect(sidebar.locator('.sidebar-bottom')).toBeInViewport();
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/recruiter/candidates');
  await expect(page.getByRole('link', { name: 'Xem chi tiết ứng viên Mai An', exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.recruiter-sidebar:visible')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
