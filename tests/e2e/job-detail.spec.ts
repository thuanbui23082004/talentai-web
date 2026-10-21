import { test, expect } from "@playwright/test";

const id = "10000000-0000-4000-8000-000000000004";
test("opens a detail page from a card and reuses search and related cards", async ({ page }) => {
    await page.goto("/jobs?q=JavaScript");
    await page.locator("#job-results article h3 a").first().click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mô tả công việc", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Việc làm liên quan", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ứng tuyển ngay", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Hiện chưa gửi hồ sơ");
    await page.getByRole("button", { name: "Đóng hộp thoại" }).click();
    await page.getByLabel("Tên công việc, chức danh", { exact: true }).fill("React");
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    await expect(page).toHaveURL(/\/jobs\?q=React/);
});

test("renders direct URLs with SEO metadata and responsive layouts", async ({ page }, testInfo) => {
    for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/jobs/${id}`);
        await expect(page).toHaveTitle(/Full Stack JavaScript Developer/);
        await expect(page.getByRole("heading", { name: "Full Stack JavaScript Developer", exact: true, level: 1 })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`detail-${width}.png`), fullPage: true });
    }
});

test("shows a not-found page for unknown and malformed IDs", async ({ page }) => {
    for (const value of ["00000000-0000-4000-8000-000000000000", "unknown-job"]) {
        await page.goto(`/jobs/${value}`);
        await expect(page.getByRole("heading", { name: "Không tìm thấy việc làm", exact: true })).toBeVisible();
        await expect(page.getByRole("link", { name: "Xem các việc làm khác →" })).toBeVisible();
    }
});
