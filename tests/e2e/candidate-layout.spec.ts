import { test, expect, type Page } from "@playwright/test";

async function loginCandidate(page: Page) {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("candidate@example.com");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
}

test("candidate layout shares its header/sidebar and tracks the active page", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginCandidate(page);
    await expect(page.getByRole("heading", { name: "Chào buổi sáng, Nguyễn Minh Anh!", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Việc làm phù hợp với bạn", exact: true })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);
    await page.getByText("Gợi ý từ AI · Vì sao phù hợp?", { exact: true }).first().click();
    await expect(page.getByText(/Phù hợp với kinh nghiệm Digital Marketing/)).toBeVisible();
    await page.getByRole("button", { name: "Ứng tuyển nhanh", exact: true }).first().click();
    await expect(page.getByRole("dialog", { name: "Ứng tuyển Senior Performance Marketing Specialist", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath("candidate-dashboard-desktop.png"), fullPage: true });
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("banner").getByText("Nguyễn Minh Anh", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Đăng ký / Đăng nhập", exact: true })).toHaveCount(0);
    const menu = page.getByRole("navigation", { name: "Menu ứng viên", exact: true });
    await expect(menu.getByRole("link", { name: "Tổng quan", exact: true })).toHaveAttribute("aria-current", "page");
    await menu.locator("summary").filter({ hasText: "Hồ sơ việc làm" }).click();
    await menu.getByRole("link", { name: "Quản lý CV", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/cv$/);
    await expect(menu.getByRole("link", { name: "Quản lý CV", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Quản lý CV & Mẫu CV", exact: true })).toBeVisible();
    await menu.getByRole("link", { name: "Quản lý việc làm", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/applications$/);
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Thông báo", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath("candidate-desktop.png"), fullPage: true });
});

test("desktop sidebar collapses, preserves navigation and expands profile submenu", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginCandidate(page);
    const sidebar = page.getByRole("complementary", { name: "Thanh bên ứng viên", exact: true });
    await sidebar.getByRole("button", { name: "Thu gọn sidebar", exact: true }).click();
    await expect(sidebar.getByRole("button", { name: "Mở rộng sidebar", exact: true })).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).toHaveCSS("width", "80px");
    await sidebar.getByRole("link", { name: "AI Job Matching", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/matching$/);
    await expect(sidebar.getByRole("link", { name: "AI Job Matching", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(sidebar).toHaveCSS("width", "80px");
    await page.screenshot({ path: testInfo.outputPath("sidebar-collapsed.png"), fullPage: true });
    await sidebar.getByRole("button", { name: "Hồ sơ việc làm", exact: true }).click();
    await expect(sidebar).toHaveCSS("width", "240px");
    await expect(sidebar.getByRole("link", { name: "Hồ sơ của tôi", exact: true })).toBeVisible();
    await sidebar.getByRole("link", { name: "Quản lý CV", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/cv$/);
    await expect(sidebar.getByRole("link", { name: "Quản lý CV", exact: true })).toHaveAttribute("aria-current", "page");
    await sidebar.locator("summary").filter({ hasText: "Hồ sơ việc làm" }).click();
    await expect(sidebar.getByRole("link", { name: "Hồ sơ của tôi", exact: true })).toBeHidden();
    await sidebar.getByRole("button", { name: "Thu gọn sidebar", exact: true }).click();
    await sidebar.getByRole("button", { name: "Mở rộng sidebar", exact: true }).click();
    await expect(sidebar).toHaveCSS("width", "240px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("mobile sidebar opens, navigates and closes with Escape", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await loginCandidate(page);
    await expect(page.getByRole("heading", { name: "Việc làm phù hợp với bạn", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("candidate-dashboard-mobile.png"), fullPage: true });
    for (const width of [375, 768]) {
        await page.setViewportSize({ width, height: 900 });
        await page.getByRole("button", { name: "Mở menu ứng viên", exact: true }).click();
        const drawer = page.getByRole("dialog", { name: "Menu ứng viên", exact: true });
        await expect(drawer).toBeVisible();
        await drawer.getByRole("link", { name: "AI Job Matching", exact: true }).click();
        await expect(page).toHaveURL(/\/candidate\/matching$/);
        await expect(drawer).toBeHidden();
        await page.getByRole("button", { name: "Mở menu ứng viên", exact: true }).click();
        await expect(drawer.getByRole("link", { name: "AI Job Matching", exact: true })).toHaveAttribute("aria-current", "page");
        await page.screenshot({ path: testInfo.outputPath(`candidate-menu-${width}.png`) });
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`candidate-${width}.png`), fullPage: true });
    }
});

test("candidate account menu uses the session and existing logout confirmation", async ({ page }) => {
    await loginCandidate(page);
    await page.getByLabel("Tài khoản Nguyễn Minh Anh", { exact: true }).click();
    await expect(page.getByRole("banner").getByText("candidate@example.com", { exact: true })).toBeVisible();
    await page.getByRole("banner").getByRole("link", { name: "Đăng xuất", exact: true }).click();
    await expect(page).toHaveURL(/\/logout$/);
    await expect(page.getByRole("heading", { name: "Đăng xuất tài khoản", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?reason=logged-out$/);
    await page.goto("/candidate/cv");
    await expect(page).toHaveURL(/\/login$/);
});
