import type { components } from "@/lib/api/generated/schema";
import { emptyProfileDraft, type ProfileDraftEntry, type ProfileDraftValues, type ProfileEditorSection } from "./schemas/profile-editor";
import type { CareerProfile, ProfileCertificate, ProfileEducation, ProfileExperience } from "./types";

export const CAREER_SECTIONS = ["experience", "education", "skills", "certificates"] as const;
export function isCareerSection(section: ProfileEditorSection) { return CAREER_SECTIONS.some(value => value === section); }
const date = (value?: string | null) => value?.slice(0, 10) ?? "";
function instant(value: string, original?: string | null) {
    if (!value) return null;
    if (original?.slice(0, 10) === value) return original;
    return `${value}T00:00:00Z`;
}

export function careerToEntries(profile?: CareerProfile): Partial<Record<ProfileEditorSection, ProfileDraftEntry[]>> {
    if (!profile) return {};
    return {
        experience: profile.experience.map(item => ({ id: item.id, values: { ...emptyProfileDraft("experience"), company: item.company, position: item.title, address: item.location ?? "", description: item.description ?? "", startDate: date(item.startDate), endDate: date(item.endDate), current: item.current ?? false } })),
        education: profile.education.map(item => ({ id: item.id, values: { ...emptyProfileDraft("education"), name: item.school, degree: item.degree ?? "", major: item.fieldOfStudy ?? "", description: item.description ?? "", startDate: date(item.startDate), endDate: date(item.endDate), current: item.isStudying ?? false } })),
        certificates: profile.certificates.map(item => ({ id: item.id, values: { ...emptyProfileDraft("certificates"), name: item.name, issuer: item.issuer ?? "", credentialId: item.credentialId ?? "", credentialUrl: item.credentialUrl ?? "", startDate: date(item.issuedAt), endDate: date(item.expiresAt) } })),
        skills: profile.skills.skills.length ? [{ id: "skills", values: { ...emptyProfileDraft("skills"), skills: profile.skills.skills } }] : [],
    };
}

export function experiencePayload(values: ProfileDraftValues, original?: ProfileExperience): components["schemas"]["ProfileExperienceInput"] {
    return { company: values.company, title: values.position, location: values.address || null, description: values.description || null, startDate: instant(values.startDate, original?.startDate), endDate: values.current ? null : instant(values.endDate, original?.endDate), current: values.current };
}
export function educationPayload(values: ProfileDraftValues, original?: ProfileEducation): components["schemas"]["ProfileEducationInput"] {
    return { school: values.name, degree: values.degree || null, fieldOfStudy: values.major || null, description: values.description || null, startDate: instant(values.startDate, original?.startDate), endDate: values.current ? null : instant(values.endDate, original?.endDate), isStudying: values.current };
}
export function certificatePayload(values: ProfileDraftValues, original?: ProfileCertificate): components["schemas"]["ProfileCertificateInput"] {
    return { name: values.name, issuer: values.issuer || null, credentialId: values.credentialId || null, credentialUrl: values.credentialUrl || null, issuedAt: instant(values.startDate, original?.issuedAt), expiresAt: instant(values.endDate, original?.expiresAt) };
}
