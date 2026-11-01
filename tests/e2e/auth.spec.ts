import { test, expect, type Page } from "@playwright/test";

test("logout notice expires after five seconds", async ({ page }) => {
  await page.goto("/login?reason=logged-out");
  const notice = page.getByText("Bạn đã đăng xuất", { exact: true });
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCount(0, { timeout: 10_000 });
});

test("submitting login dismisses the previous notice even when validation fails", async ({ page }) => {
  await page.goto("/login?reason=logged-out");
  const notice = page.getByText("Bạn đã đăng xuất", { exact: true });
  await expect(notice).toBeVisible();
  await page.locator("label").filter({ hasText: /^Nhà tuyển dụng$/ }).click();
  await expect(page.getByText("Lợi thế cho doanh nghiệp bằng trải nghiệm tuyển dụng thông minh.")).toBeVisible();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(notice).toHaveCount(0);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("candidate@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("WrongPassword123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Không thể đăng nhập", { exact: true })).toBeVisible();
  await expect(notice).toHaveCount(0);
  await page.locator("label").filter({ hasText: /^Ứng viên$/ }).click();
  await expect(page.getByText("Không thể đăng nhập", { exact: true })).toHaveCount(0);
  await expect(notice).toHaveCount(0);
});

async function login(page: Page, email = "candidate@example.com") {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/(candidate|recruiter|admin)\/dashboard$/);
}

test("login uses the verified account role and private pages reject wrong roles", async ({ page, context }) => {
  await page.goto("/login?role=recruiter");
  await expect(page.getByRole("radio", { name: "Nhà tuyển dụng", exact: true })).toBeChecked();
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("candidate@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/candidate\/dashboard$/);
  const tokens = (await context.cookies()).filter((cookie) => ["access_token", "refresh_token"].includes(cookie.name));
  expect(tokens).toHaveLength(2);
  expect(tokens.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("access_token");
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/candidate\/dashboard$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/candidate\/dashboard$/);
});

for (const role of ["candidate", "recruiter"] as const) {
  test(`registers ${role} without auto-login, then signs in`, async ({ page, context }) => {
    const email = `${role}-${crypto.randomUUID()}@example.com`;
    await page.goto(`/register?role=${role}`);
    await page.getByRole("textbox", { name: "Email đăng nhập", exact: false }).fill(email);
    await page.getByRole("textbox", { name: "Họ và tên", exact: false }).fill("Nguyễn Văn An");
    await page.locator('input[name="phone"]').fill("0901234567");
    await page.locator('input[name="password"]').fill("TalentAI123!");
    await page.locator('input[name="confirmPassword"]').fill("TalentAI123!");
    await page.getByRole("checkbox", { name: "Tôi đồng ý", exact: false }).check();
    await page.getByRole("button", { name: "Hoàn tất", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Đăng ký thành công!" })).toBeVisible();
    expect((await context.cookies()).some((cookie) => cookie.name === "access_token")).toBe(false);
    await page.getByRole("link", { name: "Đăng nhập ngay", exact: true }).click();
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
    if (role === "recruiter") await expect(page.getByText("Doanh nghiệp đang chờ hoàn thiện và kiểm duyệt")).toBeVisible();
  });
}

test("shows inline validation and duplicate email without exposing server text", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Hoàn tất", exact: true }).click();
  await expect(page.getByText("Bạn cần đồng ý với điều khoản và chính sách quyền riêng tư.")).toBeVisible();
  await page.locator('input[name="email"]').fill("candidate@example.com");
  await page.locator('input[name="phone"]').fill("0901234567");
    await page.locator('input[name="fullName"]').fill("Nguyễn Văn An");
  await page.locator('input[name="password"]').fill("TalentAI123!");
  await page.locator('input[name="confirmPassword"]').fill("wrong");
  await page.getByRole("checkbox", { name: "Tôi đồng ý", exact: false }).check();
  await page.getByRole("button", { name: "Hoàn tất", exact: true }).click();
  await expect(page.getByText("Mật khẩu nhập lại chưa khớp.")).toBeVisible();
  await page.locator('input[name="confirmPassword"]').fill("TalentAI123!");
  await page.getByRole("button", { name: "Hoàn tất", exact: true }).click();
  await expect(page.locator('input[name="email"]')).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator('input[name="email"]')).toHaveAccessibleDescription(/Email này đã được sử dụng/);
});

test("rejects wrong passwords and locked accounts", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill("candidate@example.com");
  await page.locator('input[name="password"]').fill("wrong-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Email hoặc mật khẩu không đúng.", { exact: true })).toBeVisible();
  await page.locator('input[name="email"]').fill("locked@example.com");
  await page.locator('input[name="password"]').fill("TalentAI123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Tài khoản đang bị khóa hoặc tạm khóa.", { exact: false })).toBeVisible();
});

