import { test, expect } from "@playwright/test";

test.skip(process.env.JOB_REAL_E2E !== "1", "Requires the job-posting service on localhost:3004");

test("matches real search filters, paging, categories and rendered results", async ({ page, request }, testInfo) => {
    test.setTimeout(120000);
    const pairs = [
        ["page=0&size=2&sort=publishedAt,desc", "pageSize=2&sort=newest"],
        ["page=1&size=2&sort=publishedAt,desc", "page=2&pageSize=2&sort=newest"],
        ["keyword=never-match-987&sort=publishedAt,desc", "q=never-match-987"],
        ["location=Đà Nẵng&sort=publishedAt,desc", "city=Đà Nẵng"],
        ["categoryId=1&experienceLevel=JUNIOR&jobType=FULL_TIME&workMode=REMOTE&sort=publishedAt,desc", "categoryId=1&experienceLevel=JUNIOR&jobType=FULL_TIME&workMode=REMOTE"],
        ["salaryMin=10000000&salaryMax=30000000&salaryCurrency=VND&isSalaryNegotiable=false&sort=salaryMax,desc", "salaryMin=10000000&salaryMax=30000000&salaryCurrency=VND&isSalaryNegotiable=false&sort=salary_desc"],
    ];
    for (const [nativeQuery, bffQuery] of pairs) {
        const native = await request.get(`http://localhost:3004/api/v1/jobs?${nativeQuery}`);
        const normalized = await request.get(`/api/bff/jobs?${bffQuery}`);
        expect(native.status()).toBe(200); expect(normalized.status()).toBe(200);
        const source = (await native.json()).data; const mapped = await normalized.json();
        expect(mapped.meta.totalItems).toBe(source.totalElements);
        expect(mapped.items.map((job: { id: string }) => job.id)).toEqual(source.items.map((job: { jobPostId: string }) => job.jobPostId));
    }
    const catalogs = await request.get("/api/bff/jobs/categories");
    expect(catalogs.status()).toBe(200);
    const categories = await catalogs.json();
    expect(categories.length).toBeGreaterThan(0);
    const results = await (await request.get("/api/bff/jobs?pageSize=12")).json();
    await page.goto("/jobs?pageSize=2");
    await expect(page.getByText(`Tìm thấy ${results.meta.totalItems} việc làm`, { exact: true })).toBeVisible();
    if (results.meta.totalItems > 2) {
        await page.getByRole("button", { name: "Trang sau", exact: true }).click();
        await expect(page).toHaveURL(/page=2/);
        await expect(page.locator("#job-results article")).toHaveCount(2);
    }
    await page.getByLabel("Tất cả ngành nghề", { exact: true }).click();
    await expect(page.getByRole("option", { name: categories[0].categoryName, exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByLabel("Tất cả hình thức", { exact: true }).click();
    await page.getByRole("option", { name: "Từ xa", exact: true }).click();
    await expect(page).toHaveURL(/workMode=REMOTE/);
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("real-job-search-mobile.png"), fullPage: true });
    const missing = await request.get("/api/bff/jobs/00000000-0000-4000-8000-000000000000");
    expect(missing.status()).toBe(404);
    if (results.items.length) {
        const job = results.items[0];
        await page.goto(`/jobs/${job.id}`);
        await expect(page.getByRole("heading", { level: 1, name: job.title, exact: true })).toBeVisible();
    } else {
        testInfo.annotations.push({ type: "data", description: "Backend has no public jobs; positive result/detail awaits an ACTIVE job." });
    }
});
