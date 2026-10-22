import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectAnchoredPreview(page: Page, card: Locator) {
    const preview = page.getByRole("region", { name: "Xem nhanh công việc" });
    await expect(preview).toBeVisible();
    await expect.poll(async () => {
        const anchor = await card.boundingBox(); const popup = await preview.boundingBox();
        if (!anchor || !popup) return false;
        const viewport = page.viewportSize()!;
        const center = anchor.y + anchor.height / 2;
        const expectedTop = Math.max(80, Math.min(center - popup.height / 2, viewport.height - 16 - popup.height));
        const side = await preview.getAttribute("data-side");
        const arrow = await page.locator("[data-job-preview-arrow]").boundingBox();
        const gap = side === "right" ? popup.x - anchor.x - anchor.width : anchor.x - popup.x - popup.width;
        const arrowCentered = !!arrow && Math.abs(arrow.y + arrow.height / 2 - center) <= 1;
        return arrowCentered && ["left", "right"].includes(side ?? "") && Math.abs(gap - 8) <= 1 && Math.abs(popup.y - expectedTop) <= 1 &&
            popup.x >= 15 && popup.x + popup.width <= viewport.width - 15 && popup.y >= 79 && popup.y + popup.height <= viewport.height - 15;
    }).toBe(true);
    await expect(preview.getByRole("heading", { level: 2 })).toBeInViewport();
    return preview;
}

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
    await expect(preview.getByRole("button", { name: "Ứng tuyển", exact: true })).toBeEnabled();
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

test("preview centers beside the hovered card, flips at the right edge and follows scrolling", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/jobs?q=React");
    const card = page.locator("#job-results article").first();
    await expect(card).toBeVisible();
    await card.hover();
    const preview = await expectAnchoredPreview(page, card);
    await page.screenshot({ path: testInfo.outputPath("preview-centered.png") });
    await preview.hover(); await expect(preview).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/jobs");
    await expect(page.locator("#job-results article")).toHaveCount(12);
    const rightCard = page.locator("#job-results article").nth(1);
    await rightCard.hover();
    const flipped = await expectAnchoredPreview(page, rightCard);
    await expect(flipped).toHaveAttribute("data-side", "left");
    await page.keyboard.press("Escape");

    await page.setViewportSize({ width: 1440, height: 650 });
    await card.scrollIntoViewIfNeeded();
    await card.evaluate((element) => window.scrollBy(0, element.getBoundingClientRect().top - 88));
    await card.hover(); await expectAnchoredPreview(page, card);
    await page.screenshot({ path: testInfo.outputPath("preview-top-edge.png") });
    await page.keyboard.press("Escape");
    const bottomCard = page.locator("#job-results article").last();
    await bottomCard.hover(); await expectAnchoredPreview(page, bottomCard);
    await page.screenshot({ path: testInfo.outputPath("preview-bottom-edge.png") });
});

test("saved job previews use the same centered positioning and fit after resizing", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect((await page.request.post("/api/bff/auth/login", { data: { email: "candidate@example.com", password: "TalentAI123!", role: "candidate" } })).status()).toBe(200);
    await page.goto("/candidate/saved-jobs");
    const cards = page.locator("main article");
    await expect(cards.nth(2)).toBeVisible();
    await cards.first().hover(); await expectAnchoredPreview(page, cards.first());
    await page.screenshot({ path: testInfo.outputPath("saved-preview-centered.png") });
    await page.keyboard.press("Escape");
    await cards.nth(2).hover();
    const preview = await expectAnchoredPreview(page, cards.nth(2));
    await expect(preview).toHaveAttribute("data-side", "left");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 375, height: 812 });
    await cards.first().focus();
    await expect(preview).toBeVisible();
    await expect.poll(async () => {
        const rect = await preview.boundingBox();
        return !!rect && rect.width >= 300 && rect.x >= 15 && rect.x + rect.width <= 360 && rect.y >= 79 && rect.y + rect.height <= 797;
    }).toBe(true);
});
