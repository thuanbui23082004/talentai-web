import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarDays, displayCalendarValue, isCalendarValue, todayCalendarValue } from "@/lib/calendar";

afterEach(() => vi.useRealTimers());
describe("calendar values", () => {
    it("validates leap years and rejects impossible or out-of-range dates", () => {
        expect(isCalendarValue("2024-02-29", "date")).toBe(true);
        for (const date of ["2023-02-29", "2024-04-31", "2024-00-10", "2024-13-01", "1899-12-31", "2100-01-01", "2024-01-0"]) expect(isCalendarValue(date, "date")).toBe(false);
        expect(isCalendarValue("2024-12", "month")).toBe(true);
        expect(isCalendarValue("2024-13", "month")).toBe(false);
        expect(isCalendarValue("2024", "year")).toBe(true);
        expect(isCalendarValue("24", "year")).toBe(false);
    });
    it("formats selections without timezone shifts", () => {
        expect(displayCalendarValue("1998-08-10", "date")).toBe("10/08/1998");
        expect(displayCalendarValue("2024-02", "month")).toBe("02/2024");
        expect(displayCalendarValue("2024", "year")).toBe("2024");
        expect(displayCalendarValue("invalid", "date")).toBe("");
    });
    it("builds a Monday-first six-week grid with real adjacent dates", () => {
        const days = calendarDays(2024, 1);
        expect(days).toHaveLength(42);
        expect(days[0]).toEqual({ value: "2024-01-29", day: 29, inMonth: false });
        expect(days.filter((day) => day.inMonth)).toHaveLength(29);
        expect(days.find((day) => day.value === "2024-02-29")?.inMonth).toBe(true);
        expect(new Set(days.map((day) => day.value)).size).toBe(42);
    });
    it("handles year boundaries and the local day in Vietnam", () => {
        expect(calendarDays(2024, 11).some((day) => day.value === "2025-01-01")).toBe(true);
        vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-21T20:00:00Z"));
        expect(todayCalendarValue()).toBe("2026-10-22");
    });
});
