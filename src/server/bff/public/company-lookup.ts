import type { components } from '@/lib/api/generated/schema';
import { handleCompanyService } from './company-service';

/** Load each public company once, with at most four requests in flight. */
export async function loadPublicCompanies(companyIds: string[], baseUrl: string) {
    const companies = new Map<string, components['schemas']['CompanyPublic']>();
    const uniqueIds = [...new Set(companyIds)];
    for (let index = 0; index < uniqueIds.length; index += 4) {
        await Promise.all(uniqueIds.slice(index, index + 4).map(async id => {
            const response = await handleCompanyService(
                new Request(`http://talentai.internal/api/bff/companies/${id}`),
                baseUrl,
            );
            if (response.ok) companies.set(id, await response.json() as components['schemas']['CompanyPublic']);
        }));
    }
    return companies;
}
