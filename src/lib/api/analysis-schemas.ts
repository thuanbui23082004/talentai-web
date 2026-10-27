import { z } from 'zod';
import { recruiterApplicationSchema } from '@/lib/api/application-schemas';
const score = z.number().int().min(0).max(100);
export const matchingResultSchema = z.object({
  id: z.uuid(), cvId: z.uuid(), jobId: z.uuid(), cvVersionId: z.uuid().optional(), jobTitle: z.string().optional(), score,
  explanation: z.string(), createdAt: z.iso.datetime(),
  breakdown: z.object({ skills: score.optional(), experience: score.optional(), education: score.optional(), other: score.optional() }).optional(),
  matchedSkills: z.array(z.object({ name: z.string(), evidence: z.string().optional() })).optional(),
  missingSkills: z.array(z.object({ name: z.string(), importance: z.enum(['must_have', 'nice_to_have']), suggestion: z.string().optional() })).optional(),
  strengths: z.array(z.string()).optional(), weaknesses: z.array(z.string()).optional(), disclaimer: z.string().optional(),
});
export const screeningResultSchema = z.object({ jobId: z.uuid(), processed: z.number().int().nonnegative(), failed: z.number().int().nonnegative(), completedAt: z.iso.datetime().optional() });
const taskFields = z.object({ taskId: z.uuid(), status: z.enum(['pending', 'processing', 'completed', 'failed']), progress: score.optional(), createdAt: z.iso.datetime(), completedAt: z.iso.datetime().optional(), resultId: z.uuid().optional(), error: z.object({ code: z.enum(['CV_UNREADABLE', 'JD_INSUFFICIENT', 'AI_ANALYSIS_FAILED']), message: z.string() }).optional() });
export const analysisTaskSchema = z.discriminatedUnion('type', [taskFields.extend({ type: z.literal('matching'), result: matchingResultSchema.optional() }), taskFields.extend({ type: z.literal('screening'), result: screeningResultSchema.optional() })]);
export const recommendedCandidatesSchema = z.object({ items: z.array(z.object({ application: recruiterApplicationSchema, score, reasons: z.array(z.string()).optional() })) });
export type AnalysisTask = z.infer<typeof analysisTaskSchema>;
export type MatchingResult = z.infer<typeof matchingResultSchema>;
