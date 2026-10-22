import { z } from 'zod';
import { applicationStatuses, recruiterApplicationSchema } from '@/lib/api/application-schemas';

export const safeProfileUrlSchema = z.url().refine(value => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !/@|%40/i.test(url.pathname + url.search);
  } catch { return false; }
});
const educationSchema = z.object({ id: z.uuid(), school: z.string(), degree: z.string(), major: z.string().optional(), startDate: z.iso.date(), endDate: z.iso.date().optional(), isCurrent: z.boolean().default(false), description: z.string().optional() });
const experienceSchema = z.object({ id: z.uuid(), company: z.string(), position: z.string(), startDate: z.iso.date(), endDate: z.iso.date().optional(), isCurrent: z.boolean().default(false), description: z.string().optional(), location: z.string().optional() });
const certificateSchema = z.object({ id: z.uuid(), name: z.string(), issuer: z.string().optional(), issuedDate: z.iso.date().optional(), credentialUrl: z.string().optional() });
const profileSchema = z.object({
  userId: z.uuid(), fullName: z.string(), email: z.email(), phone: z.string().optional(), headline: z.string().optional(), summary: z.string().optional(),
  dateOfBirth: z.iso.date().optional(), gender: z.enum(['male', 'female', 'other']).optional(), address: z.string().optional(), city: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string() })).optional(), educations: z.array(educationSchema).optional(), experiences: z.array(experienceSchema).optional(),
  skills: z.array(z.object({ id: z.uuid(), name: z.string(), yearsOfExperience: z.number().optional(), level: z.string().optional() })).optional(),
  certificates: z.array(certificateSchema).optional(), totalYearsExperience: z.number().optional(), completenessPercent: z.number().int().min(0).max(100),
});
export const evaluationInputSchema = z.object({ rating: z.number().int().min(1).max(5).optional(), classification: z.enum(['potential', 'consider', 'not_suitable']).optional(), tags: z.array(z.string()).optional(), note: z.string().max(2000).optional() }).strict();
export const evaluationSchema = evaluationInputSchema.extend({ updatedAt: z.iso.datetime().optional() });
export const statusUpdateSchema = z.object({ status: z.enum(['submitted', 'reviewing', 'interview', 'rejected', 'hired']), round: z.string().optional(), note: z.string().max(2000).optional(), notifyCandidate: z.boolean().default(true) }).strict();
export const interviewInputSchema = z.object({
  applicationId: z.uuid(), startTime: z.iso.datetime(), endTime: z.iso.datetime(), mode: z.enum(['online', 'offline']),
  round: z.string().optional(), location: z.string().optional(), meetingUrl: safeProfileUrlSchema.optional(), interviewers: z.array(z.string()).optional(), message: z.string().max(3000).optional(), sendInvitation: z.boolean().default(true),
}).strict().superRefine((value, ctx) => {
  if (value.endTime <= value.startTime) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'timeOrder' });
  if (value.mode === 'online' && !value.meetingUrl) ctx.addIssue({ code: 'custom', path: ['meetingUrl'], message: 'required' });
  if (value.mode === 'offline' && !value.location?.trim()) ctx.addIssue({ code: 'custom', path: ['location'], message: 'required' });
});
export const interviewSchema = z.object({ id: z.uuid(), applicationId: z.uuid(), jobId: z.uuid().optional(), round: z.string().optional(), startTime: z.iso.datetime(), endTime: z.iso.datetime(), mode: z.enum(['online', 'offline']), location: z.string().optional(), meetingUrl: z.string().optional(), interviewers: z.array(z.string()).optional(), invitationStatus: z.enum(['draft', 'pending', 'accepted', 'declined']), status: z.enum(['scheduled', 'cancelled', 'completed']), message: z.string().optional() });
export const candidateDetailSchema = recruiterApplicationSchema.extend({
  profile: profileSchema.optional(), cvAvailable: z.boolean().optional(),
  cv: z.object({ id: z.uuid(), title: z.string(), source: z.enum(['manual', 'uploaded']), isDefault: z.boolean(), versionCount: z.number().int(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), content: z.object({ languages: z.array(z.object({ name: z.string(), level: z.string().optional() })).optional() }).optional() }).optional(),
  matching: z.object({ id: z.uuid(), cvId: z.uuid(), jobId: z.uuid(), score: z.number().int().min(0).max(100), explanation: z.string(), createdAt: z.iso.datetime(), breakdown: z.object({ skills: z.number().min(0).max(100).optional(), experience: z.number().min(0).max(100).optional(), education: z.number().min(0).max(100).optional(), other: z.number().min(0).max(100).optional() }).optional(), matchedSkills: z.array(z.object({ name: z.string() })).optional(), missingSkills: z.array(z.object({ name: z.string() })).optional() }).optional(),
  interviews: z.array(interviewSchema).optional(), statusHistory: z.array(z.object({ status: z.enum(applicationStatuses), changedBy: z.enum(['candidate', 'recruiter', 'admin', 'system']), changedAt: z.iso.datetime(), round: z.string().optional(), note: z.string().optional() })).optional(),
});
export type CandidateDetail = z.infer<typeof candidateDetailSchema>;
