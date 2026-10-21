import { test, expect } from "@playwright/test";

test("form fields, password visibility, error descriptions and disabled states", async ({ page }) => {
  await page.goto("/ui");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tìm Đúng Việc");
  const password = page.getByLabel("Mật khẩu", { exact: true });
  await password.fill("TalentAI123");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await page.getByLabel("Hiển thị trạng thái lỗi minh họa").check();
  await expect(page.getByLabel("Email", { exact: false })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Email", { exact: false })).toHaveAccessibleDescription(/Vui lòng nhập địa chỉ email hợp lệ/);
  await expect(page.getByLabel("Mã hồ sơ")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Đang xử lý" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Chưa khả dụng" })).toBeDisabled();
  await page.getByRole("radio", { name: "Làm việc từ xa", exact: false }).check();
  await expect(page.getByRole("radio", { name: "Toàn thời gian", exact: true })).not.toBeChecked();
});

test("selects single and multiple values using accessible controls", async ({ page }) => {
  await page.goto("/ui");
  const location = page.getByRole("combobox", { name: "Địa điểm làm việc" });
  await location.click();
  await page.getByRole("option", { name: "Đà Nẵng", exact: true }).click();
  await expect(location).toContainText("Đà Nẵng");
  const skills = page.getByRole("combobox", { name: "Kỹ năng" });
  await skills.click();
  await page.getByRole("option", { name: "Figma", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(skills).toContainText("3 đã chọn");
  await page.getByRole("button", { name: "Bỏ React", exact: true }).click();
  await expect(skills).toContainText("2 đã chọn");
  await skills.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(skills).toBeFocused();
});

test("modal traps focus, closes with Escape and restores the trigger", async ({ page }) => {
  await page.goto("/ui");
  const trigger = page.getByRole("button", { name: "Mở hộp thoại" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Lưu thay đổi hồ sơ?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Đóng hộp thoại" })).toBeFocused();
  for (let count = 0; count < 5; count++) {
    await page.keyboard.press("Tab");
    await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Đã lưu thay đổi mẫu", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(page.getByText("Đã lưu thay đổi mẫu", { exact: true })).not.toBeVisible();
});

test("keyboard tabs, pagination boundaries and tooltip focus", async ({ page }) => {
  await page.goto("/ui");
  await page.getByRole("tab", { name: "Dành cho bạn", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Đã lưu", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tabpanel")).toContainText("Danh sách việc làm đã lưu");
  const pagination = page.getByRole("navigation", { name: "Phân trang" });
  await expect(pagination.getByRole("button", { name: "Trang trước" })).toBeDisabled();
  await pagination.getByRole("button", { name: "Trang 8", exact: true }).click();
  await expect(pagination.getByRole("button", { name: "Trang sau" })).toBeDisabled();
  await expect(pagination.getByRole("button", { name: "Trang 8", exact: true })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Quyền riêng tư hồ sơ" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Chỉ bạn và nhà tuyển dụng");
});

test("search preview navigates to real mock listing and renders without overflow", async ({ page }, testInfo) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ui");
    await page.evaluate(() => document.fonts.ready);
    await page.getByLabel("Hiển thị trạng thái lỗi minh họa").check();
    await page.getByLabel("Hiển thị trạng thái lỗi minh họa").uncheck();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`ui-${width}.png`), fullPage: true });
  }
  await page.getByRole("searchbox", { name: "Tên công việc, chức danh" }).fill("React");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(page).toHaveURL(/\/jobs\?q=React/);
  await expect(page.getByText("Tìm thấy 1 việc làm")).toBeVisible();
});
