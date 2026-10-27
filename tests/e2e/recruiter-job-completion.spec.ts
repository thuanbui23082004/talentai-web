import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { recruiterJobPageSchema, recruiterJobSchema } from '@/lib/api/job-schemas';
import { mockEditableJob } from '@/mocks/fixtures/editable-job';
import { jobToFormValues, toUpdatedJobInput } from '@/features/jobs/schemas/create-job';

test('status controls persist, handle failure and remain consistent after reload', async ({ page }) => {
  const csrf = z.object({ csrfToken: z.string() }).parse(await (await page.request.get('/api/bff/auth/csrf')).json()).csrfToken;
  const jobs = recruiterJobPageSchema.parse(await (await page.request.get('/api/bff/recruiter/jobs')).json());
  const job = jobs.items.find(item => item.status === 'open')!;
  const path = `/api/bff/recruiter/jobs/${job.id}`;
  try {
    await page.goto(`/recruiter/jobs/${job.id}`);
    await page.route('**' + path + '/pause', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
    await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
    await page.locator('.detail-confirmation').getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.locator('.detail-confirmation [role=alert]')).toContainText('Không thể tải hoặc lưu dữ liệu');
    expect(recruiterJobSchema.parse(await (await page.request.get(path)).json()).status).toBe('open');
    await page.unroute('**' + path + '/pause');
    await page.locator('.detail-confirmation').getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Mở lại', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Mở lại', exact: true })).toBeVisible();
    for (const [label, status] of [['Đóng tin', 'closed'], ['Mở lại', 'open']] as const) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.locator('.detail-confirmation').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expect(page.locator('.detail-confirmation')).toHaveCount(0);
      expect(recruiterJobSchema.parse(await (await page.request.get(path)).json()).status).toBe(status);
      await page.reload();
    }
  } finally {
    const current = recruiterJobSchema.parse(await (await page.request.get(path)).json());
    if (['paused', 'closed'].includes(current.status)) await page.request.post(path + '/reopen', { headers: { 'X-CSRF-Token': csrf } });
  }
});

test('job round editor saves, reorders, validates and clears rounds without unsupported fields', async ({ page }, info) => {
  const csrf = z.object({ csrfToken: z.string() }).parse(await (await page.request.get('/api/bff/auth/csrf')).json()).csrfToken;
  const created = await page.request.post('/api/bff/recruiter/jobs', { headers: { 'X-CSRF-Token': csrf }, data: { ...toUpdatedJobInput(jobToFormValues(mockEditableJob), mockEditableJob), title: 'Tin kiểm thử cấu hình vòng' } });
  expect(created.status()).toBe(201);
  const job = recruiterJobSchema.parse(await created.json());
  try {
    await page.goto(`/recruiter/jobs/${job.id}/edit`);
    const rounds = page.locator('#job-rounds');
    await expect(rounds).toBeVisible();
    while (await rounds.locator('li').count()) await rounds.getByRole('button', { name: 'Xóa vòng 1', exact: true }).click();
    await rounds.getByRole('button', { name: 'Thêm vòng tuyển dụng', exact: true }).click();
    await rounds.getByLabel('Vòng 1', { exact: true }).fill('Sơ tuyển');
    await rounds.getByRole('button', { name: 'Thêm vòng tuyển dụng', exact: true }).click();
    await rounds.getByLabel('Vòng 2', { exact: true }).fill('Sơ tuyển');
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(rounds.getByRole('alert')).toContainText('không được trùng');
    await rounds.getByLabel('Vòng 2', { exact: true }).fill('Chuyên môn');
    await rounds.getByRole('button', { name: 'Chuyển vòng 2 lên', exact: true }).click();
    await expect(rounds.getByLabel('Vòng 1', { exact: true })).toHaveValue('Chuyên môn');
    await page.setViewportSize({ width: 360, height: 800 });
    await rounds.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('job-rounds-mobile.png') });
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(page).toHaveURL(`/recruiter/jobs/${job.id}`);
    expect(recruiterJobSchema.parse(await (await page.request.get(`/api/bff/recruiter/jobs/${job.id}`)).json()).hiringRounds).toEqual(['Chuyên môn', 'Sơ tuyển']);
    await page.goto(`/recruiter/jobs/${job.id}/edit`);
    await expect(rounds.getByLabel('Vòng 1', { exact: true })).toHaveValue('Chuyên môn');
    await rounds.getByRole('button', { name: 'Xóa vòng 2', exact: true }).click();
    await rounds.getByRole('button', { name: 'Xóa vòng 1', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(page).toHaveURL(`/recruiter/jobs/${job.id}`);
    expect(recruiterJobSchema.parse(await (await page.request.get(`/api/bff/recruiter/jobs/${job.id}`)).json()).hiringRounds).toEqual([]);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/recruiter/jobs/new');
    await expect(page.locator('#job-rounds')).toBeVisible();
    await expect(page.locator('#job-contact, #job-extras, #extra-probation, #extra-age, #extra-gender')).toHaveCount(0);
    await expect(page.locator('.create-job-steps a[href="#job-rounds"]')).toBeVisible();
    await expect(page.locator('.create-job-steps a[href="#job-contact"]')).toHaveCount(0);
  } finally { await page.request.delete(`/api/bff/recruiter/jobs/${job.id}`, { headers: { 'X-CSRF-Token': csrf } }); }
});
