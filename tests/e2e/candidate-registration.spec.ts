import { expect, test } from "@playwright/test";

test("candidate registers without phone, arrives home signed in and sees a one-time toast", async ({ page, context }) => {
  let registered = false;
  const user = { id: "30000000-0000-4000-8000-000000000001", email: "candidate@example.test", fullName: "Nguyễn An", role: "candidate", status: "active" };
  await page.route("**/api/bff/me", route => route.fulfill({ status: registered ? 200 : 401, contentType: "application/json", body: JSON.stringify(registered ? user : { error: { code: "UNAUTHENTICATED" } }) }));
  await page.route("**/api/bff/auth/register", async route => {
    const body = route.request().postDataJSON();
    expect(body.role).toBe("candidate");
    expect(body).not.toHaveProperty("phone");
    registered = true;
    await context.addCookies([{ name: "refresh_token", value: "test-refresh", url: new URL(route.request().url()).origin, httpOnly: true, sameSite: "Lax" }]);
    await route.fulfill({ status: 201, headers: { "Content-Type": "application/json", "Set-Cookie": "access_token=test-access; Path=/; HttpOnly; SameSite=Lax" }, body: JSON.stringify({ user, expiresInSeconds: 900, csrfToken: "test-csrf", redirectTo: "/" }) });
  });
  await page.goto("/register?role=candidate");
  await expect(page.locator('input[name="phone"]')).toHaveCount(0);
  await page.getByText("Nhà tuyển dụng", { exact: true }).click();
  await page.locator('input[name="phone"]').fill("123");
  await page.getByText("Ứng viên", { exact: true }).click();
  await expect(page.locator('input[name="phone"]')).toHaveCount(0);
  await page.locator('input[name="fullName"]').fill("Nguyễn An");
  await page.locator('input[name="email"]').fill("candidate@example.test");
  await page.locator('input[name="password"]').fill("Password123!");
  await page.locator('input[name="confirmPassword"]').fill("Password123!");
  await page.getByRole("checkbox", { name: "Tôi đồng ý", exact: false }).check();
  await page.getByRole("button", { name: "Hoàn tất", exact: true }).click();
  await expect(page).toHaveURL(new URL("/", page.url()).href);
  await expect(page.getByRole("link", { name: "Tài khoản của Nguyễn An", exact: true })).toBeVisible();
  const notice = page.getByText("Đăng ký thành công", { exact: true });
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCount(0, { timeout: 10_000 });
  const authCookies = (await context.cookies()).filter(cookie => ["access_token", "refresh_token"].includes(cookie.name));
  expect(authCookies).toHaveLength(2);
  expect(authCookies.every(cookie => cookie.httpOnly)).toBe(true);
  await page.reload();
  await expect(notice).toHaveCount(0);
});
