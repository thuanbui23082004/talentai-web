import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
    const email = `notifications-${randomUUID()}@example.com`;
    const response = await page.request.post("/api/bff/auth/register", { data: {
        email, password: "TalentAI123!", confirmPassword: "TalentAI123!",
        fullName: "Ứng viên thông báo", phone: "0901234567", role: "candidate",
        acceptedPrivacyPolicy: true,
    } });
    expect(response.status()).toBe(201);
    await page.goto("/candidate/dashboard");
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
}

test("candidate notifications show the empty state and page navigation", async ({ page }) => {
    await page.route("**/api/bff/notifications/unread-count", (route) => route.fulfill({ json: { count: 0 } }));
    await page.route("**/api/bff/notifications?**", (route) => route.fulfill({ json: {
        items: [], meta: { page: 1, pageSize: Number(new URL(route.request().url()).searchParams.get("pageSize") ?? 10), totalItems: 0, totalPages: 0 }, unreadCount: 0,
    } }));
    await login(page);
    const bell = page.getByRole("button", { name: "Thông báo", exact: true });
    await bell.click();
    const popup = page.getByRole("dialog", { name: "Thông báo", exact: true });
    await expect(popup.getByText("Chưa có thông báo", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await bell.click();
    await popup.getByRole("link", { name: "Xem tất cả thông báo", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/notifications$/);
    await expect(page.getByText("Chưa có thông báo", { exact: true })).toBeVisible();
});

test("notification errors can be retried on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.route("**/api/bff/notifications/unread-count", (route) => route.fulfill({ json: { count: 0 } }));
    await login(page);
    await page.route("**/api/bff/notifications?**", (route) => route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE", message: "unavailable" } } }));
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    const popup = page.getByRole("dialog", { name: "Thông báo", exact: true });
    await expect(popup.getByText("Không thể tải thông báo", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/notifications?**");
    await page.route("**/api/bff/notifications?**", (route) => route.fulfill({ json: {
        items: [], meta: { page: 1, pageSize: 5, totalItems: 0, totalPages: 0 }, unreadCount: 0,
    } }));
    await popup.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(popup.getByText("Chưa có thông báo", { exact: true })).toBeVisible();
    expect(await popup.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth;
    })).toBe(true);
});

test("notification page and API require authentication", async ({ page }) => {
    await page.goto("/candidate/notifications");
    await expect(page).toHaveURL(/\/login$/);
    expect((await page.request.get("/api/bff/notifications")).status()).toBe(401);
});
