import type { components } from "@/lib/api/generated/schema";

export type ProfileSectionKey = "introduction" | "experience" | "education" | "skills" | "projects" | "certificates" | "languages";

export type FixedRecommendedJob = {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    tags: string[];
};
export type ProfileExperience = components["schemas"]["ProfileExperience"];
export type ProfileEducation = components["schemas"]["ProfileEducation"];
export type ProfileCertificate = components["schemas"]["ProfileCertificate"];
export type ProfileSkills = components["schemas"]["ProfileSkills"];
export type CareerProfile = { experience: ProfileExperience[]; education: ProfileEducation[]; certificates: ProfileCertificate[]; skills: ProfileSkills };
