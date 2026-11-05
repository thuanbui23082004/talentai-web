import { emptyProfileDraft, type ProfileDraftValues } from "./schemas/profile-editor";
import type { PersonalProfile, PersonalProfileInput } from "./types";
import { addressToDraft, personalAddressPayload } from "./personal-address";

export function personalToDraft(profile: PersonalProfile): ProfileDraftValues {
    return {
        ...emptyProfileDraft("personal"), name: profile.fullName ?? "", email: profile.email ?? "", phone: profile.phone ?? "",
        ...addressToDraft(profile.address ?? "", profile.location ?? ""), birthDate: profile.dob?.slice(0, 10) ?? "",
        gender: profile.gender ?? "", headline: profile.headline ?? "", avatarUrl: profile.avatarUrl ?? "",
        searchable: profile.searchable ?? false,
        showEmail: profile.showEmail ?? false, showPhone: profile.showPhone ?? false,
    };
}

export function personalPayload(values: ProfileDraftValues, original?: PersonalProfile): PersonalProfileInput {
    if (values.section === "introduction") return { summary: values.description };
    return {
        fullName: values.name, email: values.email, phone: values.phone, ...personalAddressPayload(values.location),
        dob: values.birthDate ? (original?.dob?.slice(0, 10) === values.birthDate ? original.dob : `${values.birthDate}T00:00:00Z`) : null,
        gender: values.gender,
        searchable: values.searchable, showEmail: values.showEmail, showPhone: values.showPhone,
    };
}

export const isRemoteSection = (section: string) => ["personal", "introduction", "experience", "education", "skills", "certificates"].includes(section);
