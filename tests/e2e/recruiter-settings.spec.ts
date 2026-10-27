import { expect, test, type Page } from '@playwright/test';
import { z } from 'zod';
import { settingsPngBase64, settingsPdf } from '@/mocks/fixtures/settings-files';
import { mockRecruiterPassword } from '@/mocks/fixtures/recruiter-account';
import { accountSchema } from '@/features/account/schemas/account';
import { companySchema, companyToInput } from '@/features/company/schemas/company';

async function headers(page: Page) {
  const response = await page.request.get('/api/bff/auth/csrf');
  return { 'X-CSRF-Token': z.object({ csrfToken: z.string() }).parse(await response.json()).csrfToken };
}
test('account save, cancel, API failure, header identity and avatar upload/delete', async ({ page }, info) => {
  await page.goto('/recruiter/account');
  await expect(page.getByLabel('Họ và tên', { exact: true })).toBeVisible({ timeout: 30000 });
  const original = accountSchema.parse(await (await page.request.get('/api/bff/me')).json());
  try {
    await page.getByLabel('Họ và tên', { exact: true }).fill('Minh An Cập Nhật');
    await page.getByLabel('Địa chỉ liên hệ', { exact: true }).fill('Đà Nẵng');
    await page.getByRole('button', { name: 'Cập nhật thông tin', exact: true }).click();
    await expect(page.locator('.recruiter-user strong')).toHaveText('Minh An Cập Nhật');
    await page.getByLabel('Họ và tên', { exact: true }).fill('Chưa lưu');
    await page.getByRole('button', { name: 'Hủy thay đổi', exact: true }).click();
    await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveValue('Minh An Cập Nhật');
    await page.getByLabel('Họ và tên', { exact: true }).fill('Giữ lại khi lỗi');
    await page.route('**/api/bff/me', route => route.request().method() === 'PATCH' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }) : route.continue());
    await page.getByRole('button', { name: 'Cập nhật thông tin', exact: true }).click();
    await expect(page.locator('.settings-contact [role="alert"]')).toContainText('Không thể thực hiện');
    await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveValue('Giữ lại khi lỗi');
    await page.unroute('**/api/bff/me');
    await page.getByRole('button', { name: 'Hủy thay đổi', exact: true }).click();
    await page.locator('.settings-image-section input[type="file"]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from(settingsPngBase64, 'base64') });
    await expect(page.locator('.settings-image-preview img')).toBeVisible();
    await expect(page.locator('.recruiter-user img')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath('account-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
    await expect(page.locator('.settings-image-preview img')).toHaveCount(0);
  } finally {
    await page.unroute('**/api/bff/me');
    await page.request.patch('/api/bff/me', { headers: await headers(page), data: { fullName: original.fullName, phone: original.phone, address: original.address } });
  }
});

test('password form validates and changes the mock password without displaying it', async ({ page }) => {
  await page.goto('/recruiter/account');
  await page.getByRole('button', { name: 'Thay đổi mật khẩu', exact: true }).click();
  const panel = page.locator('.settings-password-panel');
  await panel.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('WrongPassword1');
  await panel.getByLabel('Mật khẩu mới', { exact: true }).fill('ChangedPassword2026');
  await panel.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('DifferentPassword1');
  await panel.getByRole('button', { name: 'Thay đổi mật khẩu', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('chưa khớp');
  await panel.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('ChangedPassword2026');
  await panel.getByRole('button', { name: 'Thay đổi mật khẩu', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('Mật khẩu hiện tại không đúng.');
  await panel.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(mockRecruiterPassword);
  try {
    await panel.getByRole('button', { name: 'Thay đổi mật khẩu', exact: true }).click();
    await expect(panel.getByRole('status')).toHaveText('Đã thay đổi mật khẩu.');
    await expect(panel.getByLabel('Mật khẩu mới', { exact: true })).toHaveValue('');
    await expect(page.locator('#account-password')).toHaveAttribute('type', 'password');
  } finally {
    await page.request.post('/api/bff/auth/change-password', { headers: await headers(page), data: { currentPassword: 'ChangedPassword2026', newPassword: mockRecruiterPassword, confirmPassword: mockRecruiterPassword } });
  }
});

test('company independent sections preserve fields, logo and verification documents persist', async ({ page }, info) => {
  await page.goto('/recruiter/company');
  await expect(page.getByLabel('Tên công ty', { exact: true })).toBeVisible({ timeout: 30000 });
  const original = companySchema.parse(await (await page.request.get('/api/bff/recruiter/company')).json());
  try {
    // Save the introduction while the main form has an unrelated unsaved edit.
    await page.getByLabel('Tên công ty', { exact: true }).fill('Công ty Sao Mai Cập Nhật');
    await page.getByLabel('Giới thiệu doanh nghiệp', { exact: true }).fill('Giới thiệu được cập nhật độc lập.');
    const intro = page.locator('.settings-company-section').filter({ has: page.getByRole('heading', { name: 'Thông tin doanh nghiệp', exact: true }) });
    await intro.getByRole('button', { name: 'Cập nhật', exact: true }).click();
    await expect(intro.getByRole('status')).toContainText('Đã cập nhật');
    await expect(page.getByLabel('Tên công ty', { exact: true })).toHaveValue('Công ty Sao Mai Cập Nhật');
    const main = page.locator('.settings-company-main');
    await main.getByRole('button', { name: 'Cập nhật', exact: true }).click();
    await expect(main.getByRole('status')).toContainText('Đã cập nhật');
    const result = companySchema.parse(await (await page.request.get('/api/bff/recruiter/company')).json());
    expect(result.name).toBe('Công ty Sao Mai Cập Nhật'); expect(result.description).toBe('Giới thiệu được cập nhật độc lập.'); expect(result.taxCode).toBe(original.taxCode);
    await page.locator('.settings-image-section input[type="file"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(settingsPngBase64, 'base64') });
    await expect(page.locator('.settings-image-preview img')).toBeVisible();
    await page.locator('.settings-documents input[type="file"]').setInputFiles({ name: 'license.pdf', mimeType: 'application/pdf', buffer: Buffer.from(settingsPdf) });
    await expect(page.locator('.settings-documents [role="status"]')).toHaveText('Đã gửi hồ sơ xác thực.');
    await expect(page.locator('.settings-section-heading .settings-status')).toContainText('Đang chờ duyệt');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath('company-desktop.png'), fullPage: true });
    await page.reload();
    await expect(page.locator('.settings-section-heading .settings-status')).toContainText('Đang chờ duyệt');
    await expect(page.locator('.settings-image-preview img')).toBeVisible();
    await page.getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
    await expect(page.locator('.settings-image-preview img')).toHaveCount(0);
  } finally {
    await page.request.put('/api/bff/recruiter/company', { headers: await headers(page), data: companyToInput(original) });
  }
});

test('company failures keep form edits, empty company and both tabs fit mobile', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/recruiter/company');
  await expect(page.getByLabel('Tên công ty', { exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByLabel('Tên công ty', { exact: true }).fill('Chưa lưu khi lỗi');
  await page.route('**/api/bff/recruiter/company', route => route.request().method() === 'PUT' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }) : route.continue());
  await page.locator('.settings-company-main').getByRole('button', { name: 'Cập nhật', exact: true }).click();
  await expect(page.locator('.settings-company-main [role="alert"]')).toContainText('Không thể thực hiện');
  await expect(page.getByLabel('Tên công ty', { exact: true })).toHaveValue('Chưa lưu khi lỗi');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('company-mobile.png'), fullPage: true });
  await page.locator('.settings-tabs').getByRole('link', { name: 'Thông tin tài khoản', exact: true }).click();
  await expect(page.getByLabel('Họ và tên', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('account-mobile.png'), fullPage: true });
  await page.unroute('**/api/bff/recruiter/company');
  await page.route('**/api/bff/recruiter/company', route => route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'NOT_FOUND' } }) }));
  await page.goto('/recruiter/company');
  await expect(page.getByText('Chưa có thông tin công ty', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo thông tin công ty', exact: true })).toBeVisible();
});

test('loading errors offer a working retry', async ({ page }) => {
  let fail = true;
  await page.route('**/api/bff/me', route => fail ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }) : route.continue());
  await page.goto('/recruiter/account');
  await expect(page.locator('.settings-load-error')).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByLabel('Họ và tên', { exact: true })).toBeVisible();
});
