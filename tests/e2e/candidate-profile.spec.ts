import { test, expect, type Page } from "@playwright/test";

async function loginCandidate(page: Page) {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("candidate@example.com");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
}

test("candidate profile follows the reference layout and uses fixed recommendations", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginCandidate(page);
    const menu = page.getByRole("navigation", { name: "Menu ứng viên", exact: true });
    await menu.locator("summary").filter({ hasText: "Hồ sơ việc làm" }).click();
    await menu.getByRole("link", { name: "Hồ sơ của tôi", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/profile$/);
    await expect(page.getByRole("heading", { name: "Hồ sơ của tôi", exact: true })).toBeVisible();
    await expect(page.locator("#candidate-content").getByText("candidate@example.com", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Việc làm gợi ý cho bạn", exact: true }).getByRole("article")).toHaveCount(6);
    await expect(page.getByText("Danh sách gợi ý cố định", { exact: true })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "cv-nguyen-minh-anh.pdf", mimeType: "application/pdf", buffer: Buffer.from("mock pdf") });
    await expect(page.getByText("Đã chọn cv-nguyen-minh-anh.pdf", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Chỉnh sửa thông tin cá nhân", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath("candidate-profile-desktop.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("candidate profile stacks cleanly on mobile", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await loginCandidate(page);
    await page.goto("/candidate/profile");
    await expect(page.getByRole("heading", { name: "Hồ sơ của tôi", exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Việc làm gợi ý cho bạn", exact: true }).getByRole("article")).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("candidate-profile-mobile.png"), fullPage: true });
});

test("candidate profile redirects anonymous users", async ({ page }) => {
    await page.goto("/candidate/profile");
    await expect(page).toHaveURL(/\/login$/);
});
