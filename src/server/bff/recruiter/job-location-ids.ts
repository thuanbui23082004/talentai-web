import { resolveLocation } from '@/lib/locations/vietnam';

const PROVINCE_ID_BASE = 1_000_000;
const WARD_ID_BASE = 3_000_000;

// Validate the province/ward pair before applying the backend's ID convention.
export function toJobLocationIds(workplace: string) {
  if (!/^\d+(?::\d+)?$/.test(workplace)) return undefined;
  const { province, ward } = resolveLocation(workplace);
  const [, wardCode] = workplace.split(':');
  if (!province || (wardCode !== undefined && !ward)) return undefined;
  return {
    provinceId: PROVINCE_ID_BASE + Number(province.code),
    wardId: ward ? WARD_ID_BASE + Number(ward.code) : undefined,
  };
}

export function fromJobLocationIds(provinceId: number, wardId?: number) {
  const provinceCode = String(provinceId - PROVINCE_ID_BASE);
  const wardCode = wardId === undefined ? undefined : String(wardId - WARD_ID_BASE).padStart(5, '0');
  const workplace = wardCode === undefined ? provinceCode : `${provinceCode}:${wardCode}`;
  return toJobLocationIds(workplace) ? workplace : undefined;
}
