import { expect, test } from "@playwright/test";
import { pdfCv } from "../support/cv-files";

test("application popup loads account CVs, uploads with retry and retains them on reopening", async ({ page }, testInfo) => {
    test.setTimeout(120000);
    const registered = await page.request.post("/api/bff/auth/register", { data: { email: `apply-cv-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên kiểm thử ứng tuyển", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(registered.status()).toBe(201);
    const { csrfToken } = await registered.json();
    await page.goto("/jobs?q=React");
    await page.locator("#job-results article").first().getByRole("heading").getByRole("link").click();
    const apply = page.getByRole("button", { name: "Ứng tuyển ngay", exact: true });
    await page.route("**/api/bff/cvs", route => route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }));
    await apply.click();
    const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
    await expect(dialog.getByText("Không tải được danh sách CV", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/cvs");
    await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(dialog.getByText("Chưa có CV để chọn.", { exact: false })).toBeVisible();
    await expect(dialog.getByText("Nguyễn Trúc Quỳnh My", { exact: false })).toHaveCount(0);
    const input = dialog.getByLabel("Tệp CV", { exact: true });
    await input.setInputFiles({ name: "bad.exe", mimeType: "application/octet-stream", buffer: Buffer.from("invalid") });
    await expect(dialog.getByRole("alert")).toContainText("PDF hoặc DOCX hợp lệ");
    await page.route("**/api/bff/cvs", route => route.request().method() === "POST" ? route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }) : route.continue());
    await input.setInputFiles({ name: "application-resume.pdf", mimeType: "application/pdf", buffer: pdfCv() });
    await expect(dialog.getByRole("button", { name: "Thử lại tải CV", exact: true })).toBeVisible();
    await page.unroute("**/api/bff/cvs");
    await dialog.getByRole("button", { name: "Thử lại tải CV", exact: true }).click();
    await expect(dialog.getByRole("radio", { name: /application-resume/ })).toBeChecked({ timeout: 45000 });
    await expect(dialog.getByText("Mặc định", { exact: true }).first()).toBeVisible();
    const list = await (await page.request.get("/api/bff/cvs")).json();
    expect(list).toHaveLength(1);
    expect(list[0].fileName).toBe("application-resume.pdf");
    if (process.env.PROFILE_REAL_E2E === "1") {
        const access = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
        const native = await page.request.get("http://localhost:3002/api/v1/cvs", { headers: { Authorization: `Bearer ${access}` } });
        expect(native.status()).toBe(200);
        expect((await native.json()).data.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: list[0].id, fileName: list[0].fileName })]));
    }
    await page.keyboard.press("Escape");
    await apply.click();
    await expect(dialog.getByRole("radio").first()).toBeChecked();
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`application-cvs-${width}.png`) });
    }
    expect((await page.request.delete(`/api/bff/cvs/${list[0].id}`, { headers: { "X-CSRF-Token": csrfToken } })).status()).toBe(204);
});

test("anonymous visitors must sign in before accessing account CVs", async ({ page }) => {
    await page.goto("/jobs?q=React");
    await page.locator("#job-results article").first().getByRole("heading").getByRole("link").click();
    await page.getByRole("button", { name: "Ứng tuyển ngay", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
    await expect(dialog.getByRole("link", { name: "đăng nhập tài khoản ứng viên", exact: true })).toHaveAttribute("href", "/login");
    await expect(dialog.getByRole("radio")).toHaveCount(0);
});
