import { test, expect } from "@playwright/test";

test("selects province and ward, retains URL filters, and clears ward when changing province", async ({ page }, testInfo) => {
  await page.goto("/jobs");
  await page.getByRole("button", { name: "Địa điểm tìm việc", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Chọn địa điểm làm việc" });
  await dialog.getByLabel("Tìm tỉnh thành").fill("ha noi");
  await dialog.getByRole("button", { name: "Hà Nội", exact: true }).click();
  await dialog.getByLabel("Tìm phường xã").fill("ngoc ha");
  await dialog.getByRole("button", { name: "Phường Ngọc Hà", exact: true }).click();
  await dialog.getByRole("button", { name: "Chọn địa điểm", exact: true }).click();
  await expect(page).toHaveURL(/provinceCode=01/);
  await expect(page).toHaveURL(/wardCode=00008/);
  await expect(page.getByText("Tìm thấy 5 việc làm")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Địa điểm tìm việc", exact: true })).toContainText("Phường Ngọc Hà");
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("button", { name: "Địa điểm tìm việc", exact: true }).click();
  await dialog.getByLabel("Tìm tỉnh thành").fill("ho chi minh");
  await dialog.getByRole("button", { name: "TP.HCM", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Tất cả phường/xã", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: testInfo.outputPath("location-picker-mobile.png") });
  await dialog.getByRole("button", { name: "Chọn địa điểm", exact: true }).click();
  await expect(page).toHaveURL(/provinceCode=79/);
  await expect(page).not.toHaveURL(/wardCode=/);
  await expect(page.getByText("Tìm thấy 7 việc làm")).toBeVisible();
  await page.getByRole("button", { name: "Xóa lọc", exact: true }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.getByRole("button", { name: "Địa điểm tìm việc", exact: true })).toContainText("Tất cả các địa điểm");
});

test("shows twelve cards per page and applies filters without an apply button", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.locator("#job-results article")).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Áp dụng", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator("#job-results article")).toHaveCount(6);
  await page.getByLabel("Tất cả loại hình", { exact: true }).click();
  await page.getByRole("option", { name: "Từ xa", exact: true }).click();
  await expect(page).toHaveURL(/workType=remote/);
  await expect(page).not.toHaveURL(/page=2/);
  await expect(page.locator("#job-results article")).toHaveCount(1);
  await expect(page.getByText("Tìm thấy 1 việc làm")).toBeVisible();
});

test("keeps filters at the top while scrolling results and paginates", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/jobs?pageSize=2");
  await expect(page.getByText("Tìm thấy 18 việc làm")).toBeVisible();
  await expect(page.locator("#job-results article")).toHaveCount(2);
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("button", { name: "Trang 2", exact: true })).toHaveAttribute("aria-current", "page");
  await page.evaluate(() => window.scrollTo(0, 650));
  const bar = page.getByRole("button", { name: "Xóa lọc", exact: true }).locator("..");
  await expect.poll(async () => Math.round((await bar.boundingBox())?.y ?? -1)).toBe(0);
  await expect(page.getByLabel("Tất cả kinh nghiệm")).toBeVisible();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.evaluate(() => window.scrollTo(0, 650));
  await expect.poll(async () => Math.round((await bar.boundingBox())?.y ?? -1)).toBe(0);
  expect((await bar.boundingBox())?.height).toBeLessThan(120);
});

test("search jobs through the BFF and retain filters in the URL", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.getByText("Tìm thấy 18 việc làm")).toBeVisible();
  await page.getByLabel("Từ khóa").fill("React");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(page).toHaveURL(/q=React/);
  await expect(page.getByText("Tìm thấy 1 việc làm")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lập trình viên Frontend React" })).toBeVisible();
  await page.getByLabel("Từ khóa").fill("không có vị trí này");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(page.getByText("Không tìm thấy việc làm.", { exact: false })).toBeVisible();
});

test("shows an error and recovers on retry", async ({ page }) => {
  let fail = true;
  await page.route("**/api/bff/jobs*", async (route) => {
    if (fail) await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "raw server error" } }) });
    else await route.continue();
  });
  await page.goto("/jobs");
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  await expect(page.getByText("raw server error")).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByText("Tìm thấy 18 việc làm")).toBeVisible();
});

test("closes private pages for anonymous users", async ({ page }) => {
  for (const role of ["candidate", "recruiter", "admin"]) {
    await page.goto(`/${role}/dashboard`);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test("fits mobile and desktop widths", async ({ page }, testInfo) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/jobs");
    await expect(page.getByText("Tìm thấy 18 việc làm")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`jobs-${width}.png`), fullPage: true });
  }
});
