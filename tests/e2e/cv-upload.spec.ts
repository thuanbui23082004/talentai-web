import { expect, test, type Page } from "@playwright/test";
import { CV_DOCX_TYPE } from "@/lib/api/cv-schemas";
import { docxCv, pdfCv } from "../support/cv-files";

async function register(page: Page) {
    const response = await page.request.post("/api/bff/auth/register", { data: { email: `cv-flow-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên kiểm thử CV", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(response.status()).toBe(201);
}

test("uploads PDF/DOCX, reads details, changes default and deletes with account isolation", async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    expect((await page.request.get("/api/bff/cvs")).status()).toBe(401);
    await register(page);
    await page.goto("/candidate/cv");
    const list = page.getByRole("region", { name: "CV của tôi", exact: true });
    await expect(list.getByText("Bạn chưa có CV nào", { exact: true })).toBeVisible();
    const input = page.getByLabel("Chọn tệp CV", { exact: true });
    const uploadBox = page.getByRole("region", { name: "Tải lên CV có sẵn", exact: true });
    const chooser = page.waitForEvent("filechooser");
    await uploadBox.getByRole("button", { name: "Chọn hoặc kéo thả CV để tải lên", exact: true }).click();
    await (await chooser).setFiles([]);
    await input.setInputFiles({ name: "bad.exe", mimeType: "application/octet-stream", buffer: Buffer.from("invalid") });
    await expect(page.getByText("Vui lòng chọn tệp PDF hoặc DOCX hợp lệ.", { exact: true })).toBeVisible();
    await page.route("**/api/bff/cvs", route => route.request().method() === "POST" ? route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }) : route.continue());
    await input.setInputFiles({ name: "resume-first.pdf", mimeType: "application/pdf", buffer: pdfCv() });
    await expect(page.getByRole("alert").filter({ hasText: "Dịch vụ chưa sẵn sàng" })).toBeVisible();
    await expect(page.getByText("resume-first.pdf", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/cvs");
    await uploadBox.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.getByText("Đã tải CV lên tài khoản.", { exact: true })).toBeVisible({ timeout: 45000 });
    const firstCard = list.getByRole("article", { name: "resume-first.pdf", exact: true });
    await expect(firstCard.getByRole("button", { name: "Mặc định", exact: true })).toBeDisabled();
    let releaseUpload: () => void = () => {};
    const uploadGate = new Promise<void>(resolve => { releaseUpload = resolve; });
    await page.route("**/api/bff/cvs", async route => {
        if (route.request().method() === "POST") await uploadGate;
        await route.continue();
    });
    const transfer = await page.evaluateHandle(({ content, type }) => {
        const data = new DataTransfer();
        data.items.add(new File([new Uint8Array(content)], "resume-second.docx", { type }));
        return data;
    }, { content: Array.from(docxCv()), type: CV_DOCX_TYPE });
    await uploadBox.dispatchEvent("dragenter", { dataTransfer: transfer });
    await expect(uploadBox.getByText("Thả file vào đây để tải lên", { exact: true })).toBeVisible();
    await uploadBox.dispatchEvent("drop", { dataTransfer: transfer });
    await expect(uploadBox.getByRole("progressbar", { name: "Tiến trình tải CV", exact: true })).toBeVisible();
    await expect(input).toBeDisabled();
    releaseUpload();
    const secondCard = list.getByRole("article", { name: "resume-second.docx", exact: true });
    await expect(secondCard).toBeVisible({ timeout: 45000 });
    await expect(uploadBox.getByRole("progressbar")).toHaveCount(0);
    await page.unroute("**/api/bff/cvs");
    await transfer.dispose();
    await expect(list.getByRole("article")).toHaveCount(2);
    const items = await (await page.request.get("/api/bff/cvs")).json();
    const first = items.find((cv: { fileName: string }) => cv.fileName === "resume-first.pdf");
    const second = items.find((cv: { fileName: string }) => cv.fileName === "resume-second.docx");
    expect(first.isDefault).toBe(true); expect(second.isDefault).toBe(false);

    await page.route(`**/api/bff/cvs/${first.id}`, route => route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }));
    await firstCard.getByRole("button", { name: "Chi tiết", exact: true }).click();
    const detail = page.getByRole("dialog", { name: "Chi tiết CV", exact: true });
    await expect(detail.getByText("Không tải được chi tiết CV", { exact: true })).toBeVisible();
    await page.unroute(`**/api/bff/cvs/${first.id}`);
    await detail.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(detail.getByText("resume-first.pdf", { exact: true })).toBeVisible();
    await expect(detail.getByRole("link", { name: "Mở file CV gốc", exact: true })).toHaveAttribute("href", first.fileUrl);
    await detail.getByRole("button", { name: "Đóng", exact: true }).click();
    await secondCard.getByRole("button", { name: "Đặt mặc định", exact: true }).click();
    await expect(list.getByText("Đã đặt CV mặc định.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(secondCard.getByRole("button", { name: "Mặc định", exact: true })).toBeDisabled();
    expect((await (await page.request.get("/api/bff/cvs")).json()).filter((cv: { isDefault: boolean }) => cv.isDefault).map((cv: { id: string }) => cv.id)).toEqual([second.id]);

    const other = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
    try {
        const response = await other.request.post("/api/bff/auth/register", { data: { email: `cv-other-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên khác", role: "candidate", acceptedPrivacyPolicy: true } });
        expect(response.status()).toBe(201);
        const csrf = (await response.json()).csrfToken;
        expect(await (await other.request.get("/api/bff/cvs")).json()).toEqual([]);
        expect((await other.request.get(`/api/bff/cvs/${first.id}`)).status()).toBe(404);
        expect((await other.request.patch(`/api/bff/cvs/${first.id}/default`, { headers: { "X-CSRF-Token": csrf } })).status()).toBe(404);
        expect((await other.request.delete(`/api/bff/cvs/${first.id}`, { headers: { "X-CSRF-Token": csrf } })).status()).toBe(404);
        if (first.fileUrl.startsWith("/api/mock-media/")) expect((await other.request.get(first.fileUrl)).status()).toBe(404);
    } finally { await other.close(); }

    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: testInfo.outputPath(`uploaded-cvs-${width}.png`), fullPage: true });
        await secondCard.getByRole("button", { name: "Chi tiết", exact: true }).click();
        await expect(detail.getByText("resume-second.docx", { exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath(`cv-detail-${width}.png`) });
        await detail.getByRole("button", { name: "Đóng", exact: true }).click();
    }
    if (process.env.PROFILE_REAL_E2E === "1") {
        const token = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
        const native = await page.request.get("http://localhost:3002/api/v1/cvs", { headers: { Authorization: `Bearer ${token}` } });
        expect(native.status()).toBe(200);
        expect((await native.json()).data.items.find((cv: { id: string }) => cv.id === second.id)).toMatchObject({ isDefault: true, fileName: second.fileName, fileUrl: second.fileUrl });
    } else expect((await page.request.get(first.fileUrl)).status()).toBe(200);

    await secondCard.getByRole("button", { name: "Xóa resume-second.docx", exact: true }).click();
    const confirmation = page.getByRole("dialog", { name: "Xóa CV?", exact: true });
    await page.route("**/api/bff/cvs/*", route => route.request().method() === "DELETE" ? route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }) : route.continue());
    await confirmation.getByRole("button", { name: "Xóa CV", exact: true }).click();
    await expect(confirmation.getByText("Chưa thể xóa CV", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/cvs/*");
    await confirmation.getByRole("button", { name: "Xóa CV", exact: true }).click();
    await expect(confirmation).toBeHidden({ timeout: 45000 });
    await expect(firstCard.getByRole("button", { name: "Mặc định", exact: true })).toBeDisabled();
    await firstCard.getByRole("button", { name: "Xóa resume-first.pdf", exact: true }).click();
    await confirmation.getByRole("button", { name: "Xóa CV", exact: true }).click();
    await expect(confirmation).toBeHidden({ timeout: 45000 });
    await expect(list.getByText("Bạn chưa có CV nào", { exact: true })).toBeVisible();
});

test("CV list loading errors offer retry", async ({ page }) => {
    await register(page);
    await page.route("**/api/bff/cvs", route => route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }));
    await page.goto("/candidate/cv");
    const list = page.getByRole("region", { name: "CV của tôi", exact: true });
    await expect(list.getByText("Không tải được danh sách CV", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/cvs");
    await list.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(list.getByText("Bạn chưa có CV nào", { exact: true })).toBeVisible();
});
