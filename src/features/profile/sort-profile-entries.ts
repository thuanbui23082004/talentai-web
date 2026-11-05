import type { ProfileDraftEntry } from "./schemas/profile-editor";

export function sortProfileEntries(entries: ProfileDraftEntry[]): ProfileDraftEntry[] {
    return [...entries].sort((a, b) => {
        const first = a.values;
        const second = b.values;
        if (first.current !== second.current) return first.current ? -1 : 1;
        if (!first.current) {
            const byEndDate = second.endDate.localeCompare(first.endDate);
            if (byEndDate) return byEndDate;
        }
        return second.startDate.localeCompare(first.startDate);
    });
}
