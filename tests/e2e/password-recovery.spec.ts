import { expect, test } from "@playwright/test";

test("email OTP is entered on the reset form", async ({ page }) => {
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
    await expect(page.getByText(/mã OTP đã được gửi/)).toBeVisible();
    await page.getByRole("link", { name: "Nhập mã OTP" }).click();
    await expect(page).toHaveURL(/\/reset-password$/);
    await page.getByPlaceholder("Nhập mã OTP").fill("123456");
    await page.getByPlaceholder("Nhập mật khẩu mới").fill("NewPassword@123");
    await page.getByPlaceholder("Nhập lại mật khẩu mới").fill("NewPassword@123");
    await page.getByRole("button", { name: "Đặt lại mật khẩu", exact: true }).click();
    await expect(page).toHaveURL(/\/login(?:\?reason=password-reset)?$/);
    await expect(page.getByText("Đặt lại mật khẩu thành công")).toBeVisible();
    expect(resetBody).toEqual({ token: "123456", newPassword: "NewPassword@123", confirmPassword: "NewPassword@123" });
});
