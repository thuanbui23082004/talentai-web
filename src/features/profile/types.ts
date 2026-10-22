export type ProfileSectionKey = "introduction" | "experience" | "education" | "skills" | "projects" | "certificates" | "languages";

export type FixedRecommendedJob = {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    tags: string[];
};
