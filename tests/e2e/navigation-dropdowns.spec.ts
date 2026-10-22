import { expect, test } from "@playwright/test";

test("candidate dropdowns dismiss outside, on actions and when switching menus", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const login = await page.request.post("/api/bff/auth/login", {
        data: { email: "candidate@example.com", password: "TalentAI123!", role: "candidate" },
    });
    expect(login.ok()).toBe(true);
    await page.goto("/candidate/dashboard");
    // Keep checking DOM state when a modal makes the header aria-hidden.
    const header = page.locator("header");
    const jobs = header.locator("details").filter({ has: page.locator("summary", { hasText: /^Việc làm$/ }) });
    const tools = header.locator("details").filter({ has: page.locator("summary", { hasText: /^Công cụ$/ }) });
    const accountTrigger = page.getByLabel("Tài khoản Nguyễn Minh Anh", { exact: true });
    const account = header.locator("details").filter({ has: accountTrigger });

    await jobs.locator("summary").hover();
    await expect(jobs).toHaveAttribute("open", "");
    await jobs.getByRole("link", { name: "Tìm việc làm", exact: true }).hover();
    await expect(jobs).toHaveAttribute("open", "");
    await tools.locator("summary").hover();
    await expect(jobs).not.toHaveAttribute("open");
    await expect(tools).toHaveAttribute("open", "");
    await accountTrigger.hover();
    await expect(tools).not.toHaveAttribute("open");
    await expect(account).toHaveAttribute("open", "");
    await page.getByRole("heading", { name: "Tổng quan", exact: true }).hover();
    await expect(account).not.toHaveAttribute("open");
    await accountTrigger.hover();
    await page.getByRole("heading", { name: "Tổng quan", exact: true }).click();
    await expect(account).not.toHaveAttribute("open");

    await accountTrigger.click();
    await page.keyboard.press("Escape");
    await expect(account).not.toHaveAttribute("open");
    await expect(accountTrigger).toBeFocused();
    await accountTrigger.press("Enter");
    await jobs.locator("summary").focus();
    await expect(account).not.toHaveAttribute("open");
    await jobs.locator("summary").press("Enter");
    await header.getByRole("button", { name: "Thông báo", exact: true }).click();
    await expect(jobs).not.toHaveAttribute("open");
    await expect(page.getByRole("dialog", { name: "Thông báo", exact: true })).toBeVisible();
    await tools.locator("summary").click();
    await expect(page.getByRole("dialog", { name: "Thông báo", exact: true })).toBeHidden();
    await expect(tools).toHaveAttribute("open", "");

    await accountTrigger.click();
    await header.getByRole("link", { name: "Tổng quan", exact: true }).click();
    await expect(account).not.toHaveAttribute("open");
    await accountTrigger.click();
    await header.getByRole("button", { name: "Cài đặt tài khoản", exact: true }).click();
    await expect(account).not.toHaveAttribute("open");
    await expect(page.getByRole("dialog", { name: "Cài đặt tài khoản", exact: true })).toBeVisible();
});

test("public mobile navigation dismisses outside and with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/jobs");
    const trigger = page.getByLabel("Mở menu điều hướng", { exact: true });
    const menu = page.getByRole("navigation", { name: "Điều hướng di động", exact: true });
    await trigger.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.locator("main").click({ position: { x: 10, y: 600 } });
    await expect(menu).toBeHidden();
});

test.describe("touch navigation", () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 900 } });

    test("mobile menu still opens and closes on tap", async ({ page }) => {
        await page.goto("/jobs");
        const trigger = page.getByLabel("Mở menu điều hướng", { exact: true });
        const menu = page.getByRole("navigation", { name: "Điều hướng di động", exact: true });
        await trigger.tap();
        await expect(menu).toBeVisible();
        await trigger.tap();
        await expect(menu).toBeHidden();
    });
});
