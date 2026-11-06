import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { upstreamJobApplicantSchema } from '@/lib/api/job-applicant-schemas';

export function mapJobApplicant(item: z.infer<typeof upstreamJobApplicantSchema>): components['schemas']['JobApplicant'] {
    return {
        id: item.id, jobId: item.jobId, applicantId: item.applicantId, resumeId: item.resumeId,
        fullName: item.applicantSnapshot?.fullName ?? undefined, headline: item.applicantSnapshot?.headline ?? undefined,
        email: item.applicantSnapshot?.email ?? undefined, phone: item.applicantSnapshot?.phone ?? undefined,
        employmentType: item.jobSnapshot?.employmentType ?? undefined, jobTitle: item.jobSnapshot?.title ?? undefined,
        resumeFileName: item.resumeFileName ?? undefined, resumeContentType: item.resumeContentType ?? undefined,
        coverLetter: item.coverLetter ?? undefined, status: item.status, version: item.version, appliedAt: item.createdAt,
    };
}
