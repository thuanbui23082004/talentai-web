"use client";

import { useRef, useState, type KeyboardEvent, type Ref } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { calendarDays, calendarMonthValue, displayCalendarValue, isCalendarValue, todayCalendarValue, type CalendarPrecision } from "@/lib/calendar";
import { cn } from "@/lib/utils";

type DatePickerProps = {
    id?: string; value: string; onValueChange: (value: string) => void; onBlur?: () => void;
    precision?: CalendarPrecision; disabled?: boolean; required?: boolean; max?: string; className?: string;
    ref?: Ref<HTMLButtonElement>;
    "aria-describedby"?: string; "aria-invalid"?: boolean; "aria-label"?: string;
};
const TITLES: Record<CalendarPrecision, string> = { date: "Chọn ngày", month: "Chọn tháng", year: "Chọn năm" };
const PLACEHOLDERS: Record<CalendarPrecision, string> = { date: "Chọn ngày / tháng / năm", month: "Chọn tháng / năm", year: "Chọn năm" };

export function DatePicker({ id, value, onValueChange, onBlur, precision = "date", disabled, required, max, className, ref, ...aria }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const formatted = displayCalendarValue(value, precision);
    return <Popover.Root open={open && !disabled} onOpenChange={(next) => { setOpen(next); if (!next) onBlur?.(); }}>
        <Popover.Trigger ref={ref} id={id} type="button" disabled={disabled} {...aria} aria-required={required || undefined} onBlur={() => { if (!open) onBlur?.(); }} className={cn("ui-input group flex items-center gap-3 text-left hover:border-primary/40 data-popup-open:border-primary data-popup-open:ring-3 data-popup-open:ring-primary/10", className)}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-primary transition-colors group-data-popup-open:bg-primary group-data-popup-open:text-white"><CalendarDays className="size-4" aria-hidden="true" /></span>
            <span className={cn("min-w-0 flex-1 truncate", !formatted && "text-muted-foreground/80")}>{formatted || PLACEHOLDERS[precision]}</span><ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-popup-open:rotate-180" aria-hidden="true" />
        </Popover.Trigger>
        <Popover.Portal><Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={16} className="z-[70]">
            {open && !disabled && <CalendarPanel precision={precision} value={value} max={max} onSelect={(next) => { onValueChange(next); setOpen(false); onBlur?.(); }} />}
        </Popover.Positioner></Popover.Portal>
    </Popover.Root>;
}

