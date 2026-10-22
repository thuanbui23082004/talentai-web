export type CalendarPrecision = "date" | "month" | "year";
export type CalendarDay = { value: string; day: number; inMonth: boolean };

const pad = (value: number) => String(value).padStart(2, "0");
export const calendarMonthValue = (year: number, month: number) => `${year}-${pad(month + 1)}`;

export function todayCalendarValue() {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isCalendarValue(value: string, precision: CalendarPrecision) {
    if (precision === "year") return /^(19|20)\d{2}$/.test(value);
    if (precision === "month") return /^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(value);
    if (!/^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function displayCalendarValue(value: string, precision: CalendarPrecision) {
    if (!isCalendarValue(value, precision)) return "";
    if (precision === "year") return value;
    if (precision === "month") return `${value.slice(5)}/${value.slice(0, 4)}`;
    return `${value.slice(8)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

export function calendarDays(year: number, month: number): CalendarDay[] {
    const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(Date.UTC(year, month, index - offset + 1));
        return { value: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`, day: date.getUTCDate(), inMonth: date.getUTCMonth() === month };
    });
}
