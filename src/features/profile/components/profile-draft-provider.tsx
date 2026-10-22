"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "@/features/auth";
import { emptyProfileDraft, type ProfileDraftEntry, type ProfileDraftValues, type ProfileEditorSection } from "../schemas/profile-editor";

type DraftContext = {
    entries: Partial<Record<ProfileEditorSection, ProfileDraftEntry[]>>;
    personalDefaults: ProfileDraftValues;
    save: (values: ProfileDraftValues, id?: string) => void;
};
const ProfileDraftContext = createContext<DraftContext | null>(null);

export function ProfileDraftProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
    const [entries, setEntries] = useState<DraftContext["entries"]>({});
    const personalDefaults = { ...emptyProfileDraft("personal"), name: user.fullName, email: user.email, phone: user.phone ?? "" };
    const save = (values: ProfileDraftValues, id?: string) => {
        const entry = { id: id ?? crypto.randomUUID(), values };
        setEntries((previous) => {
            const existing = previous[values.section] ?? [];
            const singleton = ["personal", "introduction", "skills", "languages"].includes(values.section);
            const next = singleton ? [entry] : id ? existing.map((item) => item.id === id ? entry : item) : [...existing, entry];
            return { ...previous, [values.section]: next };
        });
    };
    return <ProfileDraftContext.Provider value={{ entries, personalDefaults, save }}>{children}</ProfileDraftContext.Provider>;
}

export function useProfileDraft() {
    const value = useContext(ProfileDraftContext);
    if (!value) throw new Error("ProfileDraftProvider is required");
    return value;
}
