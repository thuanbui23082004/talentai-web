import { expect, test, type Page } from '@playwright/test';
import { z } from 'zod';

const first = '00000000-0000-4000-9000-000000000001';
const second = '00000000-0000-4000-9000-000000000002';
async function restoreFirst(page: Page) {
  const response = await page.request.get('/api/bff/auth/csrf');
  const token = z.object({ csrfToken: z.string() }).parse(await response.json()).csrfToken;
  const headers = { 'X-CSRF-Token': token };
  await page.request.patch(`/api/bff/recruiter/applications/${first}/status`, { headers, data: { status: 'reviewing', round: 'Sơ tuyển HR', notifyCandidate: false } });
  await page.request.put(`/api/bff/recruiter/applications/${first}/evaluation`, { headers, data: {} });
}
test('open from list, update status and evaluation, and synchronize the list', async ({ page }, info) => {
  await page.goto('/recruiter/candidates');
  await page.getByRole('link', { name: 'Mai An', exact: true }).click();
  await expect(page).toHaveURL(`/recruiter/candidates/${first}`);
  await expect(page.getByRole('heading', { name: 'Mai An', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.candidate-ai-explanation')).toContainText('chỉ mang tính tham khảo');
  await expect(page.getByRole('link', { name: 'Xem chi tiết tin', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('candidate-detail-desktop.png'), fullPage: true });
  try {
    await page.getByRole('button', { name: 'Cập nhật trạng thái', exact: true }).click();
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).click();
    await page.getByRole('option', { name: 'Đang phỏng vấn', exact: true }).click();
    await page.getByRole('combobox', { name: 'Vòng tuyển dụng', exact: true }).click();
    await page.getByRole('option', { name: 'Phỏng vấn chuyên môn', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(page.locator('.candidate-personal-intro .candidate-status')).toHaveText('Đang phỏng vấn');
    await expect(page.locator('.candidate-action-form')).toHaveCount(0);
    await page.getByRole('button', { name: 'Đánh giá ứng viên', exact: true }).click();
    await page.getByRole('combobox', { name: 'Điểm đánh giá (1–5)', exact: true }).click();
    await page.getByRole('option', { name: '4/5', exact: true }).click();
    await page.getByRole('textbox', { name: 'Ghi chú', exact: true }).fill('Trao đổi thêm về kinh nghiệm dự án.');
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(page.locator('.candidate-manual-rating')).toContainText('4/5');
    await expect(page.locator('.candidate-ai-score')).toContainText('78%');
    await page.locator('.candidate-detail-back').click();
    await expect(page).toHaveURL('/recruiter/candidates');
    const card = page.locator('.candidate-card').filter({ has: page.getByRole('heading', { name: 'Mai An', exact: true }) });
    await expect(card.locator('.candidate-status')).toHaveText('Đang phỏng vấn');
  } finally { await restoreFirst(page); }
});

test('schedule interview using Vietnam time and show the created schedule', async ({ page }) => {
  await page.goto(`/recruiter/candidates/${second}`);
  await page.getByRole('heading', { name: 'Bảo Minh', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Lên lịch phỏng vấn', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo lịch phỏng vấn', exact: true }).click();
  await expect(page.locator('.candidate-action-form .field-error')).not.toHaveCount(0);
  await page.getByLabel('Bắt đầu (giờ Việt Nam)', { exact: true }).fill('2030-11-01T10:00');
  await page.getByLabel('Kết thúc (giờ Việt Nam)', { exact: true }).fill('2030-11-01T11:00');
  await page.getByRole('textbox', { name: 'Đường dẫn cuộc họp', exact: true }).fill('https://example.test/interview');
  await page.getByRole('textbox', { name: 'Người phỏng vấn', exact: true }).fill('Nhân sự, Kỹ thuật');
  const created = page.waitForResponse(response => response.url().endsWith('/api/bff/recruiter/interviews') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Tạo lịch phỏng vấn', exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(page.locator('.candidate-next-interview')).toContainText('10:00');
  await expect(page.locator('.candidate-next-interview')).toContainText('Nhân sự, Kỹ thuật');
});

test('mobile layout, existing CV viewer and missing profile state', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(`/recruiter/candidates/${first}`);
  await expect(page.getByRole('heading', { name: 'Mai An', exact: true })).toBeVisible({ timeout: 30000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: info.outputPath('candidate-detail-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Hồ sơ CV', exact: true }).click();
  await expect(page.locator('.candidate-cv-frame')).toBeVisible();
  await page.goto('/recruiter/candidates/00000000-0000-4000-9000-999999999999');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy hồ sơ ứng viên.', exact: true })).toBeVisible();
});
