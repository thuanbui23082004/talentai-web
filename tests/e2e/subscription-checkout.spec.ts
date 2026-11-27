import { expect, test, type APIRequestContext } from '@playwright/test';
import { startSubscriptionAuthServer } from '../support/subscription-auth-server';

test.skip(process.env.SUBSCRIPTION_DATA_MODE === 'real', 'This suite only creates mock orders.');
test.setTimeout(60000);

let authCookies: Awaited<ReturnType<APIRequestContext['storageState']>>['cookies'] = [];
let closeAuthServer: (() => Promise<void>) | undefined;
test.beforeAll(async ({ request }) => {
    if (process.env.SUBSCRIPTION_E2E_AUTH_STUB === '1') closeAuthServer = await startSubscriptionAuthServer();
    // One isolated account per suite avoids repeatedly registering for every case.
    const registration = await request.post('/api/bff/auth/register', { data: { fullName: 'Nhà tuyển dụng kiểm thử thanh toán', email: `checkout-${crypto.randomUUID()}@example.com`, password: 'TalentAI123!', role: 'recruiter', acceptedPrivacyPolicy: true } });
    expect(registration.status(), 'Requires the project auth gateway to register an isolated test account').toBe(201);
    const session = await registration.json();
    const catalogs = await (await request.get('/api/bff/recruiter/company/catalogs')).json();
    const company = await request.post('/api/bff/recruiter/company', { headers: { 'X-CSRF-Token': session.csrfToken }, data: { name: 'Công ty kiểm thử thanh toán', industryIds: [catalogs.industries[0].id], city: 'Đà Nẵng', description: 'Doanh nghiệp kiểm thử thanh toán gói dịch vụ.', taxCode: '0123456789' } });
    expect(company.status()).toBe(201);
    authCookies = (await request.storageState()).cookies;
});
test.afterAll(async () => { await closeAuthServer?.(); });
test.beforeEach(async ({ context }) => { await context.addCookies(authCookies); });

