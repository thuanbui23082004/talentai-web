import { describe, expect, it } from 'vitest';
import { createJobDefaults, createJobSchema, toJobInput } from '@/features/jobs/schemas/create-job';
import { jobInputSchema } from '@/lib/api/job-schemas';

const valid = { ...createJobDefaults, title: 'Frontend Developer', industryId: '00000000-0000-4000-8000-000000000001', city: 'Hà Nội', description: 'Phát triển sản phẩm.', requirements: 'Kinh nghiệm React.', salaryMin: '10.5', salaryMax: '20' };
describe('create-job contract conversion', () => {
  it('converts millions to integer VND and only includes contract fields', () => {
    const values = { ...valid, contactEmail: 'fictional@example.test', noCv: true };
    const result = toJobInput(values);
    expect(result.salary).toMatchObject({ min: 10500000, max: 20000000, currency: 'VND', negotiable: false });
    expect(result).not.toHaveProperty('contactEmail');
    expect(result).not.toHaveProperty('noCv');
    expect(jobInputSchema.safeParse(result).success).toBe(true);
  });
  it('omits salary amounts when negotiable, even when previous amounts are reversed', () => {
    const values = { ...valid, negotiable: true, salaryMin: '20', salaryMax: '10' };
    expect(createJobSchema.safeParse(values).success).toBe(true);
    expect(toJobInput(values).salary).not.toHaveProperty('min');
    expect(toJobInput(values).salary).not.toHaveProperty('max');
  });
  it.each([{ title: 'a' }, { title: 'a'.repeat(201) }, { salaryMin: '30', salaryMax: '20' }, { headcount: 0 }, { headcount: 1.5 }, { city: '' }, { industryId: 'not-a-uuid' }, { applicationDeadline: '2026-02-31' }, { salaryMin: 'NaN' }, { salaryMax: 'Infinity' }])('rejects invalid input %j', fields => {
    expect(createJobSchema.safeParse({ ...valid, ...fields }).success).toBe(false);
  });
  it('maps skills and education without sending editor-only fields', () => {
    expect(toJobInput({ ...valid, skills: 'React, TypeScript, ', educationLevel: 'bachelor' })).toMatchObject({ skills: [{ name: 'React', required: true }, { name: 'TypeScript', required: true }], educationLevel: 'bachelor' });
  });
});
