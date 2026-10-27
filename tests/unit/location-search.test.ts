import { describe, expect, it } from 'vitest';
import { matchesLocationName } from '@/features/jobs/location-search';
import { recruiterLocations } from '@/mocks/fixtures/recruiter-catalog';

describe('location search', () => {
  it('matches Vietnamese names with or without accents and normalizes spacing/case', () => {
    expect(matchesLocationName('Đà Nẵng', ' DA   NANG ')).toBe(true);
    expect(matchesLocationName('Cần Thơ', 'cần')).toBe(true);
    expect(matchesLocationName('Đắk Lắk', 'dak lak')).toBe(true);
    expect(matchesLocationName('TP. Hồ Chí Minh', 'ho chi minh')).toBe(true);
    expect(matchesLocationName('Hà Nội', 'can tho')).toBe(false);
    expect(matchesLocationName('Hải Phòng', '')).toBe(true);
    expect(matchesLocationName('Thái Nguyên', 'hai')).toBe(false);
    expect(matchesLocationName('Hải Phòng', 'hai')).toBe(true);
    expect(matchesLocationName('TP. Hồ Chí Minh', 'tp ho chi')).toBe(true);
  });
  it('keeps the original fixture identities and provides 34 unique active locations', () => {
    expect(recruiterLocations).toHaveLength(34);
    expect(new Set(recruiterLocations.map(item => item.id)).size).toBe(34);
    expect(new Set(recruiterLocations.map(item => item.name)).size).toBe(34);
    expect(recruiterLocations.every(item => item.isActive)).toBe(true);
    expect(recruiterLocations.find(item => item.name === 'Hà Nội')?.id).toBe('00000000-0000-4000-8000-000000000011');
    expect(recruiterLocations.filter(item => matchesLocationName(item.name, 'can tho')).map(item => item.name)).toEqual(['Cần Thơ']);
  });
});
