import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
    const email = `notifications-${randomUUID()}@example.com`;
    const response = await page.request.post("/api/bff/auth/register", { data: { email, password: "TalentAI123!", confirmPassword: "TalentAI123!", fullName: "Ứng viên thông báo", phone: "0901234567", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(response.status()).toBe(201);
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
}

test("notification popup opens, dismisses and navigates to read notifications", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page);
    const bell = page.getByRole("button", { name: "Thông báo", exact: true });
    await bell.click();
    const popup = page.getByRole("dialog", { name: "Thông báo", exact: true });
    await expect(popup.getByText("Bạn có 3 thông báo chưa đọc", { exact: true })).toBeVisible();
    await expect(popup.getByRole("link", { name: /Bạn có lời mời phỏng vấn mới/ })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("notifications-popup-desktop.png") });
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(bell).toBeFocused();
    await bell.click();
    await page.getByRole("heading", { name: /Chào buổi sáng/ }).click();
    await expect(popup).toBeHidden();
    await bell.click();
    await popup.getByRole("link", { name: /Bạn có lời mời phỏng vấn mới/ }).click();
    await expect(page).toHaveURL(/\/candidate\/notifications\?notification=/);
    await expect(popup).toBeHidden();
    await expect(page.getByRole("heading", { name: "Thông báo", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Bạn có lời mời phỏng vấn mới/ })).toContainText("Đã đọc");
    await page.screenshot({ path: testInfo.outputPath("notifications-page-desktop.png"), fullPage: true });
    await bell.click();
    await expect(popup.getByText("Bạn có 2 thông báo chưa đọc", { exact: true })).toBeVisible();
    await popup.getByRole("link", { name: "Xem tất cả thông báo", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/notifications$/);
    await page.getByRole("button", { name: "Đánh dấu tất cả đã đọc", exact: true }).click();
    await expect(page.getByRole("button", { name: "Đánh dấu tất cả đã đọc", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: /Chưa đọc/ }).click();
    await expect(page.getByText("Bạn đã đọc hết thông báo", { exact: true })).toBeVisible();
});

test("mobile notifications fit viewport and retry after list errors", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await login(page);
    await page.route("**/api/bff/notifications?**", (route) => route.fulfill({ status: 500, json: { error: { code: "INTERNAL_ERROR", message: "server error" } } }));
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    const popup = page.getByRole("dialog", { name: "Thông báo", exact: true });
    await expect(popup.getByText("Không thể tải thông báo", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/notifications?**");
    await popup.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(popup.getByRole("link", { name: /Bạn có lời mời phỏng vấn mới/ })).toBeVisible();
    expect(await popup.evaluate((element) => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth; })).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("notifications-popup-mobile.png") });
    await popup.getByRole("link", { name: "Xem tất cả thông báo", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Thông báo", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Bạn có lời mời phỏng vấn mới/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("notifications-page-mobile.png"), fullPage: true });
});

test("notification page and APIs require authentication", async ({ page }) => {
    await page.goto("/candidate/notifications");
    await expect(page).toHaveURL(/\/login$/);
    expect((await page.request.get("/api/bff/notifications")).status()).toBe(401);
});
