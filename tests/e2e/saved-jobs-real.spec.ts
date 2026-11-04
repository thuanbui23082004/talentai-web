import { expect, test } from "@playwright/test";

test.skip(process.env.JOB_REAL_E2E !== "1", "Requires local auth and job-posting services");

test("saves, lists and removes real jobs with persistence and account isolation", async ({ page, browser }, testInfo) => {
    test.setTimeout(120000);
    expect((await page.request.get("/api/bff/candidate/saved-jobs")).status()).toBe(401);
    const jobs = await page.request.get("/api/bff/jobs?pageSize=1");
    expect(jobs.status()).toBe(200);
    const job = (await jobs.json()).items[0];
    expect(job, "A public job is required to exercise saving").toBeTruthy();
    const email = `saved-real-${crypto.randomUUID()}@example.com`;
    const password = "TalentAI123!";
    const registration = await page.request.post("/api/bff/auth/register", { data: { fullName: "Ứng viên kiểm thử lưu việc", email, password, role: "candidate", acceptedPrivacyPolicy: true } });
    expect(registration.status()).toBe(201);
    await page.goto("/candidate/saved-jobs");
    await expect(page.getByRole("heading", { name: "Chưa có việc làm đã lưu" })).toBeVisible();
    await page.goto(`/jobs/${job.id}`);
    await page.getByRole("button", { name: `Lưu ${job.title}`, exact: true }).click();
    await expect(page.getByRole("button", { name: `Bỏ lưu ${job.title}`, exact: true })).toHaveAttribute("aria-pressed", "true");
    const csrf = await (await page.request.get("/api/bff/auth/csrf")).json();
    // Saving twice keeps one entry, as required by the browser contract.
    const duplicate = await page.request.put(`/api/bff/candidate/saved-jobs/${job.id}`, { headers: { "X-CSRF-Token": csrf.csrfToken } });
    expect(duplicate.status()).toBe(200);
    expect(await duplicate.json()).toEqual({ jobPostId: job.id, saved: true });
    const access = (await page.context().cookies()).find(cookie => cookie.name === "access_token")!.value;
    async function nativeList() {
        const response = await page.request.get("http://localhost:3004/api/v1/saved-jobs?page=0&size=100", { headers: { Authorization: `Bearer ${access}` } });
        expect(response.status()).toBe(200);
        return (await response.json()).data;
    }
    expect((await nativeList()).items.map((item: { job: { jobPostId: string } }) => item.job.jobPostId)).toEqual([job.id]);
    await page.goto("/candidate/saved-jobs");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article")).toContainText(job.title);
    await page.reload();
    await expect(page.locator("main article")).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath("real-saved-jobs-desktop.png"), fullPage: true });

    const other = await browser.newContext({ baseURL: "http://127.0.0.1:3100" });
    try {
        const response = await other.request.post("/api/bff/auth/register", { data: { fullName: "Ứng viên kiểm thử khác", email: `saved-other-${crypto.randomUUID()}@example.com`, password, role: "candidate", acceptedPrivacyPolicy: true } });
        expect(response.status()).toBe(201);
        const ownList = await other.request.get("/api/bff/candidate/saved-jobs");
        expect(ownList.status()).toBe(200);
        expect((await ownList.json()).items).toEqual([]);
    } finally { await other.close(); }

    await page.route("**/api/bff/candidate/saved-jobs/*", route => route.request().method() === "DELETE" ? route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } }) : route.continue());
    await page.getByRole("button", { name: `Bỏ lưu ${job.title}`, exact: true }).click();
    await expect(page.getByRole("heading", { name: "Chưa thể cập nhật việc làm đã lưu", exact: true })).toBeVisible();
    await expect(page.locator("main article")).toHaveCount(1);
    expect((await nativeList()).totalElements).toBe(1);
    await page.unroute("**/api/bff/candidate/saved-jobs/*");
    await page.getByRole("button", { name: `Bỏ lưu ${job.title}`, exact: true }).click();
    await expect(page.getByRole("heading", { name: "Chưa có việc làm đã lưu" })).toBeVisible();
    expect((await nativeList()).totalElements).toBe(0);
    await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
    await expect(page.locator("main article")).toHaveCount(1);
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("real-saved-jobs-mobile.png"), fullPage: true });
    await page.getByRole("button", { name: `Bỏ lưu ${job.title}`, exact: true }).click();
    await expect(page.getByRole("heading", { name: "Chưa có việc làm đã lưu" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Chưa có việc làm đã lưu" })).toBeVisible();
});
