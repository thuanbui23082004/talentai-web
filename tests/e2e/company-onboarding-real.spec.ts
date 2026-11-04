import { expect, test } from "@playwright/test";

test.skip(process.env.COMPANY_REAL_E2E !== "1", "Requires company-service and auth-service");

test("creates a real company only after review, reloads it and reports a duplicate tax code", async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    const companyName = `Công ty kiểm thử onboarding ${Date.now()}`;
    const taxCode = String(Date.now());
    const password = "TalentAI123!";
    const email = `onboarding-${crypto.randomUUID()}@example.com`;
    async function register(api: typeof page.request) {
        const response = await api.post("/api/bff/auth/register", { data: { fullName: "Đại diện kiểm thử", email: api === page.request ? email : `onboarding-${crypto.randomUUID()}@example.com`, password, role: "recruiter", acceptedPrivacyPolicy: true } });
        expect(response.status()).toBe(201);
        return response.json();
    }
    const session = await register(page.request);
    expect((await page.request.get("/api/bff/recruiter/company")).status()).toBe(404);
    async function loginAgain() {
        await page.context().clearCookies();
        await page.goto("/login?role=recruiter");
        await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
        await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
        await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    }
    await page.goto("/recruiter/dashboard");
    await expect(page).toHaveURL(/\/recruiter\/onboarding$/);
    await page.goto("/recruiter/jobs/new");
    await expect(page).toHaveURL(/\/recruiter\/onboarding$/);
    await loginAgain();
    await expect(page).toHaveURL(/\/recruiter\/onboarding$/);
    await expect(page.getByRole("heading", { name: "Giới thiệu doanh nghiệp của bạn" })).toBeVisible();
    await page.locator('input[name="name"]').fill(companyName);
    await page.locator('input[name="taxCode"]').fill(taxCode);
    await page.getByLabel("Giới thiệu ngắn về công ty").fill("Doanh nghiệp kiểm thử tích hợp phần mềm.");
    await page.getByRole("combobox", { name: "Lĩnh vực hoạt động chính" }).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    await page.getByRole("combobox", { name: "Tỉnh / Thành phố" }).click();
    await page.getByRole("option", { name: "Đà Nẵng", exact: true }).click();
    await page.getByLabel("Địa chỉ trụ sở").fill("12 Đường Hoa, Đà Nẵng");
    await page.getByLabel("Số điện thoại liên hệ").fill("0912345678");
    await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Kiểm tra thông tin công ty" })).toBeVisible();
    expect((await page.request.get("/api/bff/recruiter/company")).status()).toBe(404);
    await page.getByRole("button", { name: "Tạo hồ sơ công ty", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hồ sơ công ty đã được tạo!" })).toBeVisible();
    const own = await page.request.get("/api/bff/recruiter/company");
    expect(own.status()).toBe(200);
    const company = await own.json();
    expect(company).toMatchObject({ name: companyName, taxCode, city: "Đà Nẵng", description: "Doanh nghiệp kiểm thử tích hợp phần mềm." });
    // Verify persistence directly against Java using the real login cookie.
    const access = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
    const backend = await page.request.get("http://localhost:3003/api/v1/recruiter/company", { headers: { Authorization: `Bearer ${access}` } });
    expect(backend.status()).toBe(200);
    expect((await backend.json()).data).toMatchObject({ id: company.id, name: companyName, taxCode });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Hồ sơ công ty đã được tạo!" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("real-company-created.png"), fullPage: true });
    await page.getByRole("link", { name: "Vào trang quản lý" }).click();
    await expect(page).toHaveURL(/\/recruiter\/dashboard$/);
    await loginAgain();
    await expect(page).toHaveURL(/\/recruiter\/dashboard$/);
    // Another recruiter cannot claim the same legal identity.
    const other = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
    try {
        const second = await register(other.request);
        const response = await other.request.post("/api/bff/recruiter/company", { headers: { "X-CSRF-Token": second.csrfToken }, data: { name: "Công ty kiểm thử trùng mã", taxCode, description: "Kiểm thử mã số thuế trùng.", industryIds: [company.industries[0].id], city: company.city, address: company.address, contactPhone: company.contactPhone } });
        expect(response.status()).toBe(422);
        expect((await response.json()).error.fieldErrors).toContainEqual(expect.objectContaining({ field: "taxCode", code: "CONFLICT" }));
    } finally { await other.close(); }
    expect(session.user.role).toBe("recruiter");
});
