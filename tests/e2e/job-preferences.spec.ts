import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("candidate@example.com");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
}

test("sidebar opens job criteria, enforces selection limits and saves/cancels the preview", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page);
    const menu = page.getByRole("navigation", { name: "Menu ứng viên", exact: true });
    await menu.locator("summary").filter({ hasText: "Hồ sơ việc làm" }).click();
    await menu.getByRole("link", { name: "Tiêu chí tìm việc", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/job-preferences$/);
    await expect(menu.getByRole("link", { name: "Tiêu chí tìm việc", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Tiêu chí tìm việc", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveValue("Digital marketing");
    await page.screenshot({ path: testInfo.outputPath("job-preferences-desktop.png"), fullPage: true });
    await page.getByRole("combobox", { name: "Ngành nghề làm việc", exact: true }).click();
    await expect(page.getByRole("option", { name: "Marketing / Truyền thông", exact: true })).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Bỏ Ngân hàng", exact: true }).click();
    await page.getByRole("combobox", { name: "Ngành nghề làm việc", exact: true }).click();
    await page.getByRole("option", { name: "Marketing / Truyền thông", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Bỏ Marketing / Truyền thông", exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Cấp bậc hiện tại", exact: true }).click();
    await page.getByRole("option", { name: "Chuyên viên", exact: true }).click();
    await page.keyboard.press("Escape");
    const advanced = page.getByRole("button", { name: /Tùy chọn nâng cao/ });
    await advanced.click();
    await expect(page.getByRole("combobox", { name: "Cấp bậc hiện tại", exact: true })).toBeHidden();
    await advanced.click();
    await expect(page.getByRole("button", { name: "Bỏ Chuyên viên", exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: /Vị trí mong muốn/ }).fill("Frontend Developer");
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Đã lưu tiêu chí vào bản xem trước.", { exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: /Vị trí mong muốn/ }).fill("Thay đổi chưa lưu");
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveValue("Frontend Developer");
});

test("criteria validates salaries and required fields and fits mobile", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await login(page);
    await page.goto("/candidate/job-preferences");
    await page.getByRole("textbox", { name: "Lương tối thiểu", exact: true }).fill("30");
    await expect(page.getByRole("textbox", { name: "Lương tối thiểu", exact: true })).toHaveValue("30");
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Lương thỏa thuận", exact: true }).check();
    await expect(page.getByRole("textbox", { name: "Lương tối thiểu", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Đã lưu tiêu chí vào bản xem trước.", { exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: /Vị trí mong muốn/ }).fill("");
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Vui lòng nhập vị trí mong muốn.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(page.getByText("Vui lòng nhập vị trí mong muốn.", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveAttribute("aria-invalid", "false");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath("job-preferences-mobile.png"), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Mở menu ứng viên", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Menu ứng viên", exact: true });
    await expect(drawer.getByRole("link", { name: "Tiêu chí tìm việc", exact: true })).toHaveAttribute("aria-current", "page");
    await drawer.getByRole("link", { name: "Hồ sơ của tôi", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/profile$/);
    await expect(drawer).toBeHidden();
});

test("job criteria requires a candidate session", async ({ page }) => {
    await page.goto("/candidate/job-preferences");
    await expect(page).toHaveURL(/\/login$/);
});
