import type { components } from './generated/schema';

type Status = components['schemas']['JobApplicantStatus'];
// Matches the application service workflow. Terminal states cannot be moved.
export const JOB_APPLICANT_TRANSITIONS: Record<Status, readonly Status[]> = {
    submitted: ['reviewing', 'rejected'],
    reviewing: ['shortlisted', 'rejected'],
    shortlisted: ['interview_scheduled', 'rejected'],
    interview_scheduled: ['offered', 'rejected'],
    offered: ['hired', 'rejected'],
    hired: [], rejected: [], withdrawn: [],
};
