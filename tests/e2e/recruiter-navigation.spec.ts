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
  await expect(page.getByRole('button', { name: 'Mở menu nhà tuyển dụng', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('sidebar expands and collapses on desktop and uses a keyboard accessible mobile drawer', async ({ page }) => {
  await page.goto('/recruiter/dashboard');
  const frame = page.locator('.recruiter-app[data-sidebar]');
  const sidebar = page.locator('#recruiter-desktop-sidebar');
  await expect(frame).toHaveAttribute('data-sidebar', 'collapsed');
  await expect(sidebar).toHaveCSS('width', '76px');
  const toggle = page.getByRole('button', { name: 'Mở rộng sidebar', exact: true });
  await expect(sidebar.getByRole('button', { name: 'Mở rộng sidebar', exact: true })).toBeVisible();
  const logo = page.locator('.recruiter-header > .recruiter-brand');
  await expect(logo).toHaveCSS('width', '148px');
  const logoBounds = await logo.boundingBox();
  const toggleBounds = await toggle.boundingBox();
  expect(toggleBounds!.y).toBeGreaterThanOrEqual(logoBounds!.y + logoBounds!.height);
  const sidebarBounds = await sidebar.boundingBox();
  expect(toggleBounds!.x + toggleBounds!.width / 2).toBe(sidebarBounds!.x + sidebarBounds!.width);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(sidebar).toHaveCSS('width', '208px');
  await expect(page.getByRole('button', { name: 'Thu gọn sidebar', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await sidebar.getByRole('link', { name: 'Tin đăng', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/jobs');
  await expect(frame).toHaveAttribute('data-sidebar', 'expanded');
  await page.getByRole('button', { name: 'Thu gọn sidebar', exact: true }).click();
  await expect(sidebar).toHaveCSS('width', '76px');
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(sidebar).toBeHidden();
  const mobileToggle = page.getByRole('button', { name: 'Mở menu nhà tuyển dụng', exact: true });
  await mobileToggle.click();
  const drawer = page.getByRole('dialog', { name: 'Menu nhà tuyển dụng', exact: true });
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(mobileToggle).toBeFocused();
  await mobileToggle.click();
  await drawer.getByRole('link', { name: 'Ứng viên', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/candidates');
  await expect(drawer).toBeHidden();
  await mobileToggle.click();
  await drawer.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await expect(drawer).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
