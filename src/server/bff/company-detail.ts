import { cache } from "react";
import type { components } from "@/lib/api/generated/schema";
import { handleBffRequest } from "./handler";

export const loadCompany = cache(async (id: string) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
    const response = await handleBffRequest(new Request(`http://talentai.internal/api/bff/companies/${id}`));
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Không thể tải thông tin công ty.");
    return await response.json() as components["schemas"]["CompanyPublic"];
});

export async function loadCompanyRelated(company: components["schemas"]["CompanyPublic"]) {
    const query = new URLSearchParams({ pageSize: "7" });
    if (company.industries?.[0]) query.set("industryId", company.industries[0].id);
    const response = await handleBffRequest(new Request(`http://talentai.internal/api/bff/companies?${query}`));
    if (!response.ok) return null;
    const result: components["schemas"]["CompanyPage"] = await response.json();
    return result.items.filter((item) => item.id !== company.id).slice(0, 6);
}
