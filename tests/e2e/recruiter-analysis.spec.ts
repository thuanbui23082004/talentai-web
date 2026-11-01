import { expect, test } from './recruiter-fixture';

test('screen applicants, refresh ranking and recommendations without changing recruitment status', async ({ page }, info) => {
  const jobId = '00000000-0000-4000-8000-000000000203';
  await page.goto(`/recruiter/jobs/${jobId}`);
  await page.getByRole('button', { name: 'Sàng lọc AI', exact: true }).click();
  const panel = page.locator('.ai-screening-section');
  await expect(panel.locator('.ai-ranked-list')).toBeVisible();
  const before = await page.request.get(`/api/bff/recruiter/jobs/${jobId}/applications`);
  const statuses = (await before.json()).items.map((item: { id: string; status: string }) => [item.id, item.status]);
  await panel.getByRole('button', { name: 'Chạy sàng lọc', exact: true }).click();
  await expect(panel.locator('.ai-progress')).toContainText('Đã hoàn tất');
  await expect(panel.locator('.ai-score').first()).toBeVisible();
  const after = await page.request.get(`/api/bff/recruiter/jobs/${jobId}/applications`);
  expect((await after.json()).items.map((item: { id: string; status: string }) => [item.id, item.status])).toEqual(statuses);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('screening-desktop.png'), fullPage: true });
  await panel.getByRole('button', { name: 'Ứng viên đề xuất', exact: true }).click();
  await expect(panel.locator('.ai-recommended-list article').first()).toBeVisible();
  await expect(panel.locator('.ai-advisory').first()).toContainText('chỉ mang tính tham khảo');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('screening-mobile.png'), fullPage: true });
});

test('matching reports failure, retries and displays matched and missing skills', async ({ page }, info) => {
  const id = '00000000-0000-4000-9000-000000000002';
  await page.goto(`/recruiter/candidates/${id}`);
  const panel = page.locator('.ai-matching-panel').first();
  await expect(panel.getByRole('button', { name: 'Đối sánh lại', exact: true })).toBeVisible();
  await page.route(`**/api/bff/recruiter/applications/${id}/matching`, async route => {
    await route.continue({ headers: { ...route.request().headers(), 'x-mock-scenario': 'analysis-failed' } });
  });
  await panel.getByRole('button', { name: 'Đối sánh lại', exact: true }).click();
  await expect(panel).toContainText('Phân tích chưa thành công');
  await page.unroute(`**/api/bff/recruiter/applications/${id}/matching`);
  await panel.getByRole('button', { name: 'Đối sánh lại', exact: true }).click();
  await expect(panel.locator('.ai-progress')).toContainText('Đã hoàn tất');
  await expect(panel.getByRole('heading', { name: 'Kỹ năng phù hợp' })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Kỹ năng còn thiếu' })).toBeVisible();
  await expect(panel.locator('.ai-skill-columns section').first()).toContainText('SQL');
  await expect(panel.locator('.ai-skill-columns section').last()).toContainText('React');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('matching-desktop.png'), fullPage: true });
});

test('retrying progress resumes the same task and ranking handles empty and failed responses', async ({ page }) => {
  const jobId = '00000000-0000-4000-8000-000000000204';
  await page.goto(`/recruiter/jobs/${jobId}`);
  await page.getByRole('button', { name: 'Sàng lọc AI', exact: true }).click();
  const panel = page.locator('.ai-screening-section');
  await expect(panel.locator('.ai-ranked-list')).toBeVisible();
  let starts = 0;
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/screening')) starts++; });
  await page.route('**/api/bff/analysis-tasks/*', route => route.fulfill({ status: 503, json: { title: 'Unavailable', status: 503 } }));
  await panel.getByRole('button', { name: 'Chạy sàng lọc', exact: true }).click();
  await expect(panel.locator('.ai-progress')).toContainText('Không thể cập nhật tiến độ');
  await page.unroute('**/api/bff/analysis-tasks/*');
  await panel.locator('.ai-progress').getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(panel.locator('.ai-progress')).toContainText('Đã hoàn tất');
  expect(starts).toBe(1);
  await panel.getByRole('textbox', { name: 'Tìm theo tên, kỹ năng hoặc chức danh' }).fill('zzznomatchingcandidate');
  await expect(panel.locator('.ai-empty')).toHaveText('Chưa có hồ sơ ứng tuyển phù hợp.');
  await page.route(`**/api/bff/recruiter/jobs/${jobId}/applications?*`, route => route.fulfill({ status: 500, json: { title: 'Failed', status: 500 } }));
  await panel.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(panel.locator('[role=alert]')).toContainText('Không thể tải hoặc xử lý dữ liệu');
  await page.unroute(`**/api/bff/recruiter/jobs/${jobId}/applications?*`);
  await panel.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(panel.locator('.ai-ranked-list')).toBeVisible();
});
