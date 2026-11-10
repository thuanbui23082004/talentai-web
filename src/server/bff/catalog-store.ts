import { recruiterIndustries, recruiterLocations } from '@/mocks/fixtures/recruiter-catalog';
import { extraCatalog } from '@/mocks/fixtures/admin-content';
import type { components } from '@/lib/api/generated/schema';
import type { CatalogType } from '@/features/admin/schemas/content';
type Item = components['schemas']['CatalogItem'];
const shared = globalThis as typeof globalThis & { talentaiCatalog?: Map<string, Item> };
export function catalogStore() { return shared.talentaiCatalog ??= new Map(structuredClone([...recruiterIndustries, ...recruiterLocations, ...extraCatalog]).map(item => [item.id, item])); }
export function getCatalogItems(type: CatalogType) { return [...catalogStore().values()].filter(item => item.type === type); }
