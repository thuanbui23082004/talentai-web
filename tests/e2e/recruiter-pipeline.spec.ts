import { expect, test, type Page } from './recruiter-fixture';
import { z } from 'zod';

const first = '00000000-0000-4000-9000-000000000001';
const card = (page: Page, id = first) => page.locator(`.pipeline-card[data-application-id="${id}"]`);
async function restore(page: Page) {
  const result = await page.request.get('/api/bff/auth/csrf');
  const token = z.object({ csrfToken: z.string() }).parse(await result.json()).csrfToken;
  const response = await page.request.patch(`/api/bff/recruiter/applications/${first}/status`, { headers: { 'X-CSRF-Token': token }, data: { status: 'reviewing', round: 'Sơ tuyển HR', notifyCandidate: false } });
  expect(response.ok()).toBe(true);
}

async function dragCard(page: Page, stage: string) {
  await expect(card(page).getByRole('button', { name: 'Kéo thẻ của Mai An', exact: true })).toBeEnabled();
  const source = await card(page).locator('.pipeline-card-header').boundingBox();
  const target = await page.locator(`[data-stage="${stage}"] .pipeline-column-heading`).boundingBox();
  await page.mouse.move(source!.x + 8, source!.y + 8);
  await page.mouse.down();
  await page.mouse.move(source!.x + 20, source!.y + 8, { steps: 3 });
  await page.mouse.move(target!.x + target!.width / 2, target!.y + 20, { steps: 20 });
  await expect(page.locator(`[data-stage="${stage}"]`)).toHaveClass(/pipeline-column-over/);
  await page.mouse.up();
}

