import type { Application, Interview } from "./types";

export function scheduledInterview(items: Interview[], applicationId: string) {
    return items.filter((item) => item.applicationId === applicationId && item.status === "scheduled" && ["accepted", "pending"].includes(item.invitationStatus))
        .toSorted((a, b) => a.startTime.localeCompare(b.startTime))[0];
}

export function formatInterviewTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

export function applicationProgress(status: Application["status"]) {
    return ({ submitted: 1, reviewing: 2, interview: 3, hired: 4, rejected: 0, withdrawn: 0 })[status];
}

export function interviewCalendar(interview: Interview) {
    const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TalentAI//Interview//VI", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
        `UID:${interview.id}@talentai`, `DTSTAMP:${stamp(interview.updatedAt ?? interview.startTime)}`,
        `DTSTART:${stamp(interview.startTime)}`, `DTEND:${stamp(interview.endTime)}`,
        `SUMMARY:${escape(`Phỏng vấn · ${interview.jobTitle ?? "TalentAI"}`)}`,
        `LOCATION:${escape(interview.mode === "online" ? interview.meetingUrl ?? "Trực tuyến · chờ đường dẫn từ nhà tuyển dụng" : interview.location ?? "Chờ địa điểm từ nhà tuyển dụng")}`,
        `DESCRIPTION:${escape(interview.message ?? "")}`, "END:VEVENT", "END:VCALENDAR"];
    // RFC 5545 folds physical lines at 75 UTF-8 octets, including continuation whitespace.
    return lines.map((line) => {
        const parts: string[] = []; let part = ""; let bytes = 0;
        for (const char of line) {
            const size = new TextEncoder().encode(char).length;
            if (bytes + size > 75) { parts.push(part); part = " "; bytes = 1; }
            part += char; bytes += size;
        }
        return [...parts, part].join("\r\n");
    }).join("\r\n") + "\r\n";
}

export function downloadInterviewCalendar(interview: Interview) {
    const url = URL.createObjectURL(new Blob([interviewCalendar(interview)], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `phong-van-${interview.id}.ics`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
