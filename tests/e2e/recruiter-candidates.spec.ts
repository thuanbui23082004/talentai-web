import { expect, test } from '@playwright/test';
import example from '../../contracts/examples/job-applicants.json';
import { mockJobs } from '@/mocks/fixtures/recruiter-jobs';
import { pdfCv } from '../support/cv-files';

test('job selection, status, pagination and error retry use the job applicants endpoint', async ({ page }, info) => {
    test.setTimeout(180000);
    const registered = await page.request.post('/api/bff/auth/register', { data: { email: `applicants-ui-${crypto.randomUUID()}@example.com`, password: 'TalentAI123!', fullName: 'Recruiter Applicants Test', role: 'recruiter' } });
    expect(registered.status()).toBe(201);
    const { csrfToken } = await registered.json();
    const catalogs = await (await page.request.get('/api/bff/recruiter/company/catalogs')).json();
    expect((await page.request.post('/api/bff/recruiter/company', { headers: { 'X-CSRF-Token': csrfToken }, data: { name: 'Applicants UI Test', taxCode: String(Date.now()).slice(-10), description: 'Isolated applicants UI test company.', industryIds: [catalogs.industries[0].id], city: catalogs.locations[0].name } })).status()).toBe(201);
    let failed = false;
    let empty = false;
    const calls: URL[] = [];
    await page.route('**/api/bff/recruiter/jobs**', route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/applications')) {
            calls.push(url);
            return failed ? route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } }) : route.fulfill({ json: { items: empty ? [] : example.items, meta: { page: Number(url.searchParams.get('page') ?? 1), pageSize: 9, totalItems: empty ? 0 : 10, totalPages: empty ? 0 : 2 } } });
        }
        if (url.pathname === '/api/bff/recruiter/jobs') return route.fulfill({ json: { items: [{ ...mockJobs[0], id: example.items[0].jobId, title: 'React Developer' }], meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 } } });
        return route.continue();
    });
    const cvPath = `/api/bff/recruiter/applications/${example.items[0].id}/cv`;
    await page.route('**/api/bff/recruiter/job-applications/**', route => route.request().url().endsWith('/cv') ? route.fulfill({ contentType: 'application/pdf', body: pdfCv() }) : route.fulfill({ json: route.request().url().endsWith('/resume') ? { url: cvPath, expiresAt: new Date(Date.now() + 300000).toISOString() } : example.items[0] }));
    await page.route(`**${cvPath}`, route => route.fulfill({ contentType: 'application/pdf', body: pdfCv() }));
    await page.goto('/recruiter/candidates');
    await expect(page.getByText('Chọn tin tuyển dụng để xem ứng viên', { exact: true })).toBeVisible();
    expect(calls).toHaveLength(0);
    await page.getByRole('button', { name: 'Bảng theo dõi', exact: true }).click();
    await expect(page.locator('#applicants-job-error')).toContainText('Vui lòng chọn tin tuyển dụng trước khi mở bảng theo dõi.');
    await expect(page).toHaveURL(/\/recruiter\/candidates$/);
    await page.getByRole('combobox', { name: 'Tin tuyển dụng', exact: true }).click();
    await page.getByRole('option', { name: 'React Developer', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ứng viên kiểm thử', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hồ sơ ứng tuyển · React Developer', exact: true })).toBeVisible();
    const titleBounds = await page.locator('.candidates-page-heading').boundingBox();
    const filterBounds = await page.getByRole('region', { name: 'Lọc ứng viên', exact: true }).boundingBox();
    const spacing = await page.locator('.job-applicants-filter').evaluate(node => ({ margin: getComputedStyle(node).margin, gap: getComputedStyle(node.parentElement!).gap, headerMargin: getComputedStyle(node.previousElementSibling!).margin }));
    expect(filterBounds!.y - titleBounds!.y - titleBounds!.height, JSON.stringify(spacing)).toBeLessThanOrEqual(24);
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: info.outputPath(`job-applicants-cards-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByRole('button', { name: 'Danh sách', exact: true })).toHaveCount(0);
    const listUrl = page.url();
    await page.getByRole('button', { name: 'Xem CV', exact: true }).click();
    const cvDialog = page.getByRole('dialog', { name: 'CV ứng viên', exact: true });
    await expect(cvDialog.locator('iframe')).toHaveAttribute('src', /^blob:/);
    await expect(page).toHaveURL(listUrl);
    await cvDialog.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
    await page.getByRole('link', { name: 'Xem chi tiết ứng viên Ứng viên kiểm thử', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/recruiter/candidates/${example.items[0].id}\\?from=job`));
    await expect(page.getByRole('heading', { level: 1, name: 'Ứng viên kiểm thử', exact: true })).toBeVisible();
    await expect(page.getByText(example.items[0].coverLetter, { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Quay lại danh sách ứng viên', exact: true }).click();
    await page.getByRole('combobox', { name: 'Trạng thái hồ sơ', exact: true }).click();
    await page.getByRole('option', { name: 'Đang xem xét', exact: true }).click();
    await expect(page).toHaveURL(/status=reviewing/);
    await expect.poll(() => calls.at(-1)?.searchParams.get('status')).toBe('reviewing');
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
    await expect.poll(() => calls.at(-1)?.searchParams.get('page')).toBe('2');
    failed = true;
    await page.reload();
    await expect(page.getByRole('alert').filter({ hasText: 'Không tải được danh sách ứng viên' })).toBeVisible();
    failed = false; empty = true;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(page.getByText('Chưa có ứng viên ứng tuyển', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('job-applicants-mobile.png'), fullPage: true });
});

test('real applicants list matches application-service for an owned job', async ({ page }) => {
    test.skip(process.env.RECRUITER_APPLICANTS_REAL_E2E !== '1', 'Optional read-only real backend check');
    const login = await page.request.post('/api/bff/auth/login', { data: { email: process.env.RECRUITER_TEST_EMAIL ?? 'recruiter@example.test', password: process.env.RECRUITER_TEST_PASSWORD ?? 'TalentAI2026!', role: 'recruiter' } });
    test.skip(!login.ok(), 'Real recruiter test account is unavailable');
    const jobs = await page.request.get('/api/bff/recruiter/jobs?pageSize=1');
    expect(jobs.status()).toBe(200);
    const job = (await jobs.json()).items[0];
    test.skip(!job, 'Recruiter test account has no jobs');
    const mapped = await page.request.get(`/api/bff/recruiter/jobs/${job.id}/applications?pageSize=9`);
    const access = (await page.context().cookies()).find(cookie => cookie.name === 'access_token')!.value;
    const native = await page.request.get(`http://localhost:3005/api/v1/recruiter/jobs/${job.id}/applications?page=0&size=9`, { headers: { Authorization: `Bearer ${access}` } });
    expect(mapped.status()).toBe(200); expect(native.status()).toBe(200);
    const data = (await native.json()).data;
    const body = await mapped.json();
    expect(body.meta.totalItems).toBe(data.totalElements);
    expect(body.items.map((item: { id: string }) => item.id)).toEqual(data.items.map((item: { id: string }) => item.id));
});
