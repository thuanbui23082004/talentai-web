import { expect, test } from "@playwright/test";

test("adds a certificate file, retries without duplicating its name and reloads the attachment", async ({ page }, testInfo) => {
    test.setTimeout(120000);
    const registration = await page.request.post("/api/bff/auth/register", { data: { email: `certificate-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên chứng chỉ", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(registration.status()).toBe(201);
    await page.goto("/candidate/profile");
    const section = page.getByRole("region", { name: "Chứng chỉ/bằng cấp", exact: true });
    await section.getByRole("button", { name: "Thêm", exact: true }).click();
    const form = page.getByRole("dialog", { name: "Chứng chỉ/bằng cấp", exact: true });
    await expect(form.getByLabel("Tổ chức cấp", { exact: true })).toHaveCount(0);
    await expect(form.getByLabel("Ngày cấp", { exact: true })).toHaveCount(0);
    await form.getByRole("button", { name: "Lưu chứng chỉ", exact: true }).click();
    await expect(form.getByText("Vui lòng nhập tên chứng chỉ.", { exact: true })).toBeVisible();
    await expect(form.getByText("Vui lòng chọn file chứng chỉ.", { exact: true })).toBeVisible();
    await form.getByLabel("Tên chứng chỉ", { exact: false }).fill("Chứng chỉ kiểm thử file");
    await form.getByLabel("File chứng chỉ", { exact: false }).setInputFiles("public/logo/image 1.png");
    let creates = 0;
    let rejectUpload = true;
    await page.route("**/api/bff/candidate/certificates", route => {
        if (route.request().method() === "POST") creates++;
        return route.continue();
    });
    await page.route("**/api/bff/candidate/certificates/*/attachment", route => rejectUpload ? route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }) : route.continue());
    await form.getByRole("button", { name: "Lưu chứng chỉ", exact: true }).click();
    await expect(form.getByText("Chưa thể lưu chứng chỉ", { exact: true })).toBeVisible();
    await expect(form.getByLabel("Tên chứng chỉ", { exact: false })).toBeDisabled();
    expect(creates).toBe(1);
    rejectUpload = false;
    await form.getByRole("button", { name: "Tải file chứng chỉ", exact: true }).click();
    await expect(form).toBeHidden({ timeout: 45000 });
    expect(creates).toBe(1);
    await page.reload();
    await expect(section.getByText("Chứng chỉ kiểm thử file", { exact: true })).toBeVisible();
    const saved = (await (await page.request.get("/api/bff/candidate/certificates")).json())[0];
    expect(saved).toMatchObject({ name: "Chứng chỉ kiểm thử file", attachmentFileName: "image_1.png", attachmentContentType: "image/png" });
    await expect(section.getByRole("link", { name: saved.attachmentFileName, exact: true })).toHaveAttribute("href", saved.attachmentUrl);
    if (process.env.PROFILE_REAL_E2E === "1") {
        const access = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
        const native = await page.request.get("http://localhost:3002/api/v1/candidate/certificates", { headers: { Authorization: `Bearer ${access}` } });
        expect((await native.json()).data.items[0]).toMatchObject({ id: saved.id, attachmentUrl: saved.attachmentUrl });
    } else {
        expect((await page.request.get(saved.attachmentUrl)).status()).toBe(200);
    }
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await section.getByRole("button", { name: "Thêm", exact: true }).click();
        await expect(form.getByRole("button", { name: "Lưu chứng chỉ", exact: true })).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`certificate-upload-${width}.png`) });
        await form.getByRole("button", { name: "Hủy", exact: true }).click();
    }
    await section.getByRole("button", { name: "Xóa Chứng chỉ kiểm thử file", exact: true }).click();
    await page.getByRole("dialog", { name: "Xóa mục hồ sơ", exact: true }).getByRole("button", { name: "Xóa thông tin", exact: true }).click();
    await expect(section.getByRole("article")).toHaveCount(0);
});