function CalendarPanel({ precision, value, max, onSelect }: { precision: CalendarPrecision; value: string; max?: string; onSelect: (value: string) => void }) {
    const today = todayCalendarValue();
    const base = isCalendarValue(value, precision) ? value : today;
    const [year, setYear] = useState(Number(base.slice(0, 4)));
    const [month, setMonth] = useState(Number(base.slice(5, 7) || today.slice(5, 7)) - 1);
    const [view, setView] = useState<"days" | "months" | "years">(precision === "date" ? "days" : precision === "month" ? "months" : "years");
    const [yearPage, setYearPage] = useState(1900 + Math.floor((year - 1900) / 12) * 12);
    const [focused, setFocused] = useState("");
    const gridRef = useRef<HTMLDivElement>(null);
    const within = (candidate: string) => isCalendarValue(candidate, precision) && (!max || candidate <= max);
    const maxYear = max ? Math.min(2099, Number(max.slice(0, 4))) : 2099;
    const changeYear = (next: number) => { setYear(next); setYearPage(1900 + Math.floor((next - 1900) / 12) * 12); setFocused(""); };
    const shift = (direction: number) => {
        setFocused("");
        if (view === "years") setYearPage(yearPage + 12 * direction);
        else if (view === "months") changeYear(year + direction);
        else { const next = new Date(Date.UTC(year, month + direction, 1)); changeYear(next.getUTCFullYear()); setMonth(next.getUTCMonth()); }
    };
    const lower = view === "years" ? yearPage <= 1900 : view === "months" ? year <= 1900 : year === 1900 && month === 0;
    const upper = view === "years" ? yearPage + 11 >= maxYear : view === "months" ? year >= maxYear : calendarMonthValue(year, month) >= (max?.slice(0, 7) ?? "2099-12");
    const keyboard = (event: KeyboardEvent<HTMLDivElement>, columns: number) => {
        const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        const index = buttons.indexOf(event.target as HTMLButtonElement);
        if (index < 0 || (!Object.hasOwn(steps, event.key) && !["Home", "End"].includes(event.key))) return;
        event.preventDefault();
        const next = event.key === "Home" ? Math.floor(index / columns) * columns : event.key === "End" ? Math.min(buttons.length - 1, Math.floor(index / columns) * columns + columns - 1) : index + steps[event.key];
        buttons[Math.max(0, Math.min(buttons.length - 1, next))]?.focus();
    };
    const monthValues = Array.from({ length: 12 }, (_, index) => calendarMonthValue(year, index));
    const yearValues = Array.from({ length: 12 }, (_, index) => String(yearPage + index));
    const days = calendarDays(year, month);
    const cells = view === "years" ? yearValues : view === "months" ? monthValues : days.map((day) => day.value);
    const active = focused || cells.find((cell) => cell === value.slice(0, cell.length)) || cells.find((cell) => cell === today.slice(0, cell.length)) || cells.find((cell) => view !== "days" || cell.slice(0, 7) === calendarMonthValue(year, month)) || cells[0];
    const cellClass = (selected: boolean, current: boolean, muted = false) => cn("relative flex min-h-10 items-center justify-center rounded-xl text-sm transition-colors focus-visible:z-10 disabled:cursor-not-allowed disabled:opacity-25", selected ? "bg-primary font-semibold text-white shadow-button hover:bg-primary-hover" : "hover:bg-secondary hover:text-primary", !selected && current && "bg-secondary/50 font-semibold text-primary ring-1 ring-primary/30", !selected && !current && muted && "text-muted-foreground/50");
    const shortcut = precision === "date" ? today : precision === "month" ? today.slice(0, 7) : today.slice(0, 4);
    const pickMonth = (index: number) => { setMonth(index); setFocused(""); if (precision === "month") onSelect(calendarMonthValue(year, index)); else setView("days"); };
    const pickYear = (next: number) => { changeYear(next); if (precision === "year") onSelect(String(next)); else setView("months"); };
    return <Popover.Popup initialFocus={() => gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]') ?? true} className="max-h-[var(--available-height)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card text-foreground shadow-float outline-none transition-[opacity,transform] data-starting:translate-y-1 data-starting:opacity-0 data-ending:opacity-0">
        <div className="border-b border-border/60 bg-secondary/35 px-4 py-3"><Popover.Title className="text-xs font-medium text-muted-foreground">{TITLES[precision]}</Popover.Title><p className="mt-1 text-base font-semibold text-primary">{displayCalendarValue(value, precision) || (precision === "date" ? "Ngày / Tháng / Năm" : precision === "month" ? "Tháng / Năm" : "Năm học")}</p><Popover.Description className="sr-only">Dùng phím mũi tên để di chuyển, Enter để chọn. Escape để đóng lịch.</Popover.Description></div>
        <div className="p-3">
            <div className="mb-3 flex items-center justify-between gap-2"><button type="button" disabled={lower} aria-label={view === "years" ? "12 năm trước" : view === "months" ? "Năm trước" : "Tháng trước"} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary disabled:opacity-25" onClick={() => shift(-1)}><ChevronLeft className="size-4" /></button>
                {view === "years" ? <p aria-live="polite" className="text-sm font-semibold">{yearPage} – {Math.min(yearPage + 11, 2099)}</p> : <button type="button" aria-label={view === "days" ? "Chọn tháng và năm" : "Chọn năm"} className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-secondary hover:text-primary" onClick={() => { setView(view === "days" ? "months" : "years"); setFocused(""); }}>{view === "days" ? `Tháng ${month + 1}, ${year}` : year}<ChevronDown className="size-3.5" /></button>}
                <button type="button" disabled={upper} aria-label={view === "years" ? "12 năm sau" : view === "months" ? "Năm sau" : "Tháng sau"} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary disabled:opacity-25" onClick={() => shift(1)}><ChevronRight className="size-4" /></button>
            </div>
            {view === "days" && <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground" aria-hidden="true">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day} className="py-1.5">{day}</span>)}</div>}
            <div ref={gridRef} role="group" aria-label={view === "years" ? "Danh sách năm" : view === "months" ? "Danh sách tháng" : "Danh sách ngày"} onKeyDown={(event) => keyboard(event, view === "days" ? 7 : 3)} className={cn("grid gap-1.5", view === "days" ? "grid-cols-7 gap-0.5" : "grid-cols-3")}>
                {view === "years" && yearValues.map((candidate) => <button key={candidate} type="button" aria-label={`Năm ${candidate}`} aria-pressed={value.slice(0, 4) === candidate} disabled={Number(candidate) < 1900 || Number(candidate) > maxYear} tabIndex={candidate === active ? 0 : -1} onFocus={() => setFocused(candidate)} className={cellClass(value.slice(0, 4) === candidate, candidate === today.slice(0, 4))} onClick={() => pickYear(Number(candidate))}>{candidate}</button>)}
                {view === "months" && monthValues.map((candidate, index) => <button key={candidate} type="button" aria-label={`Tháng ${index + 1}`} aria-pressed={value.slice(0, 7) === candidate} disabled={year > maxYear || (!!max && candidate > max.slice(0, 7))} tabIndex={candidate === active ? 0 : -1} onFocus={() => setFocused(candidate)} className={cellClass(value.slice(0, 7) === candidate, candidate === today.slice(0, 7))} onClick={() => pickMonth(index)}>Tháng {index + 1}</button>)}
                {view === "days" && days.map((day) => <button key={day.value} type="button" aria-label={displayCalendarValue(day.value, "date")} aria-pressed={value === day.value} aria-current={today === day.value ? "date" : undefined} disabled={!within(day.value)} tabIndex={day.value === active ? 0 : -1} onFocus={() => setFocused(day.value)} className={cellClass(value === day.value, today === day.value, !day.inMonth)} onClick={() => onSelect(day.value)}>{day.day}</button>)}
            </div>
            {view === "months" && <p className="mt-3 text-center text-[11px] text-muted-foreground">{precision === "date" ? "Chọn tháng để xem ngày" : "Chọn tháng để hoàn tất"}</p>}
            {view === "years" && <p className="mt-3 text-center text-[11px] text-muted-foreground">{precision === "year" ? "Chọn năm để hoàn tất" : "Chọn năm để xem các tháng"}</p>}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2"><button type="button" disabled={!value} onClick={() => onSelect("")} className="min-h-10 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40">Xóa lựa chọn</button><button type="button" disabled={!within(shortcut)} onClick={() => onSelect(shortcut)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-primary hover:bg-secondary disabled:opacity-40"><Check className="size-3.5" />{precision === "date" ? "Hôm nay" : precision === "month" ? "Tháng này" : "Năm nay"}</button></div>
    </Popover.Popup>;
}
