import type { components } from "@/lib/api/generated/schema";

export const emptyCandidateCareer = {
    personal: { address: null, location: null, dob: null, gender: null, headline: null, summary: null, searchable: true, showEmail: false, showPhone: false,
        desiredIndustries: [], experienceLevel: null, salaryNegotiable: false, desiredLocations: [], currentSeniorityLevels: [], employmentTypes: [],
        workPreferences: { hybrid: false, thirteenthMonthSalary: false, healthInsurance: false },
    } satisfies components["schemas"]["PersonalProfile"],
    experience: [] as components["schemas"]["ProfileExperience"][],
    education: [] as components["schemas"]["ProfileEducation"][],
    certificates: [] as components["schemas"]["ProfileCertificate"][],
    skills: { skills: [] } satisfies components["schemas"]["ProfileSkills"],
};
