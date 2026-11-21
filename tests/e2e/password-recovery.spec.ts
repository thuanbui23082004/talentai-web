import { expect, test } from "@playwright/test";

test("email link supplies the reset token without displaying a token field", async ({ page }) => {
    await page.route("**/api/bff/auth/forgot-password", (route) => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ message: "Yêu cầu khôi phục mật khẩu đã được tiếp nhận." }),
    }));
    let resetBody: unknown;
    await page.route("**/api/bff/auth/reset-password", async (route) => {
        resetBody = route.request().postDataJSON();
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "Đặt lại mật khẩu thành công." }) });
    });

    await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.getByRole("textbox", { name: "Email đã đăng ký" }).fill("candidate@example.com");
    await page.getByRole("button", { name: "Yêu cầu đặt lại mật khẩu" }).click();
    await expect(page.getByText("Yêu cầu đã được tiếp nhận")).toBeVisible();
    await page.goto("/reset-password");
    await expect(page.getByText("Liên kết không hợp lệ hoặc đã hết hạn")).toBeVisible();
    await page.goto("/reset-password?token=123456", { waitUntil: "domcontentloaded" });
    await expect(page.getByPlaceholder("Nhập mã từ email")).toHaveCount(0);
    await page.getByPlaceholder("Nhập mật khẩu mới").fill("NewPassword@123");
    await page.getByPlaceholder("Nhập lại mật khẩu mới").fill("NewPassword@123");
    await page.getByRole("button", { name: "Đặt lại mật khẩu", exact: true }).click();
    await expect(page).toHaveURL(/\/login(?:\?reason=password-reset)?$/);
    await expect(page.getByText("Đặt lại mật khẩu thành công")).toBeVisible();
    expect(resetBody).toEqual({ token: "123456", newPassword: "NewPassword@123", confirmPassword: "NewPassword@123" });
});
