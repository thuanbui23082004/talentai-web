import { z } from "zod";

const number = z.coerce.number().finite().nonnegative().optional();
const list = <T extends z.ZodType>(schema: T) => z.preprocess((value) => typeof value === "string" ? value.split(",") : value, z.array(schema).optional());

export const jobSearchSchema = z.object({
    q: z.string().optional(), city: z.string().optional(),
    salaryMin: number, salaryMax: number,
    minExperience: number, maxExperience: number,
    level: list(z.enum(["intern", "fresher", "junior", "middle", "senior", "lead", "manager", "director"])),
    workType: list(z.enum(["full_time", "part_time", "internship", "contract", "freelance", "remote", "hybrid"])),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["relevance", "newest", "salary_desc", "salary_asc", "deadline", "match_score"]).default("relevance"),
}).refine((value) => value.salaryMin === undefined || value.salaryMax === undefined || value.salaryMin <= value.salaryMax, { message: "Khoảng lương không hợp lệ." })
  .refine((value) => value.minExperience === undefined || value.maxExperience === undefined || value.minExperience <= value.maxExperience, { message: "Khoảng kinh nghiệm không hợp lệ." });

export function parseJobSearchParams(params: URLSearchParams) {
    const input: Record<string, unknown> = Object.fromEntries(params);
    for (const key of ["level", "workType"]) if (params.has(key)) input[key] = params.getAll(key).flatMap((value) => value.split(","));
    return jobSearchSchema.safeParse(input);
}
