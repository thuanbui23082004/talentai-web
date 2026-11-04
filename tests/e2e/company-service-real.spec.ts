import { test, expect } from "@playwright/test";

test.skip(process.env.COMPANY_REAL_E2E !== "1", "Requires the real company service on localhost:3003");

test("loads real catalogs and preserves actual backend errors", async ({ page, request }, testInfo) => {
    const catalogResponse = await request.get("/api/bff/companies/catalogs");
    expect(catalogResponse.status()).toBe(200);
    const catalogs = await catalogResponse.json();
    expect(catalogs.locations).toHaveLength(34);
    expect(catalogs.industries.length).toBeGreaterThan(3);
    await page.goto("/companies");
    await page.getByRole("combobox", { name: "Ngành nghề công ty" }).click();
    await expect(page.getByRole("option", { name: catalogs.industries[0].name, exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    const missing = await request.get("/api/bff/companies/00000000-0000-4000-8000-000000000000");
    expect(missing.status()).toBe(404);
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("real-companies-mobile.png"), fullPage: true });
});

test("uses actual company data on home, list, combined filters and detail", async ({ page, request }, testInfo) => {
    test.setTimeout(120000);
    const upstream = await request.get("http://localhost:3003/api/v1/companies?page=0&size=12");
    expect(upstream.status(), "Company list must permit public requests before real integration can be accepted").toBe(200);
    const source = await upstream.json();
    const bff = await request.get("/api/bff/companies?pageSize=12");
    expect(bff.status()).toBe(200);
    const companies = await bff.json();
    expect(companies.meta.totalItems).toBe(source.totalElements);
    expect(companies.items.map((item: { id: string }) => item.id)).toEqual(source.content.map((item: { id: string }) => item.id));
    for (const [backendQuery, bffQuery] of [
        ["page=1&size=12", "page=2&pageSize=12"],
        ["page=0&size=12&industryId=1", "industryId=1"],
        ["page=0&size=12&locationId=21", "locationId=21"],
        ["page=0&size=12&minSize=50&maxSize=200", "minSize=50&maxSize=200"],
        ["page=0&size=12&industryId=1&locationId=21&minSize=50&maxSize=200", "industryId=1&locationId=21&minSize=50&maxSize=200"],
    ]) {
        const native = await request.get(`http://localhost:3003/api/v1/companies?${backendQuery}`);
        const normalized = await request.get(`/api/bff/companies?${bffQuery}`);
        expect(native.status()).toBe(200); expect(normalized.status()).toBe(200);
        const raw = await native.json(); const mapped = await normalized.json();
        expect(mapped.meta.totalItems).toBe(raw.totalElements);
        expect(mapped.items.map((item: { id: string }) => item.id)).toEqual(raw.content.map((item: { id: string }) => item.id));
    }
    const empty = await request.get("/api/bff/companies?q=zzzz-company-never-exists-987");
    expect((await empty.json()).items).toEqual([]);
    await page.goto("/companies");
    await expect(page.getByRole("heading", { name: "Khám phá các công ty nổi bật" })).toBeVisible();
    if (companies.meta.totalPages > 1) {
        await page.getByRole("button", { name: "Xem thêm công ty nổi bật", exact: true }).click();
        await expect(page.locator('a[href^="/companies/"]').filter({ has: page.locator("h3") })).toHaveCount(Math.min(companies.meta.totalItems, 24));
    }
    if (!companies.items.length) { testInfo.annotations.push({ type: "data", description: "Backend list is empty; detail checks require an existing company." }); return; }
    const first = source.content[0];
    const filters = new URLSearchParams({ q: first.name, pageSize: "12" });
    if (first.industryId) filters.set("industryId", String(first.industryId));
    if (first.locationId) filters.set("locationId", String(first.locationId));
    if (first.companySize > 0) { filters.set("minSize", String(first.companySize)); filters.set("maxSize", String(first.companySize)); }
    const filtered = await request.get(`/api/bff/companies?${filters}`);
    expect(filtered.status()).toBe(200);
    expect((await filtered.json()).items.some((item: { id: string }) => item.id === first.id)).toBe(true);
    await page.getByLabel("Tên công ty", { exact: true }).fill(first.name);
    await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
    await expect(page.getByRole("heading", { name: first.name, exact: true }).first()).toBeVisible();
    await page.goto(`/companies/${first.id}`);
    await expect(page.getByRole("heading", { level: 1, name: first.name, exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("real-company-detail.png"), fullPage: true });
    await page.goto("/");
    await expect(page.locator("#companies").getByRole("heading", { name: first.name, exact: true })).toBeVisible();
    await expect(page.locator(".home-hero dl")).toContainText(String(companies.meta.totalItems));
});
