import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("candidate follows application statuses and history", async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const email = `tracking-${randomUUID()}@example.com`;
    const registered = await page.request.post("/api/bff/auth/register", {
        data: { email, password: "TalentAI123!", fullName: "Ứng viên theo dõi", role: "candidate", acceptedPrivacyPolicy: true },
    });
    expect(registered.status()).toBe(201);

    await page.goto("/candidate/applications");
    await expect(page.getByRole("heading", { name: "Việc làm đã ứng tuyển" })).toBeVisible();
    await expect(page.locator("main article")).toHaveCount(6);
    await expect(page.getByText("12 hồ sơ", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Trang 2" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator("main article")).toHaveCount(6);

    await page.getByRole("tab", { name: "Phỏng vấn" }).click();
    await expect(page).toHaveURL(/tab=interview_scheduled/);
    await expect(page.getByText("Đã lên lịch phỏng vấn").first()).toBeVisible();
    await page.route("**/api/bff/candidate/application-tracking/*/history", route => route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }));
    await page.getByRole("link", { name: "Xem tiến trình" }).first().click();
    await expect(page).toHaveURL(/\/candidate\/applications\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Tiến trình các bước tuyển dụng" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Tiến trình ứng tuyển" }).locator("li")).toHaveCount(6);
    await expect(page.getByRole("heading", { name: "Nhật ký tiến trình chi tiết" })).toBeVisible();
    await expect(page.getByText("Chưa tải được lịch sử trạng thái.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hồ sơ đã gửi" })).toBeVisible();
    await page.unroute("**/api/bff/candidate/application-tracking/*/history");
    await page.getByRole("button", { name: "Thử lại lịch sử" }).click();
    await expect(page.getByText("Chưa tải được lịch sử trạng thái.")).toBeHidden();
    await expect(page.locator("section[aria-labelledby='history-heading'] ol li").first()).toBeVisible();

    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => window.scrollTo(0, 0));
        if (width === 1280) {
            await expect(page.getByAltText("Nhân vật TalentAI cầm CV")).toBeVisible();
            await expect.poll(() => page.getByAltText("Nhân vật TalentAI cầm CV").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`application-detail-${width}.png`), fullPage: true });
    }
    await page.getByRole("link", { name: "Danh sách ứng tuyển" }).click();
    await expect(page).toHaveURL(/\/candidate\/applications$/);
});

test("candidate tracking handles empty and failed requests", async ({ page }) => {
    const email = `tracking-state-${randomUUID()}@example.com`;
    const registered = await page.request.post("/api/bff/auth/register", {
        data: { email, password: "TalentAI123!", fullName: "Ứng viên kiểm thử", role: "candidate", acceptedPrivacyPolicy: true },
    });
    expect(registered.status()).toBe(201);
    const api = "**/api/bff/candidate/application-tracking?*";

    await page.route(api, route => route.continue({ headers: { ...route.request().headers(), "x-mock-scenario": "empty" } }));
    await page.goto("/candidate/applications");
    await expect(page.getByRole("heading", { name: "Chưa có hồ sơ trong mục này" })).toBeVisible();
    await page.unroute(api);

    await page.route(api, route => route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE", message: "private-backend-error" } } }));
    await page.reload();
    await expect(page.getByRole("heading", { name: "Không thể tải hồ sơ ứng tuyển" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("private-backend-error");
    await page.unroute(api);
    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.locator("main article")).toHaveCount(6);
});

test("tracking requires a candidate session", async ({ page }) => {
    await page.goto("/candidate/applications");
    await expect(page).toHaveURL(/\/login$/);
    expect((await page.request.get("/api/bff/candidate/application-tracking")).status()).toBe(401);
});
