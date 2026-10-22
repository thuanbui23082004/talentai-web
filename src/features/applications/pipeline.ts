import { z } from 'zod';
import { applicationStatuses } from '@/lib/api/application-schemas';

export const pipelineStages = ['submitted', 'reviewing', 'interview', 'hired', 'rejected'] as const;
export type PipelineStage = typeof pipelineStages[number];
export type ApplicationStatus = typeof applicationStatuses[number];
export const isFinalStage = (stage: PipelineStage) => stage === 'hired' || stage === 'rejected';
export function canMoveApplication(from: ApplicationStatus, to: PipelineStage) {
  return from !== 'withdrawn' && from !== to;
}
export const pipelineMoveSchema = z.object({
  from: z.enum(applicationStatuses), to: z.enum(pipelineStages), confirmed: z.boolean(),
}).superRefine((values, context) => {
  if (!canMoveApplication(values.from, values.to)) context.addIssue({ code: 'custom', path: ['to'], message: 'invalidMove' });
  if (isFinalStage(values.to) && !values.confirmed) context.addIssue({ code: 'custom', path: ['confirmed'], message: 'confirmRequired' });
});

export const pipelinePageSize = 4;
export function nextPipelinePage(meta: { page: number; totalPages: number }) {
  return meta.page < meta.totalPages ? meta.page + 1 : undefined;
}
