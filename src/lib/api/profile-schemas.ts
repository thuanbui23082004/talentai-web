import { z } from "zod";

const optionalDate = z.iso.datetime({ offset: true }).nullish();
export const personalProfileInputSchema = z.object({
    fullName: z.string().max(150).nullish(), email: z.email().max(320).nullish(), phone: z.string().max(30).nullish(),
    headline: z.string().max(200).nullish(), summary: z.string().max(5000).nullish(),
    location: z.string().max(200).nullish(), address: z.string().max(500).nullish(), dob: optionalDate,
    gender: z.string().max(10).nullish(), avatarUrl: z.string().max(1000).nullish(),
    desiredJobTitle: z.string().max(150).nullish(), desiredLocation: z.string().max(200).nullish(),
    minDesiredSalary: z.number().int().safe().nullish(), maxDesiredSalary: z.number().int().safe().nullish(),
    currency: z.string().max(10).nullish(), yearsOfExperience: z.number().int().nullish(),
    jobSearchStatus: z.string().max(30).nullish(), searchable: z.boolean().nullish(), showEmail: z.boolean().nullish(), showPhone: z.boolean().nullish(),
}).strict();
export const personalProfileSchema = personalProfileInputSchema.extend({ fullName: z.string(), email: z.string(), id: z.string().optional(), userId: z.string().optional() }).strip();
// The service nests privacy in responses, but accepts flat flags in PUT requests.
export const upstreamPersonalProfileSchema = personalProfileSchema.extend({
    privacy: z.object({ isSearchable: z.boolean(), showEmail: z.boolean(), showPhone: z.boolean() }),
}).transform(({ privacy, ...profile }) => ({ ...profile, searchable: privacy.isSearchable, showEmail: privacy.showEmail, showPhone: privacy.showPhone }));
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
export const certificateSchema = certificateInputSchema.extend({
    id, attachmentUrl: z.string().nullish(), attachmentFileName: z.string().nullish(), attachmentContentType: z.string().nullish(),
}).strip();
export const profileResourceSchemas = {
    experience: { input: experienceInputSchema, record: experienceSchema },
    education: { input: educationInputSchema, record: educationSchema },
    certificates: { input: certificateInputSchema, record: certificateSchema },
};
