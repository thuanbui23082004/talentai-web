import { test, expect } from "@playwright/test";

test("keeps the purple navigation visible across public pages on desktop and mobile", async ({ page }) => {
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 800 });
        for (const url of ["/", "/jobs", "/companies", "/jobs/10000000-0000-4000-8000-000000000004", "/companies/20000000-0000-4000-8000-000000000001"]) {
            await page.goto(url);
            const header = page.getByRole("banner");
            const top = (await header.boundingBox())!.y;
            expect(top).toBeGreaterThan(0);
            await page.evaluate(() => window.scrollTo(0, 600));
            await expect.poll(async () => Math.round((await header.boundingBox())?.y ?? -1)).toBe(0);
            await expect(header.getByRole("link", { name: "TalentAI — Trang chủ", exact: true })).toBeVisible();
            if (width === 375) {
                await header.getByLabel("Mở menu điều hướng", { exact: true }).click();
                await expect(page.getByRole("navigation", { name: "Điều hướng di động" })).toBeVisible();
                await page.getByRole("navigation", { name: "Điều hướng di động" }).getByRole("link", { name: "Công ty", exact: true }).click();
                await expect(page).toHaveURL(/\/companies$/);
            }
        }
    }
});
