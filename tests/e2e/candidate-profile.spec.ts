import { test, expect, type Locator, type Page } from "@playwright/test";

async function loginCandidate(page: Page) {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("candidate@example.com");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("TalentAI123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/dashboard$/);
}

async function chooseDate(page: Page, form: Locator, label: string, value: string) {
    const precision = value.length === 4 ? "year" : value.length === 7 ? "month" : "date";
    await form.getByLabel(label, { exact: false }).click();
    const picker = page.getByRole("dialog", { name: precision === "year" ? "Chọn năm" : precision === "month" ? "Chọn tháng" : "Chọn ngày", exact: true });
    if (precision === "date") await picker.getByRole("button", { name: "Chọn tháng và năm", exact: true }).click();
    if (precision !== "year") await picker.getByRole("button", { name: "Chọn năm", exact: true }).click();
    const year = Number(value.slice(0, 4));
    const target = picker.getByRole("button", { name: `Năm ${year}`, exact: true });
    for (let attempt = 0; attempt < 18 && !(await target.count()); attempt++) {
        const first = await picker.getByRole("group", { name: "Danh sách năm", exact: true }).getByRole("button").first().textContent();
        await picker.getByRole("button", { name: year < Number(first) ? "12 năm trước" : "12 năm sau", exact: true }).click();
    }
    await target.click();
    if (precision !== "year") await picker.getByRole("button", { name: `Tháng ${Number(value.slice(5, 7))}`, exact: true }).click();
    if (precision === "date") await picker.getByRole("button", { name: `${value.slice(8)}/${value.slice(5, 7)}/${year}`, exact: true }).click();
    await expect(picker).toBeHidden();
}

test("candidate profile follows the reference layout and uses fixed recommendations", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginCandidate(page);
    const menu = page.getByRole("navigation", { name: "Menu ứng viên", exact: true });
    await menu.locator("summary").filter({ hasText: "Hồ sơ việc làm" }).click();
    await menu.getByRole("link", { name: "Hồ sơ của tôi", exact: true }).click();
    await expect(page).toHaveURL(/\/candidate\/profile$/);
    await expect(page.getByRole("heading", { name: "Hồ sơ của tôi", exact: true })).toBeVisible();
    await expect(page.locator("#candidate-content").getByText("candidate@example.com", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Việc làm gợi ý cho bạn", exact: true }).getByRole("article")).toHaveCount(6);
    await expect(page.getByText("Danh sách gợi ý cố định", { exact: true })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "cv-nguyen-minh-anh.pdf", mimeType: "application/pdf", buffer: Buffer.from("mock pdf") });
    await expect(page.getByText("Đã chọn cv-nguyen-minh-anh.pdf", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Chỉnh sửa thông tin cá nhân", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath("candidate-profile-desktop.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("candidate profile stacks cleanly on mobile", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await loginCandidate(page);
    await page.goto("/candidate/profile");
    await expect(page.getByRole("heading", { name: "Hồ sơ của tôi", exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Việc làm gợi ý cho bạn", exact: true }).getByRole("article")).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("candidate-profile-mobile.png"), fullPage: true });
});

test("candidate profile redirects anonymous users", async ({ page }) => {
    await page.goto("/candidate/profile");
    await expect(page).toHaveURL(/\/login$/);
});

test("profile forms validate dates, save previews, edit and cancel changes", async ({ page }) => {
    await loginCandidate(page);
    await page.goto("/candidate/profile");
    await page.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
    const personal = page.getByRole("dialog", { name: "Chỉnh sửa thông tin cá nhân", exact: true });
    await personal.getByLabel("Địa chỉ hiện tại", { exact: true }).fill("Đà Nẵng");
    await chooseDate(page, personal, "Ngày sinh", "1998-08-10");
    await personal.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(page.getByRole("region", { name: "Thông tin cá nhân", exact: true }).getByText("Đà Nẵng", { exact: true })).toBeVisible();
    const experience = page.getByRole("region", { name: "Kinh nghiệm làm việc", exact: true });
    await experience.getByRole("button", { name: "Thêm", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "Kinh nghiệm làm việc", exact: true });
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog.getByText("Vui lòng nhập tên công ty.", { exact: true })).toBeVisible();
    await dialog.getByLabel("Tên công ty", { exact: false }).fill("Công ty Sao Việt");
    await dialog.getByLabel("Vị trí công việc", { exact: false }).fill("Frontend Engineer");
    await chooseDate(page, dialog, "Thời gian bắt đầu", "2022-01");
    await chooseDate(page, dialog, "Thời gian kết thúc", "2021-01");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog.getByText("Thời gian kết thúc phải từ thời gian bắt đầu trở đi.", { exact: true })).toBeVisible();
    await dialog.getByRole("checkbox", { name: "Tôi đang làm việc ở đây", exact: true }).check();
    await expect(dialog.getByLabel("Thời gian kết thúc", { exact: false })).toBeDisabled();
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(experience.getByText("Frontend Engineer", { exact: true })).toBeVisible();
    await expect(experience.getByText(/01\/2022 – Hiện tại/)).toBeVisible();
    await experience.getByRole("button", { name: "Chỉnh sửa Frontend Engineer", exact: true }).click();
    await dialog.getByLabel("Vị trí công việc", { exact: false }).fill("Thay đổi chưa lưu");
    await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(experience.getByText("Frontend Engineer", { exact: true })).toBeVisible();
    await expect(experience.getByText("Thay đổi chưa lưu", { exact: true })).toHaveCount(0);

    const intro = page.getByRole("region", { name: "Giới thiệu bản thân", exact: true });
    await intro.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Giới thiệu bản thân", exact: true });
    await dialog.getByRole("textbox", { name: /Giới thiệu bản thân/ }).fill("Lập trình viên React với 3 năm kinh nghiệm.");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(intro.getByText("Lập trình viên React với 3 năm kinh nghiệm.", { exact: true })).toBeVisible();
    await intro.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await expect(dialog.getByRole("textbox", { name: /Giới thiệu bản thân/ })).toHaveValue("Lập trình viên React với 3 năm kinh nghiệm.");
    await page.keyboard.press("Escape");

    const education = page.getByRole("region", { name: "Học vấn", exact: true });
    await education.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Học vấn", exact: true });
    await dialog.getByLabel("Tên trường", { exact: false }).fill("Đại học Bách khoa");
    await chooseDate(page, dialog, "Năm bắt đầu", "2018");
    await chooseDate(page, dialog, "Năm kết thúc", "2022");
    await dialog.getByLabel("Bằng cấp", { exact: true }).selectOption("Đại học");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(education.getByText("Đại học Bách khoa", { exact: true })).toBeVisible();

    const projects = page.getByRole("region", { name: "Dự án/thành tựu", exact: true });
    await projects.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Dự án/thành tựu", exact: true });
    await dialog.getByLabel("Tên dự án/thành tựu", { exact: false }).fill("Ứng dụng tìm việc");
    await chooseDate(page, dialog, "Thời gian bắt đầu", "2024-01");
    await chooseDate(page, dialog, "Thời gian kết thúc", "2024-06");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(projects.getByText("Ứng dụng tìm việc", { exact: true })).toBeVisible();
});

test("skills, languages and certificate image forms support selection and validation", async ({ page }) => {
    await loginCandidate(page);
    await page.goto("/candidate/profile");
    const skills = page.getByRole("region", { name: "Kỹ năng", exact: true });
    await skills.getByRole("button", { name: "Thêm", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "Kỹ năng", exact: true });
    await dialog.getByRole("checkbox", { name: "React", exact: true }).check();
    await dialog.getByRole("textbox", { name: /Kỹ năng/ }).fill("Thiết kế hệ thống");
    await dialog.getByRole("button", { name: "Thêm mới: Thiết kế hệ thống", exact: true }).click();
    await expect(dialog.getByText("Đã chọn 2/20", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(skills.getByText("React", { exact: true })).toBeVisible();
    await expect(skills.getByText("Thiết kế hệ thống", { exact: true })).toBeVisible();

    const languages = page.getByRole("region", { name: "Ngoại ngữ", exact: true });
    await languages.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Ngoại ngữ", exact: true });
    await dialog.getByRole("combobox", { name: /Tên ngoại ngữ/ }).selectOption("Tiếng Anh");
    await dialog.getByRole("radio", { name: "Cao cấp", exact: true }).check();
    await dialog.getByRole("button", { name: "Thêm ngoại ngữ", exact: true }).click();
    await dialog.getByRole("combobox", { name: /Tên ngoại ngữ/ }).nth(1).selectOption("Tiếng Anh");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(dialog.getByText("Ngoại ngữ này đã được chọn.", { exact: true })).toBeVisible();
    await dialog.getByRole("combobox", { name: /Tên ngoại ngữ/ }).nth(1).selectOption("Tiếng Nhật");
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(languages.getByText("Tiếng Anh", { exact: false })).toBeVisible();
    await expect(languages.getByText("Tiếng Nhật", { exact: false })).toBeVisible();

    const certificates = page.getByRole("region", { name: "Chứng chỉ/bằng cấp", exact: true });
    await certificates.getByRole("button", { name: "Thêm", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Chứng chỉ/bằng cấp", exact: true });
    await dialog.getByLabel("Tên chứng chỉ", { exact: false }).fill("Chứng chỉ lập trình React");
    await dialog.getByLabel("Ảnh chứng chỉ", { exact: true }).setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
    await expect(dialog.getByText("Vui lòng chọn ảnh PNG, JPG hoặc JPEG.", { exact: true })).toBeVisible();
    await dialog.getByLabel("Ảnh chứng chỉ", { exact: true }).setInputFiles({ name: "certificate.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
    await expect(dialog.getByRole("img", { name: "Ảnh chứng chỉ đã chọn", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
    await expect(certificates.getByText("Chứng chỉ lập trình React", { exact: true })).toBeVisible();
});

test("all profile popups fit desktop and mobile with fixed save actions", async ({ page }, testInfo) => {
    await loginCandidate(page);
    await page.goto("/candidate/profile");
    const titles = ["Giới thiệu bản thân", "Kinh nghiệm làm việc", "Học vấn", "Kỹ năng", "Dự án/thành tựu", "Chứng chỉ/bằng cấp", "Ngoại ngữ"];
    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: width === 375 ? 640 : 900 });
        for (const [index, title] of titles.entries()) {
            const trigger = page.getByRole("region", { name: title, exact: true }).getByRole("button", { name: "Thêm", exact: true });
            await trigger.click();
            const dialog = page.getByRole("dialog", { name: title, exact: true });
            await expect(dialog.getByRole("button", { name: "Lưu thông tin", exact: true })).toBeInViewport();
            expect(await dialog.evaluate((element) => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight; })).toBe(true);
            await page.screenshot({ path: testInfo.outputPath(`profile-popup-${width}-${index}.png`) });
            await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
            await expect(dialog).toBeHidden();
            await expect(trigger).toBeFocused();
        }
    }
});

test("modern calendar supports keyboard, clearing, leap days and fits mobile", async ({ page }, testInfo) => {
    await loginCandidate(page);
    await page.goto("/candidate/profile");
    await page.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
    const personal = page.getByRole("dialog", { name: "Chỉnh sửa thông tin cá nhân", exact: true });
    await chooseDate(page, personal, "Ngày sinh", "2024-02-29");
    const birthday = personal.getByLabel("Ngày sinh", { exact: true });
    await expect(birthday).toContainText("29/02/2024");
    await birthday.click();
    const picker = page.getByRole("dialog", { name: "Chọn ngày", exact: true });
    const selectedDay = picker.getByRole("button", { name: "29/02/2024", exact: true });
    await expect(selectedDay).toHaveAttribute("aria-pressed", "true");
    await selectedDay.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(picker.getByRole("button", { name: "28/02/2024", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(birthday).toContainText("28/02/2024");
    await birthday.click();
    await picker.getByRole("button", { name: "Xóa lựa chọn", exact: true }).click();
    await expect(birthday).toContainText("Chọn ngày / tháng / năm");
    await birthday.click();
    await page.keyboard.press("Escape");
    await expect(picker).toBeHidden();
    await expect(personal).toBeVisible();
    await expect(birthday).toBeFocused();
    await personal.getByRole("button", { name: "Hủy", exact: true }).click();

    for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: width === 375 ? 640 : 900 });
        await page.getByRole("region", { name: "Kinh nghiệm làm việc", exact: true }).getByRole("button", { name: "Thêm", exact: true }).click();
        const experience = page.getByRole("dialog", { name: "Kinh nghiệm làm việc", exact: true });
        await experience.getByLabel("Thời gian bắt đầu", { exact: false }).click();
        const months = page.getByRole("dialog", { name: "Chọn tháng", exact: true });
        await expect(months.getByRole("button", { name: "Tháng 1", exact: true })).toBeVisible();
        expect(await months.evaluate((element) => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight; })).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`modern-month-picker-${width}.png`) });
        await months.getByRole("button", { name: "Chọn năm", exact: true }).click();
        await expect(months.getByRole("group", { name: "Danh sách năm", exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath(`modern-year-picker-${width}.png`) });
        await page.keyboard.press("Escape");
        await experience.getByRole("button", { name: "Hủy", exact: true }).click();
        await page.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
        await personal.getByLabel("Ngày sinh", { exact: true }).click();
        await expect(picker.getByRole("group", { name: "Danh sách ngày", exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath(`modern-day-picker-${width}.png`) });
        await page.keyboard.press("Escape");
        await personal.getByRole("button", { name: "Hủy", exact: true }).click();
    }
});
