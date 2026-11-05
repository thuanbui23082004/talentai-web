import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
    const registration = await page.request.post("/api/bff/auth/register", { data: { email: `preferences-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên tiêu chí tìm việc", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(registration.status()).toBe(201);
    const csrf = (await registration.json()).csrfToken;
    const response = await page.request.put("/api/bff/candidate/profile", { data: { desiredIndustries: ["IT Phần cứng - Mạng", "IT Phần mềm", "Ngân hàng"], desiredJobTitle: "Digital marketing", experienceLevel: "UNDER_1_YEAR", minDesiredSalary: 15000000, maxDesiredSalary: 20000000, currency: "VND", salaryNegotiable: false, desiredLocations: ["Đà Nẵng"], currentSeniorityLevels: [], employmentTypes: [], workPreferences: { hybrid: false, thirteenthMonthSalary: true, healthInsurance: true } }, headers: { "X-CSRF-Token": csrf } });
    expect(response.status()).toBe(200);
    await page.goto("/candidate/dashboard");
}

test("sidebar opens job criteria, enforces selection limits and persists saved preferences", async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page);
    const menu = page.getByRole("navigation", { name: "Menu ứng viên", exact: true });
    await menu.locator("summary").filter({ hasText: "Hồ sơ việc làm" }).click();
    await menu.getByRole("link", { name: "Tiêu chí tìm việc", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/job-preferences$/, { timeout: 60000 });
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
    await page.getByRole("textbox", { name: "Lương tối thiểu", exact: true }).fill("15.5");
    await page.getByRole("textbox", { name: "Lương tối đa", exact: true }).fill("20.75");
    await page.getByRole("combobox", { name: "Hình thức làm việc", exact: true }).click();
    await page.getByRole("option", { name: "Toàn thời gian", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("checkbox", { name: "Làm việc Hybrid", exact: true }).check();
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Đã lưu tiêu chí tìm việc.", { exact: true })).toBeVisible();
    const saved = await (await page.request.get("/api/bff/candidate/profile")).json();
    expect(saved).toMatchObject({ desiredJobTitle: "Frontend Developer", minDesiredSalary: 15500000, maxDesiredSalary: 20750000, desiredIndustries: ["IT Phần cứng - Mạng", "IT Phần mềm", "Marketing / Truyền thông"], currentSeniorityLevels: ["Chuyên viên"], employmentTypes: ["Toàn thời gian"], workPreferences: { hybrid: true, thirteenthMonthSalary: true, healthInsurance: true } });
    if (process.env.PROFILE_REAL_E2E === "1") {
        const token = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
        const native = await page.request.get("http://localhost:3002/api/v1/candidate/profile", { headers: { Authorization: `Bearer ${token}` } });
        expect(native.status()).toBe(200);
        expect((await native.json()).data).toMatchObject({ desiredJobTitle: saved.desiredJobTitle, desiredIndustries: saved.desiredIndustries, desiredLocations: saved.desiredLocations, minDesiredSalary: saved.minDesiredSalary, currentSeniorityLevels: saved.currentSeniorityLevels, employmentTypes: saved.employmentTypes, workPreferences: saved.workPreferences });
    }
    await page.getByRole("textbox", { name: /Vị trí mong muốn/ }).fill("Thay đổi chưa lưu");
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveValue("Frontend Developer");
    await page.reload();
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveValue("Frontend Developer");
    await expect(page.getByRole("textbox", { name: "Lương tối thiểu", exact: true })).toHaveValue("15.5");
    await expect(page.getByRole("button", { name: "Bỏ Toàn thời gian", exact: true })).toBeVisible();
    // Updating another profile section must preserve saved job criteria.
    const session = await (await page.request.get("/api/bff/auth/csrf")).json();
    expect((await page.request.put("/api/bff/candidate/profile", { data: { summary: "Giới thiệu mới" }, headers: { "X-CSRF-Token": session.csrfToken } })).status()).toBe(200);
    expect((await (await page.request.get("/api/bff/candidate/profile")).json()).desiredIndustries).toEqual(saved.desiredIndustries);
});

test("criteria validates salaries and required fields and fits mobile", async ({ page }, testInfo) => {
    test.setTimeout(120000);
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
    await expect(page.getByText("Đã lưu tiêu chí tìm việc.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "Lương thỏa thuận", exact: true })).toBeChecked();
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
    await expect(page).toHaveURL(/\/candidate\/profile$/, { timeout: 60000 });
    await expect(drawer).toBeHidden();
});

test("load and write errors preserve the form and can be retried", async ({ page }) => {
    test.setTimeout(120000);
    await login(page);
    let failLoad = true;
    await page.route("**/api/bff/candidate/profile", route => failLoad ? route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }) : route.continue());
    await page.goto("/candidate/job-preferences");
    await expect(page.getByText("Không tải được tiêu chí tìm việc", { exact: true })).toBeVisible();
    failLoad = false;
    await page.getByRole("button", { name: "Thử lại", exact: true }).click();
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveValue("Digital marketing");
    await page.unroute("**/api/bff/candidate/profile");
    await page.route("**/api/bff/candidate/profile", route => route.request().method() === "PUT" ? route.fulfill({ status: 422, json: { error: { code: "VALIDATION_FAILED", fieldErrors: [{ field: "desiredJobTitle", code: "VALIDATION_FAILED" }] } } }) : route.continue());
    await page.getByRole("textbox", { name: /Vị trí mong muốn/ }).fill("Giữ nội dung khi lỗi");
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Chưa thể lưu tiêu chí tìm việc", { exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveValue("Giữ nội dung khi lỗi");
    await page.unroute("**/api/bff/candidate/profile");
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Đã lưu tiêu chí tìm việc.", { exact: true })).toBeVisible();
});

test("a newly registered candidate has no sample job preferences", async ({ page }) => {
    const registration = await page.request.post("/api/bff/auth/register", { data: { email: `empty-preferences-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên mới", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(registration.status()).toBe(201);
    await page.goto("/candidate/job-preferences");
    await expect(page.getByRole("textbox", { name: /Vị trí mong muốn/ })).toHaveValue("");
    await expect(page.getByRole("textbox", { name: "Lương tối thiểu", exact: true })).toHaveValue("");
    await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByText("Vui lòng chọn ít nhất một ngành nghề.", { exact: true })).toBeVisible();
});

test("job criteria requires a candidate session", async ({ page }) => {
    await page.goto("/candidate/job-preferences");
    await expect(page).toHaveURL(/\/login$/);
});
