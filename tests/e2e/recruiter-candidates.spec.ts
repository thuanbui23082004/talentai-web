import { expect, test } from '@playwright/test';

test('candidate cards, table, API pagination and search', async ({ page }, info) => {
  await page.goto('/recruiter/candidates');
  await expect(page.locator('.candidate-card')).toHaveCount(9, { timeout: 30000 });
  await expect(page.getByText('Tổng hồ sơ: 27 hồ sơ')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mai An', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('candidates-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
  await expect(page.locator('.candidates-list-table tbody tr')).toHaveCount(9);
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hải Nam', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Tìm kiếm ứng viên', exact: true }).fill('bao minh');
  await expect(page.locator('.candidates-list-table tbody tr')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Bảo Minh', exact: true })).toBeVisible();
  await expect(page).toHaveURL('/recruiter/candidates');
  await page.getByRole('textbox', { name: 'Tìm kiếm ứng viên', exact: true }).fill('Không có ứng viên này');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy ứng viên', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).first().click();
  await page.getByRole('button', { name: 'Thẻ', exact: true }).click();
  await expect(page.locator('.candidate-card')).toHaveCount(9);
  await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).click();
  await page.getByRole('option', { name: 'Đang xem xét', exact: true }).click();
  await expect(page.locator('.candidate-card')).toHaveCount(5);
});

test('CV preview, error handling, privacy guard and mobile layout', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/recruiter/candidates');
  await expect(page.locator('.candidate-card')).toHaveCount(9, { timeout: 30000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: info.outputPath('candidates-mobile.png'), fullPage: true });
  const cvResponse = page.waitForResponse(response => /\/recruiter\/applications\/[^/]+\/cv/.test(response.url()));
  await page.getByRole('button', { name: 'Xem CV', exact: true }).first().click();
  expect((await cvResponse).status()).toBe(200);
  await expect(page.locator('.candidate-cv-frame')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tải CV', exact: true })).toHaveAttribute('href', /^blob:/);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.locator('.candidate-cv-viewer')).toHaveCount(0);
  await page.route('**/api/bff/recruiter/applications/*/cv*', route => route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'NOT_FOUND' } }) }));
  await page.getByRole('button', { name: 'Xem CV', exact: true }).first().click();
  await expect(page.locator('.candidate-cv-viewer [role=alert]')).toContainText('CV không còn khả dụng hoặc đã bị xóa.');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  let unsafeRequest = false;
  page.on('request', request => { if (request.url().includes('fictional%40') || request.url().includes('fictional@')) unsafeRequest = true; });
  await page.getByRole('textbox', { name: 'Tìm kiếm ứng viên', exact: true }).fill('fictional@example.test');
  await expect(page.locator('#candidate-search-error')).toBeVisible();
  await page.getByRole('textbox', { name: 'Tìm kiếm ứng viên', exact: true }).blur();
  await expect(page).toHaveURL('/recruiter/candidates');
  expect(unsafeRequest).toBe(false);
});

test('list failure has a working retry', async ({ page }) => {
  await page.route('**/api/bff/recruiter/applications?*', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'INTERNAL_ERROR' } }) }));
  await page.goto('/recruiter/candidates');
  await expect(page.locator('.candidate-empty[role=alert]')).toBeVisible({ timeout: 30000 });
  await page.unroute('**/api/bff/recruiter/applications?*');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('.candidate-card')).toHaveCount(9);
});
