import { expect, test } from '@playwright/test';
test.setTimeout(90000);
async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('TalentAI2026!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.locator('.admin-cards')).toBeVisible();
}
test('admin and recruiter keep separate identities in the same browser', async ({ page }) => {
  await page.goto('/recruiter/account');
  await expect(page.locator('#account-email')).toHaveValue('recruiter@example.test', { timeout: 20000 });
  await login(page);
  await page.goto('/recruiter/account');
  await expect(page.locator('#account-email')).toHaveValue('recruiter@example.test', { timeout: 20000 });
  await expect(page.locator('.recruiter-user')).toContainText('Nhà tuyển dụng');
  await page.goto('/admin/dashboard');
  await expect(page.locator('.admin-cards')).toBeVisible();
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/recruiter/account');
  await expect(page.locator('#account-email')).toHaveValue('recruiter@example.test', { timeout: 20000 });
});
test('admin login, dashboard filters, mobile and logout', async ({ page }, info) => {
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('.admin-error-box')).toContainText('Email hoặc mật khẩu không đúng');
  await page.screenshot({ path: info.outputPath('admin-login-desktop.png'), fullPage: true });
  await login(page);
  await expect(page.locator('.admin-card').first()).toContainText('1.284');
  await expect.poll(() => page.locator('.admin-activity tbody tr').count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.admin-sidebar nav > button')).toHaveCount(5);
  await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Người dùng', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Doanh nghiệp', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quản lý doanh nghiệp', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Doanh nghiệp', exact: true }).press('Home');
  await expect(page.getByRole('tab', { name: 'Người dùng', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Tổng quan', exact: true }).click();
  // Keep framework developer controls out of product screenshots and mobile clicks.
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.screenshot({ path: info.outputPath('admin-dashboard-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Khoảng thời gian', exact: true }).click();
  await page.getByLabel('Từ ngày', { exact: true }).fill('2026-11-02');
  await page.getByLabel('Đến ngày', { exact: true }).fill('2026-11-02');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page.locator('.admin-card').first()).toContainText('58');
  await page.getByLabel('Chỉ số thống kê').selectOption('applications');
  await page.getByText('Xem bảng số liệu', { exact: true }).click();
  await expect(page.locator('.admin-chart-table tbody')).toContainText('115');
  await page.getByLabel('Từ ngày', { exact: true }).fill('2099-01-01');
  await expect(page.getByRole('button', { name: 'Áp dụng', exact: true })).toBeDisabled();
  await page.getByLabel('Đến ngày', { exact: true }).fill('2099-01-31');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page.getByText('Chưa có dữ liệu trong khoảng thời gian đã chọn.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Toàn bộ thời gian', exact: true }).click();
  await expect(page.locator('.admin-chart-canvas')).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.screenshot({ path: info.outputPath('admin-dashboard-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('admin-login-mobile.png'), fullPage: true });
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test('dashboard offers retry and handles expired API session', async ({ page }) => {
  await page.route('**/api/bff/admin/stats/overview*', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
  await loginWithoutWaiting();
  await expect(page.locator('.admin-state[role=alert]').first()).toContainText('Không thể thực hiện yêu cầu');
  await page.unroute('**/api/bff/admin/stats/overview*');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).first().click();
  await expect(page.locator('.admin-cards')).toBeVisible();
  await page.route('**/api/bff/admin/**', route => route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } }));
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page.getByText('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.').first()).toBeVisible();
  async function loginWithoutWaiting() {
    await page.goto('/admin/login');
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('TalentAI2026!');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  }
});





