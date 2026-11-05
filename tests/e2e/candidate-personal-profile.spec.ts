import { expect, test } from "@playwright/test";
import { chooseDate } from "../support/choose-profile-date";

test("saves personal details, privacy and introduction and reloads backend values", async ({ page }, testInfo) => {
    const registration = await page.request.post("/api/bff/auth/register", { data: { email: `personal-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên kiểm thử cá nhân", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(registration.status()).toBe(201);
    const csrf = (await registration.json()).csrfToken;
    const career = { headline: "Frontend Engineer", avatarUrl: "https://example.com/avatar.png", desiredJobTitle: "Senior Frontend Engineer", minDesiredSalary: 15000000, maxDesiredSalary: 25000000, desiredLocation: "Đà Nẵng (Hybrid)", yearsOfExperience: 3, jobSearchStatus: "OPEN_TO_OFFERS" };
    expect((await page.request.put("/api/bff/candidate/profile", { data: career, headers: { "X-CSRF-Token": csrf } })).status()).toBe(200);
    await page.goto("/candidate/profile");
    const card = page.getByRole("region", { name: "Thông tin cá nhân", exact: true });
    await card.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
    const form = page.getByRole("dialog", { name: "Chỉnh sửa thông tin cá nhân", exact: true });
    await form.getByLabel("Họ và tên", { exact: false }).fill("Ứng viên cập nhật");
    await expect(form.getByLabel("Tiêu đề nghề nghiệp", { exact: true })).toHaveCount(0);
    await expect(form.getByLabel("Đường dẫn ảnh đại diện", { exact: true })).toHaveCount(0);
    await expect(form.getByText("Thông tin nghề nghiệp", { exact: true })).toHaveCount(0);
    await form.getByRole("button", { name: "Tỉnh/thành phố, phường/xã", exact: true }).click();
    const locations = page.getByRole("dialog", { name: "Chọn địa điểm làm việc", exact: true });
    await locations.getByRole("button", { name: "Đà Nẵng", exact: true }).click();
    await locations.getByRole("button", { name: "Phường Hải Châu", exact: true }).click();
    await locations.getByRole("button", { name: "Chọn địa điểm", exact: true }).click();
    await expect(locations).toBeHidden();
    await chooseDate(page, form, "Ngày sinh", "1998-08-10");
    await form.getByLabel("Giới tính", { exact: true }).selectOption("MALE");
    await form.getByRole("checkbox", { name: "Cho phép nhà tuyển dụng tìm thấy hồ sơ", exact: true }).uncheck();
    await form.getByRole("checkbox", { name: "Hiển thị email với nhà tuyển dụng", exact: true }).check();
    await form.getByRole("checkbox", { name: "Hiển thị số điện thoại với nhà tuyển dụng", exact: true }).uncheck();

    await page.route("**/api/bff/candidate/profile", route => route.request().method() === "PUT" ? route.fulfill({ status: 422, json: { error: { code: "VALIDATION_FAILED", fieldErrors: [{ field: "dob", code: "VALIDATION_FAILED" }] } } }) : route.continue());
    await form.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(form.getByText("Chưa thể lưu hồ sơ", { exact: true })).toBeVisible();
    await expect(form.getByLabel("Ngày sinh", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await page.unroute("**/api/bff/candidate/profile");
    await form.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(form).toBeHidden();
    const saved = await (await page.request.get("/api/bff/candidate/profile")).json();
    expect(saved).toMatchObject({ ...career, fullName: "Ứng viên cập nhật", address: "Phường Hải Châu, Đà Nẵng", location: "Đà Nẵng", dob: "1998-08-10T00:00:00Z", gender: "MALE", searchable: false, showEmail: true, showPhone: false });
    if (process.env.PROFILE_REAL_E2E === "1") {
        const access = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
        const upstream = await page.request.get("http://localhost:3002/api/v1/candidate/profile", { headers: { Authorization: `Bearer ${access}` } });
        expect(upstream.status()).toBe(200);
        expect((await upstream.json()).data).toMatchObject({ address: saved.address, dob: saved.dob, privacy: { isSearchable: false, showEmail: true, showPhone: false } });
    }
    const intro = page.getByRole("region", { name: "Giới thiệu bản thân", exact: true });
    await intro.getByRole("button", { name: "Thêm", exact: true }).click();
    const introForm = page.getByRole("dialog", { name: "Giới thiệu bản thân", exact: true });
    await introForm.getByRole("textbox", { name: /Giới thiệu bản thân/ }).fill("Kỹ sư frontend yêu thích sản phẩm dễ sử dụng.");
    await introForm.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(introForm).toBeHidden();
    await page.reload();
    await expect(card.getByText("Phường Hải Châu, Đà Nẵng", { exact: true })).toBeVisible();
    await expect(card.getByText("10/08/1998", { exact: true })).toBeVisible();
    await expect(card.getByText("Frontend Engineer", { exact: true })).toBeVisible();
    await expect(intro.getByText("Kỹ sư frontend yêu thích sản phẩm dễ sử dụng.", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
    await expect(form.getByRole("button", { name: "Tỉnh/thành phố, phường/xã", exact: true })).toHaveText("Phường Hải Châu, Đà Nẵng");
    await form.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(form).toBeHidden();
    expect((await (await page.request.get("/api/bff/candidate/profile")).json()).address).toBe(saved.address);
    await card.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
    await expect(form.getByRole("checkbox", { name: "Hiển thị email với nhà tuyển dụng", exact: true })).toBeChecked();
    await expect(form.getByRole("checkbox", { name: "Cho phép nhà tuyển dụng tìm thấy hồ sơ", exact: true })).not.toBeChecked();
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(form.getByRole("button", { name: "Lưu thông tin", exact: true })).toBeInViewport();
        await page.screenshot({ path: testInfo.outputPath(`personal-form-${width}.png`) });
        await form.getByRole("button", { name: "Tỉnh/thành phố, phường/xã", exact: true }).click();
        await expect(locations.getByRole("button", { name: "Phường Hải Châu", exact: true })).toHaveAttribute("aria-pressed", "true");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`personal-location-${width}.png`) });
        await locations.getByRole("button", { name: "Đóng hộp thoại", exact: true }).click();
        await expect(form).toBeVisible();
    }
});
