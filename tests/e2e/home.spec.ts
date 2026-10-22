import { test, expect } from "@playwright/test";

test("homepage company cards link to existing company profiles", async ({ page, request }) => {
    await page.goto("/");
    const companies = page.locator("#companies");
    const links = await companies.locator('a[href^="/companies/"]').evaluateAll((elements) => elements.map((element) => ({ href: element.getAttribute("href")!, name: element.querySelector("h3")!.textContent! })));
    expect(links).toHaveLength(8);
    for (const link of links) {
        const id = link.href.split("/").pop();
        const response = await request.get(`/api/bff/companies/${id}`);
        expect(response.status()).toBe(200);
        expect((await response.json()).name).toBe(link.name);
    }
    await companies.locator('a[href^="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/20000000-0000-4000-8000-000000000001$/);
    await expect(page.getByRole("heading", { name: "Sao Việt", level: 1, exact: true })).toBeVisible();
    await page.goto("/");
    await page.locator("#companies").getByRole("link", { name: "Xem tất cả công ty", exact: true }).click();
    await expect(page).toHaveURL(/\/companies$/);
});

test("home renders the reference sections, SSR jobs and functional location tabs", async ({ page, request }) => {
    const html = await (await request.get("/")).text();
    expect(html.match(/<article\b/g)?.length).toBeGreaterThanOrEqual(12);
    expect(html).toContain("Full Stack JavaScript Developer");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tìm Đúng Việc – Chạm Đến Tương Lai");
    const featured = page.getByRole("region", { name: "Việc làm nổi bật", exact: true });
    await expect(featured.locator("article")).toHaveCount(6);
    await expect(page.getByRole("region", { name: "Việc làm tuyển gấp", exact: true }).locator("article")).toHaveCount(6);
    for (const title of ["Top ngành nghề nổi bật", "Các Công Ty Hàng Đầu", "Tin tức & cẩm nang"]) await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await featured.getByRole("button", { name: "An Giang", exact: true }).click();
    await expect(featured.locator("article")).toHaveCount(1);
    await expect(featured.getByRole("heading", { name: "Web Developer – Làm việc từ xa" })).toBeVisible();
    await featured.getByRole("button", { name: "Bến Tre", exact: true }).click();
    await expect(featured.getByText("Chưa có việc làm tại địa điểm này")).toBeVisible();
    await featured.getByRole("button", { name: "Xóa lọc địa điểm" }).click();
    await expect(featured.locator("article")).toHaveCount(6);
});

test("home search sends supported filters to jobs and URL Back restores controls", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Tên công việc, chức danh" }).fill("JavaScript");
    await page.getByRole("combobox", { name: "Tất cả cấp bậc" }).click();
    await page.getByRole("option", { name: "Chuyên viên cao cấp", exact: true }).click();
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    await expect(page).toHaveURL(/q=JavaScript.*level=senior/);
    await expect(page.getByText("Tìm thấy 1 việc làm")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Full Stack JavaScript Developer" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Tất cả cấp bậc" })).toContainText("Chuyên viên cao cấp");
    await page.getByRole("button", { name: "Xóa lọc", exact: true }).click();
    await expect(page).toHaveURL(/\/jobs$/);
    await expect(page.getByText("Tìm thấy 18 việc làm")).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("searchbox", { name: "Từ khóa" })).toHaveValue("JavaScript");
    await expect(page.getByRole("combobox", { name: "Tất cả cấp bậc" })).toContainText("Chuyên viên cao cấp");
});

test("home dialogs explain unavailable actions and display article content", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tải app ngay", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "TalentAI trên điện thoại" })).toBeVisible();
    await page.keyboard.press("Escape");
    const featured = page.getByRole("region", { name: "Việc làm nổi bật", exact: true });
    await featured.locator("article").first().getByRole("heading").getByRole("link").click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]{36}$/);
    await page.getByRole("button", { name: "Ứng tuyển ngay", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Ứng tuyển", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goBack();
    await page.getByRole("button", { name: "Đọc thêm", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toContainText("Một bản CV tốt giúp nhà tuyển dụng");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Tạo CV ngay", exact: false }).click();
    await expect(page.getByRole("dialog", { name: "TalentAI WowCV" })).toBeVisible();
});

test("home fits mobile, tablet and desktop with a usable mobile menu", async ({ page }, testInfo) => {
    for (const width of [375, 768, 1024, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        await expect(page.getByRole("region", { name: "Việc làm nổi bật", exact: true }).locator("article")).toHaveCount(6);
        if (width >= 1024) await expect(page.getByRole("link", { name: "Đăng ký / Đăng nhập", exact: true }).first()).toBeVisible();
        expect(await page.locator("footer").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(55, 24, 128)");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByLabel("Mở menu điều hướng").click();
    const menu = page.getByRole("navigation", { name: "Điều hướng di động" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Tìm việc làm", exact: true }).click();
    await expect(page).toHaveURL(/\/jobs$/);
    await expect(menu).not.toBeVisible();
});
