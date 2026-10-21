import { expect, test } from "@playwright/test";

test("job preview opens on hover, stays interactive and opens details", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
    await expect(page.getByRole("button", { name: "Bộ lọc", exact: true })).toHaveAttribute("aria-expanded", "false");
    const card = page.locator("article").first();
    await card.hover();
    const preview = page.getByRole("region", { name: "Xem nhanh công việc" });
    await expect(preview).toBeVisible();
    await preview.hover();
    await expect(preview.getByRole("heading", { name: "Thông tin công việc" })).toBeVisible();
    await expect(preview.getByRole("button", { name: "Ứng tuyển · Sắp ra mắt" })).toBeDisabled();
    const bounds = await preview.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await preview.getByRole("link", { name: "Xem chi tiết" }).click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("job preview supports focus and mobile title still opens details", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Bộ lọc", exact: true }).click();
    await expect(page.getByRole("button", { name: "Bộ lọc", exact: true })).toHaveAttribute("aria-expanded", "false");
    await page.locator("article").first().focus();
    await expect(page.getByRole("region", { name: "Xem nhanh công việc" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("region", { name: "Xem nhanh công việc" })).toBeHidden();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator("article").first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/jobs\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
