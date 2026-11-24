import { z } from 'zod';
import type { components } from '@/lib/api/generated/schema';
import { upstreamJobApplicantSchema } from '@/lib/api/job-applicant-schemas';

export function mapJobApplicant(item: z.infer<typeof upstreamJobApplicantSchema>): components['schemas']['JobApplicant'] {
    const snapshot = item.applicantSnapshot;
    const hasDetails = snapshot && (snapshot.skills != null || snapshot.yearsOfExperience != null || snapshot.educations != null || snapshot.experiences != null || snapshot.certificates != null);
    return {
        id: item.id, jobId: item.jobId, applicantId: item.applicantId, resumeId: item.resumeId,
        fullName: item.applicantSnapshot?.fullName ?? undefined, headline: item.applicantSnapshot?.headline ?? undefined,
        email: item.applicantSnapshot?.email ?? undefined, phone: item.applicantSnapshot?.phone ?? undefined,
        employmentType: item.jobSnapshot?.employmentType ?? undefined, jobTitle: item.jobSnapshot?.title ?? undefined,
        resumeFileName: item.resumeFileName ?? undefined, resumeContentType: item.resumeContentType ?? undefined,
        coverLetter: item.coverLetter ?? undefined, status: item.status, version: item.version, appliedAt: item.createdAt,
        ...(hasDetails && snapshot ? { applicantSnapshot: {
            skills: snapshot.skills ?? undefined,
            yearsOfExperience: snapshot.yearsOfExperience ?? undefined,
            educations: snapshot.educations?.map(entry => ({ id: entry.id ?? undefined, school: entry.school ?? undefined, degree: entry.degree ?? undefined, fieldOfStudy: entry.fieldOfStudy ?? undefined, description: entry.description ?? undefined, startDate: entry.startDate ?? undefined, endDate: entry.endDate ?? undefined, isStudying: entry.isStudying ?? undefined })),
            experiences: snapshot.experiences?.map(entry => ({ id: entry.id ?? undefined, company: entry.company ?? undefined, title: entry.title ?? undefined, location: entry.location ?? undefined, description: entry.description ?? undefined, startDate: entry.startDate ?? undefined, endDate: entry.endDate ?? undefined, current: entry.current ?? undefined })),
            certificates: snapshot.certificates?.map(entry => ({ id: entry.id ?? undefined, name: entry.name ?? undefined, issuer: entry.issuer ?? undefined, issuedAt: entry.issuedAt ?? undefined, expiresAt: entry.expiresAt ?? undefined })),
        }} : {}),
    };
}
