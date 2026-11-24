import { z } from 'zod';

export const jobApplicantStatuses = ['submitted', 'reviewing', 'shortlisted', 'interview_scheduled', 'offered', 'rejected', 'withdrawn', 'hired'] as const;
export const jobApplicantStatusUpdateSchema = z.object({
    status: z.enum(jobApplicantStatuses), version: z.number().int().nonnegative(), note: z.string().max(2000).optional(),
}).strict();
export const jobApplicantQuerySchema = z.object({
    status: z.enum(jobApplicantStatuses).optional(),
    page: z.coerce.number().int().min(1).max(10001).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(9),
}).strict();

const snapshot = z.object({ fullName: z.string().nullish(), headline: z.string().nullish(), title: z.string().nullish(), email: z.string().nullish(), phone: z.string().nullish(), employmentType: z.string().nullish() });
const applicantSnapshot = snapshot.extend({
    skills: z.array(z.string()).nullish(),
    yearsOfExperience: z.number().nullish(),
    educations: z.array(z.object({ id: z.string().nullish(), school: z.string().nullish(), degree: z.string().nullish(), fieldOfStudy: z.string().nullish(), description: z.string().nullish(), startDate: z.string().nullish(), endDate: z.string().nullish(), isStudying: z.boolean().nullish() })).nullish(),
    experiences: z.array(z.object({ id: z.string().nullish(), company: z.string().nullish(), title: z.string().nullish(), location: z.string().nullish(), description: z.string().nullish(), startDate: z.string().nullish(), endDate: z.string().nullish(), current: z.boolean().nullish() })).nullish(),
    certificates: z.array(z.object({ id: z.string().nullish(), name: z.string().nullish(), issuer: z.string().nullish(), issuedAt: z.string().nullish(), expiresAt: z.string().nullish() })).nullish(),
});
export const upstreamJobApplicantSchema = z.object({
    id: z.uuid(), jobId: z.uuid(), applicantId: z.uuid(), resumeId: z.uuid(),
    resumeFileName: z.string().nullish(), coverLetter: z.string().nullish(),
    resumeContentType: z.string().nullish(),
    jobSnapshot: snapshot.nullish(), applicantSnapshot: applicantSnapshot.nullish(),
    status: z.enum(jobApplicantStatuses), version: z.number().int().nonnegative(), createdAt: z.iso.datetime({ offset: true }),
});
export const applicationResumeDownloadSchema = z.object({
    url: z.string().refine(value => {
        if (/^\/api\/bff\/recruiter\/applications\/[a-f0-9-]{36}\/cv$/i.test(value)) return true;
        try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
    }),
    expiresAt: z.iso.datetime({ offset: true }),
});
export const upstreamJobApplicantPageSchema = z.object({
    success: z.literal(true), data: z.object({
        items: upstreamJobApplicantSchema.array(), page: z.number().int().nonnegative(), size: z.number().int().positive(),
        totalElements: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
    }),
});
