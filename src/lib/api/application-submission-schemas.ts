import { z } from "zod";

export const applicationSubmitSchema = z.object({
    jobId: z.uuid(),
    resumeId: z.uuid(),
    coverLetter: z.string().trim().max(10000).optional(),
}).strict();

export const applicationSubmissionSchema = z.object({
    id: z.uuid(), jobId: z.uuid(), resumeId: z.uuid(),
    coverLetter: z.string().nullish().transform(value => value ?? undefined),
    status: z.literal("submitted"), createdAt: z.iso.datetime({ offset: true }),
    version: z.number().int().nonnegative(),
});
