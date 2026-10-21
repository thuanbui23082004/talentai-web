import { test, expect } from "@playwright/test";

const id = "20000000-0000-4000-8000-000000000001";
test("opens company details from a card, expands introduction and opens a job", async ({ page }) => {
    await page.goto("/companies?q=Sao+Việt");
    await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "Sao Việt", exact: true }) }).click();
    await expect(page).toHaveURL(new RegExp(`/companies/${id}$`));
    await expect(page.getByRole("heading", { level: 1, name: "Sao Việt", exact: true })).toBeVisible();
    await expect(page).toHaveTitle(/Sao Việt.*TalentAI/);
    await page.getByRole("button", { name: "Xem thêm", exact: true }).click();
    await expect(page.getByRole("button", { name: "Thu gọn", exact: true })).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: "Theo dõi", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Theo dõi công ty", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    const jobs = page.getByRole("region", { name: /Việc đang tuyển/ });
    await expect(jobs.locator("article")).toHaveCount(1);
    await jobs.locator("article h3 a").click();
    await expect(page).toHaveURL(/\/jobs\/10000000-/);
});

test("handles empty jobs and retry after an API error", async ({ page }) => {
    let fail = true;
    await page.route(`**/api/bff/companies/${id}/jobs*`, (route) => fail ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "secret" } }) }) : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], meta: { page: 1, pageSize: 6, totalItems: 0, totalPages: 0 } }) }));
    await page.goto(`/companies/${id}`);
    await expect(page.getByRole("button", { name: "Thử lại việc làm", exact: true })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Thử lại việc làm", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Chưa có vị trí đang tuyển", exact: true })).toBeVisible();
});

test("fits mobile and desktop and provides company sharing and map", async ({ page, context }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 950 });
        await page.goto(`/companies/${id}`);
        await expect(page.getByRole("heading", { level: 1, name: "Sao Việt", exact: true })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Lập trình viên Frontend React", exact: true })).toBeVisible();
        await expect(page.locator("iframe")).toHaveAttribute("src", /google.com\/maps/);
        await page.getByRole("button", { name: "Sao chép liên kết công ty", exact: true }).click();
        await expect(page.getByText("Đã sao chép liên kết công ty.", { exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`company-detail-${width}.png`), fullPage: true });
    }
});

test("shows 404 for unknown and malformed company IDs", async ({ page }) => {
    for (const value of ["missing", "00000000-0000-4000-8000-000000000000"]) {
        await page.goto(`/companies/${value}`);
        await expect(page.getByRole("heading", { name: "Không tìm thấy công ty", exact: true })).toBeVisible();
    }
});
