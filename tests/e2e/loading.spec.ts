import { expect, test } from "@playwright/test";

test("loading preview fits mobile and desktop and uses all eight sprite frames", async ({ page }, testInfo) => {
    await page.goto("/ui/loading");
    const loader = page.locator('[data-loading-state="page"]');
    const mascot = loader.locator('[class*="mascot"]');
    await expect(loader).toBeVisible();
    await expect(loader).toHaveAttribute("aria-busy", "true");
    await expect(loader.getByText("Cơ hội mới", { exact: true })).toHaveCount(0);
    await expect(loader).toHaveCSS("opacity", "1");
    await expect(loader.locator(".talent-loading-title")).toHaveCSS("font-size", "16px");
    await expect(loader.locator(".talent-loading-description")).toHaveCSS("font-size", "12px");
    await expect.poll(() => mascot.evaluate((element) => element.getAnimations().length)).toBe(1);
    const positions = await mascot.evaluate((element) => {
        const animation = element.getAnimations()[0];
        animation.pause();
        return Array.from({ length: 8 }, (_, index) => {
            animation.currentTime = index * 110 + 1;
            return getComputedStyle(element).backgroundPosition;
        });
    });
    expect(new Set(positions).size).toBe(8);
    const imageUrl = await mascot.evaluate((element) => getComputedStyle(element).backgroundImage.slice(5, -2));
    expect((await page.request.get(imageUrl)).ok()).toBe(true);

    for (const width of [375, 768, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(loader.getByText("Cơ hội mới đang đến gần", { exact: true })).toBeVisible();
        const characterSize = await mascot.boundingBox();
        expect(characterSize?.width).toBeLessThanOrEqual(90);
        expect(characterSize?.height).toBeLessThanOrEqual(120);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`loading-${width}.png`) });
    }
    const smoke = loader.locator(".talent-loading-smoke i");
    await expect(smoke).toHaveCount(3);
    const smokeOpacity = await smoke.first().evaluate((element) => {
        const animation = element.getAnimations()[0];
        animation.pause();
        animation.currentTime = 420;
        return Number(getComputedStyle(element).opacity);
    });
    expect(smokeOpacity).toBeGreaterThan(0);
});

test("reduced-motion mode shows a static character without looping effects", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ui/loading");
    const loader = page.locator('[data-loading-state="page"]');
    await expect(loader).toHaveCSS("opacity", "1");
    const animations = await loader.evaluate((element) => element.getAnimations({ subtree: true }).length);
    expect(animations).toBe(0);
    await expect(loader.locator(".talent-loading-smoke")).toBeHidden();
    await expect(loader.locator('[class*="mascot"]')).toHaveCSS("background-position", "0px 0px");
});

for (const { path, api, label } of [
    { path: "/jobs", api: "**/api/bff/jobs?*", label: "Đang tải việc làm" },
    { path: "/companies", api: "**/api/bff/companies?*", label: "Đang tải công ty" },
    { path: "/candidate/saved-jobs", api: "**/api/bff/candidate/saved-jobs*", label: "Đang tải việc làm đã lưu" },
    { path: "/candidate/applications", api: "**/api/bff/applications?*", label: "Đang tải hồ sơ ứng tuyển" },
]) {
    test(`${path} shows the mascot while pending and removes it once data arrives`, async ({ page }, testInfo) => {
        if (path.startsWith("/candidate")) {
            const response = await page.request.post("/api/bff/auth/login", {
                data: { email: "candidate@example.com", password: "TalentAI123!", role: "candidate" },
            });
            expect(response.ok()).toBe(true);
        }
        let release = () => {};
        const pending = new Promise<void>((resolve) => { release = resolve; });
        await page.route(api, async (route) => { await pending; await route.continue(); });
        try {
            await page.goto(path);
            const loader = page.getByRole("status", { name: label, exact: true });
            await expect(loader).toBeVisible();
            await expect(loader.locator('[class*="mascot"]')).toBeVisible();
            await expect(page.locator("header")).toBeVisible();
            await expect(loader).toHaveCSS("opacity", "1");
            await loader.screenshot({ path: testInfo.outputPath("loading-section.png") });
            release();
            await expect(loader).toBeHidden();
        } finally {
            release();
        }
    });
}

test("home streams the shared loading fallback without adding a forced delay", async ({ request }) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('data-loading-state="page"');
    expect(html).toContain("Cơ hội mới đang đến gần");
    expect(html).toContain("featured-jobs");
});
