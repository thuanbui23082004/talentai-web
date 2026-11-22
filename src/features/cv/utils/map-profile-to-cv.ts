import type { CareerProfile, PersonalProfile } from "@/features/profile";
import type { CVData } from "../types/cv";

const clean = (value?: string | null) => value?.trim() ?? "";
const date = (value?: string | null) => value?.slice(0, 10) ?? "";

export function mapProfileToCVData(profile: PersonalProfile, career: CareerProfile): CVData {
    return {
        basics: {
            fullName: clean(profile.fullName), title: clean(profile.headline || profile.desiredJobTitle),
            email: clean(profile.email), phone: clean(profile.phone), address: clean(profile.address || profile.location),
            avatarUrl: clean(profile.avatarUrl), summary: clean(profile.summary),
        },
        education: career.education.map(item => ({
            school: clean(item.school), degree: clean(item.degree || item.fieldOfStudy),
            startDate: date(item.startDate), endDate: date(item.endDate), description: clean(item.description),
        })).filter(item => item.school),
        experience: career.experience.map(item => ({
            company: clean(item.company), position: clean(item.title), startDate: date(item.startDate),
            endDate: date(item.endDate), current: item.current ?? false, description: clean(item.description),
        })).filter(item => item.company || item.position),
        skills: career.skills.skills.filter(Boolean).map(name => ({ name, level: 80 })),
        projects: [],
        certificates: career.certificates.map(item => ({ name: clean(item.name), issuer: clean(item.issuer), date: date(item.issuedAt) })).filter(item => item.name),
        languages: [],
    };
}
