import type { components } from "@/lib/api/generated/schema";

export const jobCategories: components["schemas"]["PublicJobCategory"][] = [
    { categoryId: 1, categoryName: "Software Engineering" },
    { categoryId: 2, categoryName: "Data and AI" },
    { categoryId: 3, categoryName: "Product and Design" },
];
