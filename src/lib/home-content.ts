/** Editorial presentation model, separate from backend API DTOs. */
export type HomeContent = {
    statistics: { jobs: string; candidates: string; companies: string };
    featuredIds: string[];
    urgentIds: string[];
    categories: { name: string; query: string; count: number; icon: "design" | "sales" | "marketing" | "finance" | "technology" | "engineering" | "business" | "people" }[];
    companies: { name: string; wordmark: string; query: string; count: number; logo?: string }[];
    articles: { id: string; title: string; eyebrow: string; coverTitle: string; date: string; paragraphs: string[]; image?: string }[];
};
