import type { components } from "@/lib/api/generated/schema";

export const emptyCandidateCareer = {
    experience: [] as components["schemas"]["ProfileExperience"][],
    education: [] as components["schemas"]["ProfileEducation"][],
    certificates: [] as components["schemas"]["ProfileCertificate"][],
    skills: { skills: [] } satisfies components["schemas"]["ProfileSkills"],
};
