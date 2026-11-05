import { expect, test } from "@playwright/test";
import { chooseDate } from "../support/choose-profile-date";

test.skip(process.env.PROFILE_REAL_E2E !== "1", "Requires local auth and candidate-profile services");

test("persists career profile edits, skills and certificates through the real backend", async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    expect((await page.request.get("/api/bff/candidate/experience")).status()).toBe(401);
    const response = await page.request.post("/api/bff/auth/register", { data: { email: `career-real-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên kiểm thử hồ sơ", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(response.status()).toBe(201);
    const access = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
    async function native(resource: string) {
        const response = await page.request.get(`http://localhost:3002/api/v1/candidate/${resource}`, { headers: { Authorization: `Bearer ${access}` } });
        expect(response.status()).toBe(200);
        return (await response.json()).data;
    }
    await page.goto("/candidate/profile");
    const experience = page.getByRole("region", { name: "Kinh nghiệm làm việc", exact: true });
    const education = page.getByRole("region", { name: "Học vấn", exact: true });
    const skills = page.getByRole("region", { name: "Kỹ năng", exact: true });
    const certificates = page.getByRole("region", { name: "Chứng chỉ/bằng cấp", exact: true });
    await expect(experience.getByRole("button", { name: "Thêm", exact: true })).toBeEnabled();
    expect((await native("experience")).items).toEqual([]);
    await experience.getByRole("button", { name: "Thêm", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "Kinh nghiệm làm việc", exact: true });
    await dialog.getByLabel("Tên công ty", { exact: false }).fill("Công ty kiểm thử hồ sơ");
    await dialog.getByLabel("Vị trí công việc", { exact: false }).fill("Backend Engineer");
    await dialog.getByLabel("Địa điểm làm việc", { exact: true }).fill("Đà Nẵng (Hybrid)");
    await chooseDate(page, dialog, "Thời gian bắt đầu", "2022-01-15");
    await dialog.getByRole("checkbox", { name: "Tôi đang làm việc ở đây" }).check();
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    const savedExperience = (await native("experience")).items[0];
    expect(savedExperience).toMatchObject({ company: "Công ty kiểm thử hồ sơ", title: "Backend Engineer", location: "Đà Nẵng (Hybrid)", startDate: "2022-01-15T00:00:00Z", endDate: null, current: true });
    await experience.getByRole("button", { name: "Chỉnh sửa Backend Engineer", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Kinh nghiệm làm việc", exact: true });
    await expect(dialog.getByLabel("Địa điểm làm việc", { exact: true })).toHaveValue("Đà Nẵng (Hybrid)");
    await dialog.getByLabel("Vị trí công việc", { exact: false }).fill("Senior Backend Engineer");
    await page.route("**/api/bff/candidate/experience/*", route => route.request().method() === "PUT" ? route.fulfill({ status: 422, json: { error: { code: "VALIDATION_FAILED", fieldErrors: [{ field: "title", code: "VALIDATION_FAILED" }] } } }) : route.continue());
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog.getByText("Chưa thể lưu hồ sơ", { exact: true })).toBeVisible();
    await expect(dialog.getByLabel("Vị trí công việc", { exact: false })).toHaveValue("Senior Backend Engineer");
    await expect(dialog.getByLabel("Vị trí công việc", { exact: false })).toHaveAttribute("aria-invalid", "true");
    await page.unroute("**/api/bff/candidate/experience/*");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    expect((await native("experience")).items[0]).toMatchObject({ id: savedExperience.id, title: "Senior Backend Engineer" });

    await education.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Học vấn", exact: true });
    await dialog.getByLabel("Tên trường", { exact: false }).fill("Đại học kiểm thử");
    await dialog.getByLabel("Bằng cấp", { exact: true }).fill("Kỹ sư Công nghệ thông tin");
    await dialog.getByLabel("Chuyên ngành đào tạo", { exact: true }).fill("Khoa học máy tính");
    await chooseDate(page, dialog, "Thời gian bắt đầu", "2018-09-01");
    await dialog.getByRole("checkbox", { name: "Tôi đang học ở đây" }).check();
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    const savedEducation = (await native("education")).items[0];
    expect(savedEducation).toMatchObject({ degree: "Kỹ sư Công nghệ thông tin", fieldOfStudy: "Khoa học máy tính", startDate: "2018-09-01T00:00:00Z", endDate: null, isStudying: true });
    await education.getByRole("button", { name: "Chỉnh sửa Đại học kiểm thử", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Học vấn", exact: true });
    await expect(dialog.getByLabel("Bằng cấp", { exact: true })).toHaveValue("Kỹ sư Công nghệ thông tin");
    await dialog.getByLabel("Tên trường", { exact: false }).fill("Đại học kiểm thử cập nhật");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    expect((await native("education")).items[0].school).toBe("Đại học kiểm thử cập nhật");

    await skills.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Kỹ năng", exact: true });
    await dialog.getByRole("checkbox", { name: "React", exact: true }).check();
    await dialog.getByRole("checkbox", { name: "TypeScript", exact: true }).check();
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    expect((await native("skills")).skills).toEqual(["React", "TypeScript"]);
    await skills.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Kỹ năng", exact: true });
    await dialog.getByRole("button", { name: "Bỏ kỹ năng React", exact: true }).click();
    await dialog.getByRole("checkbox", { name: "SQL", exact: true }).check();
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    expect((await native("skills")).skills).toEqual(["TypeScript", "SQL"]);

    await certificates.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Chứng chỉ/bằng cấp", exact: true });
    await dialog.getByLabel("Tên chứng chỉ", { exact: false }).fill("Chứng chỉ kiểm thử API");
    await dialog.getByLabel("Tổ chức cấp", { exact: true }).fill("Tổ chức kiểm thử");
    await dialog.getByLabel("Mã chứng chỉ", { exact: true }).fill("TEST-001");
    await dialog.getByLabel("Link xác thực chứng chỉ", { exact: true }).fill("https://example.com/certificate/001");
    await chooseDate(page, dialog, "Ngày cấp", "2024-01-15");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    expect((await native("certificates")).items[0]).toMatchObject({ name: "Chứng chỉ kiểm thử API", issuer: "Tổ chức kiểm thử", credentialId: "TEST-001", credentialUrl: "https://example.com/certificate/001", issuedAt: "2024-01-15T00:00:00Z", expiresAt: null });
    await expect(certificates.getByRole("button", { name: /Chỉnh sửa/ })).toHaveCount(0);
    await expect(certificates.getByRole("link", { name: "Xem chứng chỉ", exact: true })).toHaveAttribute("href", "https://example.com/certificate/001");
    await page.reload();
    await expect(experience.getByText("Senior Backend Engineer", { exact: true })).toBeVisible();
    await expect(education.getByText("Đại học kiểm thử cập nhật", { exact: true })).toBeVisible();
    await expect(skills.getByText("SQL", { exact: true })).toBeVisible();
    await expect(certificates.getByText("Chứng chỉ kiểm thử API", { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: testInfo.outputPath("real-career-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("real-career-mobile.png"), fullPage: true });

    const other = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
    try {
        const registered = await other.request.post("/api/bff/auth/register", { data: { email: `career-other-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên kiểm thử khác", role: "candidate", acceptedPrivacyPolicy: true } });
        expect(registered.status()).toBe(201);
        const csrf = (await registered.json()).csrfToken;
        expect(await (await other.request.get("/api/bff/candidate/experience")).json()).toEqual([]);
        expect((await other.request.delete(`/api/bff/candidate/experience/${savedExperience.id}`, { headers: { "X-CSRF-Token": csrf } })).status()).toBe(404);
    } finally { await other.close(); }

    for (const [region, title] of [[experience, "Senior Backend Engineer"], [education, "Đại học kiểm thử cập nhật"], [certificates, "Chứng chỉ kiểm thử API"]] as const) {
        await region.getByRole("button", { name: `Xóa ${title}`, exact: true }).click();
        const confirmation = page.getByRole("dialog", { name: "Xóa mục hồ sơ", exact: true });
        await confirmation.getByRole("button", { name: "Xóa thông tin", exact: true }).click();
        await expect(confirmation).toBeHidden();
        await expect(region.getByRole("article")).toHaveCount(0);
    }
    expect((await native("experience")).items).toEqual([]);
    expect((await native("education")).items).toEqual([]);
    expect((await native("certificates")).items).toEqual([]);
});
