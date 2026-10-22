import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("candidate@example.com");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
    await page.goto("/candidate/cv");
}

test("CV page previews, edits, toggles and confirms deletion of local design samples", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page);
    const menu = page.getByRole("navigation", { name: "Menu ứng viên", exact: true });
    await expect(menu.getByRole("link", { name: "Quản lý CV", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Quản lý CV & Mẫu CV", exact: true })).toBeVisible();
    const created = page.getByRole("region", { name: "CV đã tạo trên TalentAI", exact: true });
    await expect(created.getByRole("article")).toHaveCount(2);
    await expect(created.locator(".cv-paper").first()).toHaveCSS("display", "grid");
    await expect(page.locator(".cv-library-hero")).not.toHaveCSS("background-image", "none");
    await page.screenshot({ path: testInfo.outputPath("cv-management-desktop.png"), fullPage: true, animations: "disabled" });
    const first = created.getByRole("article").first();
    await expect(first.getByRole("switch")).toBeChecked();
    await first.getByRole("switch").click();
    await expect(first.getByRole("switch")).not.toBeChecked();
    await first.getByRole("button", { name: "Xem trước", exact: true }).click();
    const preview = page.getByRole("dialog", { name: "Xem trước CV", exact: true });
    await expect(preview.getByRole("heading", { name: "Nguyễn Trúc Quỳnh My", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await first.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Chỉnh sửa CV", exact: true });
    await editor.getByRole("textbox", { name: "Tên CV", exact: false }).fill("CV Marketing 2026");
    await editor.getByRole("textbox", { name: "Vị trí ứng tuyển", exact: false }).fill("Marketing Specialist");
    await editor.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(created.getByRole("heading", { name: "CV Marketing 2026", exact: true })).toBeVisible();
    await first.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("dialog", { name: "Xóa bản xem trước CV?", exact: true }).getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(created.getByRole("article")).toHaveCount(2);
    await first.getByRole("button", { name: "Xóa", exact: true }).click();
    await page.getByRole("button", { name: "Xóa CV", exact: true }).click();
    await expect(created.getByRole("article")).toHaveCount(1);
});

test("template filtering creates a CV draft, paginates and validates file selection", async ({ page }) => {
    await login(page);
    const library = page.getByRole("region", { name: "Tạo CV chuyên nghiệp với Mẫu thịnh hành", exact: true });
    await expect(library.getByRole("article")).toHaveCount(6);
    await library.getByRole("button", { name: "Hiện đại", exact: true }).click();
    await expect(library.getByRole("article")).toHaveCount(2);
    await library.getByRole("button", { name: "Dùng mẫu này", exact: true }).first().click();
    const form = page.getByRole("dialog", { name: "Tạo CV từ mẫu", exact: true });
    await form.getByRole("button", { name: "Tạo bản xem trước", exact: true }).click();
    await expect(form.getByText("Nhập họ và tên.", { exact: true })).toBeVisible();
    await form.getByRole("textbox", { name: "Tên CV", exact: false }).fill("CV mới của tôi");
    await form.getByRole("textbox", { name: "Họ và tên", exact: false }).fill("Nguyễn Minh Anh");
    await form.getByRole("textbox", { name: "Vị trí ứng tuyển", exact: false }).fill("Frontend Developer");
    await form.getByRole("button", { name: "Tạo bản xem trước", exact: true }).click();
    await expect(page.getByRole("heading", { name: "CV mới của tôi", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trang 2", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Trang trước", exact: true }).click();
    await expect(page.getByRole("region", { name: "CV đã tạo trên TalentAI", exact: true }).getByRole("article")).toHaveCount(2);
    const input = page.getByLabel("Chọn tệp CV", { exact: true });
    await input.setInputFiles({ name: "invalid.exe", mimeType: "application/octet-stream", buffer: Buffer.from("invalid") });
    await expect(page.getByText("Vui lòng chọn tệp PDF hoặc DOCX hợp lệ.", { exact: true })).toBeVisible();
    await input.setInputFiles({ name: "candidate.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 design preview") });
    await expect(page.getByText("Đã chọn: candidate.pdf", { exact: true })).toBeVisible();
    await expect(page.getByText("Tệp chưa được tải lên.", { exact: false })).toBeVisible();
});

test("CV layout and preview fit mobile and require a session", async ({ page }, testInfo) => {
    await page.goto("/candidate/cv");
    await expect(page).toHaveURL(/\/login$/);
    await page.setViewportSize({ width: 375, height: 900 });
    await login(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("cv-management-mobile.png"), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Xem trước", exact: true }).first().click();
    await expect(page.getByRole("dialog", { name: "Xem trước CV", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Mở menu ứng viên", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Menu ứng viên", exact: true });
    await expect(drawer.getByRole("link", { name: "Quản lý CV", exact: true })).toHaveAttribute("aria-current", "page");
    await drawer.getByRole("link", { name: "Hồ sơ của tôi", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/profile$/);
    await expect(drawer).toBeHidden();
});
