import { expect, test } from "@playwright/test";
import { pdfCv } from "../support/cv-files";

test("submits the selected account CV once, retains input on errors and prevents duplicates", async ({ page }, testInfo) => {
    test.setTimeout(180000);
    const registered = await page.request.post("/api/bff/auth/register", { data: { email: `submit-${crypto.randomUUID()}@example.com`, password: "TalentAI123!", fullName: "Ứng viên kiểm thử nộp hồ sơ", role: "candidate", acceptedPrivacyPolicy: true } });
    expect(registered.status()).toBe(201);
    const { csrfToken } = await registered.json();
    const uploaded = await page.request.post("/api/bff/cvs", { headers: { "X-CSRF-Token": csrfToken }, multipart: { file: { name: "application-submit.pdf", mimeType: "application/pdf", buffer: pdfCv() } } });
    expect(uploaded.status()).toBe(201);
    const cv = await uploaded.json();
    const jobs = await (await page.request.get("/api/bff/jobs?pageSize=1")).json();
    expect(jobs.items.length).toBe(1);
    const job = jobs.items[0];
    await page.goto(`/jobs/${job.id}`);
    await page.getByRole("button", { name: "Ứng tuyển ngay", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Ứng tuyển", exact: true });
    await expect(dialog.getByRole("radio").first()).toBeChecked();
    await expect(dialog.getByRole("checkbox")).toHaveCount(0);
    await dialog.getByLabel("Thư giới thiệu", { exact: true }).fill("Tôi mong muốn ứng tuyển vị trí này.");
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("application-submit-mobile.png") });
    const send = dialog.getByRole("button", { name: "Nộp hồ sơ ứng tuyển", exact: true });
    await page.route("**/api/bff/applications", route => route.request().method() === "POST" ? route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }) : route.continue());
    await send.click();
    await expect(dialog.getByText("Chưa nộp được hồ sơ", { exact: true })).toBeVisible();
    await expect(dialog.getByLabel("Thư giới thiệu", { exact: true })).toHaveValue("Tôi mong muốn ứng tuyển vị trí này.");
    await page.unroute("**/api/bff/applications");
    let posted = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/bff/applications", async route => {
        if (route.request().method() === "POST") {
            posted++;
            expect(route.request().postDataJSON()).toEqual({ jobId: job.id, resumeId: cv.id, coverLetter: "Tôi mong muốn ứng tuyển vị trí này." });
            await gate;
        }
        await route.continue();
    });
    const result = page.waitForResponse(response => response.url().endsWith("/api/bff/applications") && response.request().method() === "POST");
    await send.click();
    await expect(dialog.getByRole("button", { name: "Đang nộp hồ sơ…", exact: true })).toBeDisabled();
    await dialog.locator("form").dispatchEvent("submit");
    release();
    const response = await result;
    if (response.status() !== 201) await page.request.delete(`/api/bff/cvs/${cv.id}`, { headers: { "X-CSRF-Token": csrfToken } });
    expect(response.status(), await response.text()).toBe(201);
    const application = await response.json();
    await expect(dialog.getByText("Nộp hồ sơ thành công", { exact: true })).toBeVisible();
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`application-success-${width}.png`) });
    }
    expect(posted).toBe(1);
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await expect(page.getByRole("button", { name: "Đã ứng tuyển", exact: true })).toBeDisabled();
    await page.unroute("**/api/bff/applications");
    const duplicate = await page.request.post("/api/bff/applications", { headers: { "X-CSRF-Token": csrfToken }, data: { jobId: job.id, resumeId: cv.id } });
    expect(duplicate.status()).toBe(409);

    if (process.env.APPLICATION_REAL_E2E === "1") {
        const access = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
        const headers = { Authorization: `Bearer ${access}` };
        const detail = await page.request.get(`http://localhost:3005/api/v1/applications/${application.id}`, { headers });
        expect(detail.status()).toBe(200);
        expect((await detail.json()).data).toMatchObject({ jobId: job.id, resumeId: cv.id, status: "submitted", coverLetter: "Tôi mong muốn ứng tuyển vị trí này." });
        const withdrawn = await page.request.post(`http://localhost:3005/api/v1/applications/${application.id}/withdraw`, { headers, data: { version: application.version, reason: "Hoàn tất kiểm thử tích hợp." } });
        expect(withdrawn.status()).toBe(200);
    } else {
        const list = await (await page.request.get("/api/bff/applications")).json();
        expect(list.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: application.id, jobId: job.id, cvId: cv.id })]));
    }
    const removed = await page.request.delete(`/api/bff/cvs/${cv.id}`, { headers: { "X-CSRF-Token": csrfToken } });
    if (removed.status() === 409) testInfo.annotations.push({ type: "cleanup", description: "CV kiểm thử được backend giữ vì đã có bản ghi ứng tuyển." });
    else expect(removed.status()).toBe(204);
});
