import { test, expect } from "@playwright/test";

test("loads companies, loads more, searches and resets filters", async ({ page }) => {
    await page.goto("/companies");
    const cards = page.locator('a[href^="/jobs?"]').filter({ has: page.locator("h3") });
    await expect(cards).toHaveCount(12);
    await page.getByRole("button", { name: "Xem thêm công ty nổi bật", exact: true }).click();
    await expect(cards).toHaveCount(18);
    await expect(page.getByRole("button", { name: "Xem thêm công ty nổi bật", exact: true })).toHaveCount(0);
    await page.getByLabel("Tên công ty", { exact: true }).fill("sao viet");
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    await expect(page).toHaveURL(/q=sao\+viet/);
    await expect(cards).toHaveCount(1);
    await expect(page.getByText("Tìm thấy 1 công ty", { exact: true })).toBeVisible();
    await page.getByLabel("Tên công ty", { exact: true }).fill("not-a-company");
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Không tìm thấy công ty", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Xóa lọc", exact: true }).click();
    await expect(cards).toHaveCount(18);
    await page.getByLabel("Quy mô công ty", { exact: true }).click();
    await page.getByRole("option", { name: "11-50 nhân viên", exact: true }).click();
    await expect(page).toHaveURL(/size=11-50/);
    await expect(cards).toHaveCount(4);
});

test("recovers from a company API error", async ({ page }) => {
    let fail = true;
    await page.route("**/api/bff/companies*", (route) => fail ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "secret" } }) }) : route.continue());
    await page.goto("/companies");
    await expect(page.getByRole("button", { name: "Thử lại", exact: true })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Sao Việt", exact: true })).toBeVisible();
});

test("fits desktop and mobile and only animates once per session", async ({ page }, testInfo) => {
    for (const width of [1280, 768, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/companies");
        await expect(page.getByRole("heading", { name: "Sao Việt", exact: true })).toBeVisible();
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem("companies-hero-count"))).toBe("1");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const cards = page.locator('a[href^="/jobs?"]').filter({ has: page.locator("h3") });
        const boxes = await cards.evaluateAll((elements) => elements.map((element) => { const { y, height } = element.getBoundingClientRect(); return { y, height }; }));
        const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
        expect(boxes.filter((box) => Math.abs(box.y - boxes[0].y) < 1)).toHaveLength(columns);
        expect(new Set(boxes.map((box) => Math.round(box.height))).size).toBe(1);
        await page.screenshot({ path: testInfo.outputPath(`companies-${width}.png`), fullPage: true });
    }
});
