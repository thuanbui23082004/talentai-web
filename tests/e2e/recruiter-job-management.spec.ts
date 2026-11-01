import { expect, test, type Page } from './recruiter-fixture';
import { z } from 'zod';
import { mockEditableJob } from '@/mocks/fixtures/editable-job';
import { jobToFormValues, toUpdatedJobInput } from '@/features/jobs/schemas/create-job';
import { recruiterJobSchema } from '@/lib/api/job-schemas';

async function headers(page: Page) {
  const response = await page.request.get('/api/bff/auth/csrf');
  return { 'X-CSRF-Token': z.object({ csrfToken: z.string() }).parse(await response.json()).csrfToken };
}
async function create(page: Page, title: string) {
  const data = { ...toUpdatedJobInput(jobToFormValues(mockEditableJob), mockEditableJob), title };
  const response = await page.request.post('/api/bff/recruiter/jobs', { headers: await headers(page), data });
  expect(response.status()).toBe(201);
  return recruiterJobSchema.parse(await response.json());
}
async function remove(page: Page, id: string) { await page.request.delete(`/api/bff/recruiter/jobs/${id}`, { headers: await headers(page) }); }

test('edit loads existing values, saves, retains metadata and supports cancellation', async ({ page }, info) => {
  const job = await create(page, 'Tin chỉnh sửa kiểm thử');
  try {
    await page.goto(`/recruiter/jobs/${job.id}`);
    await page.getByRole('link', { name: 'Chỉnh sửa tin', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Chỉnh sửa tin', exact: true })).toBeVisible();
    await expect(page.locator('#job-title')).toHaveValue(job.title);
    await expect(page.locator('#job-salaryMin')).toHaveValue('45000');
    await expect(page.getByText('Khoảng lương (USD/năm)', { exact: true })).toBeVisible();
    await expect(page.locator('#extra-skills')).toHaveValue('React, TypeScript');
    const title = 'Tin đã chỉnh sửa và lưu';
    await page.locator('#job-title').fill(title);
    await page.getByRole('textbox', { name: 'Mô tả công việc', exact: true }).fill('Nội dung công việc đã được chỉnh sửa.');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath('edit-job-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(page).toHaveURL(`/recruiter/jobs/${job.id}`);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    const saved = recruiterJobSchema.parse(await (await page.request.get(`/api/bff/recruiter/jobs/${job.id}`)).json());
    expect(saved.salary).toEqual(job.salary); expect(saved.requiredSkills).toEqual(job.requiredSkills); expect(saved.hiringRounds).toEqual(job.hiringRounds); expect(saved.position).toEqual(job.position);
    await page.getByRole('link', { name: 'Chỉnh sửa tin', exact: true }).click();
    await page.locator('#job-title').fill('Không lưu thay đổi này');
    await page.getByRole('link', { name: 'Hủy chỉnh sửa', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.locator('.detail-back').click();
    await expect(page.locator('.job-card').filter({ has: page.getByRole('heading', { name: title, exact: true }) })).toBeVisible();
  } finally { await remove(page, job.id); }
});

test('publish confirms, handles verification errors, then shows the returned review status', async ({ page }) => {
  const job = await create(page, 'Tin đăng bản nháp kiểm thử');
  try {
    await page.goto(`/recruiter/jobs/${job.id}`);
    await page.getByRole('button', { name: 'Đăng tin', exact: true }).click();
    await page.locator('.job-management-confirm').getByRole('button', { name: 'Hủy', exact: true }).click();
    expect(recruiterJobSchema.parse(await (await page.request.get(`/api/bff/recruiter/jobs/${job.id}`)).json()).status).toBe('draft');
    await page.route(`**/api/bff/recruiter/jobs/${job.id}/publish`, route => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: { code: 'COMPANY_NOT_VERIFIED' } }) }));
    await page.getByRole('button', { name: 'Đăng tin', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận đăng tin', exact: true }).click();
    await expect(page.locator('.job-management-confirm [role="alert"]')).toContainText('Doanh nghiệp chưa được xác thực');
    await page.unroute(`**/api/bff/recruiter/jobs/${job.id}/publish`);
    await page.getByRole('button', { name: 'Xác nhận đăng tin', exact: true }).click();
    await expect(page.locator('.job-management [role="status"]')).toHaveText('Đã gửi tin và đang chờ duyệt.');
    await expect(page.locator('.detail-info-card')).toContainText('Chờ duyệt');
    await expect(page.getByRole('button', { name: 'Đăng tin', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.locator('.detail-info-card')).toContainText('Chờ duyệt');
  } finally { await remove(page, job.id); }
});

test('delete confirms the exact job, cancellation and errors retain it, then hides it from the list', async ({ page }) => {
  const job = await create(page, 'Tin xóa mềm kiểm thử');
  try {
    await page.goto(`/recruiter/jobs/${job.id}`);
    await page.getByRole('button', { name: 'Xóa tin', exact: true }).click();
    await expect(page.locator('.job-management-confirm')).toContainText(job.title);
    await page.locator('.job-management-confirm').getByRole('button', { name: 'Hủy', exact: true }).click();
    expect((await page.request.get(`/api/bff/recruiter/jobs/${job.id}`)).status()).toBe(200);
    await page.route(`**/api/bff/recruiter/jobs/${job.id}`, route => route.request().method() === 'DELETE' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }) : route.continue());
    await page.getByRole('button', { name: 'Xóa tin', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận xóa', exact: true }).click();
    await expect(page.locator('.job-management-confirm [role="alert"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: job.title, exact: true })).toBeVisible();
    await page.unroute(`**/api/bff/recruiter/jobs/${job.id}`);
    await page.getByRole('button', { name: 'Xác nhận xóa', exact: true }).click();
    await expect(page).toHaveURL('/recruiter/jobs');
    await expect(page.getByRole('heading', { name: job.title, exact: true })).toHaveCount(0);
    await page.goto(`/recruiter/jobs/${job.id}`);
    await expect(page.locator('main [role="alert"]')).toContainText('Không tìm thấy tin tuyển dụng');
  } finally { await remove(page, job.id); }
});

test('edit loading/retry, failed save retains inputs and fits mobile', async ({ page }, info) => {
  const job = await create(page, 'Tin chỉnh sửa mobile');
  try {
    let failed = true;
    await page.setViewportSize({ width: 360, height: 900 });
    await page.route(`**/api/bff/recruiter/jobs/${job.id}`, route => failed && route.request().method() === 'GET' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }) : route.continue());
    await page.goto(`/recruiter/jobs/${job.id}/edit`);
    await expect(page.locator('main [role="alert"]')).toBeVisible();
    failed = false;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(page.locator('#job-title')).toHaveValue(job.title);
    await page.unroute(`**/api/bff/recruiter/jobs/${job.id}`);
    await page.route(`**/api/bff/recruiter/jobs/${job.id}`, route => route.request().method() === 'PUT' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) }) : route.continue());
    await page.locator('#job-title').fill('Nội dung chưa lưu vẫn còn');
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(page.locator('.submit-error')).toBeVisible();
    await expect(page.locator('#job-title')).toHaveValue('Nội dung chưa lưu vẫn còn');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath('edit-job-mobile.png'), fullPage: true });
  } finally { await page.unroute(`**/api/bff/recruiter/jobs/${job.id}`); await remove(page, job.id); }
});

test('locked and missing jobs do not expose an editable form', async ({ page }) => {
  const job = await create(page, 'Tin bị khóa kiểm thử');
  try {
    await page.route(`**/api/bff/recruiter/jobs/${job.id}`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...job, status: 'locked' }) }));
    await page.goto(`/recruiter/jobs/${job.id}/edit`);
    await expect(page.locator('main [role="alert"]')).toContainText('Tin đang bị khóa');
    await expect(page.locator('.create-job-fieldset')).toHaveCount(0);
    await page.unroute(`**/api/bff/recruiter/jobs/${job.id}`);
    await page.goto('/recruiter/jobs/00000000-0000-4000-8000-999999999999/edit');
    await expect(page.locator('main [role="alert"]')).toContainText('Không tìm thấy tin tuyển dụng');
  } finally { await remove(page, job.id); }
});
