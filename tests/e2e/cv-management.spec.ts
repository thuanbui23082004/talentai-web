import { test, expect, type Page } from "@playwright/test";

async function openCvPage(page: Page) {
    const response = await page.request.post("/api/bff/auth/register", { data: { email: `cv-design-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên bản nháp CV", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(response.status()).toBe(201);
    await page.goto("/candidate/cv");
}

async function createDraft(page: Page) {
    const library = page.getByRole("region", { name: "Tạo CV chuyên nghiệp với Mẫu thịnh hành", exact: true });
    await library.getByRole("button", { name: "Dùng mẫu này", exact: true }).first().click();
    const form = page.getByRole("dialog", { name: "Tạo CV từ mẫu", exact: true });
    await form.getByRole("textbox", { name: "Tên CV", exact: false }).fill("CV bản nháp");
    await form.getByRole("textbox", { name: "Họ và tên", exact: false }).fill("Nguyễn Minh Anh");
    await form.getByRole("textbox", { name: "Vị trí ứng tuyển", exact: false }).fill("Frontend Developer");
    await form.getByRole("button", { name: "Tạo bản xem trước", exact: true }).click();
}

test("template drafts stay separate from account CVs and retain editing and preview", async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await openCvPage(page);
    await expect(page.getByRole("region", { name: "CV của tôi", exact: true }).getByRole("article")).toHaveCount(0);
    await createDraft(page);
    const drafts = page.getByRole("region", { name: "Bản nháp CV từ mẫu", exact: true });
    await expect(drafts.getByRole("article")).toHaveCount(1);
    const card = drafts.getByRole("article").first();
    await expect(card.getByRole("switch")).not.toBeChecked();
    await card.getByRole("switch").click();
    await expect(card.getByRole("switch")).toBeChecked();
    await card.getByRole("button", { name: "Xem trước", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Xem trước CV", exact: true }).getByRole("heading", { name: "Nguyễn Minh Anh", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await card.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Chỉnh sửa CV", exact: true });
    await editor.getByRole("textbox", { name: "Tên CV", exact: false }).fill("CV Marketing 2026");
    await editor.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(drafts.getByRole("heading", { name: "CV Marketing 2026", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("cv-template-desktop.png"), fullPage: true });
    expect(await (await page.request.get("/api/bff/cvs")).json()).toEqual([]);
    await card.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("button", { name: "Xóa CV", exact: true }).click();
    await expect(drafts).toHaveCount(0);
});

test("template filters, validation and mobile layout still work", async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 375, height: 900 });
    await openCvPage(page);
    const library = page.getByRole("region", { name: "Tạo CV chuyên nghiệp với Mẫu thịnh hành", exact: true });
    await expect(library.getByRole("article")).toHaveCount(6);
    await library.getByRole("button", { name: "Hiện đại", exact: true }).click();
    await expect(library.getByRole("article")).toHaveCount(2);
    await library.getByRole("button", { name: "Dùng mẫu này", exact: true }).first().click();
    const form = page.getByRole("dialog", { name: "Tạo CV từ mẫu", exact: true });
    await form.getByRole("button", { name: "Tạo bản xem trước", exact: true }).click();
    await expect(form.getByText("Nhập họ và tên.", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await createDraft(page);
    await page.getByRole("button", { name: "Xem trước", exact: true }).first().click();
    await expect(page.getByRole("dialog", { name: "Xem trước CV", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("cv-template-mobile.png") });
});

test("CV management requires a candidate session", async ({ page }) => {
    await page.goto("/candidate/cv");
    await expect(page).toHaveURL(/\/login$/);
});
