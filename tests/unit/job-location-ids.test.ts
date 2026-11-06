import { describe, expect, it } from 'vitest';
import { fromJobLocationIds, toJobLocationIds } from '@/server/bff/recruiter/job-location-ids';

describe('official location codes and grouped backend IDs', () => {
  it.each([
    ['1:00004', 1000001, 3000004],
    ['11:03151', 1000011, 3003151],
    ['4:01279', 1000004, 3001279],
  ])('maps %s to the backend IDs and restores the same selection', (selection, provinceId, wardId) => {
    expect(toJobLocationIds(String(selection))).toEqual({ provinceId, wardId });
    expect(fromJobLocationIds(Number(provinceId), Number(wardId))).toBe(selection);
  });

  it('supports selecting a province without a ward', () => {
    expect(toJobLocationIds('79')).toEqual({ provinceId: 1000079, wardId: undefined });
    expect(fromJobLocationIds(1000079)).toBe('79');
  });

  it('rejects the old sequential province code paired with a ward from another province', () => {
    expect(toJobLocationIds('4:03151')).toBeUndefined();
    expect(fromJobLocationIds(1000004, 3003151)).toBeUndefined();
    expect(toJobLocationIds('11:03151:extra')).toBeUndefined();
    expect(toJobLocationIds('99')).toBeUndefined();
    expect(fromJobLocationIds(11, 3151)).toBeUndefined();
  });
});
