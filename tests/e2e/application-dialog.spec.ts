import { expect, test } from "@playwright/test";

test("single location defaults, CV selection and preview-only submission", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 960 });
    const mutations: string[] = [];
    page.on("request", (request) => { if (request.method() === "POST" && /\/api\/bff\/(cvs|applications)/.test(request.url())) mutations.push(request.url()); });
    await page.goto("/ui/application");
    const trigger = page.getByRole("button", { name: "Job một địa điểm", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("width", "680px");
    expect((await dialog.boundingBox())!.height).toBeLessThanOrEqual(840);
    expect(await dialog.locator(".overflow-y-auto").evaluate((element) => getComputedStyle(element, "::-webkit-scrollbar").width)).toBe("3px");
    await page.screenshot({ path: testInfo.outputPath("application-initial.png") });
    await expect(page.locator("[data-modal-backdrop]:visible")).toHaveCount(1);
    await expect(dialog.getByLabel("Địa điểm làm việc mặc định")).toContainText("Phường Phú Lợi");
    await expect(dialog.getByRole("combobox")).toHaveCount(0);
    await expect(dialog.getByRole("radio").first()).toBeChecked();
    await dialog.getByRole("radio").nth(1).check();
    await expect(dialog.getByRole("radio").nth(1)).toBeChecked();
    await dialog.getByRole("button", { name: "Nộp hồ sơ ứng tuyển", exact: true }).click();
    await expect(dialog.getByText("Vui lòng xác nhận thỏa thuận sử dụng dữ liệu.", { exact: true })).toBeVisible();
    await dialog.getByRole("checkbox").nth(1).check();
    await dialog.getByRole("button", { name: "Nộp hồ sơ ứng tuyển", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("Chưa gửi hồ sơ");
    expect(mutations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath("application-desktop.png") });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
});

test("multiple locations only offer the job list and require a selection", async ({ page }) => {
    await page.goto("/ui/application");
    await page.getByRole("button", { name: "Job nhiều địa điểm", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
    const location = dialog.getByRole("combobox");
    await expect(location).toContainText("Chọn địa điểm bạn muốn làm việc");
    await dialog.getByRole("button", { name: "Nộp hồ sơ ứng tuyển", exact: true }).click();
    await expect(dialog.getByText("Vui lòng chọn địa điểm làm việc của tin tuyển dụng.", { exact: true })).toBeVisible();
    await location.click();
    await expect(page.getByRole("option")).toHaveCount(2);
    await page.getByRole("option", { name: "Phường Hải Vân, Đà Nẵng", exact: true }).click();
    await expect(location).toContainText("Phường Hải Vân, Đà Nẵng");
    await expect(dialog.getByText("Vui lòng chọn địa điểm làm việc của tin tuyển dụng.", { exact: true })).toHaveCount(0);
});

test("local file selection validates, replaces and removes without uploading", async ({ page }) => {
    await page.goto("/ui/application");
    await page.getByRole("button", { name: "Chưa có CV", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
    const input = dialog.getByLabel("Tệp CV", { exact: true });
    await input.setInputFiles({ name: "CV.doc", mimeType: "application/msword", buffer: Buffer.from("invalid") });
    await expect(dialog.getByRole("alert")).toContainText("PDF hoặc DOCX hợp lệ");
    await input.setInputFiles({ name: "empty.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(0) });
    await expect(dialog.getByRole("alert")).toContainText("Tệp CV trống");
    await input.setInputFiles({ name: "large.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    await expect(dialog.getByRole("alert")).toContainText("không được vượt quá 5MB");
    await input.setInputFiles({ name: "my-cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 preview") });
    await expect(dialog.getByText("my-cv.pdf", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    await expect(dialog.getByLabel("Chọn CV từ máy tính", { exact: true })).toBeChecked();
    await dialog.getByLabel("Bỏ tệp CV", { exact: true }).click();
    await expect(dialog.getByText("my-cv.pdf", { exact: true })).toHaveCount(0);
    const transfer = await page.evaluateHandle(() => {
        const data = new DataTransfer();
        data.items.add(new File(["%PDF-1.7 dragged preview"], "dragged-cv.pdf", { type: "application/pdf" }));
        return data;
    });
    await dialog.locator("[data-cv-dropzone]").dispatchEvent("drop", { dataTransfer: transfer });
    await expect(dialog.getByText("dragged-cv.pdf", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Chưa có CV", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Chọn CV", exact: true })).toBeVisible();
});

test("application modal fits small screens, scrolls internally and supports nested terms", async ({ page }, testInfo) => {
    for (const width of [375, 768]) {
        await page.setViewportSize({ width, height: 740 });
        await page.goto("/ui/application");
        await page.getByRole("button", { name: "Job một địa điểm", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
        await expect(dialog).toBeVisible();
        const rect = await dialog.boundingBox();
        expect(rect!.x).toBeGreaterThanOrEqual(11);
        expect(rect!.y).toBeGreaterThanOrEqual(31);
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(width - 11);
        expect(rect!.height).toBeLessThanOrEqual(676);
        expect(await dialog.locator(".overflow-y-auto").evaluate((element) => getComputedStyle(element, "::-webkit-scrollbar").width)).toBe("3px");
        await dialog.getByRole("button", { name: "Thỏa thuận sử dụng dữ liệu cá nhân", exact: true }).click();
        const terms = page.getByRole("dialog", { name: "Thỏa thuận sử dụng dữ liệu cá nhân", exact: true });
        await expect(terms).toBeVisible();
        await expect(page.locator("[data-modal-backdrop]:visible")).toHaveCount(2);
        await page.keyboard.press("Escape");
        await expect(terms).toBeHidden();
        await expect(dialog).toBeVisible();
        await dialog.getByRole("button", { name: "Nộp hồ sơ ứng tuyển", exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`application-mobile-${width}.png`) });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.keyboard.press("Escape");
    }
});

test("hover preview apply survives preview closing and candidate dialogs have a backdrop", async ({ page }) => {
    await page.goto("/jobs?q=React");
    const card = page.locator("#job-results article").first();
    await card.hover();
    const preview = page.getByRole("region", { name: "Xem nhanh công việc" });
    await expect(page.locator("[data-preview-backdrop]")).toBeVisible();
    await preview.getByRole("button", { name: "Ứng tuyển", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
    await expect(dialog).toBeVisible();
    await expect(preview).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();

    expect((await page.request.post("/api/bff/auth/login", { data: { email: "candidate@example.com", password: "TalentAI123!", role: "candidate" } })).ok()).toBe(true);
    await page.goto("/candidate/dashboard");
    await page.getByRole("button", { name: "Ứng tuyển nhanh", exact: true }).first().click();
    await expect(dialog).toBeVisible();
    await expect(page.locator("[data-modal-backdrop]:visible")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await page.getByLabel("Tài khoản Nguyễn Minh Anh", { exact: true }).hover();
    await expect(page.locator("header").getByRole("link", { name: "Đăng xuất", exact: true })).toBeVisible();
    await expect(page.locator("[data-modal-backdrop]:visible")).toHaveCount(0);
});
