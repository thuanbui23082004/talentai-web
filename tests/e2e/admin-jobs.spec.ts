import { expect, test, type Page } from '@playwright/test';
test.setTimeout(90000);
const target = '00000000-0000-4000-8000-000000008000';
async function login(page: Page) {
  await page.goto('/admin/login'); await page.getByLabel('Email', { exact: true }).fill('admin@example.test'); await page.getByLabel('Mật khẩu', { exact: true }).fill('TalentAI2026!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('.admin-cards')).toBeVisible({ timeout: 20000 });
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
}
async function act(page: Page, action: string, reason: string) {
  await page.getByRole('button', { name: action, exact: true }).click();
  await page.getByLabel('Ghi chú / lý do xử lý', { exact: true }).fill(reason);
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Đã cập nhật trạng thái tin');
}
test('job filters, approval, hiding, locking, deletion and audit on desktop/mobile', async ({ page }, info) => {
  await page.goto('/admin/jobs'); await expect(page).toHaveURL(/\/admin\/login$/);
  await login(page); const before = Number(await page.locator('.admin-card').nth(3).locator('strong').innerText());
  await page.getByRole('button', { name: 'Nội dung', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs$/); await expect(page.locator('.admin-jobs-table')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nội dung', exact: true })).toHaveClass(/active/);
  await expect(page.getByRole('tab', { name: 'Tin tuyển dụng', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('Trang 2 / 2', { exact: true })).toBeVisible();
  await page.getByLabel('Tìm kiếm tin tuyển dụng', { exact: true }).fill('Chuyên viên phát triển');
  await page.getByLabel('Trạng thái', { exact: true }).selectOption('pending_review');
  await page.getByLabel('Doanh nghiệp', { exact: true }).selectOption('00000000-0000-4000-8000-000000004001');
  await expect(page.locator('.admin-jobs-table tbody tr')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('jobs-desktop.png'), fullPage: true });
  await page.getByRole('link', { name: 'Xem chi tiết', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chi tiết tin tuyển dụng', exact: true })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Duyệt tin', exact: true }).click(); await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByText('Vui lòng nhập ghi chú hoặc lý do.', { exact: true })).toBeVisible();
  await page.getByLabel('Ghi chú / lý do xử lý', { exact: true }).fill('Đã kiểm duyệt nội dung mẫu'); await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: info.outputPath('job-confirm-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.locator('.admin-users-heading .admin-badge')).toHaveText('Đang đăng');
  await page.goto('/admin/dashboard'); await expect(page.locator('.admin-card').nth(3).locator('strong')).toHaveText(String(before + 1));
  await page.goto(`/admin/jobs/${target}`); await act(page, 'Ẩn tin', 'Cần kiểm tra lại tin mẫu');
  await expect(page.locator('.admin-users-heading .admin-badge')).toHaveText('Đã ẩn');
  await act(page, 'Khóa tin', 'Tin mẫu vi phạm nội dung'); await expect(page.locator('.admin-users-heading .admin-badge')).toHaveText('Đã khóa');
  await expect(page.locator('.admin-user-history li')).toHaveCount(3);
  await page.reload(); await expect(page.locator('.admin-users-heading .admin-badge')).toHaveText('Đã khóa');
  await page.setViewportSize({ width: 360, height: 800 }); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' }); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: info.outputPath('job-detail-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xóa tin', exact: true }).click(); await page.getByLabel('Ghi chú / lý do xử lý', { exact: true }).fill('Liên hệ demo@example.test'); await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByText('Vui lòng bỏ email và số điện thoại khỏi lý do xóa.', { exact: true })).toBeVisible();
  await page.getByLabel('Ghi chú / lý do xử lý', { exact: true }).fill('Xóa tin vi phạm mẫu'); await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs$/); await expect(page.getByRole('status')).toContainText('Đã xóa tin');
  await page.getByLabel('Tìm kiếm tin tuyển dụng', { exact: true }).fill('Chuyên viên phát triển'); await expect(page.getByText('Không tìm thấy tin tuyển dụng phù hợp.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: info.outputPath('jobs-mobile.png'), fullPage: true });
  await page.goto('/admin/dashboard'); await expect(page.locator('.admin-activity tbody tr').first()).toContainText('Xóa tin tuyển dụng');
  await page.goto(`/admin/jobs/${target}`); await expect(page.locator('.admin-state[role=alert]')).toContainText('Tin tuyển dụng không tồn tại hoặc đã bị xóa');
});
test('empty search, API retry and rejection preserve reason when request fails', async ({ page }) => {
  await login(page); await page.goto('/admin/jobs'); await expect(page.locator('.admin-jobs-table')).toBeVisible();
  await page.getByLabel('Tìm kiếm tin tuyển dụng', { exact: true }).fill('khong-co-tin'); await expect(page.getByText('Không tìm thấy tin tuyển dụng phù hợp.', { exact: true })).toBeVisible();
  await page.route('**/api/bff/admin/jobs?*', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } })); await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page.locator('.admin-state[role=alert]')).toContainText('Không thể tải tin tuyển dụng'); await page.unroute('**/api/bff/admin/jobs?*'); await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await page.getByLabel('Tìm kiếm tin tuyển dụng', { exact: true }).fill('Chuyên viên tư vấn khách hàng'); await page.getByRole('link', { name: 'Xem chi tiết', exact: true }).click();
  await page.getByRole('button', { name: 'Từ chối tin', exact: true }).click(); await page.getByLabel('Ghi chú / lý do xử lý', { exact: true }).fill('Tin mẫu cần bổ sung thông tin'); await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.route('**/api/bff/admin/jobs/*/reject', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } })); await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.admin-access-panel [role=alert]')).toContainText('Không thể cập nhật tin'); await page.getByRole('button', { name: 'Sửa nội dung', exact: true }).click(); await expect(page.getByLabel('Ghi chú / lý do xử lý', { exact: true })).toHaveValue('Tin mẫu cần bổ sung thông tin');
  await page.unroute('**/api/bff/admin/jobs/*/reject'); await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.locator('.admin-users-heading .admin-badge')).toHaveText('Đã từ chối');
});
