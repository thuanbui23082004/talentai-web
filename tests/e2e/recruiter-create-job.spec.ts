import { expect, test, type Page } from '@playwright/test';

async function fillRequired(page: Page, title: string) {
  await page.getByRole('textbox', { name: 'Tiêu đề tin', exact: true }).fill(title);
  await page.locator('#job-industryId').click();
  await page.getByRole('option', { name: 'Công nghệ thông tin', exact: true }).click();
  await page.getByRole('textbox', { name: 'Mô tả công việc', exact: true }).fill('Phát triển giao diện sản phẩm và phối hợp cùng đội ngũ.');
  await page.getByRole('textbox', { name: 'Yêu cầu công việc', exact: true }).fill('Có kiến thức TypeScript và làm việc nhóm.');
  await page.getByRole('spinbutton', { name: 'Từ', exact: true }).fill('10');
  await page.getByRole('spinbutton', { name: 'Đến', exact: true }).fill('20');
  await page.locator('#job-city').click();
  await page.getByRole('option', { name: 'Hà Nội', exact: true }).click();
}

test('create a draft, open detail and find it in the list', async ({ page }, testInfo) => {
  await page.goto('/recruiter/jobs/new');
  await expect(page.getByRole('heading', { name: 'Tạo tin tuyển dụng', exact: true })).toBeVisible({ timeout: 30000 });
  await page.locator('#job-basic > summary').click();
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click();
  await expect(page.locator('#job-basic')).toHaveAttribute('open', '');
  await expect(page.getByText('Tiêu đề cần từ 3 đến 200 ký tự.')).toBeVisible();
  const title = 'Chuyên viên giao diện kiểm thử';
  await fillRequired(page, title);
  await expect(page.locator('.preview-job-title')).toContainText(title);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('create-job-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click();
  await expect(page).toHaveURL(/\/recruiter\/jobs\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.locator('.detail-info-card')).toContainText('Bản nháp');
  await page.locator('.detail-back').click();
  await expect(page).toHaveURL('/recruiter/jobs');
  await expect(page.locator('.job-card-grid').getByRole('heading', { name: title, exact: true })).toBeVisible();
});

test('create form fits mobile and keeps data on save failure', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/recruiter/jobs/new');
  await page.getByRole('heading', { name: 'Tạo tin tuyển dụng', exact: true }).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await fillRequired(page, 'Tin kiểm thử giữ dữ liệu');
  await page.route('**/api/bff/recruiter/jobs', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'SERVICE_UNAVAILABLE' } }) }));
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click();
  await expect(page.locator('.submit-error[role="alert"]')).toContainText('Không thể tải hoặc lưu dữ liệu. Vui lòng thử lại.');
  await expect(page.getByRole('textbox', { name: 'Tiêu đề tin', exact: true })).toHaveValue('Tin kiểm thử giữ dữ liệu');
  await expect(page.getByRole('button', { name: 'Lưu & tiếp tục' })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('create-job-mobile.png'), fullPage: true });
});
