import { z } from "zod";

const optionalDate = z.iso.datetime({ offset: true }).nullish();
export const experienceInputSchema = z.object({
    company: z.string().trim().min(1).max(200), title: z.string().trim().min(1).max(200),
    location: z.string().max(200).nullish(), description: z.string().max(4000).nullish(),
    startDate: optionalDate, endDate: optionalDate, current: z.boolean().optional(),
}).strict();
export const educationInputSchema = z.object({
    school: z.string().trim().min(1).max(200), degree: z.string().max(150).nullish(), fieldOfStudy: z.string().max(150).nullish(),
    description: z.string().max(2000).nullish(), startDate: optionalDate, endDate: optionalDate, isStudying: z.boolean().optional(),
}).strict();
export const certificateInputSchema = z.object({
    name: z.string().trim().min(1).max(200), issuer: z.string().max(200).nullish(), credentialId: z.string().max(200).nullish(),
    credentialUrl: z.string().max(1000).refine(value => !value || /^https?:\/\//i.test(value) && z.url().safeParse(value).success).nullish(),
    issuedAt: optionalDate, expiresAt: optionalDate,
}).strict();
export const profileSkillsSchema = z.object({ skills: z.array(z.string().min(1).max(100)) });
export const profileSkillsInputSchema = profileSkillsSchema.extend({ skills: z.array(z.string().trim().min(1).max(100)).min(1) }).strict();
const id = z.string().min(1).max(200);
// Strip service-only fields such as userId; ownership always comes from the session.
export const experienceSchema = experienceInputSchema.extend({ id }).strip();
export const educationSchema = educationInputSchema.extend({ id }).strip();
export const certificateSchema = certificateInputSchema.extend({ id }).strip();
export const profileResourceSchemas = {
    experience: { input: experienceInputSchema, record: experienceSchema },
    education: { input: educationInputSchema, record: educationSchema },
    certificates: { input: certificateInputSchema, record: certificateSchema },
};