test('confirms price, prevents duplicate submit, activates the paid plan and survives reload', async ({ page }, info) => {
    let creates = 0;
    await page.route('**/api/bff/orders', async route => {
        if (route.request().method() === 'POST') {
            creates++;
            const body = route.request().postDataJSON();
            expect(body).toMatchObject({ itemType: 'SUBSCRIPTION' });
            expect(body).not.toHaveProperty('amount');
            expect(body).not.toHaveProperty('paymentMethod');
            expect(route.request().headers()['idempotency-key']).toBeTruthy();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        await route.continue();
    });
    await page.goto('/recruiter/pricing');
    await page.getByRole('button', { name: 'Đăng ký Gói Tiêu Chuẩn (Basic)', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('499,000 VNĐ');
    await expect(dialog.getByRole('radio', { name: /VietQR/ })).toBeChecked();
    await page.screenshot({ path: info.outputPath('checkout-confirmation-desktop.png'), fullPage: true });
    await dialog.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
    await expect(page).toHaveURL(/\/recruiter\/billing\/result\?orderId=/, { timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Gói đã được kích hoạt', exact: true })).toBeVisible();
    expect(creates).toBe(1);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('payment-success-desktop.png'), fullPage: true });
    await page.getByRole('link', { name: 'Quay lại bảng giá', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đăng ký Gói Tiêu Chuẩn (Basic)', exact: true })).toBeDisabled();
    await expect(page.getByRole('region', { name: 'Gói dịch vụ hiện tại' })).toContainText('Đang sử dụng: Gói Tiêu Chuẩn (Basic)');
});

test('renders failed payment and permits a fresh purchase on mobile', async ({ page }, info) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route('**/api/bff/orders/*/status', route => route.continue({ headers: { ...route.request().headers(), 'x-mock-scenario': 'failed' } }));
    await page.goto('/recruiter/pricing');
    await page.getByRole('button', { name: 'Đăng ký Gói Nâng Cao (Pro)', exact: true }).click();
    await page.getByRole('radio', { name: 'MoMo', exact: true }).check();
    await expect(page.getByRole('dialog')).toContainText('1,499,000 VNĐ');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('checkout-confirmation-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thanh toán thất bại', exact: true })).toBeVisible({ timeout: 20000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('payment-failed-mobile.png'), fullPage: true });
});

test('cancels a pending order and ignores forged success query parameters', async ({ page }) => {
    await page.route('**/api/bff/orders/*/status', route => route.continue({ headers: { ...route.request().headers(), 'x-mock-scenario': 'pending' } }));
    await page.goto('/recruiter/pricing');
    await page.getByRole('button', { name: 'Đăng ký Gói Nâng Cao (Pro)', exact: true }).click();
    await page.getByRole('radio', { name: 'ZaloPay', exact: true }).check();
    await page.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đang xử lý thanh toán', exact: true })).toBeVisible();
    await page.goto(`${page.url()}&status=PAID&result=success`);
    await expect(page.getByRole('heading', { name: 'Đang xử lý thanh toán', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận hủy đơn', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thanh toán đã hủy', exact: true })).toBeVisible();
    await page.goto('/recruiter/billing/result?status=PAID&result=success');
    await expect(page.getByRole('heading', { name: 'Chưa xác định được giao dịch', exact: true })).toBeVisible();
});

test('stops pending polling at 30 checks and supports an explicit retry', async ({ page }) => {
    test.setTimeout(120000);
    let checks = 0;
    await page.route('**/api/bff/orders/*/status', route => { checks++; return route.continue({ headers: { ...route.request().headers(), 'x-mock-scenario': 'pending' } }); });
    await page.goto('/recruiter/pricing');
    await page.getByRole('button', { name: 'Đăng ký Gói Nâng Cao (Pro)', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đang xử lý thanh toán', exact: true })).toBeVisible();
    const firstCheck = Number(await page.locator('[data-payment-check]').getAttribute('data-payment-check'));
    await page.clock.install();
    for (let i = firstCheck + 1; i <= 30; i++) {
        await page.clock.runFor(3100);
        await expect(page.locator('[data-payment-check]')).toHaveAttribute('data-payment-check', String(i));
    }
    await expect(page.getByText('Đã dừng tự động kiểm tra sau 30 lần.', { exact: false })).toBeVisible({ timeout: 15000 });
    expect(checks).toBe(30);
    await page.clock.runFor(15000);
    expect(checks).toBe(30);
    await page.getByRole('button', { name: 'Kiểm tra lại trạng thái', exact: true }).click();
    await expect.poll(() => checks).toBeGreaterThan(30);
});

test('recovers an ambiguous creation error with the same key and resolves the provider callback', async ({ page }) => {
    const keys: string[] = [];
    const ids: string[] = [];
    await page.route('**/api/bff/orders', async route => {
        keys.push(route.request().headers()['idempotency-key']);
        const response = await route.fetch();
        const order = await response.json();
        ids.push(order.orderId);
        if (keys.length === 1) await route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE', message: 'untrusted technical error' } } });
        else await route.fulfill({ response, json: { ...order, paymentUrl: route.request().postDataJSON().returnUrl } });
    });
    await page.goto('/recruiter/pricing');
    await page.getByRole('button', { name: 'Đăng ký Gói Nâng Cao (Pro)', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Chưa thể xác nhận');
    await page.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).click();
    await expect(page).toHaveURL(/\/billing\/result\?orderId=/, { timeout: 20000 });
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(1);
    expect(new Set(ids).size).toBe(1);
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toBeVisible({ timeout: 20000 });
});

test('displays a QR-only response without requiring a payment link', async ({ page }) => {
    const qr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9uoAAAAASUVORK5CYII=';
    await page.route('**/api/bff/orders', async route => { const response = await route.fetch(); await route.fulfill({ response, json: { ...await response.json(), paymentUrl: null, qrCodeUrl: qr } }); });
    await page.route('**/api/bff/orders/*/status', async route => {
        const response = await route.fetch({ headers: { ...route.request().headers(), 'x-mock-scenario': 'pending' } });
        await route.fulfill({ response, json: { ...await response.json(), paymentUrl: null, qrCodeUrl: qr } });
    });
    await page.goto('/recruiter/pricing');
    await page.getByRole('button', { name: 'Đăng ký Gói Tiêu Chuẩn (Basic)', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đang xử lý thanh toán', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Mã QR thanh toán của đơn hàng', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tiếp tục thanh toán', exact: true })).toHaveCount(0);
});

test('keeps payment success distinct from delayed subscription activation', async ({ page }) => {
    let holdActivation = true;
    await page.route('**/api/bff/subscriptions/me', async route => {
        const response = await route.fetch();
        const subscription = await response.json();
        await route.fulfill({ response, json: holdActivation ? { ...subscription, plan: { code: 'FREE', name: 'Gói Khởi Động (Free)' }, status: 'ACTIVE' } : subscription });
    });
    await page.goto('/recruiter/pricing');
    await page.getByRole('button', { name: 'Đăng ký Gói Tiêu Chuẩn (Basic)', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận và thanh toán', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công', exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Đang cập nhật gói của bạn', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gói đã được kích hoạt', exact: true })).toHaveCount(0);
    holdActivation = false;
    await expect(page.getByRole('heading', { name: 'Gói đã được kích hoạt', exact: true })).toBeVisible({ timeout: 10000 });
});

test('payment history lists real mock orders, paginates, filters, retries and opens an order on mobile', async ({ page }, info) => {
    test.setTimeout(90000);
    const initialTotal = (await (await page.request.get('/api/bff/orders/my')).json()).meta.totalItems;
    const csrf = (await (await page.request.get('/api/bff/auth/csrf')).json()).csrfToken;
    let lastId = '';
    for (let i = 0; i < 11; i++) {
        const key = crypto.randomUUID();
        const response = await page.request.post('/api/bff/orders', { headers: { Origin: 'http://127.0.0.1:3100', 'X-CSRF-Token': csrf, 'Idempotency-Key': key }, data: { itemType: 'SUBSCRIPTION', itemId: '4a7f01c8-8924-42b7-a38f-9a489d81d290', returnUrl: `http://127.0.0.1:3100/recruiter/billing/result?checkout=${key}&result=return`, cancelUrl: `http://127.0.0.1:3100/recruiter/billing/result?checkout=${key}&result=cancel` } });
        expect(response.status()).toBe(201);
        lastId = (await response.json()).orderId;
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/recruiter/payment-history');
    await expect(page.locator('article')).toHaveCount(10);
    await expect(page.getByRole('link', { name: 'Xem giao dịch', exact: true }).first()).toHaveAttribute('href', `/recruiter/billing/result?orderId=${lastId}`);
    await expect(page.locator('article').first()).toContainText('499,000 VNĐ');
    await page.screenshot({ path: info.outputPath('payment-history-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('article')).toHaveCount(Math.min(10, initialTotal + 1));
    await page.reload();
    await expect(page.locator('article')).toHaveCount(Math.min(10, initialTotal + 1));
    await page.getByRole('combobox', { name: 'Trạng thái thanh toán' }).click();
    await page.getByRole('option', { name: 'Đã hoàn tiền', exact: true }).click();
    await expect(page).toHaveURL(/status=REFUNDED/);
    await expect(page.getByRole('heading', { name: 'Không có giao dịch phù hợp' })).toBeVisible();
    await page.getByRole('button', { name: 'Xem tất cả giao dịch', exact: true }).click();
    let historyError = true;
    await page.route('**/api/bff/orders/my*', route => historyError ? route.fulfill({ status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE', message: 'private backend error' } } }) : route.continue());
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Không thể tải lịch sử thanh toán' })).toBeVisible();
    historyError = false;
    // Dispatch in-place so window-focus refetch cannot remove the error action
    // between Playwright's focus/scroll steps and the actual click.
    await page.getByRole('button', { name: 'Thử lại', exact: true }).evaluate(button => (button as HTMLButtonElement).click());
    await expect(page.locator('article')).toHaveCount(10);
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('payment-history-mobile.png'), fullPage: true });
    await page.getByRole('link', { name: 'Xem giao dịch', exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`orderId=${lastId}`));
});
