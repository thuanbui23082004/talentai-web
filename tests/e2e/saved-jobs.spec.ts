import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
    const email = `saved-${randomUUID()}@example.com`; const password = "TalentAI123!";
    expect((await page.request.post("/api/bff/auth/register", { data: { email, password, confirmPassword: password, fullName: "Ứng viên việc làm đã lưu", phone: "0901234567", role: "candidate", acceptedPrivacyPolicy: true } })).status()).toBe(201);
    expect((await page.request.post("/api/bff/auth/login", { data: { email, password, role: "candidate" } })).status()).toBe(200);
}

test("saved jobs reuse cards, filter, paginate and persist remove/undo", async ({ page }, testInfo) => {
    await login(page); await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/candidate/dashboard");
    await page.getByRole("link", { name: "Việc làm đã lưu", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/saved-jobs$/);
    await expect(page.getByRole("heading", { name: "Việc làm đã lưu", exact: true })).toBeVisible();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("1–6 trong 9 việc làm");
    await expect(page.locator("main article")).toHaveCount(6);
    await expect(page.getByRole("link", { name: "Xem công việc", exact: true })).toHaveCount(0);
    const cardTops = await page.locator("main article").evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().top)));
    expect(cardTops[0]).toBe(cardTops[1]);
    expect(cardTops[1]).toBe(cardTops[2]);
    expect(cardTops[3]).toBeGreaterThan(cardTops[0]);
    await page.screenshot({ path: testInfo.outputPath("saved-jobs-desktop.png"), fullPage: true });
    const first = page.locator("main article").first();
    await first.getByRole("button", { name: "Bỏ lưu Lập trình viên Frontend React", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("trong 8 việc làm");
    await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("trong 9 việc làm");
    await page.reload(); await expect(page.getByRole("button", { name: "Bỏ lưu Lập trình viên Frontend React", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Trang 2", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("7–9 trong 9 việc làm");
    await page.getByRole("tab", { name: /Đã ngừng tuyển/ }).click();
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article").getByText("Đã hết hạn", { exact: true })).toBeVisible();
    await expect(page.locator("main article").getByRole("link")).toHaveCount(0);
    await page.getByRole("tab", { name: /Sắp hết hạn/ }).click();
    await expect(page.getByRole("heading", { name: "Chưa có việc làm sắp hết hạn" })).toBeVisible();
    await page.getByRole("tab", { name: /Tất cả/ }).click();
    await page.getByRole("textbox", { name: "Tìm việc làm đã lưu" }).fill("sao viet");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article")).toContainText("Lập trình viên Frontend React");
    await page.getByRole("textbox", { name: "Tìm việc làm đã lưu" }).fill("khongtimthay");
    await expect(page.getByRole("heading", { name: "Không tìm thấy việc làm phù hợp" })).toBeVisible();
    await page.getByRole("button", { name: "Xem tất cả đã lưu", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(6);
    await page.getByLabel("Lọc địa điểm", { exact: true }).click();
    await page.getByRole("option", { name: "Hà Nội", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(2);
    await page.getByLabel("Lọc địa điểm", { exact: true }).click();
    await page.getByRole("option", { name: "Tất cả địa điểm", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(6);
    await page.getByLabel("Sắp xếp việc làm đã lưu", { exact: true }).click();
    await page.getByRole("option", { name: "Lưu lâu nhất", exact: true }).click();
    await expect(page.locator("main article").first()).toContainText("Đợt tuyển tháng 9");
    await page.getByLabel("Sắp xếp việc làm đã lưu", { exact: true }).click();
    await page.getByRole("option", { name: "Lưu gần đây nhất", exact: true }).click();
    await expect(page.locator("main article").first()).toContainText("Lập trình viên Frontend React");
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("saved-jobs-mobile.png"), fullPage: true });
    await page.route("**/api/bff/candidate/saved-jobs?**", (route) => route.fulfill({ status: 500, json: { error: { code: "INTERNAL_ERROR" } } }));
    await page.reload(); await expect(page.getByText("Không thể tải việc làm đã lưu", { exact: true })).toBeVisible();
    await page.unroute("**/api/bff/candidate/saved-jobs?**"); await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(6);
});

test("saved button works from search cards and failed removals keep the item", async ({ page }) => {
    await login(page); await page.goto("/candidate/saved-jobs");
    await expect(page.locator("main article")).toHaveCount(6);
    await page.route("**/api/bff/candidate/saved-jobs/*", (route) => route.request().method() === "DELETE" ? route.fulfill({ status: 500, json: { error: { code: "INTERNAL_ERROR" } } }) : route.continue());
    await page.getByRole("button", { name: "Bỏ lưu Lập trình viên Frontend React", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Chưa thể cập nhật việc làm đã lưu", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bỏ lưu Lập trình viên Frontend React", exact: true })).toBeVisible();
    await page.unroute("**/api/bff/candidate/saved-jobs/*");
    await page.getByRole("button", { name: "Bỏ lưu Lập trình viên Frontend React", exact: true }).click();
    await expect(page.getByText("Hiển thị", { exact: false })).toContainText("8 việc làm");
    await page.goto("/jobs?q=React");
    const save = page.getByRole("button", { name: "Lưu Lập trình viên Frontend React", exact: true });
    await save.scrollIntoViewIfNeeded(); await save.click();
    await expect(page.getByRole("button", { name: "Bỏ lưu Lập trình viên Frontend React", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/candidate/saved-jobs"); await expect(page.getByText("Hiển thị", { exact: false })).toContainText("9 việc làm");
});

test("empty list and private route are handled", async ({ page }) => {
    await page.goto("/candidate/saved-jobs"); await expect(page).toHaveURL(/\/login$/);
    expect((await page.request.get("/api/bff/candidate/saved-jobs")).status()).toBe(401);
    await login(page);
    await page.route("**/api/bff/candidate/saved-jobs?**", (route) => route.fulfill({ json: { items: [], meta: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } } }));
    await page.goto("/candidate/saved-jobs"); await expect(page.getByRole("heading", { name: "Chưa có việc làm đã lưu" })).toBeVisible();
});
