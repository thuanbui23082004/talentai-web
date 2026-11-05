"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "@/features/auth";
import { emptyProfileDraft, type ProfileDraftEntry, type ProfileDraftValues, type ProfileEditorSection } from "../schemas/profile-editor";
import { careerToEntries, isCareerSection } from "../career-mapping";
import { useCareerActions, useCareerProfile } from "../hooks/use-career-profile";
import { usePersonalProfile, useSavePersonalProfile } from "../hooks/use-personal-profile";
import { personalToDraft } from "../personal-mapping";
import type { ProfileCertificate } from "../types";

type DraftContext = {
    entries: Partial<Record<ProfileEditorSection, ProfileDraftEntry[]>>;
    personalDefaults: ProfileDraftValues;
    save: (values: ProfileDraftValues, id?: string) => Promise<void>;
    remove: (section: ProfileEditorSection, id: string) => Promise<void>;
    createCertificate: (name: string) => Promise<ProfileCertificate>;
    uploadCertificate: (id: string, file: File) => Promise<ProfileCertificate>;
    busy: boolean;
    isPending: boolean;
    isError: boolean;
    reload: () => void;
    personalPending: boolean;
    personalError: boolean;
    reloadPersonal: () => void;
};
const ProfileDraftContext = createContext<DraftContext | null>(null);

export function ProfileDraftProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
    const [localEntries, setEntries] = useState<DraftContext["entries"]>({});
    const query = useCareerProfile(user.id);
    const actions = useCareerActions(user.id);
    const personal = usePersonalProfile(user.id);
    const savePersonal = useSavePersonalProfile(user.id);
    const entries = { ...localEntries, ...careerToEntries(query.data) };
    if (personal.data) {
        entries.personal = [{ id: "personal", values: personalToDraft(personal.data) }];
        entries.introduction = personal.data.summary ? [{ id: "introduction", values: { ...emptyProfileDraft("introduction"), description: personal.data.summary } }] : [];
    }
    const personalDefaults = { ...emptyProfileDraft("personal"), name: user.fullName, email: user.email, phone: user.phone ?? "" };
    const save = async (values: ProfileDraftValues, id?: string) => {
        if (values.section === "personal" || values.section === "introduction") {
            await savePersonal.mutateAsync(values);
            return;
        }
        if (isCareerSection(values.section)) {
            await actions.save.mutateAsync({ values, id });
            return;
        }
        const entry = { id: id ?? crypto.randomUUID(), values };
        setEntries((previous) => {
            const existing = previous[values.section] ?? [];
            const singleton = ["personal", "introduction", "skills"].includes(values.section);
            const next = singleton ? [entry] : id ? existing.map((item) => item.id === id ? entry : item) : [...existing, entry];
            return { ...previous, [values.section]: next };
        });
    };
    const value: DraftContext = {
        entries, personalDefaults, save,
        createCertificate: name => actions.createCertificate.mutateAsync(name),
        uploadCertificate: (id, file) => actions.uploadCertificate.mutateAsync({ id, file }),
        remove: async (section, id) => { await actions.remove.mutateAsync({ section, id }); },
        busy: actions.save.isPending || actions.remove.isPending || savePersonal.isPending || actions.createCertificate.isPending || actions.uploadCertificate.isPending,
        isPending: query.isPending,
        isError: query.isError,
        reload: () => { void query.refetch(); },
        personalPending: personal.isPending,
        personalError: personal.isError,
        reloadPersonal: () => { void personal.refetch(); },
    };
    return <ProfileDraftContext.Provider value={value}>{children}</ProfileDraftContext.Provider>;
}

export function useProfileDraft() {
    const value = useContext(ProfileDraftContext);
    if (!value) throw new Error("ProfileDraftProvider is required");
    return value;
}