test('a failed drop retains the card, supports retry, and a final drop still needs confirmation', async ({ page }) => {
  await page.goto('/recruiter/candidates/pipeline');
  await expect(card(page)).toBeVisible();
  await page.route(`**/api/bff/recruiter/applications/${first}/status`, route => route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } }) }));
  await dragCard(page, 'interview');
  await expect(page.locator('.pipeline-drop-error')).toContainText('Hồ sơ được giữ ở cột cũ');
  await expect(page.locator(`[data-stage="reviewing"] .pipeline-card[data-application-id="${first}"]`)).toBeVisible();
  await page.unroute(`**/api/bff/recruiter/applications/${first}/status`);
  try {
    await page.locator('.pipeline-drop-error').getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(page.locator(`[data-stage="interview"] .pipeline-card[data-application-id="${first}"]`)).toBeVisible();
    await dragCard(page, 'hired');
    await expect(page.getByRole('heading', { name: 'Chuyển giai đoạn ứng viên', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Tôi xác nhận quyết định tuyển dụng này.' })).toBeVisible();
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(page.locator(`[data-stage="interview"] .pipeline-card[data-application-id="${first}"]`)).toBeVisible();
  } finally { await restore(page); }
});
test('board entry, real counts, per-column pagination, explanation and detail link', async ({ page }, info) => {
  await page.goto('/recruiter/candidates');
  await page.getByRole('link', { name: 'Bảng theo dõi', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/candidates/pipeline');
  const submitted = page.locator('[data-stage="submitted"]');
  await expect(submitted.locator('.pipeline-card')).toHaveCount(4, { timeout: 30000 });
  await expect(submitted.getByLabel('5 hồ sơ', { exact: true })).toBeVisible();
  await submitted.getByRole('button', { name: 'Tải thêm', exact: true }).click();
  await expect(submitted.locator('.pipeline-card')).toHaveCount(5);
  await expect(page.locator('[data-stage="reviewing"] .pipeline-card')).toHaveCount(4);
  await card(page).getByRole('button', { name: 'Điểm AI 78%. Xem giải thích', exact: true }).click();
  await expect(card(page).locator('.pipeline-score-explanation')).toContainText('Hồ sơ đáp ứng', { timeout: 30000 });
  await expect(card(page).locator('.pipeline-score-explanation')).toContainText('chỉ mang tính tham khảo');
  await card(page).getByRole('button', { name: 'Đóng giải thích', exact: true }).click();
  await page.screenshot({ path: info.outputPath('pipeline-desktop.png'), fullPage: true });
  await card(page).getByRole('link', { name: 'Xem chi tiết ứng viên Mai An', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mai An', exact: true })).toBeVisible();
});

test('dragging persists a manual stage change and synchronizes list and detail', async ({ page }) => {
  await page.goto('/recruiter/candidates/pipeline');
  await expect(card(page)).toBeVisible({ timeout: 30000 });
  try {
    const source = await card(page).locator('.pipeline-card-header').boundingBox();
    const target = await page.locator('[data-stage="interview"] .pipeline-column-heading').boundingBox();
    await page.mouse.move(source!.x + 8, source!.y + 8);
    await page.mouse.down();
    await page.mouse.move(source!.x + 20, source!.y + 8, { steps: 3 });
    await page.mouse.move(target!.x + target!.width / 2, target!.y + 20, { steps: 20 });
    await expect(page.locator('[data-stage="interview"]')).toHaveClass(/pipeline-column-over/);
    await page.mouse.up();
    await expect(page.getByRole('heading', { name: 'Chuyển giai đoạn ứng viên', exact: true })).toHaveCount(0);
    await expect(page.locator('[data-stage="interview"] .pipeline-card').filter({ has: page.getByRole('link', { name: 'Mai An', exact: true }) })).toBeVisible();
    await expect(page.locator('[data-stage="reviewing"] .pipeline-card[data-application-id="' + first + '"]')).toHaveCount(0);
    await page.getByRole('link', { name: 'Danh sách ứng viên', exact: true }).click();
    await expect(page.locator('.candidate-card').filter({ has: page.getByRole('heading', { name: 'Mai An', exact: true }) }).locator('.candidate-status')).toHaveText('Đang phỏng vấn');
    await page.getByRole('link', { name: 'Mai An', exact: true }).click();
    await expect(page.locator('.candidate-personal-intro .candidate-status')).toHaveText('Đang phỏng vấn');
  } finally { await restore(page); }
});

test('plus picker, final decision confirmation, cancellation and failed save retain the original card', async ({ page }) => {
  await page.goto('/recruiter/candidates/pipeline');
  await expect(card(page)).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Chuyển hồ sơ vào Đã tuyển dụng', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tìm tên hoặc chức danh', exact: true }).fill('Mai An');
  await page.getByRole('button', { name: 'Chọn Mai An', exact: true }).click();
  let patches = 0;
  await page.route(`**/api/bff/recruiter/applications/${first}/status`, async route => {
    patches += 1;
    await route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } }) });
  });
  await page.getByRole('button', { name: 'Xác nhận chuyển', exact: true }).click();
  await expect(page.locator('.pipeline-action-panel').getByRole('alert')).toContainText('Vui lòng xác nhận quyết định');
  expect(patches).toBe(0);
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await card(page).getByRole('combobox', { name: 'Chuyển giai đoạn của Mai An', exact: true }).click();
  await page.getByRole('option', { name: 'Từ chối', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Tôi xác nhận quyết định tuyển dụng này.', exact: true }).check();
  await page.getByRole('button', { name: 'Xác nhận chuyển', exact: true }).click();
  await expect(page.locator('.pipeline-action-panel').getByRole('alert')).toContainText('Hồ sơ được giữ ở cột cũ');
  expect(patches).toBe(1);
  await expect(page.locator('[data-stage="reviewing"] .pipeline-card[data-application-id="' + first + '"]')).toBeVisible();
  await page.unroute(`**/api/bff/recruiter/applications/${first}/status`);
  try {
    await page.getByRole('button', { name: 'Xác nhận chuyển', exact: true }).click();
    await expect(page.locator('[data-stage="rejected"] .pipeline-card[data-application-id="' + first + '"]')).toBeVisible();
  } finally { await restore(page); }
});

test('column errors retry, empty columns, withdrawn read-only and mobile scrolling', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 800 });
  let fail = true;
  await page.route('**/api/bff/recruiter/applications?*', async route => {
    const url = new URL(route.request().url());
    if (fail && url.search.includes('submitted')) await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR' } }) });
    else await route.continue();
  });
  await page.goto('/recruiter/candidates/pipeline');
  const submitted = page.locator('[data-stage="submitted"]');
  await expect(submitted.getByRole('alert')).toContainText('Không thể tải hồ sơ', { timeout: 30000 });
  fail = false;
  await submitted.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(submitted.locator('.pipeline-card')).toHaveCount(4);
  await expect(page.locator('[data-stage="withdrawn"] .pipeline-card').first()).toBeVisible();
  await expect(page.locator('[data-stage="withdrawn"] .pipeline-card-actions')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scroll = page.locator('.pipeline-board-scroll');
  expect(await scroll.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await expect(page.locator('[data-stage="rejected"] .pipeline-column-heading')).toBeInViewport();
  await page.screenshot({ path: info.outputPath('pipeline-mobile.png'), fullPage: true });
  await page.unroute('**/api/bff/recruiter/applications?*');
  await page.route('**/api/bff/recruiter/applications?*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], meta: { page: 1, pageSize: 4, totalItems: 0, totalPages: 0 } }) }));
  await page.reload();
  await expect(page.locator('.pipeline-board .pipeline-column-state')).toHaveCount(5);
  await expect(submitted).toContainText('Chưa có ứng viên ở giai đoạn này.');
});
