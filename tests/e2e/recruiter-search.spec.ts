import { expect, test } from './recruiter-fixture';

test('job search keeps a rounded focus indicator and filters results', async ({ page }, info) => {
  await page.goto('/recruiter/jobs');
  const input = page.getByRole('textbox', { name: 'Tìm kiếm vị trí, phòng ban, từ khóa…', exact: true });
  await input.fill('Fullstack');
  await expect(input).toBeFocused();
  expect(await input.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('none');
  expect(await input.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none');
  expect(await page.locator('.search-input').evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
  await input.press('Enter');
  await expect(page.locator('.job-card').first()).toContainText('Fullstack');
  await page.screenshot({ path: info.outputPath('job-search-focus.png'), fullPage: true });
  await page.setViewportSize({ width: 360, height: 900 });
  await input.focus();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('header search opens candidate and job detail without putting terms in page URLs', async ({ page }, info) => {
  await page.goto('/recruiter/dashboard');
  const search = page.locator('.header-search input');
  await search.fill('Mai An');
  await search.press('Enter');
  const results = page.getByRole('region', { name: 'Kết quả tìm kiếm', exact: true });
  await expect(results.getByRole('link', { name: /Mai An/ })).toBeVisible();
  await results.getByRole('link', { name: /Mai An/ }).click();
  await expect(page).toHaveURL(/\/recruiter\/candidates\/[\da-f-]+$/);
  await search.fill('Fullstack');
  await page.locator('.header-search').getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(results.getByRole('link', { name: /Senior Fullstack/ })).toBeVisible();
  await page.screenshot({ path: info.outputPath('header-search-results.png') });
  await results.getByRole('link', { name: /Senior Fullstack/ }).click();
  await expect(page).toHaveURL(/\/recruiter\/jobs\/[\da-f-]+$/);
  await search.fill('zzzzzzzz');
  await search.press('Enter');
  await expect(results).toContainText('Không tìm thấy ứng viên phù hợp.');
  await expect(results).toContainText('Không tìm thấy tin tuyển dụng phù hợp.');
  await search.press('Escape');
  await expect(results).toHaveCount(0);
  await search.fill('someone@example.com');
  await search.press('Enter');
  await expect(page.locator('#header-search-error')).toBeVisible();
  await expect(results).toHaveCount(0);
});

test('header search shows request errors and supports retry', async ({ page }) => {
  await page.route('**/api/bff/recruiter/applications?*', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }));
  await page.goto('/recruiter/help');
  const input = page.locator('.header-search input');
  await input.fill('Mai An');
  await input.press('Enter');
  const results = page.getByRole('region', { name: 'Kết quả tìm kiếm', exact: true });
  await expect(results.getByRole('alert')).toContainText('Không thể tải dữ liệu. Vui lòng thử lại.');
  await page.unroute('**/api/bff/recruiter/applications?*');
  await results.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(results.getByRole('link', { name: /Mai An/ })).toBeVisible();
  await results.getByRole('button', { name: 'Đóng kết quả tìm kiếm' }).click();
  await expect(results).toHaveCount(0);
});
