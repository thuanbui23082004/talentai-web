import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function chooseDate(page: Page, form: Locator, label: string, value: string) {
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

