import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

async function expectAlignedCards(page: Page) {
    const cards = await page.locator("main article").evaluateAll((elements) => elements.map((element) => {
        const card = element.getBoundingClientRect();
        const panel = element.querySelector('section[aria-label="Hồ sơ ứng tuyển"]')!;
        const footer = panel.lastElementChild!.getBoundingClientRect();
        return { top: Math.round(card.top), height: card.height, panelTop: panel.getBoundingClientRect().top, footerTop: footer.top };
    }));
    expect(cards.length).toBeGreaterThan(1);
    const rows = Map.groupBy(cards, (card) => card.top);
    for (const row of rows.values()) {
        for (const key of ["height", "panelTop", "footerTop"] as const) {
            expect(Math.max(...row.map((card) => card[key])) - Math.min(...row.map((card) => card[key]))).toBeLessThan(1);
        }
    }
}

test("candidate tracks applications, confirms an interview and downloads calendar", async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-10-23T02:00:00Z'));
    await page.setViewportSize({ width: 1440, height: 1000 });
    const email = `applications-${randomUUID()}@example.com`;
    expect((await page.request.post("/api/bff/auth/register", { data: { email, password: "TalentAI123!", confirmPassword: "TalentAI123!", fullName: "Ứng viên ứng tuyển", phone: "0901234567", role: "candidate", acceptedPrivacyPolicy: true } })).status()).toBe(201);
    expect((await page.request.post("/api/bff/auth/login", { data: { email, password: "TalentAI123!", role: "candidate" } })).status()).toBe(200);
    await page.goto("/candidate/applications");
    await expect(page.getByRole("heading", { name: "Việc làm đã ứng tuyển" })).toBeVisible();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("1–6 trong 12 hồ sơ");
    await expectAlignedCards(page);
    const character = page.locator("[data-interview-character]");
    await expect(character).toBeVisible();
    await expect(character.locator("img")).toHaveJSProperty("complete", true);
    expect(await character.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath("applications-desktop.png"), fullPage: true });
    for (const width of [375, 640, 768, 1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        const content = page.locator("[data-interview-character-content]");
        expect(await content.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return box.height >= 44 && element.scrollHeight <= element.clientHeight + 1 &&
                [...element.children].filter((child) => child.getBoundingClientRect().height > 0).every((child) => {
                    const rect = child.getBoundingClientRect();
                    return rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1;
                });
        })).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width >= 1280) {
            const heroHeight = await page.locator("[data-applications-hero]").evaluate((element) => element.getBoundingClientRect().height);
            const copyHeight = await page.locator("[data-applications-hero-copy]").evaluate((element) => element.getBoundingClientRect().height);
            expect(Math.abs(heroHeight - copyHeight - 2)).toBeLessThan(1);
        }
        await character.screenshot({ path: testInfo.outputPath(`interview-character-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "Xem lịch phỏng vấn", exact: true }).click();
    await expect(page.getByRole("tab", { name: "Phỏng vấn", exact: true })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Tất cả", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("1–6 trong 12 hồ sơ");
    await page.getByRole("button", { name: "Trang 2", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("7–12 trong 12 hồ sơ");
    await page.getByRole("tab", { name: "Phỏng vấn", exact: true }).click();
    await expect(page.getByText("Phỏng vấn trực tuyến", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Xem lời mời", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Chi tiết ứng tuyển" });
    await dialog.getByRole("button", { name: "Xác nhận tham gia", exact: true }).click();
    await expect(dialog.getByText("Đã xác nhận tham gia phỏng vấn.")).toBeVisible();
    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Thêm vào lịch cá nhân", exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/\.ics$/);
    await page.keyboard.press("Escape");
    await expectAlignedCards(page);
    await page.screenshot({ path: testInfo.outputPath("applications-interviews.png"), fullPage: true });
    await page.getByRole("tab", { name: "Tất cả", exact: true }).click();
    await page.getByRole("textbox", { name: "Tìm vị trí hoặc công ty" }).fill("khong-co-cong-ty-nay");
    await expect(page.getByRole("heading", { name: "Không tìm thấy hồ sơ phù hợp" })).toBeVisible();
    await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("12 hồ sơ");
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({ path: testInfo.outputPath("applications-mobile.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("tab", { name: "Phỏng vấn", exact: true }).click();
    await expect(page.getByText("Phỏng vấn trực tuyến", { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("applications-interviews-mobile.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("tab", { name: "Đã trúng tuyển", exact: true }).click();
    await expect(page.getByText("Chúc mừng bạn!", { exact: false })).toBeVisible();
    await page.getByRole("tab", { name: "Tất cả", exact: true }).click();
    await expect(page.getByRole("tab", { name: "Tất cả", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("12 hồ sơ");
    await page.route("**/api/bff/applications?**", (route) => route.fulfill({ status: 500, json: { error: { code: "INTERNAL_ERROR" } } }));
    await page.reload();
    await expect(page.getByText("Không thể tải hồ sơ ứng tuyển", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/applications?**");
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("12 hồ sơ");
});

test("application management requires a candidate session", async ({ page }) => {
    await page.goto("/candidate/applications");
    await expect(page).toHaveURL(/\/login$/);
    expect((await page.request.get("/api/bff/applications")).status()).toBe(401);
    expect((await page.request.get("/api/bff/candidate/interviews")).status()).toBe(401);
});