test("GET logout preserves the session, confirmation revokes it and private routes close", async ({ page, context }) => {
  await login(page);
  await page.goto("/logout");
  await expect(page.getByRole("heading", { name: "Đăng xuất tài khoản" })).toBeVisible();
  expect((await context.request.get("/api/bff/me")).status()).toBe(200);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?reason=logged-out$/);
  expect((await context.cookies()).filter((cookie) => ["access_token", "refresh_token"].includes(cookie.name))).toHaveLength(0);
  expect((await context.request.get("/api/bff/me")).status()).toBe(401);
  await page.goto("/candidate/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("refreshes expired access once and preserves the authenticated page", async ({ page, context }) => {
  await login(page, "recruiter@example.com");
  const oldRefresh = (await context.cookies()).find((cookie) => cookie.name === "refresh_token")!.value;
  await context.clearCookies({ name: "access_token" });
  await page.reload();
  await expect(page.getByRole("heading", { name: /Xin chào/ })).toBeVisible();
  await expect.poll(async () => (await context.cookies()).some((cookie) => cookie.name === "access_token")).toBe(true);
  expect((await context.cookies()).find((cookie) => cookie.name === "refresh_token")!.value).not.toBe(oldRefresh);
});

test("a failed logout shows retry and does not discard a valid session", async ({ page, context }) => {
  await login(page);
  await page.goto("/logout");
  await page.route("**/api/bff/auth/logout", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "secret database failure" } }) }));
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page.getByText("Chưa thể đăng xuất", { exact: true })).toBeVisible();
  await expect(page.getByText("secret database failure")).toHaveCount(0);
  expect((await context.request.get("/api/bff/me")).status()).toBe(200);
  await page.unroute("**/api/bff/auth/logout");
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?reason=logged-out$/);
});

test("auth screens fit desktop and mobile with the provided illustration", async ({ page }, testInfo) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["login", "login?role=recruiter", "register?role=recruiter"]) {
      await page.goto(`/${route}`);
      await page.locator('input[name="email"]').fill("preview@example.com");
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.locator('[data-slot="auth-illustration"]').textContent()).toBe("");
      await expect(page.locator('[data-slot="auth-illustration"] img')).toHaveAttribute("src", /login-banner/);
      await page.screenshot({ path: testInfo.outputPath(`${route.replace("?role=", "-")}-${width}.png`), fullPage: true });
    }
  }
});

test("register scrolls only its content while the frame, logo and image stay fixed", async ({ page }, testInfo) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 667 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/register?role=recruiter");
    await page.locator('input[name="email"]').fill("preview@example.com");
    const content = page.getByRole("region", { name: "Nội dung tài khoản" });
    const frame = page.locator('[data-slot="auth-frame"]');
    const logo = page.getByRole("link", { name: "TalentAI — Trang chủ" });
    const frameBefore = await frame.boundingBox();
    const logoBefore = await logo.boundingBox();
    const imageBefore = viewport.width >= 1024 ? await page.locator('[data-slot="auth-illustration"] img').boundingBox() : null;
    expect(await content.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await expect(page.getByRole("button", { name: "Hoàn tất", exact: true })).toBeInViewport();
    await content.hover();
    await page.mouse.wheel(0, 1200);
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    expect(await frame.boundingBox()).toEqual(frameBefore);
    expect(await logo.boundingBox()).toEqual(logoBefore);
    if (imageBefore) expect(await page.locator('[data-slot="auth-illustration"] img').boundingBox()).toEqual(imageBefore);
    await expect(page.getByRole("button", { name: "Hoàn tất", exact: true })).toBeInViewport();
    // Keyboard users can reach an earlier input and the panel scrolls it into view.
    await page.getByRole("button", { name: "Hoàn tất", exact: true }).focus();
    await page.locator('input[name="fullName"]').focus();
    await expect(page.locator('input[name="email"]')).toBeInViewport();
    await expect.poll(() => content.evaluate((element) => {
      const field = element.querySelector('[data-slot="form-field"]')!;
      return field.getBoundingClientRect().top >= element.getBoundingClientRect().top;
    })).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.screenshot({ path: testInfo.outputPath(`register-scroll-${viewport.width}.png`), fullPage: true });
  }
});
