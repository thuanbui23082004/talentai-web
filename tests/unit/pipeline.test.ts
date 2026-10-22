import { describe, expect, it } from 'vitest';
import { canMoveApplication, isFinalStage, nextPipelinePage, pipelineMoveSchema, pipelineStages } from '@/features/applications/pipeline';

describe('recruiter pipeline rules', () => {
  it('maps the five board stages to existing contractual statuses', () => {
    expect(pipelineStages).toEqual(['submitted', 'reviewing', 'interview', 'hired', 'rejected']);
    expect(isFinalStage('hired')).toBe(true);
    expect(isFinalStage('interview')).toBe(false);
  });
  it('prevents withdrawn and unchanged moves without blocking a manual reopening', () => {
    for (const stage of pipelineStages) expect(canMoveApplication('withdrawn', stage)).toBe(false);
    expect(canMoveApplication('reviewing', 'reviewing')).toBe(false);
    expect(canMoveApplication('rejected', 'reviewing')).toBe(true);
    expect(pipelineMoveSchema.safeParse({ from: 'withdrawn', to: 'interview', confirmed: true }).success).toBe(false);
    expect(pipelineMoveSchema.safeParse({ from: 'submitted', to: 'withdrawn', confirmed: true }).success).toBe(false);
  });
  it('requires deliberate confirmation for both terminal decisions', () => {
    for (const to of ['hired', 'rejected'] as const) {
      expect(pipelineMoveSchema.safeParse({ from: 'reviewing', to, confirmed: false }).success).toBe(false);
      expect(pipelineMoveSchema.safeParse({ from: 'reviewing', to, confirmed: true }).success).toBe(true);
    }
    expect(pipelineMoveSchema.safeParse({ from: 'submitted', to: 'reviewing', confirmed: false }).success).toBe(true);
  });
  it('loads further pages only when the server reports more pages', () => {
    expect(nextPipelinePage({ page: 1, totalPages: 2 })).toBe(2);
    expect(nextPipelinePage({ page: 2, totalPages: 2 })).toBeUndefined();
    expect(nextPipelinePage({ page: 1, totalPages: 0 })).toBeUndefined();
  });
});
