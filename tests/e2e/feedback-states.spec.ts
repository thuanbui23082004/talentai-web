import { expect, test, type Locator } from "@playwright/test";

async function expectLoadedMascot(state: Locator) {
    const image = state.locator("[data-feedback-illustration] img");
    await expect(state).toBeVisible();
    // Scroll the stationary panel, not the continuously floating illustration.
    await state.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveAttribute("alt", "");
}

test("unknown routes have a branded 404, visible recovery links and no horizontal overflow", async ({ page }, testInfo) => {
    for (const width of [375, 768, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto("/duong-dan-khong-ton-tai");
        expect(response?.status()).toBe(404);
        await expect(page.getByRole("heading", { name: "Có vẻ bạn đã đi lạc", exact: true })).toBeVisible();
        const state = page.locator('[data-feedback-state="not-found"]');
        await expectLoadedMascot(state);
        await expect(page.getByRole("link", { name: "Về trang chủ", exact: true })).toBeVisible();
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`404-${width}.png`) });
    }
    await page.getByRole("link", { name: "Về trang chủ", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
});

test("missing jobs and companies use the lost mascot and preserve recovery destinations", async ({ page }) => {
    for (const item of [
        { path: "/jobs/unknown-job", title: "Không tìm thấy việc làm", label: "Xem các việc làm khác →", href: "/jobs" },
        { path: "/companies/unknown-company", title: "Không tìm thấy công ty", label: "Xem danh sách công ty →", href: "/companies" },
    ]) {
        await page.goto(item.path);
        await expect(page.getByRole("heading", { name: item.title, exact: true })).toBeVisible();
        await expectLoadedMascot(page.locator('[data-feedback-state="not-found"]'));
        await expect(page.getByRole("link", { name: item.label, exact: true })).toHaveAttribute("href", item.href);
    }
});

test("empty job search shows the search mascot and clearing filters recovers results", async ({ page }, testInfo) => {
    await page.goto("/jobs?q=khong-co-vi-tri-nao-nhu-vay");
    const state = page.locator('[data-feedback-state="empty"]');
    await expect(state).toContainText("Không tìm thấy việc làm.");
    await expectLoadedMascot(state);
    await state.screenshot({ path: testInfo.outputPath("empty-jobs.png") });
    await state.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
    await expect(page.locator("#job-results article")).toHaveCount(12);
    await expect(state).toBeHidden();
});

test("failed job requests show a different mascot, hide technical errors and recover on retry", async ({ page }, testInfo) => {
    let fail = true;
    await page.route("**/api/bff/jobs?*", (route) => fail ? route.fulfill({ status: 500, json: { error: { code: "INTERNAL_ERROR", message: "private-server-stack" } } }) : route.continue());
    await page.goto("/jobs");
    const state = page.locator('[data-feedback-state="error"]');
    await expect(state).toHaveAttribute("role", "alert");
    await expectLoadedMascot(state);
    await expect(page.locator("body")).not.toContainText("private-server-stack");
    await state.screenshot({ path: testInfo.outputPath("error-jobs.png") });
    fail = false;
    await state.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.locator("#job-results article")).toHaveCount(12);
    await expect(state).toBeHidden();
});

test("candidate empty lists and compact notification popup share the new illustrations", async ({ page }) => {
    expect((await page.request.post("/api/bff/auth/login", { data: { email: "candidate@example.com", password: "TalentAI123!", role: "candidate" } })).ok()).toBe(true);
    for (const item of [
        { path: "/candidate/saved-jobs", api: "**/api/bff/candidate/saved-jobs?*", title: "Chưa có việc làm đã lưu" },
        { path: "/candidate/applications", api: "**/api/bff/applications?*", title: "Chưa có hồ sơ trong mục này" },
    ]) {
        await page.route(item.api, (route) => route.continue({ headers: { ...route.request().headers(), "x-mock-scenario": "empty" } }));
        await page.goto(item.path);
        await expect(page.getByRole("heading", { name: item.title, exact: true })).toBeVisible();
        await expectLoadedMascot(page.locator('[data-feedback-state="empty"]'));
    }
    await page.route("**/api/bff/notifications?*", (route) => route.continue({ headers: { ...route.request().headers(), "x-mock-scenario": "empty" } }));
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    const popup = page.getByRole("dialog", { name: "Thông báo", exact: true });
    await expect(popup.getByRole("heading", { name: "Chưa có thông báo", exact: true })).toBeVisible();
    await expectLoadedMascot(popup.locator('[data-feedback-state="empty"]'));
    expect((await popup.locator("[data-feedback-illustration]").boundingBox())?.width).toBe(96);
});

test("state showcase fits mobile, uses three distinct assets and respects reduced motion", async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/ui/states");
        await expect(page.getByRole("heading", { name: "Nhân vật & trạng thái giao diện", exact: true })).toBeVisible();
        const sources = new Set<string>();
        for (const kind of ["not-found", "empty", "error"]) {
            const state = page.locator(`[data-feedback-state="${kind}"]:visible`).first();
            await expectLoadedMascot(state);
            sources.add((await state.locator("img").getAttribute("src"))!);
            expect(await state.locator("img").evaluate((element) => element.getAnimations().length)).toBe(0);
        }
        expect(sources.size).toBe(3);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`states-${width}.png`), fullPage: true });
    }
});

test("runtime error boundary displays safe recovery content and retry remounts the page", async ({ page }) => {
    await page.goto("/ui/states");
    await page.getByRole("button", { name: "Xem thử lỗi trang", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Có một chút gián đoạn", exact: true })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("FEEDBACK_PREVIEW_ERROR");
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Nhân vật & trạng thái giao diện", exact: true })).toBeVisible();
});
