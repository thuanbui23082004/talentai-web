import { test, expect } from "@playwright/test";

test("search jobs through the BFF and retain filters in the URL", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.getByText("Tìm thấy 6 việc làm")).toBeVisible();
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
  await expect(page.getByText("Tìm thấy 6 việc làm")).toBeVisible();
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
    await expect(page.getByText("Tìm thấy 6 việc làm")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`jobs-${width}.png`), fullPage: true });
  }
});
