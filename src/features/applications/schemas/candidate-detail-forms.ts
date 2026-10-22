import { z } from 'zod';
import { safeProfileUrlSchema, interviewInputSchema } from '@/lib/api/candidate-detail-schemas';
export const statusFormSchema = z.object({ status: z.enum(['submitted', 'reviewing', 'interview', 'rejected', 'hired']), round: z.string(), note: z.string().max(2000, 'noteLength'), confirmed: z.boolean() }).superRefine((value, ctx) => {
  if (['hired', 'rejected'].includes(value.status) && !value.confirmed) ctx.addIssue({ code: 'custom', path: ['confirmed'], message: 'required' });
});
export const evaluationFormSchema = z.object({ rating: z.string().regex(/^[1-5]$/, 'required'), classification: z.enum(['potential', 'consider', 'not_suitable']), note: z.string().max(2000, 'noteLength'), tags: z.string() });
const localDate = z.iso.datetime({ local: true, precision: -1, error: 'required' });
export const interviewFormSchema = z.object({ start: localDate, end: localDate, mode: z.enum(['online', 'offline']), round: z.string(), location: z.string(), meetingUrl: z.string(), participants: z.string(), message: z.string().max(3000, 'noteLength'), sendInvitation: z.boolean() }).superRefine((value, ctx) => {
  if (value.start >= value.end) ctx.addIssue({ code: 'custom', path: ['end'], message: 'timeOrder' });
  if (value.mode === 'online' && !safeProfileUrlSchema.safeParse(value.meetingUrl).success) ctx.addIssue({ code: 'custom', path: ['meetingUrl'], message: 'invalidUrl' });
  if (value.mode === 'offline' && !value.location.trim()) ctx.addIssue({ code: 'custom', path: ['location'], message: 'required' });
});
export function interviewFormToInput(applicationId: string, values: z.infer<typeof interviewFormSchema>) {
  return interviewInputSchema.parse({ applicationId, startTime: new Date(values.start + ':00+07:00').toISOString(), endTime: new Date(values.end + ':00+07:00').toISOString(), mode: values.mode, round: values.round || undefined, location: values.mode === 'offline' ? values.location : undefined, meetingUrl: values.mode === 'online' ? values.meetingUrl : undefined, interviewers: values.participants.split(',').map(value => value.trim()).filter(Boolean), message: values.message || undefined, sendInvitation: values.sendInvitation });
}
