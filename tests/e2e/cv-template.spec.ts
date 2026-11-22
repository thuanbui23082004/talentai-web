import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("chọn mẫu, điền hồ sơ, lưu JSON và tải PDF", async ({ page }, testInfo) => {
    const registration = await page.request.post("/api/bff/auth/register", {
        data: {
            email: `cv-template-${crypto.randomUUID()}@example.com`,
            password: "TalentAI123!",
            fullName: "Ứng viên mẫu CV",
            role: "candidate",
            acceptedPrivacyPolicy: true,
        },
    });
    test.skip(registration.status() === 503, "Auth backend chưa sẵn sàng trong môi trường kiểm thử.");
    expect(registration.status()).toBe(201);

    await page.goto("/candidate/cv");
    await page.getByRole("button", { name: /Dùng mẫu/ }).first().click();
    await expect(page.getByText("Chỉnh sửa CV", { exact: true })).toBeVisible();
    const fullName = page.getByRole("textbox", { name: "Họ tên" });
    await expect(fullName).toHaveValue("Ứng viên mẫu CV");
    await fullName.fill("Nguyễn Văn Mẫu");
    await page.getByRole("button", { name: "Chọn màu #1BAEE6" }).click();
    await page.getByRole("button", { name: "bg-03" }).click();

    const response = page.waitForResponse(result => result.url().endsWith("/api/bff/cv") && result.request().method() === "POST");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    expect((await response).status()).toBe(201);
    const payload = await (await response).json();
    expect(payload).toMatchObject({ templateId: "modern-1", theme: { primaryColor: "#1BAEE6", backgroundId: "bg-03" }, data: { basics: { fullName: "Nguyễn Văn Mẫu" } } });

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Tải PDF" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^CV_Nguyen_Van_Mau_\d{4}-\d{2}-\d{2}\.pdf$/);
    const pdfPath = testInfo.outputPath("cv-template.pdf");
    await file.saveAs(pdfPath);
    const pdf = await readFile(pdfPath);
    expect(pdf.length).toBeGreaterThan(10_000);
    expect(pdf.toString("latin1")).toContain("/Subtype /Image");
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(1);
});
