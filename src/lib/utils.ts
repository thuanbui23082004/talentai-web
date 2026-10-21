export { cn } from "cn"

export function formatVND(value: number) {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} VNĐ`;
}

export function formatSalaryRange(salary?: { min?: number; max?: number; negotiable?: boolean; currency?: string }, compact = false) {
    if (!salary || salary.negotiable || (salary.min === undefined && salary.max === undefined)) return "Thỏa thuận";
    if (compact && (!salary.currency || salary.currency === "VND")) {
        const millions = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value / 1_000_000);
        if (salary.min !== undefined && salary.max !== undefined) return `${millions(salary.min)} – ${millions(salary.max)} triệu`;
        return salary.min !== undefined ? `Từ ${millions(salary.min)} triệu` : `Đến ${millions(salary.max!)} triệu`;
    }
    const format = (value: number) => salary.currency && salary.currency !== "VND" ? `${new Intl.NumberFormat("en-US").format(value)} ${salary.currency}` : formatVND(value);
    if (salary.min !== undefined && salary.max !== undefined) return `${format(salary.min)} – ${format(salary.max)}`;
    return salary.min !== undefined ? `Từ ${format(salary.min)}` : `Đến ${format(salary.max!)}`;
}

export function formatDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

export function formatDeadline(value?: string, now = new Date()) {
    if (!value) return "Chưa có hạn nộp";
    const deadline = Date.parse(`${value}T00:00:00Z`);
    if (!Number.isFinite(deadline)) return "Chưa có hạn nộp";
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
    const today = Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day")));
    const days = Math.round((deadline - today) / 86_400_000);
    if (days < 0) return "Đã hết hạn";
    return days === 0 ? "Hết hạn hôm nay" : `Còn ${days} ngày`;
}
