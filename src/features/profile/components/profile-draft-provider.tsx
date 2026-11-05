"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "@/features/auth";
import { emptyProfileDraft, type ProfileDraftEntry, type ProfileDraftValues, type ProfileEditorSection } from "../schemas/profile-editor";
import { careerToEntries, isCareerSection } from "../career-mapping";
import { useCareerActions, useCareerProfile } from "../hooks/use-career-profile";

type DraftContext = {
    entries: Partial<Record<ProfileEditorSection, ProfileDraftEntry[]>>;
    personalDefaults: ProfileDraftValues;
    save: (values: ProfileDraftValues, id?: string) => Promise<void>;
    remove: (section: ProfileEditorSection, id: string) => Promise<void>;
    busy: boolean;
    isPending: boolean;
    isError: boolean;
    reload: () => void;
};
const ProfileDraftContext = createContext<DraftContext | null>(null);

export function ProfileDraftProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
    const [localEntries, setEntries] = useState<DraftContext["entries"]>({});
    const query = useCareerProfile(user.id);
    const actions = useCareerActions(user.id);
    const entries = { ...localEntries, ...careerToEntries(query.data) };
    const personalDefaults = { ...emptyProfileDraft("personal"), name: user.fullName, email: user.email, phone: user.phone ?? "" };
    const save = async (values: ProfileDraftValues, id?: string) => {
        if (isCareerSection(values.section)) {
            await actions.save.mutateAsync({ values, id });
            return;
        }
        const entry = { id: id ?? crypto.randomUUID(), values };
        setEntries((previous) => {
            const existing = previous[values.section] ?? [];
            const singleton = ["personal", "introduction", "skills", "languages"].includes(values.section);
            const next = singleton ? [entry] : id ? existing.map((item) => item.id === id ? entry : item) : [...existing, entry];
            return { ...previous, [values.section]: next };
        });
    };
    const value: DraftContext = {
        entries, personalDefaults, save,
        remove: async (section, id) => { await actions.remove.mutateAsync({ section, id }); },
        busy: actions.save.isPending || actions.remove.isPending,
        isPending: query.isPending,
        isError: query.isError,
        reload: () => { void query.refetch(); },
    };
    return <ProfileDraftContext.Provider value={value}>{children}</ProfileDraftContext.Provider>;
}

export function useProfileDraft() {
    const value = useContext(ProfileDraftContext);
    if (!value) throw new Error("ProfileDraftProvider is required");
    return value;
}
