export { cn } from "cn"

export function formatVND(value: number) {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} VNĐ`;
}

export function formatSalaryRange(salary?: { min?: number; max?: number; negotiable?: boolean; currency?: string }) {
    if (!salary || salary.negotiable || (salary.min === undefined && salary.max === undefined)) return "Thỏa thuận";
    const format = (value: number) => salary.currency && salary.currency !== "VND" ? `${new Intl.NumberFormat("en-US").format(value)} ${salary.currency}` : formatVND(value);
    if (salary.min !== undefined && salary.max !== undefined) return `${format(salary.min)} – ${format(salary.max)}`;
    return salary.min !== undefined ? `Từ ${format(salary.min)}` : `Đến ${format(salary.max!)}`;
}

export function formatDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}
