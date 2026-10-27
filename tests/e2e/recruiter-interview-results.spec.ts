import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { interviewSchema } from '@/lib/api/candidate-detail-schemas';

test('record, reload and edit interview results inside the recruitment timeline', async ({ page }, info) => {
  const applicationId = '00000000-0000-4000-9000-000000000003';
  const csrf = await page.request.get('/api/bff/auth/csrf');
  const token = z.object({ csrfToken: z.string() }).parse(await csrf.json()).csrfToken;
  const created = await page.request.post('/api/bff/recruiter/interviews', { headers: { 'X-CSRF-Token': token }, data: { applicationId, startTime: '2038-05-01T03:00:00Z', endTime: '2038-05-01T04:00:00Z', mode: 'offline', location: 'Văn phòng kiểm thử', sendInvitation: false } });
  expect(created.status()).toBe(201);
  const interview = interviewSchema.parse(await created.json());
  await page.goto(`/recruiter/candidates/${applicationId}`);
  const panel = page.getByRole('region', { name: 'Kết quả phỏng vấn', exact: true });
  const pipeline = page.locator('.candidate-pipeline');
  const before = await pipeline.innerText();
  // The new interview is first because the timeline is sorted by start time.
  const first = panel.locator('.interview-result-list > li').first();
  await first.getByRole('button', { name: 'Ghi kết quả', exact: true }).click();
  await first.getByRole('button', { name: 'Lưu kết quả', exact: true }).click();
  await expect(first.getByRole('alert')).toContainText('Vui lòng chọn kết quả');
  await first.getByRole('combobox', { name: 'Kết quả', exact: true }).click();
  await page.getByRole('option', { name: 'Cần phỏng vấn thêm', exact: true }).click();
  await first.getByRole('textbox', { name: 'Nhận xét phỏng vấn' }).fill('Cần thêm vòng trao đổi về dự án.');
  await first.getByRole('button', { name: 'Lưu kết quả', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Đã lưu kết quả phỏng vấn.');
  expect(await pipeline.innerText()).toBe(before);
  await page.reload();
  await expect(first).toContainText('Cần phỏng vấn thêm');
  await expect(first).toContainText('Cần thêm vòng trao đổi về dự án.');
  await first.getByRole('button', { name: 'Chỉnh sửa kết quả', exact: true }).click();
  await expect(first.getByRole('textbox', { name: 'Nhận xét phỏng vấn' })).toHaveValue('Cần thêm vòng trao đổi về dự án.');
  await first.getByRole('combobox', { name: 'Kết quả', exact: true }).click();
  await page.getByRole('option', { name: 'Đạt', exact: true }).click();
  await first.getByRole('button', { name: 'Lưu kết quả', exact: true }).click();
  await expect(first.locator('.interview-result-badge')).toHaveText('Đạt');
  const result = await page.request.get(`/api/bff/recruiter/applications/${applicationId}/interviews`);
  const list = z.object({ items: z.array(interviewSchema) }).parse(await result.json());
  expect(list.items.find(value => value.id === interview.id)).toMatchObject({ status: 'completed', result: 'passed' });
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('interview-results-desktop.png') });
  await page.setViewportSize({ width: 360, height: 800 });
  await panel.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('interview-results-mobile.png') });
});

test('interview timeline offers retry and handles an empty list', async ({ page }) => {
  const id = '00000000-0000-4000-9000-000000000004';
  const url = `**/api/bff/recruiter/applications/${id}/interviews`;
  await page.route(url, route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } }));
  await page.goto(`/recruiter/candidates/${id}`);
  const panel = page.getByRole('region', { name: 'Kết quả phỏng vấn', exact: true });
  await expect(panel.getByRole('alert')).toContainText('Không thể tải hoặc lưu kết quả');
  await page.unroute(url);
  await page.route(url, route => route.fulfill({ status: 200, json: { items: [] } }));
  await panel.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(panel).toContainText('Chưa có lịch phỏng vấn.');
});
